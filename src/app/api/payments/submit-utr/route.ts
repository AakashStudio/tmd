import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { orderId, utr, planCode } = body;

    if (!orderId || !utr) {
      return NextResponse.json(
        { error: "Order ID and 12-digit UPI UTR / Reference number are required." },
        { status: 400 }
      );
    }

    const cleanUtr = String(utr).trim();
    if (cleanUtr.length < 8 || cleanUtr.length > 20) {
      return NextResponse.json(
        { error: "Please enter a valid UPI Reference / UTR Number (usually 12 digits)." },
        { status: 400 }
      );
    }

    // Find the pending payment for this order
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
      include: { plan: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment record not found for this order." },
        { status: 404 }
      );
    }

    if (payment.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized for this payment." },
        { status: 403 }
      );
    }

    // Save the UTR to payment record
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: cleanUtr,
        razorpaySignature: "UTR_SUBMITTED",
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "UTR submitted successfully. Your payment is queued for verification.",
      paymentId: updated.id,
      utr: cleanUtr,
    });
  } catch (err: any) {
    console.error("Submit UTR error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit UTR." },
      { status: 500 }
    );
  }
}
