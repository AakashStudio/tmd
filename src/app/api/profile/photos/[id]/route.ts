import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const photoId = params.id;

    // Verify photo exists and belongs to this user
    const photo = await prisma.profilePhoto.findFirst({
      where: {
        id: photoId,
        profileId: user.profile.id,
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Prohibit deleting if only 1 photo remains
    const totalCount = await prisma.profilePhoto.count({
      where: { profileId: user.profile.id },
    });

    if (totalCount <= 1) {
      return NextResponse.json(
        { error: "You must keep at least 1 profile photo." },
        { status: 400 }
      );
    }

    // Delete photo
    await prisma.profilePhoto.delete({
      where: { id: photoId },
    });

    // Re-index remaining photos and assign primary if needed
    const remainingPhotos = await prisma.profilePhoto.findMany({
      where: { profileId: user.profile.id },
      orderBy: { order: "asc" },
    });

    const hasPrimary = remainingPhotos.some((p) => p.isPrimary && p.id !== photoId);

    await prisma.$transaction(
      remainingPhotos.map((p, idx) =>
        prisma.profilePhoto.update({
          where: { id: p.id },
          data: {
            order: idx + 1,
            isPrimary: !hasPrimary && idx === 0 ? true : p.isPrimary,
          },
        })
      )
    );

    const refreshedPhotos = await prisma.profilePhoto.findMany({
      where: { profileId: user.profile.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      success: true,
      message: "Photo deleted successfully",
      photos: refreshedPhotos,
    });
  } catch (error) {
    console.error("Error in DELETE /api/profile/photos/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
