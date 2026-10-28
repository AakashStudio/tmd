import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { savePrivateMedia } from "@/lib/storage";
import { calculateUnopenedExpiryDate } from "@/lib/view-once";
import {
  getConversationMessages,
  validateChatParticipant,
} from "@/services/chatService";
import { createNotification } from "@/lib/notifications";
import crypto from "crypto";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    conversationId: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const direction = (searchParams.get("direction") as "before" | "after") || "before";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const includePartnerParam = searchParams.get("includePartner");
    const includePartner = includePartnerParam !== "false";

    const result = await getConversationMessages({
      user,
      conversationId,
      cursor,
      direction,
      limit,
      includePartner,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Chat messages GET error:", error);
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error fetching messages." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = params;

    const validation = await validateChatParticipant(conversationId, user.id);
    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const body = await req.json().catch(() => ({}));
    const { type = "TEXT", content = "", mediaBase64 } = body;

    if (type === "TEXT") {
      const trimmed = (content || "").trim();
      if (!trimmed || trimmed.length > 2000) {
        return NextResponse.json(
          { error: "Message content must be between 1 and 2000 characters." },
          { status: 400 }
        );
      }

      const realConversationId = validation.conversation.id;

      const message = await prisma.message.create({
        data: {
          conversationId: realConversationId,
          senderId: user.id,
          content: trimmed,
          type: "TEXT",
          status: "SENT",
        },
      });

      await prisma.conversation.update({
        where: { id: realConversationId },
        data: { lastMessageAt: new Date() },
      });

      // Send Message Notification to partner
      const partnerId =
        validation.conversation.match.user1Id === user.id
          ? validation.conversation.match.user2Id
          : validation.conversation.match.user1Id;

      const senderName = user.profile?.name || "Your match";
      createNotification({
        userId: partnerId,
        type: "MESSAGE",
        title: senderName,
        body: trimmed.length > 60 ? `${trimmed.substring(0, 57)}...` : trimmed,
        linkUrl: `/chat/${realConversationId}`,
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        message: {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          isFromMe: true,
          content: message.content,
          type: message.type,
          status: message.status,
          createdAt: message.createdAt,
          media: null,
        },
      });
    }

    if (type === "VIEW_ONCE_PHOTO") {
      if (!mediaBase64 || typeof mediaBase64 !== "string") {
        return NextResponse.json(
          { error: "View Once photo media content is required." },
          { status: 400 }
        );
      }

      // Check max size (max 15MB binary ~ 20MB base64) to prevent memory exhaustion
      if (mediaBase64.length > 20 * 1024 * 1024) {
        return NextResponse.json(
          { error: "View Once photo exceeds 15MB size limit." },
          { status: 400 }
        );
      }

      // Extract base64 buffer
      const base64Data = mediaBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const filename = `vo_${Date.now()}_${crypto.randomBytes(8).toString("hex")}.jpg`;
      const storageKey = await savePrivateMedia(buffer, "view_once", filename);

      const expiresAt = calculateUnopenedExpiryDate();

      const realConversationId = validation.conversation.id;

      const message = await prisma.message.create({
        data: {
          conversationId: realConversationId,
          senderId: user.id,
          content: "📷 View Once Photo",
          type: "VIEW_ONCE_PHOTO",
          status: "SENT",
          media: {
            create: {
              storageKey,
              isViewOnce: true,
              expiresAt,
            },
          },
        },
        include: {
          media: true,
        },
      });

      await prisma.conversation.update({
        where: { id: realConversationId },
        data: { lastMessageAt: new Date() },
      });

      // Send Message Notification to partner
      const partnerId =
        validation.conversation.match.user1Id === user.id
          ? validation.conversation.match.user2Id
          : validation.conversation.match.user1Id;

      const senderName = user.profile?.name || "Your match";
      createNotification({
        userId: partnerId,
        type: "MESSAGE",
        title: senderName,
        body: "📷 Sent you a view-once photo",
        linkUrl: `/chat/${realConversationId}`,
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        message: {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          isFromMe: true,
          content: message.content,
          type: message.type,
          status: message.status,
          createdAt: message.createdAt,
          media: {
            id: message.media!.id,
            isViewOnce: true,
            isOpened: false,
            isExpired: false,
            canOpen: false, // sender cannot open
            openedAt: null,
          },
        },
      });
    }

    return NextResponse.json({ error: "Invalid message type." }, { status: 400 });
  } catch (error: any) {
    console.error("Chat message send error:", error);
    return NextResponse.json(
      { error: "Internal server error sending message." },
      { status: 500 }
    );
  }
}
