import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
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
    const { planCode, amount, customAmountInRupees } = body;

    let targetAmountInPaise: number = 0;
    let targetPlan: any = null;

    if (planCode && planCode !== PlanCode.FREE) {
      targetPlan = await prisma.plan.findUnique({
        where: { code: planCode as PlanCode },
      });
      if (!targetPlan) {
        return NextResponse.json({ error: "Plan not found." }, { status: 404 });
      }
      targetAmountInPaise = customAmountInRupees
        ? Math.round(customAmountInRupees * 100)
        : targetPlan.priceInPaise;
    } else if (typeof customAmountInRupees === "number" && customAmountInRupees > 0) {
      targetAmountInPaise = Math.round(customAmountInRupees * 100);
    } else if (typeof amount === "number") {
      targetAmountInPaise = amount;
    } else {
      return NextResponse.json(
        { error: "A valid paid plan code or amount must be provided." },
        { status: 400 }
      );
    }

    // Minimum amount validation (>= 100 paise / ₹1)
    if (!targetAmountInPaise || targetAmountInPaise < 100) {
      return NextResponse.json(
        { error: "Order amount must be at least ₹1." },
        { status: 400 }
      );
    }

    // Generate unique internal order ID for UPI payment tracking
    const orderId = `tmd_ord_${(targetPlan?.code || "custom").toLowerCase()}_${Date.now()}_${crypto
      .randomBytes(4)
      .toString("hex")}`;

    // Record pending payment in database if plan exists
    let paymentId: string | null = null;
    if (targetPlan) {
      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          planId: targetPlan.id,
          razorpayOrderId: orderId,
          amountInPaise: targetAmountInPaise,
          status: "PENDING",
        },
      });
      paymentId = payment.id;
    }

    const merchantVpa = process.env.MERCHANT_UPI_ID || "thematchdate@okaxis";
    const merchantName = process.env.MERCHANT_NAME || "The Match Date";
    const amountInRupees = (targetAmountInPaise / 100).toFixed(2);
    const txnNote = `TMD ${targetPlan?.name || "VIP"} Plan`;

    const baseUpiParams = `pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent(merchantName)}&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent(txnNote)}&tr=${encodeURIComponent(orderId)}`;

    return NextResponse.json({
      success: true,
      order_id: orderId,
      orderId: orderId,
      amount: targetAmountInPaise,
      amountInPaise: targetAmountInPaise,
      currency: "INR",
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
      upiDetails: {
        payeeVpa: merchantVpa,
        payeeName: merchantName,
        amountInRupees: parseFloat(amountInRupees),
        transactionNote: txnNote,
        upiIntentUrl: `upi://pay?${baseUpiParams}`,
        gpayUrl: `tez://upi/pay?${baseUpiParams}`,
        phonepeUrl: `phonepe://pay?${baseUpiParams}`,
        paytmUrl: `paytmmp://pay?${baseUpiParams}`,
        credUrl: `upi://pay?${baseUpiParams}`,
      },
    });
  } catch (error: any) {
    console.error("Payment create order error:", error);
    return NextResponse.json(
      { error: "Internal server error creating payment order." },
      { status: 500 }
    );
  }
}
