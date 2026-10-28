import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { updateProfileSchema, formatZodError } from "@/lib/validation";
import { RelationshipIntention } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.profile) {
      return NextResponse.json(
        { profile: null, hasProfile: false },
        { status: 200 }
      );
    }

    const fullProfile = await prisma.profile.findUnique({
      where: { id: user.profile.id },
      include: {
        photos: { orderBy: { order: "asc" } },
        interests: { include: { interest: true } },
        languages: { include: { language: true } },
      },
    });

    const preference = await prisma.preference.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      profile: fullProfile,
      preference,
      entitlements: user.entitlements,
      hasProfile: true,
    });
  } catch (error) {
    console.error("Error in GET /api/profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.profile) {
      return NextResponse.json(
        { error: "No profile found. Please complete onboarding first." },
        { status: 404 }
      );
    }

    const body = await req.json();

    // 1. Check for forbidden fields (DOB / age directly submitted)
    if ("dob" in body || "age" in body) {
      return NextResponse.json(
        { error: "Age and Date of Birth cannot be manually edited. DOB Correction requires a formal request with verification." },
        { status: 400 }
      );
    }

    // 2. Validate update fields
    const parseResult = updateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // 3. Name Change Authorization Check
    if (data.name && data.name !== user.profile.name) {
      if (!user.entitlements.canChangeName) {
        return NextResponse.json(
          {
            error: "Name change is restricted. You must hold an active ₹499 PRO plan to change your name.",
          },
          { status: 403 }
        );
      }
    }

    // 4. City / Location Change Authorization Check
    const isCityChanging = data.city && data.city.trim().toLowerCase() !== user.profile.city.trim().toLowerCase();
    let incrementLocationCount = false;

    if (isCityChanging) {
      if (!user.entitlements.canSelectCity) {
        return NextResponse.json(
          {
            error: "You have used all 3 free location changes. Upgrade to TMD Plus (₹149) or PRO (₹499) for unlimited location changes.",
          },
          { status: 403 }
        );
      }
      // If user is on Free/₹49 tier (not on unlimited tier), mark to increment lifetime count
      if (user.entitlements.locationChangesRemaining !== undefined && user.entitlements.locationChangesRemaining !== Infinity) {
        incrementLocationCount = true;
      }
    }

    // 5. Update Profile
    const updated = await prisma.profile.update({
      where: { id: user.profile.id },
      data: {
        ...(data.name && user.entitlements.canChangeName ? { name: data.name } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.profession !== undefined ? { profession: data.profession } : {}),
        ...(data.education !== undefined ? { education: data.education } : {}),
        ...(data.height !== undefined ? { height: data.height } : {}),
        ...(isCityChanging ? { city: data.city!.trim() } : {}),
        ...(data.state !== undefined ? { state: data.state ? data.state.trim() : null } : {}),
        ...(data.country !== undefined ? { country: data.country ? data.country.trim() : null } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
        ...(incrementLocationCount ? { locationChangeCount: { increment: 1 } } : {}),
        ...(data.gender ? { gender: data.gender } : {}),
        ...(data.interestedIn ? { interestedIn: data.interestedIn } : {}),
        ...(data.relationshipIntention
          ? { relationshipIntention: data.relationshipIntention as RelationshipIntention }
          : {}),
        ...(data.promptQuestion !== undefined ? { promptQuestion: data.promptQuestion } : {}),
        ...(data.promptAnswer !== undefined ? { promptAnswer: data.promptAnswer } : {}),
        ...(data.anthemTitle !== undefined ? { anthemTitle: data.anthemTitle } : {}),
        ...(data.anthemArtist !== undefined ? { anthemArtist: data.anthemArtist } : {}),
        ...(data.anthemCoverUrl !== undefined ? { anthemCoverUrl: data.anthemCoverUrl } : {}),
      },
    });

    const currentProfileId = user.profile.id;

    // 5. Update Interests if provided (Deduplicated batch insert)
    if (Array.isArray(body.interestIds)) {
      await prisma.profileInterest.deleteMany({
        where: { profileId: currentProfileId },
      });

      const uniqueInterestIds: string[] = Array.from(
        new Set(
          (body.interestIds as unknown[]).filter(
            (id: unknown): id is string => typeof id === "string" && Boolean(id.trim())
          )
        )
      );

      if (uniqueInterestIds.length > 0) {
        await prisma.profileInterest.createMany({
          data: uniqueInterestIds.map((interestId: string) => ({
            profileId: currentProfileId,
            interestId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // 6. Update Languages if provided (Deduplicated batch insert)
    if (Array.isArray(body.languageIds)) {
      await prisma.profileLanguage.deleteMany({
        where: { profileId: currentProfileId },
      });

      const uniqueLanguageIds: string[] = Array.from(
        new Set(
          (body.languageIds as unknown[]).filter(
            (id: unknown): id is string => typeof id === "string" && Boolean(id.trim())
          )
        )
      );

      if (uniqueLanguageIds.length > 0) {
        await prisma.profileLanguage.createMany({
          data: uniqueLanguageIds.map((languageId: string) => ({
            profileId: currentProfileId,
            languageId,
          })),
          skipDuplicates: true,
        });
      }
    }

    const refreshedProfile = await prisma.profile.findUnique({
      where: { id: user.profile.id },
      include: {
        photos: { orderBy: { order: "asc" } },
        interests: { include: { interest: true } },
        languages: { include: { language: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: refreshedProfile,
    });
  } catch (error) {
    console.error("Error in PUT /api/profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
