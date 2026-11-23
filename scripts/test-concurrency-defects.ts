import { prisma } from "../src/lib/db";
import { POST as verifyPaymentHandler } from "../src/app/api/payments/verify/route";
import { POST as openViewOnceHandler } from "../src/app/api/chat/view-once/[mediaId]/open/route";
import { POST as uploadHandler } from "../src/app/api/upload/route";
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

async function runConcurrencyDefectTests() {
  console.log("=================================================");
  console.log("🔬 REPRODUCING CONCURRENCY & UPLOAD DEFECTS (PRE-FIX)");
  console.log("=================================================\n");

  const cleanupUserIds: string[] = [];

  try {
    // -------------------------------------------------------------
    // DEFECT 1: Concurrent Payment Verification Race Condition
    // -------------------------------------------------------------
    console.log("1. Testing Concurrent Duplicate Payment Verification...");

    const user = await prisma.user.create({
      data: {
        phone: `+91977${Math.floor(1000000 + Math.random() * 9000000)}`,
        status: "ACTIVE",
        profile: {
          create: {
            name: "RaceUser",
            dob: new Date("1995-01-01"),
            age: 29,
            gender: "MALE",
            interestedIn: "WOMEN",
            city: "Bhopal",
            relationshipIntention: "LONG_TERM",
          },
        },
      },
    });
    cleanupUserIds.push(user.id);

    const plan = await prisma.plan.findUniqueOrThrow({ where: { code: "TIER_49" } });
    const orderId = `order_race_${Date.now()}`;
    await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        razorpayOrderId: orderId,
        amountInPaise: 4900,
        status: "PENDING",
      },
    });

    const paymentId = `pay_race_${Date.now()}`;
    const signature = crypto
      .createHmac("sha256", config.payments.razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const userToken = await createSessionToken({ userId: user.id, role: "USER", status: "ACTIVE" });

    const createVerifyReq = () =>
      new NextRequest("http://localhost:3000/api/payments/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${config.auth.cookieName}=${userToken}`,
        },
        body: JSON.stringify({
          orderId,
          paymentId,
          signature,
          planCode: "TIER_49",
        }),
      });

    // Fire 2 concurrent requests
    const [res1, res2] = await Promise.all([
      verifyPaymentHandler(createVerifyReq()),
      verifyPaymentHandler(createVerifyReq()),
    ]);

    const body1 = await res1.json();
    const body2 = await res2.json();

    console.log(`  Res 1: ${res1.status}, alreadyProcessed: ${body1.alreadyProcessed}`);
    console.log(`  Res 2: ${res2.status}, alreadyProcessed: ${body2.alreadyProcessed}`);

    const subs = await prisma.subscription.findMany({
      where: { userId: user.id },
    });
    console.log(`  Total subscriptions created: ${subs.length}`);
    const activeSubs = subs.filter((s) => s.status === "ACTIVE");
    console.log(`  Active subscriptions: ${activeSubs.length}`);

    // If both requests created separate subscriptions, subs.length will be > 1
    // The requirement: exactly 1 subscription created overall for this payment order
    assert(subs.length === 1, `Exactly 1 subscription record must exist (Found: ${subs.length})`);
    assert(activeSubs.length === 1, `Exactly 1 active subscription (Found: ${activeSubs.length})`);

    // -------------------------------------------------------------
    // DEFECT 2: Concurrent View Once Opening Race Condition
    // -------------------------------------------------------------
    console.log("\n2. Testing Concurrent View Once Opening Race Condition...");

    const alice = await prisma.user.create({
      data: {
        phone: `+91977${Math.floor(1000000 + Math.random() * 9000000)}`,
        status: "ACTIVE",
        profile: {
          create: {
            name: "Alice",
            dob: new Date("1996-02-02"),
            age: 28,
            gender: "FEMALE",
            interestedIn: "MEN",
            city: "Bhopal",
            relationshipIntention: "LONG_TERM",
          },
        },
      },
    });
    cleanupUserIds.push(alice.id);

    const bob = await prisma.user.create({
      data: {
        phone: `+91977${Math.floor(1000000 + Math.random() * 9000000)}`,
        status: "ACTIVE",
        profile: {
          create: {
            name: "Bob",
            dob: new Date("1995-03-03"),
            age: 29,
            gender: "MALE",
            interestedIn: "WOMEN",
            city: "Bhopal",
            relationshipIntention: "LONG_TERM",
          },
        },
      },
    });
    cleanupUserIds.push(bob.id);

    const { user1Id, user2Id } = getCanonicalMatchPair(alice.id, bob.id);
    const match = await prisma.match.create({
      data: { user1Id, user2Id, status: "ACTIVE" },
    });
    const conv = await prisma.conversation.create({
      data: { matchId: match.id },
    });

    const msg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: alice.id,
        content: "View once photo",
        type: "VIEW_ONCE_PHOTO",
        status: "SENT",
        media: {
          create: {
            storageKey: `view_once/test_vo_${Date.now()}.jpg`,
            isViewOnce: true,
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
          },
        },
      },
      include: { media: true },
    });

    const mediaId = msg.media!.id;
    const bobToken = await createSessionToken({ userId: bob.id, role: "USER", status: "ACTIVE" });

    const createOpenReq = () =>
      new NextRequest(`http://localhost:3000/api/chat/view-once/${mediaId}/open`, {
        method: "POST",
        headers: {
          cookie: `${config.auth.cookieName}=${bobToken}`,
        },
      });

    // Fire 2 concurrent open requests from Bob
    const [openRes1, openRes2] = await Promise.all([
      openViewOnceHandler(createOpenReq(), { params: { mediaId } }),
      openViewOnceHandler(createOpenReq(), { params: { mediaId } }),
    ]);

    const openBody1 = await openRes1.json();
    const openBody2 = await openRes2.json();

    console.log(`  Open Res 1 status: ${openRes1.status}, streamToken: ${Boolean(openBody1.streamToken)}`);
    console.log(`  Open Res 2 status: ${openRes2.status}, streamToken: ${Boolean(openBody2.streamToken)}`);

    const statuses = [openRes1.status, openRes2.status];
    const successCount = statuses.filter((s) => s === 200).length;
    const goneCount = statuses.filter((s) => s === 410).length;

    // Invariant: Exactly one must succeed (200), and the other must be 410 Gone
    assert(successCount === 1, `Exactly 1 concurrent request receives 200 OK (Got: ${successCount})`);
    assert(goneCount === 1, `Concurrent second request receives 410 Gone (Got: ${goneCount})`);

    // -------------------------------------------------------------
    // DEFECT 3: Invalid File Upload MIME & Signature Validation
    // -------------------------------------------------------------
    console.log("\n3. Testing Upload File Type & Signature Security...");

    // Attack 1: Plain text / shell script uploaded as multipart
    const fakeScriptFormData = new FormData();
    const fakeScriptBlob = new Blob(["#!/bin/bash\necho Malicious"], { type: "application/x-sh" });
    fakeScriptFormData.append("file", fakeScriptBlob, "script.sh");

    const fakeUploadReq = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      headers: {
        cookie: `${config.auth.cookieName}=${bobToken}`,
      },
      body: fakeScriptFormData,
    });

    const fakeUploadRes = await uploadHandler(fakeUploadReq);
    console.log(`  Upload fake script response status: ${fakeUploadRes.status}`);
    assert(
      fakeUploadRes.status === 400,
      "Non-image MIME type application/x-sh strictly rejected with 400 Bad Request"
    );

    // Attack 2: Fake image with invalid binary magic bytes
    const fakeJpgFormData = new FormData();
    const fakeJpgBlob = new Blob(["NOT_A_REAL_JPEG_DATA_TEXT"], { type: "image/jpeg" });
    fakeJpgFormData.append("file", fakeJpgBlob, "fake.jpg");

    const fakeJpgUploadReq = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      headers: {
        cookie: `${config.auth.cookieName}=${bobToken}`,
      },
      body: fakeJpgFormData,
    });

    const fakeJpgUploadRes = await uploadHandler(fakeJpgUploadReq);
    console.log(`  Upload invalid magic bytes response status: ${fakeJpgUploadRes.status}`);
    assert(
      fakeJpgUploadRes.status === 400,
      "Fake image with invalid binary magic bytes strictly rejected with 400 Bad Request"
    );

    console.log("\n=================================================");
    console.log("🎉 ALL CONCURRENCY & UPLOAD CHECKS PASSED!");
    console.log("=================================================");
  } finally {
    for (const uid of cleanupUserIds) {
      await prisma.subscription.deleteMany({ where: { userId: uid } });
      await prisma.payment.deleteMany({ where: { userId: uid } });
      await prisma.messageMedia.deleteMany({
        where: { message: { conversation: { match: { OR: [{ user1Id: uid }, { user2Id: uid }] } } } },
      });
      await prisma.message.deleteMany({
        where: { conversation: { match: { OR: [{ user1Id: uid }, { user2Id: uid }] } } },
      });
      await prisma.conversation.deleteMany({
        where: { match: { OR: [{ user1Id: uid }, { user2Id: uid }] } },
      });
      await prisma.match.deleteMany({
        where: { OR: [{ user1Id: uid }, { user2Id: uid }] },
      });
      await prisma.profile.deleteMany({ where: { userId: uid } });
      await prisma.user.deleteMany({ where: { id: uid } });
    }
  }
}

runConcurrencyDefectTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
