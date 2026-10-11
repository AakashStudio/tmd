import { prisma } from "../src/lib/db";
import { getDiscoveryFeed } from "../src/services/discoveryService";
import { getConversationMessages } from "../src/services/chatService";
import { AuthenticatedUser } from "../src/lib/session";

async function runVerification() {
  console.log("==========================================================");
  console.log("🔬 VERIFYING DISCOVERY SQL & QUERY PLANS (EXPLAIN ANALYZE)");
  console.log("==========================================================\n");

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const testUserId = "non_existent_test_id";

  // 1. Run EXPLAIN ANALYZE on discovery query
  const explainResult: any = await prisma.$queryRawUnsafe(`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT u.id, u."isVerified", u."lastActiveAt"
    FROM users u
    JOIN profiles p ON p."userId" = u.id
    WHERE u.id != $1
      AND u.status = 'ACTIVE'
      AND u."lastActiveAt" >= $2
      AND NOT EXISTS (SELECT 1 FROM likes l WHERE l."fromUserId" = $1 AND l."toUserId" = u.id)
      AND NOT EXISTS (SELECT 1 FROM passes ps WHERE ps."fromUserId" = $1 AND ps."toUserId" = u.id)
      AND NOT EXISTS (SELECT 1 FROM blocks b1 WHERE b1."blockerId" = $1 AND b1."blockedUserId" = u.id)
      AND NOT EXISTS (SELECT 1 FROM blocks b2 WHERE b2."blockedUserId" = $1 AND b2."blockerId" = u.id)
      AND NOT EXISTS (SELECT 1 FROM matches m WHERE (m."user1Id" = $1 AND m."user2Id" = u.id OR m."user2Id" = $1 AND m."user1Id" = u.id) AND m.status = 'ACTIVE')
    ORDER BY u."lastActiveAt" DESC, u.id ASC
    LIMIT 21;
  `, testUserId, sevenDaysAgo);

  console.log("Discovery Query Plan:");
  explainResult.forEach((row: any) => console.log("  " + row["QUERY PLAN"]));

  console.log("\n==========================================================");
  console.log("🔬 VERIFYING BIDIRECTIONAL CHAT CURSOR PAGINATION & ISOLATION");
  console.log("==========================================================\n");

  // Create isolated users and conversation
  const user1 = await prisma.user.create({
    data: {
      phone: `+91888${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: "ACTIVE",
      profile: {
        create: {
          name: "Verify Chat A",
          dob: new Date("1996-01-01"),
          age: 28,
          gender: "MALE",
          interestedIn: "WOMEN",
          city: "Bhopal",
        },
      },
    },
    include: { profile: true },
  });

  const user2 = await prisma.user.create({
    data: {
      phone: `+91888${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: "ACTIVE",
      profile: {
        create: {
          name: "Verify Chat B",
          dob: new Date("1997-01-01"),
          age: 27,
          gender: "FEMALE",
          interestedIn: "MEN",
          city: "Bhopal",
        },
      },
    },
    include: { profile: true },
  });

  const canonical = user1.id < user2.id ? [user1.id, user2.id] : [user2.id, user1.id];
  const match = await prisma.match.create({
    data: {
      user1Id: canonical[0],
      user2Id: canonical[1],
      status: "ACTIVE",
      conversation: { create: {} },
    },
    include: { conversation: true },
  });
  const conversationId = match.conversation!.id;

  // Insert 10 chronological messages
  const insertedMsgIds: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const msg = await prisma.message.create({
      data: {
        conversationId,
        senderId: i % 2 === 0 ? user2.id : user1.id,
        content: `Message ${i}`,
        type: "TEXT",
        status: "SENT",
        createdAt: new Date(Date.now() + i * 1000),
      },
    });
    insertedMsgIds.push(msg.id);
  }

  const authUser1: AuthenticatedUser = {
    id: user1.id,
    phone: user1.phone,
    email: user1.email,
    role: "USER",
    status: "ACTIVE",
    isVerified: true,
    lastActiveAt: new Date(),
    profile: {
      id: user1.profile!.id,
      name: user1.profile!.name,
      dob: user1.profile!.dob,
      age: user1.profile!.age,
      gender: user1.profile!.gender,
      interestedIn: user1.profile!.interestedIn,
      city: user1.profile!.city,
      bio: null,
      profession: null,
      education: null,
      height: null,
      relationshipIntention: "NOT_SURE_YET",
      isNameLocked: true,
      photos: [],
    },
    activeSubscription: null,
    entitlements: {
      planCode: "FREE",
      planName: "Free",
      isPaid: false,
      isPro: false,
      canRewind: false,
      whoLikedYouLimit: 0,
      swipesLimitPerWindow: 10,
      canSelectCity: false,
      canUseDistanceFilter: false,
      hasAds: true,
      canAccessEvents: false,
      canJoinEvents: false,
      canCreateEvents: false,
      canChangeName: false,
      canRequestDobCorrection: false,
      maxFreeLocationChanges: 3,
      locationChangesRemaining: 3,
    },
  };

  // Test 1: Initial fetch (limit 5)
  const initialFetch = await getConversationMessages({
    user: authUser1,
    conversationId,
    limit: 5,
    direction: "before",
  });
  console.log(`✓ Initial fetch: Got ${initialFetch.messages.length} messages (expected 5)`);
  console.log(`  First message: "${initialFetch.messages[0]?.content}", Last message: "${initialFetch.messages[initialFetch.messages.length - 1]?.content}"`);
  console.log(`  nextCursor: ${initialFetch.nextCursor}, hasMore: ${initialFetch.hasMore}`);

  // Test 2: Paginate backwards (historical messages) using nextCursor
  const page2 = await getConversationMessages({
    user: authUser1,
    conversationId,
    cursor: initialFetch.nextCursor,
    limit: 5,
    direction: "before",
  });
  console.log(`✓ Historical pagination: Got ${page2.messages.length} earlier messages (expected 5)`);
  console.log(`  First message: "${page2.messages[0]?.content}", Last message: "${page2.messages[page2.messages.length - 1]?.content}"`);

  // Test 3: Incremental forward polling (direction = "after")
  const lastKnownId = insertedMsgIds[7]; // up to message 8
  const forwardPoll = await getConversationMessages({
    user: authUser1,
    conversationId,
    cursor: lastKnownId,
    direction: "after",
    limit: 10,
  });
  console.log(`✓ Incremental forward poll after message 8: Got ${forwardPoll.messages.length} new messages (expected 2: Message 9 and 10)`);
  forwardPoll.messages.forEach((m) => console.log(`  Received: "${m.content}"`));

  // Clean up
  await prisma.message.deleteMany({ where: { conversationId } });
  await prisma.conversation.delete({ where: { id: conversationId } });
  await prisma.match.delete({ where: { id: match.id } });
  await prisma.profile.deleteMany({ where: { userId: { in: [user1.id, user2.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [user1.id, user2.id] } } });
  console.log("✓ Test conversation cleaned up successfully\n");

  await prisma.$disconnect();
}

runVerification().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
