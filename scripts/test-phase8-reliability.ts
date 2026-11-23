import { prisma } from "../src/lib/db";
import { verifySessionToken } from "../src/lib/auth-crypto";
import { verifyViewOnceStreamToken } from "../src/lib/view-once";
import { getCanonicalMatchPair } from "../src/lib/match-helper";
import { checkOtpRateLimit } from "../src/lib/rate-limiter";
import { registrationGateSchema, swipeActionSchema } from "../src/lib/validation";

async function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(msg);
  }
  console.log(`  ✓ ${msg}`);
}

async function runReliabilityTests() {
  console.log("=================================================================");
  console.log("🛡️ PHASE 8 RELIABILITY, RESILIENCE & ERROR HANDLING SUITE");
  console.log("=================================================================\n");

  // 1. JWT & Cryptographic Boundary Resilience
  console.log("1. Testing Token Tampering, Corruptions & Claims Verification...");
  const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature";
  const emptyToken = "";
  const malformedToken = "not-a-token";

  assert((await verifySessionToken(fakeToken)) === null, "Fake session token returns null");
  assert((await verifySessionToken(emptyToken)) === null, "Empty session token returns null");
  assert((await verifySessionToken(malformedToken)) === null, "Malformed session token returns null");

  assert(
    (await verifyViewOnceStreamToken(fakeToken)) === null,
    "Tampered View Once stream token returns null"
  );

  // 2. Schema Boundary Validation & Error Recovery
  console.log("\n2. Testing Zod Validation Schema Error Recovery...");
  const invalidRegistration = registrationGateSchema.safeParse({
    dob: "not-a-date",
    is18PlusConfirmed: false,
  });
  assert(invalidRegistration.success === false, "Invalid date rejected safely by registration gate");

  const underageRegistration = registrationGateSchema.safeParse({
    dob: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    is18PlusConfirmed: true,
  });
  assert(underageRegistration.success === false, "Underage candidate rejected safely");

  const invalidSwipe = swipeActionSchema.safeParse({
    targetUserId: "",
    action: "INVALID_ACTION",
  });
  assert(invalidSwipe.success === false, "Invalid swipe action safely rejected");

  // 3. Database Invariant & Transaction Safety Under Duplication
  console.log("\n3. Testing Database Invariant Collision Safety...");
  const uid1 = `user_rel_1_${Date.now()}`;
  const uid2 = `user_rel_2_${Date.now()}`;

  const u1 = await prisma.user.create({
    data: { id: uid1, phone: `+91711${Math.floor(1000000 + Math.random() * 9000000)}` },
  });
  const u2 = await prisma.user.create({
    data: { id: uid2, phone: `+91711${Math.floor(1000000 + Math.random() * 9000000)}` },
  });

  try {
    // Unique like constraint
    await prisma.like.create({
      data: { fromUserId: u1.id, toUserId: u2.id, status: "PENDING" },
    });

    let duplicateLikeThrew = false;
    try {
      await prisma.like.create({
        data: { fromUserId: u1.id, toUserId: u2.id, status: "PENDING" },
      });
    } catch {
      duplicateLikeThrew = true;
    }
    assert(duplicateLikeThrew, "Duplicate like blocked by unique composite constraint");

    // Canonical match duplicate prevention
    const { user1Id, user2Id } = getCanonicalMatchPair(u1.id, u2.id);
    await prisma.match.create({
      data: { user1Id, user2Id, status: "ACTIVE" },
    });

    let duplicateMatchThrew = false;
    try {
      await prisma.match.create({
        data: { user1Id, user2Id, status: "ACTIVE" },
      });
    } catch {
      duplicateMatchThrew = true;
    }
    assert(duplicateMatchThrew, "Duplicate canonical match pair strictly prevented by database constraint");

    // 4. Rate Limiter Rapid Bursts Resilience
    console.log("\n4. Testing Rate Limiting Under Rapid Burst Scenarios...");
    const burstIdentifier = `burst_${Date.now()}`;
    const firstCheck = checkOtpRateLimit(burstIdentifier);
    assert(firstCheck.allowed === true, "First request in burst allowed");

    const secondCheck = checkOtpRateLimit(burstIdentifier);
    assert(secondCheck.allowed === false, "Rapid duplicate request within 30s throttled");
    assert(typeof secondCheck.retryAfterSeconds === "number", "Retry timer provided to client");

    console.log("\n=================================================================");
    console.log("🎉 ALL RELIABILITY & ERROR HANDLING SCENARIOS VERIFIED!");
    console.log("=================================================================");
  } finally {
    await prisma.like.deleteMany({ where: { OR: [{ fromUserId: u1.id }, { fromUserId: u2.id }] } });
    await prisma.match.deleteMany({ where: { OR: [{ user1Id: u1.id }, { user1Id: u2.id }] } });
    await prisma.user.deleteMany({ where: { id: { in: [u1.id, u2.id] } } });
  }
}

runReliabilityTests()
  .catch((e) => {
    console.error("Reliability test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
