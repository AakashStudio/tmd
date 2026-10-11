import { prisma } from "../src/lib/db";
import { getConversationMessages, validateChatParticipant } from "../src/services/chatService";
import { AuthenticatedUser } from "../src/lib/session";

interface DetailedBenchmarkMetrics {
  name: string;
  totalRequests: number;
  concurrency: number;
  steadyStateRequests: number;
  coldStartLatencyMs: number;
  durationMs: number;
  throughputRps: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  queryCountPerReq: number;
  avgResponseSizeBytes: number;
  errorRate: number;
  cpuUserDiffMs: number;
  memoryDiffMb: number;
}

function calculatePercentile(latencies: number[], p: number): number {
  if (latencies.length === 0) return 0;
  latencies.sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * latencies.length) - 1;
  return latencies[Math.max(0, Math.min(index, latencies.length - 1))];
}

async function runDetailedBenchmark(
  name: string,
  totalRequests: number,
  concurrency: number,
  task: () => Promise<any>,
  queryCountPerReq: number
): Promise<DetailedBenchmarkMetrics> {
  const memBefore = process.memoryUsage().heapUsed;
  const cpuBefore = process.cpuUsage();

  // 1. Cold-start measurement (single first request)
  const coldStartTimer = performance.now();
  const firstRes = await task();
  const coldStartLatencyMs = performance.now() - coldStartTimer;
  const avgResponseSizeBytes = Buffer.byteLength(JSON.stringify(firstRes || ""));

  // 2. Steady-state benchmark
  const steadyLatencies: number[] = [];
  let errorCount = 0;
  let executed = 0;

  const steadyStart = performance.now();

  const worker = async () => {
    while (executed < totalRequests) {
      executed++;
      const t0 = performance.now();
      try {
        await task();
        steadyLatencies.push(performance.now() - t0);
      } catch (e) {
        errorCount++;
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const durationMs = performance.now() - steadyStart;

  const cpuDiff = process.cpuUsage(cpuBefore);
  const memAfter = process.memoryUsage().heapUsed;

  return {
    name,
    totalRequests,
    concurrency,
    steadyStateRequests: steadyLatencies.length,
    coldStartLatencyMs: Math.round(coldStartLatencyMs * 100) / 100,
    durationMs: Math.round(durationMs),
    throughputRps: Math.round((steadyLatencies.length / (durationMs / 1000)) * 10) / 10,
    p50Ms: Math.round(calculatePercentile(steadyLatencies, 50) * 100) / 100,
    p95Ms: Math.round(calculatePercentile(steadyLatencies, 95) * 100) / 100,
    p99Ms: Math.round(calculatePercentile(steadyLatencies, 99) * 100) / 100,
    queryCountPerReq,
    avgResponseSizeBytes,
    errorRate: Math.round((errorCount / totalRequests) * 10000) / 100,
    cpuUserDiffMs: Math.round(cpuDiff.user / 1000),
    memoryDiffMb: Math.round(((memAfter - memBefore) / (1024 * 1024)) * 100) / 100,
  };
}

async function executeChatInvestigation() {
  console.log("==========================================================================");
  console.log("🔬 TMD CHAT POLLING DISCREPANCY INVESTIGATION & RIGOROUS BENCHMARK");
  console.log("==========================================================================\n");

  // Step 1: Create isolated users & conversation with 200 messages
  const userA = await prisma.user.create({
    data: {
      phone: `+91666${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: "ACTIVE",
      profile: {
        create: {
          name: "User Alice",
          dob: new Date("1998-01-01"),
          age: 26,
          gender: "FEMALE",
          interestedIn: "MEN",
          city: "Bhopal",
          photos: {
            create: [
              {
                storageKey: "alice.jpg",
                url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
                order: 0,
                isPrimary: true,
                status: "APPROVED",
              },
            ],
          },
        },
      },
    },
    include: { profile: { include: { photos: true } } },
  });

  const userB = await prisma.user.create({
    data: {
      phone: `+91666${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: "ACTIVE",
      profile: {
        create: {
          name: "User Bob",
          dob: new Date("1996-01-01"),
          age: 28,
          gender: "MALE",
          interestedIn: "WOMEN",
          city: "Bhopal",
          photos: {
            create: [
              {
                storageKey: "bob.jpg",
                url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500",
                order: 0,
                isPrimary: true,
                status: "APPROVED",
              },
            ],
          },
        },
      },
    },
    include: { profile: { include: { photos: true } } },
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

  console.log(`Seeding 200 messages in conversation ${conversationId}...`);
  const messageData = [];
  const baseTime = Date.now() - 200 * 5000;
  for (let i = 0; i < 200; i++) {
    messageData.push({
      conversationId,
      senderId: i % 2 === 0 ? userA.id : userB.id,
      content: `Message content test ${i} with simulated conversational payload text`,
      type: "TEXT" as const,
      status: "SENT" as const,
      createdAt: new Date(baseTime + i * 5000),
    });
  }
  await prisma.message.createMany({ data: messageData });
  console.log("✓ 200 messages seeded successfully.\n");

  const latestMessage = await prisma.message.findFirst({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
  });

  const authUserA: AuthenticatedUser = {
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
      photos: userA.profile!.photos,
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

  // -------------------------------------------------------------
  // DEFINING TRUE EQUIVALENT WORKLOADS:
  // Both legacy and optimized route handlers perform authorization,
  // block check, and auto-marking unread messages.
  // -------------------------------------------------------------

  // LEGACY ROUTE HANDLER SIMULATION (Full 100 messages scan + Partner profile fetch on every poll):
  const legacyFullPollTask = async () => {
    // 1. Participant & match check
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { match: true },
    });
    const partnerId = conversation!.match.user1Id === userA.id ? conversation!.match.user2Id : conversation!.match.user1Id;
    // 2. Block check
    await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userA.id, blockedUserId: partnerId },
          { blockerId: partnerId, blockedUserId: userA.id },
        ],
      },
    });
    // 3. Mark read
    await prisma.message.updateMany({
      where: { conversationId, senderId: partnerId, status: { not: "READ" } },
      data: { status: "READ" },
    });
    // 4. Fetch 100 messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: { media: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    // 5. Fetch partner
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      include: { profile: { include: { photos: { where: { isPrimary: true }, take: 1 } } } },
    });
    return { messages, partner };
  };

  // OPTIMIZED SERVICE CALL (Cursor-based polling, includePartner: false):
  const optimizedDeltaPollTask = async () => {
    return await getConversationMessages({
      user: authUserA,
      conversationId,
      cursor: latestMessage?.id,
      direction: "after",
      limit: 10,
      includePartner: false,
    });
  };

  // RAW DB SCAN COMPARISON (Direct Message Query Only without auth overhead):
  const rawLegacy100MessageQuery = async () => {
    return await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  };

  const rawOptimizedDeltaMessageQuery = async () => {
    return await prisma.message.findMany({
      where: { conversationId },
      take: 10,
      skip: 1,
      cursor: { id: latestMessage!.id },
      orderBy: { createdAt: "asc" },
    });
  };

  console.log("Executing equivalent benchmarks (Concurrency: 10 & 30)...\n");

  const results: DetailedBenchmarkMetrics[] = [];

  // Comparison 1: Raw Database Query Layer
  results.push(await runDetailedBenchmark("Raw DB: Legacy Take 100 Query", 300, 10, rawLegacy100MessageQuery, 1));
  results.push(await runDetailedBenchmark("Raw DB: Optimized Delta Cursor Query", 300, 10, rawOptimizedDeltaMessageQuery, 1));

  // Comparison 2: Full End-to-End Handlers (Concurrency 10)
  results.push(await runDetailedBenchmark("E2E Handler: Legacy Full Poll (5 queries)", 200, 10, legacyFullPollTask, 5));
  results.push(await runDetailedBenchmark("E2E Handler: Optimized Delta Poll (4 queries)", 200, 10, optimizedDeltaPollTask, 4));

  // Comparison 3: Full End-to-End Handlers (Concurrency 30 - Sustained Load)
  results.push(await runDetailedBenchmark("E2E Handler: Legacy Full Poll (Conc 30)", 300, 30, legacyFullPollTask, 5));
  results.push(await runDetailedBenchmark("E2E Handler: Optimized Delta Poll (Conc 30)", 300, 30, optimizedDeltaPollTask, 4));

  console.log("\n==========================================================================");
  console.log("📊 CHAT BENCHMARK COMPARISON TABLE");
  console.log("==========================================================================\n");
  console.table(results);

  // Clean up
  await prisma.message.deleteMany({ where: { conversationId } });
  await prisma.conversation.delete({ where: { id: conversationId } });
  await prisma.match.delete({ where: { id: match.id } });
  await prisma.profilePhoto.deleteMany({ where: { profile: { userId: { in: [userA.id, userB.id] } } } });
  await prisma.profile.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  console.log("✓ Investigation dataset cleaned up successfully.\n");

  await prisma.$disconnect();
}

executeChatInvestigation().catch((err) => {
  console.error("Chat investigation error:", err);
  process.exit(1);
});
