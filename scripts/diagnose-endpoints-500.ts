import { prisma } from "../src/lib/db";
import { createSessionToken } from "../src/lib/auth-crypto";
import { config } from "../src/lib/config";

const SERVER_BASE_URL = "http://localhost:3010";

async function testEndpointAt500(endpoint: string, token: string) {
  console.log(`\nTesting endpoint ${endpoint} at 500 concurrency (1000 requests)...`);
  let executed = 0;
  const statusCodes: Record<string, number> = {};
  const errorClassifications: Record<string, number> = {};
  const startTime = performance.now();

  const worker = async () => {
    while (true) {
      const idx = executed++;
      if (idx >= 1000) break;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${SERVER_BASE_URL}${endpoint}`, {
          method: "GET",
          headers: {
            cookie: `${config.auth.cookieName}=${token}`,
            "User-Agent": "TMD-Diagnostics/1.0",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const code = res.status.toString();
        statusCodes[code] = (statusCodes[code] || 0) + 1;
      } catch (err: any) {
        const errKey = err.cause?.code || err.code || err.name || "UNKNOWN_ERR";
        errorClassifications[errKey] = (errorClassifications[errKey] || 0) + 1;
      }
    }
  };

  const workers = Array.from({ length: 500 }, () => worker());
  await Promise.all(workers);
  const durationSec = (performance.now() - startTime) / 1000;

  console.log(`Duration: ${durationSec.toFixed(2)}s | Throughput: ${(1000 / durationSec).toFixed(1)} req/s`);
  console.log(`Status Codes:`, statusCodes);
  console.log(`Errors:`, errorClassifications);
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { profile: { isNot: null } },
    include: { profile: true },
  });
  if (!user) throw new Error("No user found");

  const token = await createSessionToken({ userId: user.id, role: "USER", status: "ACTIVE" });

  await testEndpointAt500("/api/plans", token);
  await testEndpointAt500("/api/auth/me", token);
  await testEndpointAt500("/api/matches", token);
  await testEndpointAt500("/api/chat/requests", token);
  await testEndpointAt500("/api/discovery/feed?limit=10", token);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
