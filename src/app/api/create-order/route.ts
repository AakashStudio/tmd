import { NextRequest, NextResponse } from "next/server";
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

    const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const orderReceipt = receipt || `rcpt_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    return NextResponse.json({
      success: true,
      order_id: orderId,
      amount: amountInPaise,
      currency: currency || "INR",
      receipt: orderReceipt,
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
