import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", config.payments.razorpayWebhookSecret)
      .update(rawBody)
      .digest("hex");

    const isDevMock =
      !config.app.isProduction &&
      (signature === "dev_webhook_sig" || signature === "test_webhook_sig");

    if (signature !== expectedSignature && !isDevMock) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const eventId = payload.id || `event_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const eventType = payload.event || "unknown";

    // Deduplication & Idempotency Check
    const existingEvent = await prisma.paymentEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      // Idempotent success response
      return NextResponse.json({
        status: "ignored",
        reason: "Duplicate event already processed",
      });
    }

    // Process payment events
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const orderId = paymentEntity.order_id || payload.payload?.order?.entity?.id;
      const paymentId = paymentEntity.id;

      if (orderId) {
        const payment = await prisma.payment.findUnique({
          where: { razorpayOrderId: orderId },
          include: { plan: true },
        });

        if (payment && payment.status !== "SUCCESS") {
          await prisma.$transaction(async (tx) => {
            // Update payment to SUCCESS
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: "SUCCESS",
                razorpayPaymentId: paymentId || payment.razorpayPaymentId,
                razorpaySignature: signature,
              },
            });

            // Supersede existing active subscriptions (Immediate Replacement)
            await tx.subscription.updateMany({
              where: {
                userId: payment.userId,
                status: "ACTIVE",
              },
              data: {
                status: "SUPERSEDED",
              },
            });

            // Create new active subscription
            const startDate = new Date();
            const endDate = new Date(
              startDate.getTime() + payment.plan.durationDays * 24 * 60 * 60 * 1000
            );

            await tx.subscription.create({
              data: {
                userId: payment.userId,
                planId: payment.planId,
                status: "ACTIVE",
                startDate,
                endDate,
              },
            });

            // Record event
            await tx.paymentEvent.create({
              data: {
                paymentId: payment.id,
                eventId,
                eventType,
                payload: rawBody,
              },
            });
          });

          return NextResponse.json({ status: "processed", eventId });
        }
      }
    }

    // Save generic audit event
    await prisma.paymentEvent.create({
      data: {
        eventId,
        eventType,
        payload: rawBody,
      },
    });

    return NextResponse.json({ status: "recorded", eventId });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error handling webhook" },
      { status: 500 }
    );
  }
}
