import { prisma } from "../src/lib/db";
import { POST as verifyPaymentHandler } from "../src/app/api/payments/verify/route";
import { POST as reportHandler } from "../src/app/api/safety/report/route";
import { POST as uploadHandler } from "../src/app/api/upload/route";
import { PUT as updateProfileHandler } from "../src/app/api/profile/route";
import { createSessionToken } from "../src/lib/auth-crypto";
import { config } from "../src/lib/config";
import { getCanonicalMatchPair } from "../src/lib/match-helper";
import { NextRequest } from "next/server";
import crypto from "crypto";

async function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runRegressionBugVerification() {
  console.log("=================================================");
  console.log("🧪 TDD REGRESSION TESTS — DETECTING UNFIXED DEFECTS");
  console.log("=================================================\n");

  const createdUserIds: string[] = [];

  try {
    const userA = await prisma.user.create({
      data: {
        phone: `+91988${Math.floor(1000000 + Math.random() * 9000000)}`,
        status: "ACTIVE",
        profile: {
          create: {
            name: "UserA_Test",
            dob: new Date("1995-05-15"),
            age: 29,
            gender: "MALE",
            interestedIn: "WOMEN",
            city: "Indore",
            relationshipIntention: "LONG_TERM",
          },
        },
      },
      include: { profile: true },
    });
    createdUserIds.push(userA.id);

    const userB = await prisma.user.create({
      data: {
        phone: `+91988${Math.floor(1000000 + Math.random() * 9000000)}`,
        status: "ACTIVE",
        profile: {
          create: {
            name: "UserB_Test",
            dob: new Date("1997-08-20"),
            age: 27,
            gender: "FEMALE",
            interestedIn: "MEN",
            city: "Indore",
            relationshipIntention: "LONG_TERM",
          },
        },
      },
      include: { profile: true },
    });
    createdUserIds.push(userB.id);

    // -------------------------------------------------------------
    // DEFECT 1: Payment Verify Ownership & Replay Protection
    // -------------------------------------------------------------
    console.log("1. Testing Payment Verification Security & Idempotency...");

    const plan = await prisma.plan.findUniqueOrThrow({ where: { code: "TIER_49" } });
    const orderId = `order_test_${Date.now()}`;
    const paymentRecord = await prisma.payment.create({
      data: {
        userId: userA.id, // Order was created by User A
        planId: plan.id,
        razorpayOrderId: orderId,
        amountInPaise: 4900,
        status: "PENDING",
      },
    });

    const paymentId = `pay_${Date.now()}`;
    const signature = crypto
      .createHmac("sha256", config.payments.razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const tokenB = await createSessionToken({ userId: userB.id, role: "USER", status: "ACTIVE" });
    const tokenA = await createSessionToken({ userId: userA.id, role: "USER", status: "ACTIVE" });

    // Attack 1: User B attempts to verify User A's order
    const reqAttack = new NextRequest("http://localhost:3000/api/payments/verify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${config.auth.cookieName}=${tokenB}`,
      },
      body: JSON.stringify({
        orderId,
        paymentId,
        signature,
        planCode: "TIER_49",
      }),
    });

    const resAttack = await verifyPaymentHandler(reqAttack);
    const bodyAttack = await resAttack.json();

    console.log(`  Ownership attack response status: ${resAttack.status}`);
    assert(
      resAttack.status === 403,
      "Cross-user payment verification strictly blocked with 403 Forbidden"
    );

    // Legitimate verification by User A
    const reqA = new NextRequest("http://localhost:3000/api/payments/verify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${config.auth.cookieName}=${tokenA}`,
      },
      body: JSON.stringify({
        orderId,
        paymentId,
        signature,
        planCode: "TIER_49",
      }),
    });

    const resA = await verifyPaymentHandler(reqA);
    assert(resA.status === 200, "First verification by legitimate user succeeds");

    const subsAfterFirst = await prisma.subscription.count({
      where: { userId: userA.id, status: "ACTIVE" },
    });
    assert(subsAfterFirst === 1, "Exactly 1 active subscription created");

    // Attack 2: Replay of verified order
    const reqReplay = new NextRequest("http://localhost:3000/api/payments/verify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${config.auth.cookieName}=${tokenA}`,
      },
      body: JSON.stringify({
        orderId,
        paymentId,
        signature,
        planCode: "TIER_49",
      }),
    });

    const resReplay = await verifyPaymentHandler(reqReplay);
    const bodyReplay = await resReplay.json();
    console.log(`  Replay response:`, bodyReplay);
    assert(
      bodyReplay.alreadyProcessed === true || resReplay.status === 400 || resReplay.status === 200,
      "Replay handled without duplicate subscription creation"
    );

    const totalSubs = await prisma.subscription.count({
      where: { userId: userA.id },
    });
    assert(totalSubs === 1, "No duplicate subscriptions created on replayed verification");

    // -------------------------------------------------------------
    // DEFECT 2: Safety Report Auto-Block Match Disconnection
    // -------------------------------------------------------------
    console.log("\n2. Testing Safety Report Auto-Block Match Disconnection...");

    const { user1Id, user2Id } = getCanonicalMatchPair(userA.id, userB.id);
    const testMatch = await prisma.match.create({
      data: {
        user1Id,
        user2Id,
        status: "ACTIVE",
      },
    });

    const reportReq = new NextRequest("http://localhost:3000/api/safety/report", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${config.auth.cookieName}=${tokenA}`,
      },
      body: JSON.stringify({
        reportedUserId: userB.id,
        reason: "HARASSMENT",
        details: "Test auto-block unmatch",
        autoBlock: true,
      }),
    });

    const reportRes = await reportHandler(reportReq);
    assert(reportRes.status === 200, "Report successfully submitted with autoBlock: true");

    const refreshedMatch = await prisma.match.findUnique({
      where: { id: testMatch.id },
    });
    assert(
      refreshedMatch?.status === "UNMATCHED",
      "Active match automatically transitioned to UNMATCHED when autoBlock is true"
    );

    // -------------------------------------------------------------
    // DEFECT 3: Unauthenticated File Upload Security
    // -------------------------------------------------------------
    console.log("\n3. Testing Upload Authentication Enforcement...");

    const unauthUploadReq = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        base64: "dGVzdA==",
        filename: "unauthorized.jpg",
      }),
    });

    const unauthRes = await uploadHandler(unauthUploadReq);
    assert(unauthRes.status === 401, "Unauthenticated POST /api/upload returns 401 Unauthorized");

    // -------------------------------------------------------------
    // DEFECT 4: Profile Update Duplicate Interests Deduplication
    // -------------------------------------------------------------
    console.log("\n4. Testing Profile Update Deduplication & Batch Insertion...");

    const interests = await prisma.interest.findMany({ take: 2 });
    if (interests.length >= 2) {
      const duplicateInterestIds = [interests[0].id, interests[0].id, interests[1].id];
      const updateReq = new NextRequest("http://localhost:3000/api/profile", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          cookie: `${config.auth.cookieName}=${tokenA}`,
        },
        body: JSON.stringify({
          bio: "Updated bio without duplicate key crash",
          interestIds: duplicateInterestIds,
        }),
      });

      const updateRes = await updateProfileHandler(updateReq);
      assert(updateRes.status === 200, "Profile updated successfully despite duplicate interestIds");
    }

    console.log("\n=================================================");
    console.log("🎉 ALL REGRESSION VERIFICATIONS PASSED!");
    console.log("=================================================");
  } finally {
    // Cleanup test users and relations
    for (const uid of createdUserIds) {
      await prisma.subscription.deleteMany({ where: { userId: uid } });
      await prisma.payment.deleteMany({ where: { userId: uid } });
      await prisma.block.deleteMany({
        where: { OR: [{ blockerId: uid }, { blockedUserId: uid }] },
      });
      await prisma.report.deleteMany({
        where: { OR: [{ reporterId: uid }, { reportedUserId: uid }] },
      });
      await prisma.profileInterest.deleteMany({ where: { profile: { userId: uid } } });
      await prisma.profile.deleteMany({ where: { userId: uid } });
      await prisma.match.deleteMany({
        where: { OR: [{ user1Id: uid }, { user2Id: uid }] },
      });
      await prisma.user.deleteMany({ where: { id: uid } });
    }
  }
}

runRegressionBugVerification()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
