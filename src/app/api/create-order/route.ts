import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import Razorpay from "razorpay";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount, currency = "INR", receipt } = body;

    const amountInPaise = Number(amount);

    // Validate amount >= 100 paise (₹1)
    if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
      return NextResponse.json(
        { error: "Order amount must be at least 100 paise (₹1)." },
        { status: 400 }
      );
    }

    if (!config.payments.razorpayKeyId || !config.payments.razorpayKeySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials not configured on server." },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: config.payments.razorpayKeyId,
      key_secret: config.payments.razorpayKeySecret,
    });

    const orderReceipt = receipt || `rcpt_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: currency || "INR",
      receipt: orderReceipt,
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: config.payments.razorpayKeyId,
    });
  } catch (error: any) {
    console.error("Create order endpoint error:", error);
    return NextResponse.json(
      {
        error:
          error.error?.description ||
          error.message ||
          "Failed to create Razorpay order.",
      },
      { status: 500 }
    );
  }
}
