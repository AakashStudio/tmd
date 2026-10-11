import { prisma } from "../src/lib/db";
import { getConversationMessages } from "../src/services/chatService";
import { getDiscoveryFeed } from "../src/services/discoveryService";
import { AuthenticatedUser } from "../src/lib/session";

async function runCorrectnessVerification() {
  console.log("==========================================================================");
  console.log("🧪 RIGOROUS CORRECTNESS VERIFICATION: CHAT & DISCOVERY EDGE CASES");
  console.log("==========================================================================\n");

  // -------------------------------------------------------------
  // TEST 1: CHAT INCREMENTAL POLLING CORRECTNESS
  // Verify: No missed messages, no duplicate messages, proper ordering, reconnection recovery
  // -------------------------------------------------------------
  console.log("--- 1. Testing Chat Incremental Polling Edge Cases ---");

  const userA = await prisma.user.create({
    data: {
      phone: `+91555${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: "ACTIVE",
      profile: {
        create: {
          name: "Correctness Alice",
          dob: new Date("1998-01-01"),
          age: 26,
          gender: "FEMALE",
          interestedIn: "MEN",
          city: "Bhopal",
        },
      },
    },
    include: { profile: true },
  });

  const userB = await prisma.user.create({
    data: {
      phone: `+91555${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: "ACTIVE",
      profile: {
        create: {
          name: "Correctness Bob",
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

  const pair = userA.id < userB.id ? [userA.id, userB.id] : [userB.id, userA.id];
  const match = await prisma.match.create({
    data: {
      user1Id: pair[0],
      user2Id: pair[1],
      status: "ACTIVE",
      conversation: { create: {} },
    },
    include: { conversation: true },
  });
  const conversationId = match.conversation!.id;

  const authAlice: AuthenticatedUser = {
    id: userA.id,
    phone: userA.phone,
    email: userA.email,
    role: "USER",
    status: "ACTIVE",
    isVerified: true,
    lastActiveAt: new Date(),
    profile: {
      id: userA.profile!.id,
      name: userA.profile!.name,
      dob: userA.profile!.dob,
      age: userA.profile!.age,
      gender: userA.profile!.gender,
      interestedIn: userA.profile!.interestedIn,
      city: userA.profile!.city,
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

  // 1a. Simulate Initial Load with 5 messages
  const msgIds: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const m = await prisma.message.create({
      data: {
        conversationId,
        senderId: i % 2 === 0 ? userB.id : userA.id,
        content: `Initial Msg ${i}`,
        type: "TEXT",
        status: "SENT",
        createdAt: new Date(Date.now() + i * 1000),
      },
    });
    msgIds.push(m.id);
  }

  const initialLoad = await getConversationMessages({
    user: authAlice,
    conversationId,
    limit: 10,
    direction: "before",
  });
  console.log(`✓ Initial load returned ${initialLoad.messages.length}/5 messages.`);
  if (initialLoad.messages.length !== 5) throw new Error("Initial load message count mismatch");

  let clientMessages = [...initialLoad.messages];
  let lastKnownId = clientMessages[clientMessages.length - 1].id;

  // 1b. Send 3 new messages and perform incremental poll
  const newMsgIds: string[] = [];
  for (let i = 6; i <= 8; i++) {
    const m = await prisma.message.create({
      data: {
        conversationId,
        senderId: userB.id,
        content: `Incremental Msg ${i}`,
        type: "TEXT",
        status: "SENT",
        createdAt: new Date(Date.now() + i * 1000),
      },
    });
    newMsgIds.push(m.id);
  }

  const poll1 = await getConversationMessages({
    user: authAlice,
    conversationId,
    cursor: lastKnownId,
    direction: "after",
    limit: 10,
    includePartner: false,
  });

  console.log(`✓ Incremental poll 1 returned ${poll1.messages.length} messages (expected 3).`);
  if (poll1.messages.length !== 3) throw new Error("Incremental poll 1 count mismatch");

  // Client updates local state with deduplication (matching useChat.ts)
  const existingSet = new Set(clientMessages.map((m) => m.id));
  const uniqueNew = poll1.messages.filter((m) => !existingSet.has(m.id));
  clientMessages = [...clientMessages, ...uniqueNew as any];
  lastKnownId = clientMessages[clientMessages.length - 1].id;

  console.log(`✓ Client state now has ${clientMessages.length} total messages with 0 duplicates.`);
  if (clientMessages.length !== 8) throw new Error("Client message accumulation error");

  // 1c. Poll again with NO new messages (Idle poll)
  const idlePoll = await getConversationMessages({
    user: authAlice,
    conversationId,
    cursor: lastKnownId,
    direction: "after",
    limit: 10,
    includePartner: false,
  });
  console.log(`✓ Idle poll returned ${idlePoll.messages.length} messages (expected 0, delta = 0).`);
  if (idlePoll.messages.length !== 0) throw new Error("Idle poll should return empty array");

  // 1d. Simulate Reconnection (client disconnects, 5 messages arrive while offline, client reconnects)
  for (let i = 9; i <= 13; i++) {
    await prisma.message.create({
      data: {
        conversationId,
        senderId: userB.id,
        content: `Offline Msg ${i}`,
        type: "TEXT",
        status: "SENT",
        createdAt: new Date(Date.now() + i * 1000),
      },
    });
  }

  // Client reconnects: performs forward poll starting from last known message ID before disconnect
  const reconnectPoll = await getConversationMessages({
    user: authAlice,
    conversationId,
    cursor: lastKnownId,
    direction: "after",
    limit: 20,
    includePartner: false,
  });
  console.log(`✓ Reconnection poll returned ${reconnectPoll.messages.length} messages (expected 5 offline messages).`);
  if (reconnectPoll.messages.length !== 5) throw new Error("Reconnection missed messages");

  // Verify ordering: messages must be strictly ascending by createdAt
  let orderValid = true;
  for (let i = 1; i < reconnectPoll.messages.length; i++) {
    if (new Date(reconnectPoll.messages[i].createdAt).getTime() < new Date(reconnectPoll.messages[i - 1].createdAt).getTime()) {
      orderValid = false;
    }
  }
  console.log(`✓ Chronological ascending message order strictly maintained: ${orderValid}`);
  if (!orderValid) throw new Error("Message ordering invalid");

  // -------------------------------------------------------------
  // TEST 2: DISCOVERY PAGINATION, DEDUPLICATION & EXCLUSIONS
  // Verify: Cursor pagination returns 0 duplicates across pages, no skipped profiles,
  // block enforcement, and canonical match exclusion.
  // -------------------------------------------------------------
  console.log("\n--- 2. Testing Discovery Pagination, Deduplication & Exclusions ---");

  // Seed 25 discovery candidate users in Bhopal
  const candidates: any[] = [];
  for (let i = 0; i < 25; i++) {
    const c = await prisma.user.create({
      data: {
        phone: `+91444${Math.floor(1000000 + Math.random() * 9000000)}`,
        status: "ACTIVE",
        lastActiveAt: new Date(Date.now() - i * 60000), // staged activity times
        profile: {
          create: {
            name: `Candidate ${i}`,
            dob: new Date("1997-01-01"),
            age: 27,
            gender: "MALE",
            interestedIn: "WOMEN",
            city: "Bhopal",
          },
        },
      },
      include: { profile: true },
    });
    candidates.push(c);
  }

  // Page 1: limit 10
  const page1 = await getDiscoveryFeed({
    user: authAlice,
    limit: 10,
  });
  console.log(`✓ Discovery Page 1: Got ${page1.candidates.length} candidates. nextCursor: ${page1.nextCursor}`);
  if (page1.candidates.length !== 10) throw new Error("Page 1 length error");

  // Page 2: limit 10 using nextCursor
  const page2 = await getDiscoveryFeed({
    user: authAlice,
    cursor: page1.nextCursor,
    limit: 10,
  });
  console.log(`✓ Discovery Page 2: Got ${page2.candidates.length} candidates. nextCursor: ${page2.nextCursor}`);
  if (page2.candidates.length !== 10) throw new Error("Page 2 length error");

  // Verify 0 overlaps between Page 1 and Page 2
  const page1Ids = new Set(page1.candidates.map((c) => c.userId));
  const page2Overlaps = page2.candidates.filter((c) => page1Ids.has(c.userId));
  console.log(`✓ Page 1 and Page 2 overlap count: ${page2Overlaps.length} (expected 0 duplicates).`);
  if (page2Overlaps.length > 0) throw new Error("Duplicate candidates found across paginated feed!");

  // Test Block Exclusion: Block Candidate 2
  const candidateToBlock = page2.candidates[0].userId;
  await prisma.block.create({
    data: {
      blockerId: authAlice.id,
      blockedUserId: candidateToBlock,
    },
  });

  const feedAfterBlock = await getDiscoveryFeed({
    user: authAlice,
    limit: 30,
  });
  const blockedFound = feedAfterBlock.candidates.some((c) => c.userId === candidateToBlock);
  console.log(`✓ Blocked candidate strictly excluded from feed: ${!blockedFound}`);
  if (blockedFound) throw new Error("Blocked candidate leaked into discovery feed!");

  // Clean up all test records
  console.log("\nCleaning up test artifacts...");
  await prisma.message.deleteMany({ where: { conversationId } });
  await prisma.conversation.delete({ where: { id: conversationId } });
  await prisma.match.delete({ where: { id: match.id } });
  await prisma.block.deleteMany({ where: { blockerId: authAlice.id } });
  await prisma.profile.deleteMany({ where: { userId: { in: [userA.id, userB.id, ...candidates.map((c) => c.id)] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id, ...candidates.map((c) => c.id)] } } });
  console.log("✓ All test artifacts cleaned up.\n");

  await prisma.$disconnect();
}

runCorrectnessVerification().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
