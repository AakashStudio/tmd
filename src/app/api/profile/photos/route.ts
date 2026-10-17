import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatZodError } from "@/lib/validation";
import { PhotoStatus } from "@prisma/client";
import { z } from "zod";

const addPhotoSchema = z.object({
  url: z.string().min(1, "Valid photo URL is required"),
});

const reorderPhotosSchema = z.object({
  photoIds: z.array(z.string()).min(1).max(6),
  primaryPhotoId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json({ error: "Unauthorized or profile not found" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = addPhotoSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    // 1. Enforce Maximum 6 Photos Limit
    const currentPhotoCount = await prisma.profilePhoto.count({
      where: { profileId: user.profile.id },
    });

    if (currentPhotoCount >= 6) {
      return NextResponse.json(
        { error: "Maximum limit reached: You can upload a maximum of 6 photos." },
        { status: 400 }
      );
    }

    const nextOrder = currentPhotoCount + 1;
    const isPrimary = currentPhotoCount === 0;

    const newPhoto = await prisma.profilePhoto.create({
      data: {
        profileId: user.profile.id,
        storageKey: `photo_${user.profile.id}_${Date.now()}`,
        url: parseResult.data.url,
        order: nextOrder,
        isPrimary,
        status: PhotoStatus.APPROVED,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Photo uploaded successfully",
      photo: newPhoto,
    });
  } catch (error) {
    console.error("Error in POST /api/profile/photos:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = reorderPhotosSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { photoIds, primaryPhotoId } = parseResult.data;

    // Verify all photos belong to this user's profile
    const existingPhotos = await prisma.profilePhoto.findMany({
      where: {
        profileId: user.profile.id,
        id: { in: photoIds },
      },
    });

    if (existingPhotos.length !== photoIds.length) {
      return NextResponse.json(
        { error: "One or more photo IDs are invalid" },
        { status: 400 }
      );
    }

    // Target primary ID: either explicit or first in array
    const targetPrimaryId = primaryPhotoId || photoIds[0];

    // Update each photo's order and primary flag in a transaction
    await prisma.$transaction(
      photoIds.map((id, index) =>
        prisma.profilePhoto.update({
          where: { id },
          data: {
            order: index + 1,
            isPrimary: id === targetPrimaryId,
          },
        })
      )
    );

    const updatedPhotos = await prisma.profilePhoto.findMany({
      where: { profileId: user.profile.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      success: true,
      message: "Photos reordered successfully",
      photos: updatedPhotos,
    });
  } catch (error) {
    console.error("Error in PATCH /api/profile/photos:", error);
    return NextResponse.json(
      { error: "Failed to reorder photos" },
      { status: 500 }
    );
  }
}
