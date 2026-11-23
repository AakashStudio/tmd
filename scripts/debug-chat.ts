import { prisma } from "../src/lib/db";

async function main() {
  const matches = await prisma.match.findMany({
    include: {
      user1: { include: { profile: true } },
      user2: { include: { profile: true } },
      conversation: {
        include: {
          messages: true,
        },
      },
    },
  });

  console.log("Total matches:", matches.length);
  for (const m of matches) {
    console.log({
      matchId: m.id,
      status: m.status,
      user1: m.user1?.profile?.name || m.user1Id,
      user2: m.user2?.profile?.name || m.user2Id,
      hasConversation: Boolean(m.conversation),
      conversationId: m.conversation?.id,
      messageCount: m.conversation?.messages?.length || 0,
    });
  }

  const allConversations = await prisma.conversation.findMany({
    include: { messages: true },
  });
  console.log("Total conversations in DB:", allConversations.length);
  for (const c of allConversations) {
    console.log("Conv:", c.id, "matchId:", c.matchId, "msgCount:", c.messages.length);
  }
}

main()
  .catch((e) => console.error("Error:", e))
  .finally(() => prisma.$disconnect());
