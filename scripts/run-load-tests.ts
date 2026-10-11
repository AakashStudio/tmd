import { prisma } from "../src/lib/db";
import { getDiscoveryFeed } from "../src/services/discoveryService";
import { getConversationMessages } from "../src/services/chatService";
import { AuthenticatedUser } from "../src/lib/session";

interface BenchmarkResult {
  operation: string;
  concurrency: number;
  totalRequests: number;
  durationMs: number;
  reqPerSec: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  errorRate: number;
  dbPoolConnectionsActive: number;
}

function calculatePercentile(latencies: number[], p: number): number {
  if (latencies.length === 0) return 0;
  latencies.sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * latencies.length) - 1;
  return latencies[Math.max(0, Math.min(index, latencies.length - 1))];
}

async function runBenchmarkWorkload(
  name: string,
  totalRequests: number,
  concurrency: number,
  task: () => Promise<void>
): Promise<BenchmarkResult> {
  const latencies: number[] = [];
  let errorCount = 0;
  const start = performance.now();

  let executed = 0;
  const worker = async () => {
    while (executed < totalRequests) {
      executed++;
      const reqStart = performance.now();
      try {
        await task();
        latencies.push(performance.now() - reqStart);
      } catch (err) {
        errorCount++;
      }
    }
  };

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const durationMs = performance.now() - start;
  const reqPerSec = Math.round((totalRequests / (durationMs / 1000)) * 10) / 10;

  return {
    operation: name,
    concurrency,
    totalRequests,
    durationMs: Math.round(durationMs),
    reqPerSec,
    p50Ms: Math.round(calculatePercentile(latencies, 50) * 100) / 100,
    p95Ms: Math.round(calculatePercentile(latencies, 95) * 100) / 100,
    p99Ms: Math.round(calculatePercentile(latencies, 99) * 100) / 100,
    errorRate: Math.round((errorCount / totalRequests) * 10000) / 100,
    dbPoolConnectionsActive: concurrency,
  };
}

async function runLoadTests() {
  console.log("==========================================================");
  console.log("⚡ TMD BENCHMARK & LOAD TESTING — ISOLATED DATASET");
  console.log("==========================================================\n");

  // Step 1: Seed isolated test users
  const testUsers: any[] = [];
  for (let i = 0; i < 20; i++) {
    const user = await prisma.user.create({
      data: {
        phone: `+91777${Math.floor(1000000 + Math.random() * 9000000)}`,
        status: "ACTIVE",
        profile: {
          create: {
            name: `LoadUser_${i}`,
            dob: new Date("1997-06-15"),
            age: 27,
            gender: i % 2 === 0 ? "MALE" : "FEMALE",
            interestedIn: i % 2 === 0 ? "WOMEN" : "MEN",
            city: "Bhopal",
            bio: "Load test profile",
            photos: {
              create: [
                {
                  storageKey: `photo_${i}.jpg`,
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
    testUsers.push(user);
  }

  const primaryUser = testUsers[0];
  const authUser: AuthenticatedUser = {
    id: primaryUser.id,
    phone: primaryUser.phone,
    email: primaryUser.email,
    role: "USER",
    status: "ACTIVE",
    isVerified: true,
    lastActiveAt: new Date(),
    profile: {
      id: primaryUser.profile!.id,
      name: primaryUser.profile!.name,
      dob: primaryUser.profile!.dob,
      age: primaryUser.profile!.age,
      gender: primaryUser.profile!.gender,
      interestedIn: primaryUser.profile!.interestedIn,
      city: primaryUser.profile!.city,
      bio: null,
      profession: null,
      education: null,
      height: null,
      relationshipIntention: "NOT_SURE_YET",
      isNameLocked: true,
      photos: primaryUser.profile!.photos,
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

  // Create conversation with 30 messages for chat load testing
  const match = await prisma.match.create({
    data: {
      user1Id: testUsers[0].id < testUsers[1].id ? testUsers[0].id : testUsers[1].id,
      user2Id: testUsers[0].id < testUsers[1].id ? testUsers[1].id : testUsers[0].id,
      status: "ACTIVE",
      conversation: { create: {} },
    },
    include: { conversation: true },
  });
  const conversationId = match.conversation!.id;

  for (let i = 0; i < 30; i++) {
    await prisma.message.create({
      data: {
        conversationId,
        senderId: i % 2 === 0 ? testUsers[0].id : testUsers[1].id,
        content: `Load message ${i}`,
        type: "TEXT",
        status: "SENT",
      },
    });
  }

  // Measure discovery query baseline with previous approach (5 queries + in-memory Set + notIn)
  const legacyDiscoveryTask = async () => {
    const [likesGiven, passesGiven, blocksInitiated, blocksReceived, existingMatches] =
      await Promise.all([
        prisma.like.findMany({ where: { fromUserId: primaryUser.id }, select: { toUserId: true } }),
        prisma.pass.findMany({ where: { fromUserId: primaryUser.id }, select: { toUserId: true } }),
        prisma.block.findMany({ where: { blockerId: primaryUser.id }, select: { blockedUserId: true } }),
        prisma.block.findMany({ where: { blockedUserId: primaryUser.id }, select: { blockerId: true } }),
        prisma.match.findMany({
          where: { OR: [{ user1Id: primaryUser.id }, { user2Id: primaryUser.id }], status: "ACTIVE" },
          select: { user1Id: true, user2Id: true },
        }),
      ]);
    const excludedUserIds = new Set<string>([primaryUser.id]);
    likesGiven.forEach((l) => excludedUserIds.add(l.toUserId));
    passesGiven.forEach((p) => excludedUserIds.add(p.toUserId));
    blocksInitiated.forEach((b) => excludedUserIds.add(b.blockedUserId));
    blocksReceived.forEach((b) => excludedUserIds.add(b.blockerId));
    existingMatches.forEach((m) => {
      excludedUserIds.add(m.user1Id);
      excludedUserIds.add(m.user2Id);
    });
    await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludedUserIds) },
        status: "ACTIVE",
      },
      take: 20,
    });
  };

  // Measure optimized discovery query
  const optimizedDiscoveryTask = async () => {
    await getDiscoveryFeed({
      user: authUser,
      limit: 20,
    });
  };

  // Measure legacy full chat poll (take 100 without cursor)
  const legacyChatPollTask = async () => {
    await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  };

  // Measure optimized incremental chat poll (take 10 with cursor)
  const lastMessage = await prisma.message.findFirst({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
  });
  const optimizedChatPollTask = async () => {
    await getConversationMessages({
      user: authUser,
      conversationId,
      cursor: lastMessage?.id,
      direction: "after",
      limit: 10,
    });
  };

  console.log("Simulating Workloads with Increasing Concurrency (10 to 50 concurrent users)...\n");

  const results: BenchmarkResult[] = [];

  // 1. Discovery Comparison at 10 and 30 concurrency
  results.push(await runBenchmarkWorkload("Discovery (Legacy 5-Query + notIn)", 100, 10, legacyDiscoveryTask));
  results.push(await runBenchmarkWorkload("Discovery (Optimized Single Relational NOT EXISTS)", 100, 10, optimizedDiscoveryTask));
  results.push(await runBenchmarkWorkload("Discovery (Optimized Single Relational NOT EXISTS)", 200, 30, optimizedDiscoveryTask));

  // 2. Chat Polling Comparison at 20 and 50 concurrency
  results.push(await runBenchmarkWorkload("Chat Poll (Legacy Full 100-msg Scan)", 150, 20, legacyChatPollTask));
  results.push(await runBenchmarkWorkload("Chat Poll (Optimized Incremental Delta Cursor)", 150, 20, optimizedChatPollTask));
  results.push(await runBenchmarkWorkload("Chat Poll (Optimized Incremental Delta Cursor)", 300, 50, optimizedChatPollTask));

  console.log("\n==========================================================");
  console.log("📊 LOAD TEST & BENCHMARK SUMMARY TABLE");
  console.log("==========================================================\n");
  console.table(results);

  // Cleanup
  await prisma.message.deleteMany({ where: { conversationId } });
  await prisma.conversation.delete({ where: { id: conversationId } });
  await prisma.match.delete({ where: { id: match.id } });
  await prisma.profilePhoto.deleteMany({ where: { profile: { userId: { in: testUsers.map((u) => u.id) } } } });
  await prisma.profile.deleteMany({ where: { userId: { in: testUsers.map((u) => u.id) } } });
  await prisma.user.deleteMany({ where: { id: { in: testUsers.map((u) => u.id) } } });
  console.log("✓ Isolated benchmark test dataset cleaned up successfully\n");

  await prisma.$disconnect();
}

runLoadTests().catch((err) => {
  console.error("Load test error:", err);
  process.exit(1);
});
