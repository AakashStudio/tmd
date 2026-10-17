import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine if recipient is paid / has plan
    const isPaid = user.activeSubscription?.status === "ACTIVE" || user.role === "ADMIN";

    // Fetch incoming likes where recipient is current user and status is PENDING
    const incomingLikes = await prisma.like.findMany({
      where: {
        toUserId: user.id,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
      include: {
        fromUser: {
          select: {
            id: true,
            isVerified: true,
            profile: {
              select: {
                name: true,
                age: true,
                city: true,
                bio: true,
                profession: true,
                education: true,
                height: true,
                relationshipIntention: true,
                photos: {
                  where: { status: "APPROVED" },
                  orderBy: { order: "asc" },
                  select: {
                    id: true,
                    url: true,
                    isPrimary: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const requests = incomingLikes
      .filter((like) => like.fromUser.profile !== null)
      .map((like) => {
        const p = like.fromUser.profile!;
        return {
          id: like.id,
          createdAt: like.createdAt.toISOString(),
          comment: like.comment,
          replyType: like.replyType || "GENERAL",
          replyContext: like.replyContext,
          sender: {
            id: like.fromUser.id,
            name: p.name,
            age: p.age,
            city: p.city,
            bio: p.bio,
            profession: p.profession,
            education: p.education,
            height: p.height,
            relationshipIntention: p.relationshipIntention,
            isVerified: like.fromUser.isVerified,
            photoUrl: p.photos[0]?.url || null,
            photos: p.photos,
          },
        };
      });

    return NextResponse.json({
      requests,
      isPaid,
      totalCount: requests.length,
    });
  } catch (error: any) {
    console.error("Requests API error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching incoming requests." },
      { status: 500 }
    );
  }
}
