import { prisma } from "../src/lib/db";
import { createSessionToken } from "../src/lib/auth-crypto";
import { config } from "../src/lib/config";
import os from "os";

const SERVER_BASE_URL = "http://localhost:3010";

async function getPgConnectionStats(): Promise<{ total: number; active: number; max: number }> {
  try {
    const stats: any[] = await prisma.$queryRaw`
      SELECT count(*) as total, 
             count(*) FILTER (WHERE state = 'active') as active 
      FROM pg_stat_activity 
      WHERE datname = current_database();
    `;
    const maxConn: any[] = await prisma.$queryRaw`
      SHOW max_connections;
    `;
    return {
      total: Number(stats[0]?.total || 0),
      active: Number(stats[0]?.active || 0),
      max: Number(maxConn[0]?.max_connections || 100),
    };
  } catch (e: any) {
    return { total: 0, active: 0, max: 0 };
  }
}

async function runStageWithDetailedDiagnostics(
  concurrency: number,
  totalRequests: number,
  token: string
) {
  console.log(`\n======================================================`);
  console.log(`Running Diagnostics for Concurrency = ${concurrency} (${totalRequests} total requests)`);
  console.log(`======================================================`);

  const initialPg = await getPgConnectionStats();
  console.log(`Initial PostgreSQL connections: ${initialPg.active} active / ${initialPg.total} total (max: ${initialPg.max})`);

  const startCpu = process.cpuUsage();
  const startMem = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  const errorClassifications: Record<string, number> = {};
  const statusCodes: Record<string, number> = {};
  const latencies: number[] = [];
  let peakPgActive = initialPg.active;
  let executed = 0;

  // Background monitor for PostgreSQL connections
  let monitoring = true;
  const monitorPromise = (async () => {
    while (monitoring) {
      const stats = await getPgConnectionStats();
      if (stats.active > peakPgActive) peakPgActive = stats.active;
      await new Promise((r) => setTimeout(r, 50));
    }
  })();

  const worker = async () => {
    while (true) {
      const idx = executed++;
      if (idx >= totalRequests) break;

      const reqStart = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${SERVER_BASE_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            cookie: `${config.auth.cookieName}=${token}`,
            "User-Agent": "TMD-Diagnostics/1.0",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        latencies.push(performance.now() - reqStart);
        const code = res.status.toString();
        statusCodes[code] = (statusCodes[code] || 0) + 1;
      } catch (err: any) {
        latencies.push(performance.now() - reqStart);
        const errKey = err.cause?.code || err.code || err.name || "UNKNOWN_ERR";
        errorClassifications[errKey] = (errorClassifications[errKey] || 0) + 1;
      }
    }
  };

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  monitoring = false;
  await monitorPromise;

  const durationMs = performance.now() - startTime;
  const endCpu = process.cpuUsage(startCpu);
  const endMem = process.memoryUsage().heapUsed;

  latencies.sort((a, b) => a - b);
  const successCount = Object.entries(statusCodes)
    .filter(([c]) => c.startsWith("2") || c.startsWith("3"))
    .reduce((sum, [, count]) => sum + count, 0);
  const failCount = totalRequests - successCount;

  console.log(`Completed in: ${(durationMs / 1000).toFixed(2)}s | Throughput: ${(totalRequests / (durationMs / 1000)).toFixed(1)} req/s`);
  console.log(`HTTP Status Codes:`, statusCodes);
  console.log(`Error Classifications:`, errorClassifications);
  console.log(`Peak PostgreSQL Active Connections: ${peakPgActive}`);
  console.log(`CPU User: ${Math.round(endCpu.user / 1000)}ms | CPU System: ${Math.round(endCpu.system / 1000)}ms`);
  console.log(`Memory Delta: ${((endMem - startMem) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Success Rate: ${((successCount / totalRequests) * 100).toFixed(2)}% | Error Rate: ${((failCount / totalRequests) * 100).toFixed(2)}%`);

  return {
    concurrency,
    successRate: (successCount / totalRequests) * 100,
    errorClassifications,
    statusCodes,
    peakPgActive,
  };
}

async function main() {
  console.log("Starting Concurrency Diagnostic Suite on port 3010...");
  
  // Create a single test user
  const user = await prisma.user.create({
    data: {
      phone: `+91799${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: "ACTIVE",
      profile: {
        create: {
          name: "DiagUser",
          dob: new Date("1995-01-01"),
          age: 29,
          gender: "MALE",
          interestedIn: "WOMEN",
          city: "Indore",
          relationshipIntention: "LONG_TERM",
        },
      },
    },
  });

  const token = await createSessionToken({ userId: user.id, role: "USER", status: "ACTIVE" });

  try {
    // Stage 100
    await runStageWithDetailedDiagnostics(100, 1000, token);

    // Stage 200
    await runStageWithDetailedDiagnostics(200, 1000, token);

    // Stage 300
    await runStageWithDetailedDiagnostics(300, 1000, token);

    // Stage 400
    await runStageWithDetailedDiagnostics(400, 1000, token);

    // Stage 500
    await runStageWithDetailedDiagnostics(500, 1000, token);
  } finally {
    await prisma.profile.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Diagnostic failure:", e);
  process.exit(1);
});
