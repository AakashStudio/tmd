import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { PlanCode } from "@prisma/client";
import Razorpay from "razorpay";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { planCode, amount } = body;

    let targetAmountInPaise: number = 0;
    let targetPlan: any = null;

    if (planCode && planCode !== PlanCode.FREE) {
      targetPlan = await prisma.plan.findUnique({
        where: { code: planCode as PlanCode },
      });
      if (!targetPlan) {
        return NextResponse.json({ error: "Plan not found." }, { status: 404 });
      }
      targetAmountInPaise = targetPlan.priceInPaise;
    } else if (typeof amount === "number") {
      targetAmountInPaise = amount;
    } else {
      return NextResponse.json(
        { error: "A valid paid plan code or amount in paise must be provided." },
        { status: 400 }
      );
    }

    // Razorpay minimum amount validation (>= 100 paise / ₹1)
    if (!targetAmountInPaise || targetAmountInPaise < 100) {
      return NextResponse.json(
        { error: "Order amount must be at least 100 paise (₹1)." },
        { status: 400 }
      );
    }

    // Generate unique Razorpay order ID using official Razorpay SDK
    let razorpayOrderId: string;
    const hasRealRazorpayKeys =
      config.payments.razorpayKeyId &&
      config.payments.razorpayKeySecret &&
      !config.payments.razorpayKeyId.includes("placeholder");

    if (hasRealRazorpayKeys) {
      try {
        const razorpay = new Razorpay({
          key_id: config.payments.razorpayKeyId,
          key_secret: config.payments.razorpayKeySecret,
        });

        const rzpOrder = await razorpay.orders.create({
          amount: targetAmountInPaise,
          currency: "INR",
          receipt: `rcpt_${user.id.slice(-6)}_${Date.now()}`,
          notes: {
            userId: user.id,
            planCode: targetPlan ? targetPlan.code : "CUSTOM",
          },
        });

        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr: any) {
        console.error("Razorpay orders.create failed:", rzpErr);
        return NextResponse.json(
          {
            error:
              rzpErr.error?.description ||
              rzpErr.message ||
              "Failed to create Razorpay order.",
          },
          { status: 500 }
        );
      }
    } else {
      // In development fallback if placeholder keys
      razorpayOrderId = `order_${(targetPlan?.code || "custom").toLowerCase()}_${Date.now()}_${crypto
        .randomBytes(4)
        .toString("hex")}`;
    }

    // Record pending payment in database if plan exists
    let paymentId: string | null = null;
    if (targetPlan) {
      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          planId: targetPlan.id,
          razorpayOrderId,
          amountInPaise: targetAmountInPaise,
          status: "PENDING",
        },
      });
      paymentId = payment.id;
    }

    return NextResponse.json({
      success: true,
      order_id: razorpayOrderId,
      orderId: razorpayOrderId,
      amount: targetAmountInPaise,
      amountInPaise: targetAmountInPaise,
      currency: "INR",
      key_id: config.payments.razorpayKeyId,
      keyId: config.payments.razorpayKeyId,
      plan: targetPlan
        ? {
            code: targetPlan.code,
            name: targetPlan.name,
            priceInPaise: targetPlan.priceInPaise,
            durationDays: targetPlan.durationDays,
            isPro: targetPlan.isPro,
          }
        : null,
      paymentId,
    });
  } catch (error: any) {
    console.error("Payment create order error:", error);
    return NextResponse.json(
      { error: "Internal server error creating payment order." },
      { status: 500 }
    );
  }
}
