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
    const { planCode } = body;

    if (!planCode || planCode === PlanCode.FREE) {
      return NextResponse.json(
        { error: "A valid paid plan code must be provided." },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.findUnique({
      where: { code: planCode as PlanCode },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    // Generate unique Razorpay order ID
    let razorpayOrderId: string;

    const hasRealRazorpayKeys =
      config.payments.razorpayKeyId &&
      config.payments.razorpayKeySecret &&
      !config.payments.razorpayKeyId.includes("placeholder");

    if (hasRealRazorpayKeys) {
      // Call official Razorpay Orders API
      const authHeader = Buffer.from(
        `${config.payments.razorpayKeyId}:${config.payments.razorpayKeySecret}`
      ).toString("base64");

      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          amount: plan.priceInPaise,
          currency: "INR",
          receipt: `rcpt_${user.id.slice(-6)}_${Date.now()}`,
          notes: {
            userId: user.id,
            planCode: plan.code,
          },
        }),
      });

      if (!rzpRes.ok) {
        const rzpErr = await rzpRes.json().catch(() => ({}));
        console.error("Razorpay orders.create failed:", rzpErr);
        return NextResponse.json(
          { error: rzpErr.error?.description || "Failed to create Razorpay order." },
          { status: 502 }
        );
      }

      const rzpData = await rzpRes.json();
      razorpayOrderId = rzpData.id;
    } else {
      // In development or when keys are placeholders, fallback to deterministic order id
      razorpayOrderId = `order_${plan.code.toLowerCase()}_${Date.now()}_${crypto
        .randomBytes(4)
        .toString("hex")}`;
    }

    // Record pending payment in database
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        razorpayOrderId,
        amountInPaise: plan.priceInPaise,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrderId,
      amountInPaise: plan.priceInPaise,
      currency: "INR",
      keyId: config.payments.razorpayKeyId,
      plan: {
        code: plan.code,
        name: plan.name,
        priceInPaise: plan.priceInPaise,
        durationDays: plan.durationDays,
        isPro: plan.isPro,
      },
      paymentId: payment.id,
    });
  } catch (error: any) {
    console.error("Payment create order error:", error);
    return NextResponse.json(
      { error: "Internal server error creating payment order." },
      { status: 500 }
    );
  }
}
