import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getCanonicalMatchPair } from "@/lib/match-helper";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { likeId } = body;

    if (!likeId) {
      return NextResponse.json({ error: "likeId is required" }, { status: 400 });
    }

    // Find the like where user is the recipient
    const targetLike = await prisma.like.findFirst({
      where: {
        id: likeId,
        toUserId: user.id,
      },
      include: {
        fromUser: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!targetLike) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const senderId = targetLike.fromUserId;
    const { user1Id, user2Id } = getCanonicalMatchPair(user.id, senderId);

    // Atomic transaction: Resolve all pending requests, update reciprocal likes, and establish connection
    const { match, conversation } = await prisma.$transaction(async (tx) => {
      // 1. Mark ALL likes between both users as ACCEPTED
      await tx.like.updateMany({
        where: {
          OR: [
            { fromUserId: senderId, toUserId: user.id },
            { fromUserId: user.id, toUserId: senderId },
          ],
        },
        data: { status: "ACCEPTED" },
      });

      // 2. Ensure reciprocal like exists and is ACCEPTED
      await tx.like.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: user.id,
            toUserId: senderId,
          },
        },
        update: {
          status: "ACCEPTED",
        },
        create: {
          fromUserId: user.id,
          toUserId: senderId,
          status: "ACCEPTED",
        },
      });

      // 3. Clear any existing passes between them
      await tx.pass.deleteMany({
        where: {
          OR: [
            { fromUserId: user.id, toUserId: senderId },
            { fromUserId: senderId, toUserId: user.id },
          ],
        },
      });

      // 4. Create or update canonical Match
      const m = await tx.match.upsert({
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

      // 5. Create Conversation
      const c = await tx.conversation.upsert({
        where: {
          matchId: m.id,
        },
        update: {},
        create: {
          matchId: m.id,
        },
      });

      return { match: m, conversation: c };
    });

    // 6. If pre-match comment was attached, make it the first message
    if (targetLike.comment) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: senderId,
          content: targetLike.comment,
          status: "SENT",
        },
      }).catch(() => null);
    }

    // 6. Trigger Match notifications for both users
    const myName = user.profile?.name || "Someone";
    const senderName = targetLike.fromUser?.profile?.name || "Someone";
    await Promise.all([
      createNotification({
        userId: senderId,
        type: "MATCH",
        title: "It's a Match! 🎉",
        body: `You and ${myName} matched! Say hello.`,
        linkUrl: `/chat/${conversation.id}`,
      }),
      createNotification({
        userId: user.id,
        type: "MATCH",
        title: "It's a Match! 🎉",
        body: `You and ${senderName} matched! Say hello.`,
        linkUrl: `/chat/${conversation.id}`,
      }),
    ]).catch(() => null);

    return NextResponse.json({
      success: true,
      matchId: match.id,
      conversationId: conversation.id,
    });
  } catch (error: any) {
    console.error("Accept request error:", error);
    return NextResponse.json(
      { error: "Internal server error accepting request." },
      { status: 500 }
    );
  }
}
