import { prisma } from "@/lib/db";
import { AuthenticatedUser } from "@/lib/session";

export interface GetMessagesOptions {
  user: AuthenticatedUser;
  conversationId: string;
  cursor?: string | null;
  limit?: number;
  direction?: "before" | "after"; // "before" for historical scroll up, "after" for newer messages
  includePartner?: boolean;
}

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  isFromMe: boolean;
  content: string;
  type: "TEXT" | "VIEW_ONCE_PHOTO";
  status: "SENT" | "DELIVERED" | "READ";
  createdAt: Date;
  media: {
    id: string;
    isViewOnce: boolean;
    isOpened: boolean;
    isExpired: boolean;
    canOpen: boolean;
    openedAt: Date | null;
  } | null;
}

export interface PartnerProfileDto {
  userId: string;
  name: string;
  photoUrl: string | null;
  isVerified: boolean;
  lastActiveAt: Date;
}

export interface GetMessagesResult {
  messages: ChatMessageDto[];
  partner: PartnerProfileDto | null;
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

/**
 * Validates chat conversation membership and block status.
 */
export async function validateChatParticipant(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      match: true,
    },
  });

  if (!conversation) {
    return { error: "Conversation not found", status: 404 };
  }

  const { match } = conversation;
  const isParticipant = match.user1Id === userId || match.user2Id === userId;

  if (!isParticipant) {
    return {
      error: "Forbidden: You are not a participant in this conversation.",
      status: 403,
    };
  }

  if (match.status !== "ACTIVE") {
    return { error: "This match is no longer active.", status: 403 };
  }

  const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;

  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedUserId: partnerId },
        { blockerId: partnerId, blockedUserId: userId },
      ],
    },
  });

  if (block) {
    return {
      error: "Communication is blocked between these users.",
      status: 403,
    };
  }

  return { conversation, match, partnerId };
}

/**
 * Retrieves paginated messages for a conversation.
 * Supports cursor pagination for both initial loading and incremental polling.
 */
export async function getConversationMessages(
  options: GetMessagesOptions
): Promise<GetMessagesResult> {
  const {
    user,
    conversationId,
    cursor,
    limit = 50,
    direction = "before",
    includePartner = true,
  } = options;

  const validation = await validateChatParticipant(conversationId, user.id);
  if ("error" in validation) {
    throw new Error(validation.error);
  }

  const { partnerId } = validation;

  // Auto-mark incoming unread messages as READ
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: partnerId,
      status: { not: "READ" },
    },
    data: {
      status: "READ",
    },
  });

  const takeAmount = Math.min(Math.max(1, limit), 100);

  // If direction === "after" (polling for new messages after cursor):
  // we fetch messages where id > cursor or createdAt > cursorMessage.createdAt in asc order.
  let messages;
  let hasMore = false;
  let nextCursor: string | null = null;
  let prevCursor: string | null = null;

  if (direction === "after" && cursor) {
    // Polling for incoming new messages
    messages = await prisma.message.findMany({
      where: { conversationId },
      take: takeAmount,
      skip: 1,
      cursor: { id: cursor },
      include: { media: true },
      orderBy: { createdAt: "asc" },
    });
  } else {
    // Normal or historical loading
    const queryTake = takeAmount + 1;
    messages = await prisma.message.findMany({
      where: { conversationId },
      include: { media: true },
      take: queryTake,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
    });

    if (messages.length > takeAmount) {
      hasMore = true;
      messages = messages.slice(0, takeAmount);
      // nextCursor points to the oldest message in the current batch (for fetching items before it)
      nextCursor = messages[messages.length - 1].id;
    }
    // Reverse to display chronologically (asc) in UI
    messages.reverse();
  }

  const now = new Date();
  const formattedMessages: ChatMessageDto[] = messages.map((m) => {
    const isFromMe = m.senderId === user.id;
    let mediaInfo = null;

    if (m.media) {
      const isExpired = Boolean(m.media.expiresAt && m.media.expiresAt < now);
      const isOpened = Boolean(m.media.openedAt);

      mediaInfo = {
        id: m.media.id,
        isViewOnce: m.media.isViewOnce,
        isOpened,
        isExpired,
        canOpen: !isFromMe && !isOpened && !isExpired,
        openedAt: m.media.openedAt,
      };
    }

    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      isFromMe,
      content: m.content,
      type: m.type as "TEXT" | "VIEW_ONCE_PHOTO",
      status: m.status as "SENT" | "DELIVERED" | "READ",
      createdAt: m.createdAt,
      media: mediaInfo,
    };
  });

  // Partner profile for chat header (only loaded on initial fetch or when requested)
  let partnerDto: PartnerProfileDto | null = null;
  if (includePartner) {
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        isVerified: true,
        lastActiveAt: true,
        profile: {
          select: {
            name: true,
            photos: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });

    if (partner?.profile) {
      partnerDto = {
        userId: partner.id,
        name: partner.profile.name,
        photoUrl: partner.profile.photos[0]?.url || null,
        isVerified: partner.isVerified,
        lastActiveAt: partner.lastActiveAt,
      };
    }
  }

  return {
    messages: formattedMessages,
    partner: partnerDto,
    nextCursor,
    prevCursor,
    hasMore,
  };
}
