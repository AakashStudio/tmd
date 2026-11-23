import { prisma } from "../src/lib/db";
import { createSessionToken } from "../src/lib/auth-crypto";
import { config } from "../src/lib/config";
import os from "os";

interface HttpBenchmarkMetrics {
  stage: string;
  concurrency: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  statusCodes: Record<string, number>;
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

const SERVER_BASE_URL = "http://localhost:3010";

async function executeHttpStage(
  stageName: string,
  concurrency: number,
  totalRequests: number,
  sessionTokens: string[]
): Promise<HttpBenchmarkMetrics> {
  const latencies: number[] = [];
  const statusCodes: Record<string, number> = {};
  let successfulRequests = 0;
  let failedRequests = 0;

  const startCpu = process.cpuUsage();
  const startMem = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  let executed = 0;

  const endpoints = [
    { path: "/api/plans", needsAuth: false },
    { path: "/api/auth/me", needsAuth: true },
    { path: "/api/discovery/feed?limit=10", needsAuth: true },
    { path: "/api/chat/requests", needsAuth: true },
    { path: "/api/matches", needsAuth: true },
  ];

  const worker = async () => {
    while (true) {
      const idx = executed++;
      if (idx >= totalRequests) break;

      const endpoint = endpoints[idx % endpoints.length];
      const token = sessionTokens[idx % sessionTokens.length];

      const headers: Record<string, string> = {
        "User-Agent": "TMD-Real-Http-LoadTester/1.0",
      };
      if (endpoint.needsAuth) {
        headers["cookie"] = `${config.auth.cookieName}=${token}`;
      }

      const reqStart = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s safety timeout

        const response = await fetch(`${SERVER_BASE_URL}${endpoint.path}`, {
          method: "GET",
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latency = performance.now() - reqStart;
        latencies.push(latency);

        const codeStr = response.status.toString();
        statusCodes[codeStr] = (statusCodes[codeStr] || 0) + 1;

        if (response.status >= 200 && response.status < 400) {
          successfulRequests++;
        } else {
          failedRequests++;
        }
      } catch (err: any) {
        const latency = performance.now() - reqStart;
        latencies.push(latency);
        failedRequests++;
        const errKey = err.name === "AbortError" ? "TIMEOUT" : "ERR_CONN";
        statusCodes[errKey] = (statusCodes[errKey] || 0) + 1;
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
    statusCodes,
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
  console.log("⚡ TMD PRODUCTION REAL HTTP LOAD TEST — 100, 200 & 500 VIRTUAL USERS");
  console.log("=================================================================\n");
  console.log(`Server Target: ${SERVER_BASE_URL} (Next.js Production Standalone/Cluster)`);
  console.log(`Host Hardware: ${os.type()} ${os.arch()} | ${os.cpus().length} vCPUs | ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB RAM\n`);

  // Verify server is reachable over HTTP
  try {
    const probe = await fetch(`${SERVER_BASE_URL}/api/plans`);
    if (!probe.ok) throw new Error(`Server probe returned ${probe.status}`);
    console.log("✓ Live HTTP server reachability verified.\n");
  } catch (err: any) {
    console.error(`❌ Cannot reach Next.js server at ${SERVER_BASE_URL}: ${err.message}`);
    process.exit(1);
  }

  const createdUserIds: string[] = [];
  const sessionTokens: string[] = [];

  try {
    console.log("Seeding isolated test dataset of 30 active users with sessions...");
    const freePlan = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });

    for (let i = 0; i < 30; i++) {
      const u = await prisma.user.create({
        data: {
          phone: `+91755${Math.floor(1000000 + Math.random() * 9000000)}`,
          status: "ACTIVE",
          isVerified: true,
          profile: {
            create: {
              name: `HttpUser_${i}`,
              dob: new Date("1996-05-10"),
              age: 28,
              gender: i % 2 === 0 ? "MALE" : "FEMALE",
              interestedIn: i % 2 === 0 ? "WOMEN" : "MEN",
              city: "Indore",
              relationshipIntention: "LONG_TERM",
              photos: {
                create: [
                  {
                    storageKey: `photo_http_${i}.jpg`,
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
              planId: freePlan.id,
              status: "ACTIVE",
              startDate: new Date(),
              endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            },
          },
        },
      });
      createdUserIds.push(u.id);

      const token = await createSessionToken({ userId: u.id, role: "USER", status: "ACTIVE" });
      sessionTokens.push(token);
    }
    console.log("✓ 30 authenticated test sessions established.\n");

    const allStageMetrics: HttpBenchmarkMetrics[] = [];

    // Warm-up Stage: 25 VU, 250 requests
    console.log("Ramping up: 25 concurrent users (250 HTTP requests)...");
    const warmup = await executeHttpStage("Warmup (25 VU)", 25, 250, sessionTokens);
    allStageMetrics.push(warmup);
    console.log(`✓ Warmup complete: ${warmup.throughputRps} RPS | Median: ${warmup.medianLatencyMs}ms | Statuses:`, warmup.statusCodes);

    // Stage 1: 100 Concurrent Virtual Users (1,000 HTTP requests)
    console.log("\n⚡ STAGE 1: 100 Concurrent Virtual Users (1,000 HTTP requests)...");
    const stage100 = await executeHttpStage("Primary (100 VU)", 100, 1000, sessionTokens);
    allStageMetrics.push(stage100);
    console.log(`✓ Stage 1 complete: ${stage100.throughputRps} RPS | Median: ${stage100.medianLatencyMs}ms | p95: ${stage100.p95LatencyMs}ms | Statuses:`, stage100.statusCodes);

    // Stage 2: 200 Concurrent Virtual Users (1,000 HTTP requests)
    console.log("\n⚡ STAGE 2: 200 Concurrent Virtual Users (1,000 HTTP requests)...");
    const stage200 = await executeHttpStage("Scale (200 VU)", 200, 1000, sessionTokens);
    allStageMetrics.push(stage200);
    console.log(`✓ Stage 2 complete: ${stage200.throughputRps} RPS | Median: ${stage200.medianLatencyMs}ms | p95: ${stage200.p95LatencyMs}ms | Statuses:`, stage200.statusCodes);

    // Stage 3: 500 Concurrent Virtual Users (1,500 HTTP requests)
    console.log("\n⚡ STAGE 3: 500 Concurrent Virtual Users (1,500 HTTP requests)...");
    const stage500 = await executeHttpStage("Stress (500 VU)", 500, 1500, sessionTokens);
    allStageMetrics.push(stage500);
    console.log(`✓ Stage 3 complete: ${stage500.throughputRps} RPS | Median: ${stage500.medianLatencyMs}ms | p95: ${stage500.p95LatencyMs}ms | Statuses:`, stage500.statusCodes);

    console.log("\n=================================================================");
    console.log("📊 GENUINE HTTP LOAD & PERFORMANCE RESULTS SUMMARY");
    console.log("=================================================================");
    console.table(allStageMetrics.map(m => ({
      stage: m.stage,
      concurrency: m.concurrency,
      totalRequests: m.totalRequests,
      success: m.successfulRequests,
      failed: m.failedRequests,
      errorRate: `${m.errorRatePercent}%`,
      durationSec: m.durationSeconds,
      throughputRps: m.throughputRps,
      avgMs: m.avgLatencyMs,
      p50Ms: m.medianLatencyMs,
      p90Ms: m.p90LatencyMs,
      p95Ms: m.p95LatencyMs,
      p99Ms: m.p99LatencyMs,
      statusCodes: JSON.stringify(m.statusCodes)
    })));

  } finally {
    console.log("\nCleaning up test dataset...");
    for (const uid of createdUserIds) {
      await prisma.subscription.deleteMany({ where: { userId: uid } });
      await prisma.profilePhoto.deleteMany({ where: { profile: { userId: uid } } });
      await prisma.profile.deleteMany({ where: { userId: uid } });
      await prisma.user.deleteMany({ where: { id: uid } });
    }
    console.log("✓ Cleaned up cleanly.");
  }
}

main()
  .catch((e) => {
    console.error("HTTP Load test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
