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
    });

    if (!targetLike) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const senderId = targetLike.fromUserId;

    // 1. Mark like as ACCEPTED
    await prisma.like.update({
      where: { id: targetLike.id },
      data: { status: "ACCEPTED" },
    });

    // 2. Create reciprocal like from user to sender
    await prisma.like.upsert({
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

    // 3. Create canonical Match
    const { user1Id, user2Id } = getCanonicalMatchPair(user.id, senderId);
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

    // 4. Create Conversation
    const conversation = await prisma.conversation.upsert({
      where: {
        matchId: match.id,
      },
      update: {},
      create: {
        matchId: match.id,
      },
    });

    // 5. If pre-match comment was attached, make it the first message
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
