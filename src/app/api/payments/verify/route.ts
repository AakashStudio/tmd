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
    const { orderId, paymentId, signature, planCode } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { error: "Order ID and Payment ID are required." },
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
      // 1. Mark Payment successful
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          razorpayPaymentId: paymentId,
          razorpaySignature: signature || generatedSignature,
        },
      });

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
