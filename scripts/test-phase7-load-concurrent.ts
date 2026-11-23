import { prisma } from "../src/lib/db";
import { getDiscoveryFeed } from "../src/services/discoveryService";
import { getConversationMessages } from "../src/services/chatService";
import { createSessionToken, verifySessionToken } from "../src/lib/auth-crypto";
import { getCanonicalMatchPair } from "../src/lib/match-helper";
import { resolveUserEntitlements } from "../src/lib/entitlements";
import { PlanCode } from "@prisma/client";
import os from "os";

interface StageMetrics {
  stage: string;
  concurrency: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRatePercent: number;
  durationSeconds: number;
  throughputRps: number;
  avgLatencyMs: number;
  medianLatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  cpuUserMs: number;
  cpuSystemMs: number;
  memoryDiffMb: number;
}

function calcPercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

async function runStageLoadTest(
  stageName: string,
  concurrency: number,
  totalRequests: number,
  testUsers: any[],
  conversationId: string
): Promise<StageMetrics> {
  const latencies: number[] = [];
  let successfulRequests = 0;
  let failedRequests = 0;

  const startCpu = process.cpuUsage();
  const startMem = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  let executed = 0;

  const worker = async () => {
    while (true) {
      const currentIdx = executed++;
      if (currentIdx >= totalRequests) break;

      const user = testUsers[currentIdx % testUsers.length];
      const partner = testUsers[(currentIdx + 1) % testUsers.length];
      const workflowType = currentIdx % 5;

      const reqStart = performance.now();
      try {
        if (workflowType === 0) {
          // Workflow A: Auth Session & Entitlements Resolution
          const token = await createSessionToken({
            userId: user.id,
            role: "USER",
            status: "ACTIVE",
          });
          const verified = await verifySessionToken(token);
          const entitlements = resolveUserEntitlements(user.subscriptions[0] || null);
          if (!verified || !entitlements) throw new Error("Auth failed");
        } else if (workflowType === 1) {
          // Workflow B: Discovery Feed with Relational Filter
          const feed = await getDiscoveryFeed({
            user: {
              ...user,
              entitlements: resolveUserEntitlements(user.subscriptions[0] || null),
            },
            limit: 10,
          });
          if (!feed) throw new Error("Feed query failed");
        } else if (workflowType === 2) {
          // Workflow C: Concurrent Swiping & Mutual Match Calculation
          const { user1Id, user2Id } = getCanonicalMatchPair(user.id, partner.id);
          await prisma.like.upsert({
            where: {
              fromUserId_toUserId: {
                fromUserId: user.id,
                toUserId: partner.id,
              },
            },
            update: { status: "PENDING" },
            create: {
              fromUserId: user.id,
              toUserId: partner.id,
              status: "PENDING",
            },
          });
        } else if (workflowType === 3) {
          // Workflow D: Incremental Chat Polling (by participant)
          const participantUser = testUsers[currentIdx % 2]; // testUsers[0] and testUsers[1] are conversation participants
          const chatResult = await getConversationMessages({
            user: {
              ...participantUser,
              entitlements: resolveUserEntitlements(participantUser.subscriptions[0] || null),
            },
            conversationId,
            limit: 20,
            direction: "before",
          });
          if (!chatResult) throw new Error("Chat query failed");
        } else {
          // Workflow E: Events Feed & Residential Privacy Masking
          const events = await prisma.event.findMany({
            where: { status: "ACTIVE" },
            take: 5,
            select: {
              id: true,
              title: true,
              address: true,
              isResidential: true,
              latitude: true,
              longitude: true,
            },
          });
          // Privacy transform
          events.forEach((ev) => {
            if (ev.isResidential) {
              ev.address = "Residential Area (Masked)";
              ev.latitude = null;
              ev.longitude = null;
            }
          });
        }

        latencies.push(performance.now() - reqStart);
        successfulRequests++;
      } catch (err) {
        failedRequests++;
        latencies.push(performance.now() - reqStart);
      }
    }
  };

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const durationMs = performance.now() - startTime;
  const durationSeconds = durationMs / 1000;
  const endCpu = process.cpuUsage(startCpu);
  const endMem = process.memoryUsage().heapUsed;

  latencies.sort((a, b) => a - b);
  const sum = latencies.reduce((acc, v) => acc + v, 0);

  return {
    stage: stageName,
    concurrency,
    totalRequests,
    successfulRequests,
    failedRequests,
    errorRatePercent: Math.round((failedRequests / totalRequests) * 10000) / 100,
    durationSeconds: Math.round(durationSeconds * 100) / 100,
    throughputRps: Math.round((totalRequests / durationSeconds) * 10) / 10,
    avgLatencyMs: Math.round((sum / (latencies.length || 1)) * 100) / 100,
    medianLatencyMs: Math.round(calcPercentile(latencies, 50) * 100) / 100,
    p90LatencyMs: Math.round(calcPercentile(latencies, 90) * 100) / 100,
    p95LatencyMs: Math.round(calcPercentile(latencies, 95) * 100) / 100,
    p99LatencyMs: Math.round(calcPercentile(latencies, 99) * 100) / 100,
    cpuUserMs: Math.round(endCpu.user / 1000),
    cpuSystemMs: Math.round(endCpu.system / 1000),
    memoryDiffMb: Math.round(((endMem - startMem) / (1024 * 1024)) * 100) / 100,
  };
}

async function main() {
  console.log("=================================================================");
  console.log("🚀 PHASE 7 LOAD & PERFORMANCE AUDIT — 100, 200 & 500 VIRTUAL USERS");
  console.log("=================================================================\n");
  console.log(`System Environment: ${os.type()} ${os.arch()} | CPUs: ${os.cpus().length} cores | Total RAM: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB`);
  console.log(`Database Target: PostgreSQL (tmd_db) on localhost\n`);

  const createdUserIds: string[] = [];
  const testUsers: any[] = [];

  try {
    console.log("Setting up isolated test dataset of 30 active users...");
    const freePlan = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });
    const proPlan = await prisma.plan.findUniqueOrThrow({ where: { code: "PRO_499" } });

    for (let i = 0; i < 30; i++) {
      const u = await prisma.user.create({
        data: {
          phone: `+91766${Math.floor(1000000 + Math.random() * 9000000)}`,
          status: "ACTIVE",
          isVerified: i % 3 === 0,
          profile: {
            create: {
              name: `PerfUser_${i}`,
              dob: new Date("1996-04-12"),
              age: 28,
              gender: i % 2 === 0 ? "MALE" : "FEMALE",
              interestedIn: i % 2 === 0 ? "WOMEN" : "MEN",
              city: "Indore",
              relationshipIntention: "LONG_TERM",
              photos: {
                create: [
                  {
                    storageKey: `photo_perf_${i}.jpg`,
                    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
                    order: 0,
                    isPrimary: true,
                    status: "APPROVED",
                  },
                ],
              },
            },
          },
          subscriptions: {
            create: {
              planId: i % 4 === 0 ? proPlan.id : freePlan.id,
              status: "ACTIVE",
              startDate: new Date(),
              endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            },
          },
        },
        include: {
          profile: { include: { photos: true } },
          subscriptions: { include: { plan: true } },
        },
      });
      createdUserIds.push(u.id);
      testUsers.push(u);
    }

    // Create a shared conversation for chat load testing
    const { user1Id, user2Id } = getCanonicalMatchPair(testUsers[0].id, testUsers[1].id);
    const testMatch = await prisma.match.create({
      data: {
        user1Id,
        user2Id,
        status: "ACTIVE",
      },
    });
    const testConversation = await prisma.conversation.create({
      data: {
        matchId: testMatch.id,
      },
    });

    // Seed 20 test messages
    for (let m = 0; m < 20; m++) {
      await prisma.message.create({
        data: {
          conversationId: testConversation.id,
          senderId: m % 2 === 0 ? user1Id : user2Id,
          content: `Perf test message #${m}`,
          status: "SENT",
        },
      });
    }

    console.log("✓ Test harness seeded successfully.\n");

    const allMetrics: StageMetrics[] = [];

    // Stage 0: Ramp-up Stage (25 concurrent users)
    console.log("Ramping up workload: 25 concurrent users (250 requests)...");
    const rampMetrics = await runStageLoadTest(
      "Warmup / Ramp-up",
      25,
      250,
      testUsers,
      testConversation.id
    );
    allMetrics.push(rampMetrics);
    console.log(`✓ Ramp-up completed: ${rampMetrics.throughputRps} RPS | Median: ${rampMetrics.medianLatencyMs}ms\n`);

    // Stage 1: PRIMARY BENCHMARK — 100 Concurrent Virtual Users
    console.log("⚡ STAGE 1: 100 Concurrent Virtual Users (1,000 requests)...");
    const stage100Metrics = await runStageLoadTest(
      "Primary: 100 Concurrent Users",
      100,
      1000,
      testUsers,
      testConversation.id
    );
    allMetrics.push(stage100Metrics);
    console.log(`✓ Stage 1 (100 VU) completed: ${stage100Metrics.throughputRps} RPS | p95: ${stage100Metrics.p95LatencyMs}ms\n`);

    // Stage 2: SCALABILITY TEST — 200 Concurrent Virtual Users
    console.log("⚡ STAGE 2: 200 Concurrent Virtual Users (1,000 requests)...");
    const stage200Metrics = await runStageLoadTest(
      "Scale: 200 Concurrent Users",
      200,
      1000,
      testUsers,
      testConversation.id
    );
    allMetrics.push(stage200Metrics);
    console.log(`✓ Stage 2 (200 VU) completed: ${stage200Metrics.throughputRps} RPS | p95: ${stage200Metrics.p95LatencyMs}ms\n`);

    // Stage 3: STRESS TEST — 500 Concurrent Virtual Users
    console.log("⚡ STAGE 3: 500 Concurrent Virtual Users (1,500 requests)...");
    const stage500Metrics = await runStageLoadTest(
      "Stress: 500 Concurrent Users",
      500,
      1500,
      testUsers,
      testConversation.id
    );
    allMetrics.push(stage500Metrics);
    console.log(`✓ Stage 3 (500 VU) completed: ${stage500Metrics.throughputRps} RPS | p95: ${stage500Metrics.p95LatencyMs}ms\n`);

    console.log("=================================================================");
    console.log("📊 COMPLETE LOAD & PERFORMANCE RESULTS SUMMARY TABLE");
    console.log("=================================================================");
    console.table(allMetrics);

  } finally {
    console.log("\nCleaning up test harness dataset...");
    for (const uid of createdUserIds) {
      await prisma.like.deleteMany({
        where: { OR: [{ fromUserId: uid }, { toUserId: uid }] },
      });
      await prisma.subscription.deleteMany({ where: { userId: uid } });
      await prisma.profilePhoto.deleteMany({ where: { profile: { userId: uid } } });
      await prisma.profile.deleteMany({ where: { userId: uid } });
      await prisma.message.deleteMany({
        where: { conversation: { match: { OR: [{ user1Id: uid }, { user2Id: uid }] } } },
      });
      await prisma.conversation.deleteMany({
        where: { match: { OR: [{ user1Id: uid }, { user2Id: uid }] } },
      });
      await prisma.match.deleteMany({
        where: { OR: [{ user1Id: uid }, { user2Id: uid }] },
      });
      await prisma.user.deleteMany({ where: { id: uid } });
    }
    console.log("✓ Dataset cleaned up cleanly.");
  }
}

main()
  .catch((err) => {
    console.error("Load test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
