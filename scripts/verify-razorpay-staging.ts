import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { POST as verifyPayment } from "../src/app/api/payments/verify/route";
import { POST as webhookHandler } from "../src/app/api/payments/webhook/route";
import { config } from "../src/lib/config";
import { createSessionToken } from "../src/lib/auth-crypto";
import crypto from "crypto";

const prisma = new PrismaClient();

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`  ✓ ${msg}`);
}

async function runRazorpayStagingSuite() {
  console.log("=================================================================");
  console.log("💳 RAZORPAY TEST-MODE STAGING VERIFICATION SUITE");
  console.log("=================================================================\n");

  const ts = Date.now();
  let testUserId: string | null = null;
  let testPaymentId: string | null = null;
  let webhookUserId: string | null = null;
  let webhookPaymentId: string | null = null;

  try {
    // -------------------------------------------------------------
    // SETUP FIXTURES
    // -------------------------------------------------------------
    console.log("1. Setting Up Test-Mode Razorpay Fixtures...");
    const plan = await prisma.plan.findFirst({ where: { code: "TIER_149" } });
    if (!plan) throw new Error("Plan TIER_149 not found");

    const user = await prisma.user.create({
      data: {
        phone: `+91971${ts.toString().slice(-7)}`,
        status: "ACTIVE",
        profile: {
          create: {
            name: "Razorpay Verify Tester",
            dob: new Date("1997-07-07"),
            age: 27,
            gender: "FEMALE",
            interestedIn: "MALE",
            city: "Bhopal",
          },
        },
      },
    });
    testUserId = user.id;

    const userToken = await createSessionToken({
      userId: user.id,
      phone: user.phone,
      role: "USER",
      status: "ACTIVE",
    });

    const testOrderId = `order_test_${ts}_001`;
    const testPayment = await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amountInPaise: plan.priceInPaise,
        status: "PENDING",
        razorpayOrderId: testOrderId,
      },
    });
    testPaymentId = testPayment.id;
    console.log(`  ✓ Test payment fixture created: ${testOrderId} (status: PENDING)`);

    // -------------------------------------------------------------
    // PART 1: PAYMENT SIGNATURE & RETRY VERIFICATION
    // -------------------------------------------------------------
    console.log("\n2. Testing Payment Signature Verification & Retries...");
    const paymentId = `pay_test_${ts}_001`;
    const validSignature = crypto
      .createHmac("sha256", config.payments.razorpayKeySecret)
      .update(`${testOrderId}|${paymentId}`)
      .digest("hex");

    const invalidSignature = crypto
      .createHmac("sha256", "wrong_key_secret_for_tampering")
      .update(`${testOrderId}|${paymentId}`)
      .digest("hex");

    // 2.1 Missing required verification fields
    const missingFieldsReq = new NextRequest("http://localhost:3000/api/payments/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${config.auth.cookieName}=${userToken}`,
      },
      body: JSON.stringify({ orderId: testOrderId }),
    });
    const missingFieldsRes = await verifyPayment(missingFieldsReq);
    assert(missingFieldsRes.status === 400, "Missing payment_id or signature rejected with 400 Bad Request");

    // 2.2 Invalid / tampered payment signature
    const invalidSigReq = new NextRequest("http://localhost:3000/api/payments/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${config.auth.cookieName}=${userToken}`,
      },
      body: JSON.stringify({
        orderId: testOrderId,
        paymentId,
        signature: invalidSignature,
        planCode: "TIER_149",
      }),
    });
    const invalidSigRes = await verifyPayment(invalidSigReq);
    assert(invalidSigRes.status === 400, "Tampered payment signature strictly rejected with 400 Bad Request");

    // Reset payment status back to PENDING for the valid test (since invalid marks it FAILED)
    await prisma.payment.update({
      where: { id: testPaymentId },
      data: { status: "PENDING" },
    });

    // 2.3 Valid payment verification (First attempt)
    const validVerifyReq = new NextRequest("http://localhost:3000/api/payments/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${config.auth.cookieName}=${userToken}`,
      },
      body: JSON.stringify({
        orderId: testOrderId,
        paymentId,
        signature: validSignature,
        planCode: "TIER_149",
      }),
    });
    const validVerifyRes = await verifyPayment(validVerifyReq);
    assert(validVerifyRes.status === 200, "Valid signature verification succeeds with 200 OK");
    const validVerifyData = await validVerifyRes.json();
    assert(validVerifyData.success === true, "Response returns success: true");
    assert(Boolean(validVerifyData.subscription), "Response returns activated subscription");

    // 2.4 Duplicate Verify Request / Retry (Idempotency)
    const duplicateVerifyReq = new NextRequest("http://localhost:3000/api/payments/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${config.auth.cookieName}=${userToken}`,
      },
      body: JSON.stringify({
        orderId: testOrderId,
        paymentId,
        signature: validSignature,
        planCode: "TIER_149",
      }),
    });
    const duplicateVerifyRes = await verifyPayment(duplicateVerifyReq);
    assert(duplicateVerifyRes.status === 200, "Duplicate verification request succeeds with 200 OK");
    const duplicateData = await duplicateVerifyRes.json();
    assert(duplicateData.alreadyProcessed === true, "Response flags alreadyProcessed: true");

    // Verify subscription count
    const subCount = await prisma.subscription.count({
      where: { userId: user.id },
    });
    assert(subCount === 1, `Exactly 1 subscription created despite duplicate verify requests (Found: ${subCount})`);

    // -------------------------------------------------------------
    // PART 2: WEBHOOK SIGNATURE & DUPLICATE EVENT RETRIES
    // -------------------------------------------------------------
    console.log("\n3. Testing Razorpay Webhook Staging Flow...");

    // Create a second pending payment for webhook processing
    const webhookUser = await prisma.user.create({
      data: {
        phone: `+91972${ts.toString().slice(-7)}`,
        status: "ACTIVE",
        profile: {
          create: {
            name: "Webhook Tester",
            dob: new Date("1996-06-06"),
            age: 28,
            gender: "MALE",
            interestedIn: "FEMALE",
            city: "Bhopal",
          },
        },
      },
    });
    webhookUserId = webhookUser.id;

    const webhookOrderId = `order_webhook_${ts}_002`;
    const webhookPayment = await prisma.payment.create({
      data: {
        userId: webhookUser.id,
        planId: plan.id,
        amountInPaise: plan.priceInPaise,
        status: "PENDING",
        razorpayOrderId: webhookOrderId,
      },
    });
    webhookPaymentId = webhookPayment.id;

    const webhookEventId = `evt_stage_${ts}_capture`;
    const webhookPayloadObj = {
      entity: "event",
      account_id: "acc_stage_001",
      event: "payment.captured",
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id: `pay_stage_${ts}_webhook`,
            entity: "payment",
            amount: plan.priceInPaise,
            currency: "INR",
            status: "captured",
            order_id: webhookOrderId,
          },
        },
      },
      created_at: Math.floor(Date.now() / 1000),
      id: webhookEventId,
    };
    const webhookRawBody = JSON.stringify(webhookPayloadObj);

    const validWebhookSig = crypto
      .createHmac("sha256", config.payments.razorpayWebhookSecret)
      .update(webhookRawBody)
      .digest("hex");

    const invalidWebhookSig = crypto
      .createHmac("sha256", "tampered_webhook_secret")
      .update(webhookRawBody)
      .digest("hex");

    // 3.1 Webhook without signature header
    const noSigReq = new NextRequest("http://localhost:3000/api/payments/webhook", {
      method: "POST",
      body: webhookRawBody,
    });
    const noSigRes = await webhookHandler(noSigReq);
    assert(noSigRes.status === 400, "Webhook request without signature rejected with 400 Bad Request");

    // 3.2 Webhook with invalid signature
    const invalidWebhookReq = new NextRequest("http://localhost:3000/api/payments/webhook", {
      method: "POST",
      headers: { "x-razorpay-signature": invalidWebhookSig },
      body: webhookRawBody,
    });
    const invalidWebhookRes = await webhookHandler(invalidWebhookReq);
    assert(invalidWebhookRes.status === 400, "Webhook with tampered signature rejected with 400 Bad Request");

    // 3.3 Webhook with invalid JSON payload
    const invalidJsonReq = new NextRequest("http://localhost:3000/api/payments/webhook", {
      method: "POST",
      headers: {
        "x-razorpay-signature": crypto
          .createHmac("sha256", config.payments.razorpayWebhookSecret)
          .update("not-json")
          .digest("hex"),
      },
      body: "not-json",
    });
    const invalidJsonRes = await webhookHandler(invalidJsonReq);
    assert(invalidJsonRes.status === 400, "Webhook with malformed JSON rejected with 400 Bad Request");

    // 3.4 Valid webhook delivery (First attempt)
    const validWebhookReq = new NextRequest("http://localhost:3000/api/payments/webhook", {
      method: "POST",
      headers: { "x-razorpay-signature": validWebhookSig },
      body: webhookRawBody,
    });
    const validWebhookRes = await webhookHandler(validWebhookReq);
    assert(validWebhookRes.status === 200, "Valid webhook delivery accepted with 200 OK");
    const validWebhookData = await validWebhookRes.json();
    assert(validWebhookData.status === "processed", "Webhook status returns 'processed'");

    // Verify payment updated to SUCCESS and subscription activated
    const updatedWebhookPayment = await prisma.payment.findUnique({
      where: { id: webhookPaymentId },
    });
    assert(updatedWebhookPayment?.status === "SUCCESS", "Webhook successfully transitioned payment status to SUCCESS");

    const webhookUserSub = await prisma.subscription.findFirst({
      where: { userId: webhookUser.id, status: "ACTIVE" },
    });
    assert(Boolean(webhookUserSub), "Subscription successfully activated for user via webhook");

    // 3.5 Duplicate Webhook Delivery Retry (Razorpay webhook retry simulation)
    const retryWebhookReq1 = new NextRequest("http://localhost:3000/api/payments/webhook", {
      method: "POST",
      headers: { "x-razorpay-signature": validWebhookSig },
      body: webhookRawBody,
    });
    const retryWebhookRes1 = await webhookHandler(retryWebhookReq1);
    assert(retryWebhookRes1.status === 200, "First retry returns 200 OK without failing");
    const retryData1 = await retryWebhookRes1.json();
    assert(retryData1.status === "ignored", "Retry delivery safely ignored (status: ignored)");
    assert(retryData1.reason === "Duplicate event already processed", "Idempotency confirmed");

    const retryWebhookReq2 = new NextRequest("http://localhost:3000/api/payments/webhook", {
      method: "POST",
      headers: { "x-razorpay-signature": validWebhookSig },
      body: webhookRawBody,
    });
    const retryWebhookRes2 = await webhookHandler(retryWebhookReq2);
    assert(retryWebhookRes2.status === 200, "Second retry returns 200 OK without failing");

    // Verify exactly 1 subscription exists for webhook user
    const webhookSubCount = await prisma.subscription.count({
      where: { userId: webhookUser.id },
    });
    assert(webhookSubCount === 1, `Zero duplicate subscriptions created across webhook retries (Found: ${webhookSubCount})`);

    // 3.6 Non-payment event audit handling
    const genericEventObj = {
      entity: "event",
      account_id: "acc_stage_001",
      event: "payment.failed",
      id: `evt_stage_${ts}_failed`,
      payload: { payment: { entity: { id: "pay_failed_123" } } },
    };
    const genericBody = JSON.stringify(genericEventObj);
    const genericSig = crypto
      .createHmac("sha256", config.payments.razorpayWebhookSecret)
      .update(genericBody)
      .digest("hex");

    const genericReq = new NextRequest("http://localhost:3000/api/payments/webhook", {
      method: "POST",
      headers: { "x-razorpay-signature": genericSig },
      body: genericBody,
    });
    const genericRes = await webhookHandler(genericReq);
    assert(genericRes.status === 200, "Non-payment webhook event processed with 200 OK");
    const genericData = await genericRes.json();
    assert(genericData.status === "recorded", "Generic webhook recorded in payment event audit");

  } finally {
    console.log("\n4. Cleaning Up Staging Fixtures...");
    if (webhookUserId) {
      await prisma.paymentEvent.deleteMany({ where: { payment: { userId: webhookUserId } } });
      await prisma.subscription.deleteMany({ where: { userId: webhookUserId } });
      await prisma.payment.deleteMany({ where: { userId: webhookUserId } });
      await prisma.profile.deleteMany({ where: { userId: webhookUserId } });
      await prisma.user.deleteMany({ where: { id: webhookUserId } });
    }
    if (testUserId) {
      await prisma.paymentEvent.deleteMany({ where: { payment: { userId: testUserId } } });
      await prisma.subscription.deleteMany({ where: { userId: testUserId } });
      await prisma.payment.deleteMany({ where: { userId: testUserId } });
      await prisma.profile.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    // Delete test payment events by ID pattern
    await prisma.paymentEvent.deleteMany({
      where: { eventId: { contains: `${ts}` } },
    }).catch(() => {});
    await prisma.$disconnect();
    console.log("  ✓ Staging fixtures cleanly destroyed.");
  }

  console.log("\n=================================================================");
  console.log("🎉 RAZORPAY TEST-MODE STAGING VERIFICATION PASSED WITH 100% SUCCESS!");
  console.log("=================================================================\n");
}

runRazorpayStagingSuite().catch((err) => {
  console.error("FATAL ERROR IN RAZORPAY STAGING SUITE:", err);
  process.exit(1);
});
