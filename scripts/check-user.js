const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function check() {
  const user = await p.user.findFirst({
    where: { phone: "7566548512" },
    include: {
      profile: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        include: { plan: true },
      },
    },
  });

  console.log("User:", user.phone, "| Name:", user.profile.name);
  console.log("Active Plan:", user.subscriptions[0]?.plan.name);

  const matches = await p.match.findMany({
    where: {
      OR: [{ user1Id: user.id }, { user2Id: user.id }],
      status: "ACTIVE",
    },
    include: {
      conversation: { include: { messages: true } },
      user1: { include: { profile: true } },
      user2: { include: { profile: true } },
    },
  });

  console.log("Total Matches:", matches.length);
  for (const m of matches) {
    const partner = m.user1Id === user.id ? m.user2.profile : m.user1.profile;
    const lastMsg = m.conversation?.messages[m.conversation.messages.length - 1];
    console.log(`- Partner: ${partner.name} | Messages: ${m.conversation?.messages.length} | Last: "${lastMsg?.content}"`);
  }

  const events = await p.event.findMany({ select: { id: true, title: true, venue: true, attendanceMode: true } });
  console.log("Events count:", events.length);
  for (const ev of events) {
    console.log(`- Event: ${ev.title} @ ${ev.venue} (${ev.attendanceMode})`);
  }
}

check().catch(console.error).finally(() => p.$disconnect());
