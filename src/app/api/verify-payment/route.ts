import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const order_id = body.order_id || body.razorpay_order_id || body.orderId;
    const payment_id = body.payment_id || body.razorpay_payment_id || body.paymentId;
    const razorpay_signature = body.razorpay_signature || body.signature;

    // Missing fields check
    if (!order_id || !payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          error: "Missing required fields: order_id, payment_id, and razorpay_signature must be provided.",
        },
        { status: 400 }
      );
    }

    if (!config.payments.razorpayKeySecret) {
      return NextResponse.json(
        { error: "Razorpay secret key not configured on server." },
        { status: 500 }
      );
    }

    // Verify HMAC-SHA256 signature
    const text = `${order_id}|${payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", config.payments.razorpayKeySecret)
      .update(text)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const receivedBuf = Buffer.from(razorpay_signature, "utf-8");

    const isMatch =
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "Signature verification failed. Potential tampering detected.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment signature verified successfully.",
      order_id,
      payment_id,
    });
  } catch (error: any) {
    console.error("Verify payment endpoint error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment." },
      { status: 500 }
    );
  }
}
