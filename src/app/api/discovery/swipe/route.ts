import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { swipeActionSchema, formatZodError } from "@/lib/validation";
import { getCurrentSwipeWindow } from "@/lib/swipe-window";
import { getCanonicalMatchPair } from "@/lib/match-helper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.profile) {
      return NextResponse.json(
        { error: "Please complete your profile first." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = swipeActionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { targetUserId, action } = parseResult.data;

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "You cannot swipe on yourself." },
        { status: 400 }
      );
    }

    // Verify target exists and is active
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
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
    });

    if (!targetUser || targetUser.status !== "ACTIVE" || !targetUser.profile) {
      return NextResponse.json(
        { error: "Candidate profile not found or inactive." },
        { status: 404 }
      );
    }

    let swipeCount = 0;
    const totalLimit = user.entitlements.swipesLimitPerWindow;
    let swipesRemaining: number | null = null;

    // Enforce 12-hour swipe limits for Free tier
    if (totalLimit !== null) {
      const windowPeriod = getCurrentSwipeWindow();

      // Find or create current window record
      const swipeRecord = await prisma.swipeWindow.upsert({
        where: {
          userId_windowStart: {
            userId: user.id,
            windowStart: windowPeriod.windowStart,
          },
        },
        update: {},
        create: {
          userId: user.id,
          windowStart: windowPeriod.windowStart,
          count: 0,
        },
      });

      if (swipeRecord.count >= totalLimit) {
        return NextResponse.json(
          {
            error: `You have reached your ${totalLimit} free likes for this 12-hour window. Upgrade for unlimited swipes!`,
            limitReached: true,
            resetAt: windowPeriod.windowEnd.toISOString(),
            secondsUntilReset: windowPeriod.secondsUntilReset,
            planCode: user.activeSubscription?.plan.code || "FREE",
          },
          { status: 429 }
        );
      }

      // Increment swipe count
      const updatedWindow = await prisma.swipeWindow.update({
        where: { id: swipeRecord.id },
        data: { count: { increment: 1 } },
      });
      swipeCount = updatedWindow.count;
      swipesRemaining = Math.max(0, totalLimit - swipeCount);
    }

    if (action === "PASS") {
      await prisma.pass.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: user.id,
            toUserId: targetUserId,
          },
        },
        update: {},
        create: {
          fromUserId: user.id,
          toUserId: targetUserId,
        },
      });

      return NextResponse.json({
        success: true,
        action: "PASS",
        isMatch: false,
        swipeCount,
        swipesRemaining,
        totalLimit,
      });
    }

    // action === "LIKE"
    await prisma.like.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: user.id,
          toUserId: targetUserId,
        },
      },
      update: {},
      create: {
        fromUserId: user.id,
        toUserId: targetUserId,
      },
    });

    // Check for reciprocal like
    const reciprocalLike = await prisma.like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: targetUserId,
          toUserId: user.id,
        },
      },
    });

    if (reciprocalLike) {
      // Reciprocal like detected: Create canonical Match
      const { user1Id, user2Id } = getCanonicalMatchPair(user.id, targetUserId);

      const match = await prisma.match.upsert({
        where: {
          user1Id_user2Id: {
            user1Id,
            user2Id,
          },
        },
        update: {
          status: "ACTIVE",
        },
        create: {
          user1Id,
          user2Id,
          status: "ACTIVE",
        },
      });

      // Ensure conversation exists
      const conversation = await prisma.conversation.upsert({
        where: {
          matchId: match.id,
        },
        update: {},
        create: {
          matchId: match.id,
        },
      });

      return NextResponse.json({
        success: true,
        action: "LIKE",
        isMatch: true,
        match: {
          id: match.id,
          conversationId: conversation.id,
          matchedUser: {
            id: targetUserId,
            name: targetUser.profile.name,
            photoUrl: targetUser.profile.photos[0]?.url || null,
          },
        },
        swipeCount,
        swipesRemaining,
        totalLimit,
      });
    }

    return NextResponse.json({
      success: true,
      action: "LIKE",
      isMatch: false,
      swipeCount,
      swipesRemaining,
      totalLimit,
    });
  } catch (error: any) {
    console.error("Swipe API error:", error);
    return NextResponse.json(
      { error: "Internal server error processing swipe." },
      { status: 500 }
    );
  }
}
