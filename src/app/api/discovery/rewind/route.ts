import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.entitlements.canRewind) {
      return NextResponse.json(
        {
          error: "Rewind is a premium feature available on ₹149 and PRO plans.",
          code: "UPGRADE_REQUIRED",
        },
        { status: 403 }
      );
    }

    // Find the user's most recent pass
    const latestPass = await prisma.pass.findFirst({
      where: { fromUserId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!latestPass) {
      return NextResponse.json(
        { error: "No recent passes found to rewind." },
        { status: 404 }
      );
    }

    // Delete the pass
    await prisma.pass.delete({
      where: { id: latestPass.id },
    });

    // Fetch candidate details to restore card to discovery deck
    const candidate = await prisma.user.findUnique({
      where: { id: latestPass.toUserId },
      include: {
        profile: {
          include: {
            photos: {
              where: { status: "APPROVED" },
              orderBy: { order: "asc" },
            },
            interests: {
              include: {
                interest: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      rewoundUserId: latestPass.toUserId,
      candidate: candidate?.profile
        ? {
            userId: candidate.id,
            name: candidate.profile.name,
            age: candidate.profile.age,
            gender: candidate.profile.gender,
            city: candidate.profile.city,
            bio: candidate.profile.bio,
            profession: candidate.profile.profession,
            education: candidate.profile.education,
            height: candidate.profile.height,
            relationshipIntention: candidate.profile.relationshipIntention,
            isVerified: candidate.isVerified,
            photos: candidate.profile.photos.map((ph) => ({
              id: ph.id,
              url: ph.url,
              isPrimary: ph.isPrimary,
              order: ph.order,
            })),
            interests: candidate.profile.interests.map((pi) => ({
              id: pi.interest.id,
              name: pi.interest.name,
              icon: pi.interest.icon,
            })),
          }
        : null,
    });
  } catch (error: any) {
    console.error("Rewind API error:", error);
    return NextResponse.json(
      { error: "Internal server error processing rewind." },
      { status: 500 }
    );
  }
}
