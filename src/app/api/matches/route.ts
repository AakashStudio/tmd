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

    // Exclude blocked users
    const [blocksInitiated, blocksReceived] = await Promise.all([
      prisma.block.findMany({
        where: { blockerId: user.id },
        select: { blockedUserId: true },
      }),
      prisma.block.findMany({
        where: { blockedUserId: user.id },
        select: { blockerId: true },
      }),
    ]);

    const blockedIds = new Set<string>();
    blocksInitiated.forEach((b) => blockedIds.add(b.blockedUserId));
    blocksReceived.forEach((b) => blockedIds.add(b.blockerId));

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
        status: "ACTIVE",
      },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        user1: {
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
        user2: {
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
      orderBy: { updatedAt: "desc" },
    });

    // Filter out any matches involving blocked users
    const filteredMatches = matches.filter((m) => {
      const partnerId = m.user1Id === user.id ? m.user2Id : m.user1Id;
      return !blockedIds.has(partnerId);
    });

    // Ensure every active match has an active conversation
    const formattedMatches = await Promise.all(
      filteredMatches.map(async (m) => {
        let conversation = m.conversation;
        if (!conversation) {
          conversation = (await prisma.conversation.upsert({
            where: { matchId: m.id },
            update: {},
            create: { matchId: m.id },
            include: {
              messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          })) as any;
        }

        const isUser1 = m.user1Id === user.id;
        const partner = isUser1 ? m.user2 : m.user1;
        const partnerProfile = partner.profile;
        const latestMsg = conversation?.messages?.[0] || null;

        return {
          matchId: m.id,
          conversationId: conversation?.id || m.id,
          matchedAt: m.createdAt,
          partner: {
            userId: partner.id,
            name: partnerProfile?.name || "Match",
            age: partnerProfile?.age || 21,
            city: partnerProfile?.city || "",
            photoUrl: partnerProfile?.photos[0]?.url || null,
            isVerified: partner.isVerified,
          },
          lastMessage: latestMsg
            ? {
                id: latestMsg.id,
                content:
                  latestMsg.type === "VIEW_ONCE_PHOTO"
                    ? "📷 View Once Photo"
                    : latestMsg.content,
                senderId: latestMsg.senderId,
                createdAt: latestMsg.createdAt,
                isFromMe: latestMsg.senderId === user.id,
                status: latestMsg.status,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      matches: formattedMatches,
      count: formattedMatches.length,
    });
  } catch (error: any) {
    console.error("Matches API error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching matches." },
      { status: 500 }
    );
  }
}
