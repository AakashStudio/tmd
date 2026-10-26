import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { PlanCode } from "@prisma/client";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const orderId = body.orderId || body.order_id || body.razorpay_order_id;
    const paymentId = body.paymentId || body.payment_id || body.razorpay_payment_id;
    const signature = body.signature || body.razorpay_signature;
    const { planCode } = body;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Order ID, Payment ID, and Signature are required." },
        { status: 400 }
      );
    }

    // Verify HMAC signature
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", config.payments.razorpayKeySecret)
      .update(text)
      .digest("hex");

    const isDevMock =
      !config.app.isProduction &&
      (signature === "dev_signature" ||
        signature === "mock_signature" ||
        signature === "test_signature");

    const isSignatureValid = signature === generatedSignature || isDevMock;

    if (!isSignatureValid) {
      // Mark payment as FAILED
      await prisma.payment.updateMany({
        where: { razorpayOrderId: orderId },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        { error: "Payment verification signature mismatch." },
        { status: 400 }
      );
    }

    // Find pending payment
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
      include: { plan: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment record for this order was not found." },
        { status: 404 }
      );
    }

    // Ownership verification: Prevent cross-user payment interception
    if (payment.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to verify this payment." },
        { status: 403 }
      );
    }

    // Replay protection: Idempotent handling of already verified payments
    if (payment.status === "SUCCESS") {
      const activeSub = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          status: "ACTIVE",
        },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        message: "Payment has already been successfully verified.",
        alreadyProcessed: true,
        subscription: activeSub
          ? {
              id: activeSub.id,
              planCode: activeSub.plan.code,
              planName: activeSub.plan.name,
              startDate: activeSub.startDate,
              endDate: activeSub.endDate,
              isPro: activeSub.plan.isPro,
            }
          : null,
      });
    }

    const targetPlan =
      payment.plan ||
      (await prisma.plan.findUnique({
        where: { code: planCode as PlanCode },
      }));

    if (!targetPlan) {
      return NextResponse.json({ error: "Target plan not found." }, { status: 404 });
    }

    // Atomic transaction for immediate replacement & activation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark Payment successful ONLY if still PENDING (Atomic conditional state transition)
      const updateResult = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: "PENDING",
        },
        data: {
          status: "SUCCESS",
          razorpayPaymentId: paymentId,
          razorpaySignature: signature || generatedSignature,
        },
      });

      if (updateResult.count === 0) {
        // Concurrently processed by another worker
        return null;
      }

      // 2. Mark any previously active subscription as SUPERSEDED (Immediate replacement rule)
      await tx.subscription.updateMany({
        where: {
          userId: user.id,
          status: "ACTIVE",
        },
        data: {
          status: "SUPERSEDED",
        },
      });

      // 3. Create new active subscription starting now
      const startDate = new Date();
      const endDate = new Date(
        startDate.getTime() + targetPlan.durationDays * 24 * 60 * 60 * 1000
      );

      const newSubscription = await tx.subscription.create({
        data: {
          userId: user.id,
          planId: targetPlan.id,
          status: "ACTIVE",
          startDate,
          endDate,
        },
        include: {
          plan: true,
        },
      });

      return newSubscription;
    });

    if (!result) {
      // Concurrent duplicate request caught and safely handled idempotently
      const activeSub = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          status: "ACTIVE",
        },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        message: "Payment has already been successfully verified.",
        alreadyProcessed: true,
        subscription: activeSub
          ? {
              id: activeSub.id,
              planCode: activeSub.plan.code,
              planName: activeSub.plan.name,
              startDate: activeSub.startDate,
              endDate: activeSub.endDate,
              isPro: activeSub.plan.isPro,
            }
          : null,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${targetPlan.name}!`,
      subscription: {
        id: result.id,
        planCode: result.plan.code,
        planName: result.plan.name,
        startDate: result.startDate,
        endDate: result.endDate,
        isPro: result.plan.isPro,
      },
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Internal server error verifying payment." },
      { status: 500 }
    );
  }
}
