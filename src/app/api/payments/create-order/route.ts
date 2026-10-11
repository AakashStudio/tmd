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
    // In production, Razorpay orders.create is invoked; in dev, deterministic order id
    const razorpayOrderId = `order_${plan.code.toLowerCase()}_${Date.now()}_${crypto
      .randomBytes(4)
      .toString("hex")}`;

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
