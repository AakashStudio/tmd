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

    const limit = user.entitlements.whoLikedYouLimit;

    // Users blocked or already matched should be filtered out
    const [blocksInitiated, blocksReceived, existingMatches] = await Promise.all([
      prisma.block.findMany({
        where: { blockerId: user.id },
        select: { blockedUserId: true },
      }),
      prisma.block.findMany({
        where: { blockedUserId: user.id },
        select: { blockerId: true },
      }),
      prisma.match.findMany({
        where: {
          OR: [{ user1Id: user.id }, { user2Id: user.id }],
          status: "ACTIVE",
        },
        select: { user1Id: true, user2Id: true },
      }),
    ]);

    const excludedIds = new Set<string>([user.id]);
    blocksInitiated.forEach((b) => excludedIds.add(b.blockedUserId));
    blocksReceived.forEach((b) => excludedIds.add(b.blockerId));
    existingMatches.forEach((m) => {
      excludedIds.add(m.user1Id);
      excludedIds.add(m.user2Id);
    });

    const totalCount = await prisma.like.count({
      where: {
        toUserId: user.id,
        fromUserId: { notIn: Array.from(excludedIds) },
        fromUser: {
          status: "ACTIVE",
        },
      },
    });

    if (limit === 0) {
      // Free plan: Return count only, profiles are locked
      return NextResponse.json({
        totalCount,
        locked: true,
        limit: 0,
        profiles: [],
        upgradeRequired: true,
      });
    }

    const takeCount = !isFinite(limit) ? 50 : limit;

    const likes = await prisma.like.findMany({
      where: {
        toUserId: user.id,
        fromUserId: { notIn: Array.from(excludedIds) },
        fromUser: {
          status: "ACTIVE",
        },
      },
      include: {
        fromUser: {
          include: {
            profile: {
              include: {
                photos: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: takeCount,
    });

    const profiles = likes
      .filter((l) => l.fromUser.profile !== null)
      .map((l) => ({
        userId: l.fromUserId,
        likedAt: l.createdAt,
        name: l.fromUser.profile!.name,
        age: l.fromUser.profile!.age,
        city: l.fromUser.profile!.city,
        photoUrl: l.fromUser.profile!.photos[0]?.url || null,
        isVerified: l.fromUser.isVerified,
      }));

    return NextResponse.json({
      totalCount,
      locked: false,
      limit,
      profiles,
      upgradeRequired: false,
    });
  } catch (error: any) {
    console.error("Likes received error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching likes received." },
      { status: 500 }
    );
  }
}
