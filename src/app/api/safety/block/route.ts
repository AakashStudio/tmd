import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getCanonicalMatchPair } from "@/lib/match-helper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { blockedUserId } = body;

    if (!blockedUserId || typeof blockedUserId !== "string") {
      return NextResponse.json({ error: "Blocked user ID is required." }, { status: 400 });
    }

    if (blockedUserId === user.id) {
      return NextResponse.json({ error: "You cannot block yourself." }, { status: 400 });
    }

    // 1. Create Block record
    await prisma.block.upsert({
      where: {
        blockerId_blockedUserId: {
          blockerId: user.id,
          blockedUserId,
        },
      },
      update: {},
      create: {
        blockerId: user.id,
        blockedUserId,
      },
    });

    // 2. Immediate exclusion: Update match status if exists
    try {
      const { user1Id, user2Id } = getCanonicalMatchPair(user.id, blockedUserId);
      await prisma.match.updateMany({
        where: {
          user1Id,
          user2Id,
        },
        data: {
          status: "UNMATCHED",
          unmatchedById: user.id,
        },
      });
    } catch {
      // No match exists between them, that's fine
    }

    return NextResponse.json({
      success: true,
      message: "User blocked successfully. They will no longer appear in your feed or chat.",
    });
  } catch (error: any) {
    console.error("Block API error:", error);
    return NextResponse.json(
      { error: "Internal server error blocking user." },
      { status: 500 }
    );
  }
}
