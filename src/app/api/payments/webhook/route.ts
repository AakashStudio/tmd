import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { queryOne, transaction, query } from '@/lib/db';

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // Verify webhook signature
    if (RAZORPAY_WEBHOOK_SECRET && signature) {
      const expectedSignature = createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const eventId = event.event_id || event.id;
    const eventType = event.event;

    // Idempotency check
    const existing = await queryOne(
      'SELECT id FROM payment_webhooks WHERE razorpay_event_id = $1',
      [eventId]
    );
    if (existing) {
      return NextResponse.json({ status: 'already_processed' });
    }

    // Store webhook event
    await query(
      `INSERT INTO payment_webhooks (razorpay_event_id, event_type, payload, processed)
       VALUES ($1, $2, $3, false)`,
      [eventId, eventType, JSON.stringify(event)]
    );

    // Process based on event type
    if (eventType === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      if (payment) {
        const orderId = payment.order_id;

        // Find our payment record
        const paymentRecord = await queryOne<{ id: string; user_id: string; plan_id: string; status: string }>(
          'SELECT id, user_id, plan_id, status FROM payments WHERE razorpay_order_id = $1',
          [orderId]
        );

        if (paymentRecord && paymentRecord.status !== 'success') {
          const plan = await queryOne<{ duration_days: number }>(
            'SELECT duration_days FROM plans WHERE id = $1',
            [paymentRecord.plan_id]
          );

          await transaction(async (client) => {
            // Expire existing subscriptions
            await client.query(
              `UPDATE subscriptions SET status = 'expired', updated_at = NOW() WHERE user_id = $1 AND status = 'active'`,
              [paymentRecord!.user_id]
            );

            const expiresAt = plan?.duration_days
              ? new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString()
              : null;

            const sub = await client.query(
              `INSERT INTO subscriptions (user_id, plan_id, status, starts_at, expires_at)
               VALUES ($1, $2, 'active', NOW(), $3) RETURNING id`,
              [paymentRecord!.user_id, paymentRecord!.plan_id, expiresAt]
            );

            await client.query(
              `UPDATE payments SET 
                razorpay_payment_id = $1, status = 'success', 
                subscription_id = $2, verified_at = NOW(), updated_at = NOW()
               WHERE id = $3`,
              [payment.id, sub.rows[0].id, paymentRecord!.id]
            );
          });
        }
      }
    } else if (eventType === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      if (payment) {
        await query(
          `UPDATE payments SET status = 'failed', updated_at = NOW() WHERE razorpay_order_id = $1 AND status != 'success'`,
          [payment.order_id]
        );
      }
    }

    // Mark webhook as processed
    await query(
      `UPDATE payment_webhooks SET processed = true, processed_at = NOW() WHERE razorpay_event_id = $1`,
      [eventId]
    );

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
