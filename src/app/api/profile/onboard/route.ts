import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { registrationGateSchema, calculateAge, formatZodError } from "@/lib/validation";
import { z } from "zod";
import { RelationshipIntention, PhotoStatus } from "@prisma/client";

const onboardProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  dob: z.coerce.date(),
  is18PlusConfirmed: z.boolean(),
  gender: z.string().trim().min(1, "Gender is required"),
  interestedIn: z.string().trim().min(1, "Interested in is required"),
  city: z.string().trim().min(2, "City is required").max(100),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  bio: z.string().trim().max(500).optional().nullable(),
  profession: z.string().trim().max(100).optional().nullable(),
  education: z.string().trim().max(100).optional().nullable(),
  height: z.number().int().min(100).max(250).optional().nullable(),
  relationshipIntention: z
    .enum(["LONG_TERM", "SHORT_TERM_CASUAL", "FRIENDSHIP", "NOT_SURE_YET"])
    .default("NOT_SURE_YET"),
  interestIds: z.array(z.string()).default([]),
  languageIds: z.array(z.string()).default([]),
  photoUrls: z.array(z.string().min(1)).min(1, "At least one profile photo is required").max(6, "Maximum 6 photos allowed"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // 1. Validate full registration & onboarding payload
    const parseResult = onboardProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // 2. Authoritative 18+ Verification Gate
    const gateCheck = registrationGateSchema.safeParse({
      dob: data.dob.toISOString(),
      is18PlusConfirmed: data.is18PlusConfirmed,
    });

    if (!gateCheck.success) {
      return NextResponse.json(
        { error: formatZodError(gateCheck.error) },
        { status: 403 }
      );
    }

    const calculatedAge = calculateAge(data.dob);
    if (calculatedAge < 18) {
      return NextResponse.json(
        { error: "Access Denied: Users under 18 years of age are not permitted." },
        { status: 403 }
      );
    }

    // 3. Upsert Profile
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        name: data.name,
        dob: data.dob,
        age: calculatedAge,
        gender: data.gender,
        interestedIn: data.interestedIn,
        city: data.city,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        bio: data.bio || null,
        profession: data.profession || null,
        education: data.education || null,
        height: data.height || null,
        relationshipIntention: data.relationshipIntention as RelationshipIntention,
      },
      create: {
        userId: user.id,
        name: data.name,
        dob: data.dob,
        age: calculatedAge,
        gender: data.gender,
        interestedIn: data.interestedIn,
        city: data.city,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        bio: data.bio || null,
        profession: data.profession || null,
        education: data.education || null,
        height: data.height || null,
        relationshipIntention: data.relationshipIntention as RelationshipIntention,
        isNameLocked: true, // Locked on Free / 49 / 149
      },
    });

    // 4. Photos (replace existing during initial onboarding)
    await prisma.profilePhoto.deleteMany({
      where: { profileId: profile.id },
    });

    for (let i = 0; i < data.photoUrls.length; i++) {
      const url = data.photoUrls[i];
      await prisma.profilePhoto.create({
        data: {
          profileId: profile.id,
          storageKey: `profile_${profile.id}_photo_${i + 1}`,
          url,
          order: i + 1,
          isPrimary: i === 0, // First photo is primary
          status: PhotoStatus.APPROVED,
        },
      });
    }

    // 5. Connect Interests
    if (data.interestIds.length > 0) {
      await prisma.profileInterest.deleteMany({
        where: { profileId: profile.id },
      });

      for (const interestId of data.interestIds) {
        await prisma.profileInterest.create({
          data: {
            profileId: profile.id,
            interestId,
          },
        });
      }
    }

    // 6. Connect Languages
    if (data.languageIds.length > 0) {
      await prisma.profileLanguage.deleteMany({
        where: { profileId: profile.id },
      });

      for (const languageId of data.languageIds) {
        await prisma.profileLanguage.create({
          data: {
            profileId: profile.id,
            languageId,
          },
        });
      }
    }

    // 7. Initialize Preferences for Discovery
    await prisma.preference.upsert({
      where: { userId: user.id },
      update: {
        targetCity: data.city,
        preferredGenders: JSON.stringify([data.interestedIn]),
      },
      create: {
        userId: user.id,
        minAge: Math.max(18, calculatedAge - 5),
        maxAge: calculatedAge + 7,
        targetCity: data.city,
        preferredGenders: JSON.stringify([data.interestedIn]),
      },
    });

    // 8. Fetch complete created profile
    const completeProfile = await prisma.profile.findUnique({
      where: { id: profile.id },
      include: {
        photos: { orderBy: { order: "asc" } },
        interests: { include: { interest: true } },
        languages: { include: { language: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile onboarding completed successfully",
      profile: completeProfile,
    });
  } catch (error) {
    console.error("Error in /api/profile/onboard:", error);
    return NextResponse.json(
      { error: "Failed to complete profile onboarding" },
      { status: 500 }
    );
  }
}
