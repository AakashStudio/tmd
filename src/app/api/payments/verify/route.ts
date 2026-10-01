import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { queryOne, transaction } from '@/lib/db';
import { createHmac } from 'crypto';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ success: false, error: 'Missing payment details' }, { status: 400 });
    }

    // Find payment record
    const payment = await queryOne<{ id: string; user_id: string; plan_id: string; amount_inr: number; status: string }>(
      `SELECT id, user_id, plan_id, amount_inr, status FROM payments WHERE razorpay_order_id = $1`,
      [razorpayOrderId]
    );

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    // Verify payment belongs to this user
    if (payment.user_id !== session.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Check idempotency - don't process if already successful
    if (payment.status === 'success') {
      return NextResponse.json({ success: true, message: 'Payment already verified' });
    }

    // Verify signature
    if (RAZORPAY_KEY_SECRET) {
      const expectedSignature = createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        // Mark payment as failed
        await queryOne(
          `UPDATE payments SET status = 'failed', updated_at = NOW() WHERE id = $1 RETURNING id`,
          [payment.id]
        );
        return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 });
      }
    }

    // Get plan details
    const plan = await queryOne<{ id: string; slug: string; duration_days: number; price_inr: number }>(
      'SELECT id, slug, duration_days, price_inr FROM plans WHERE id = $1',
      [payment.plan_id]
    );

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }

    // Verify amount matches
    if (payment.amount_inr !== plan.price_inr) {
      return NextResponse.json({ success: false, error: 'Amount mismatch' }, { status: 400 });
    }

    // Activate subscription in transaction
    await transaction(async (client) => {
      // Expire all current active subscriptions for this user (no carry-forward)
      await client.query(
        `UPDATE subscriptions SET status = 'expired', updated_at = NOW()
         WHERE user_id = $1 AND status = 'active'`,
        [session.userId]
      );

      // Create new subscription
      const expiresAt = plan.duration_days
        ? new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const sub = await client.query(
        `INSERT INTO subscriptions (user_id, plan_id, status, starts_at, expires_at)
         VALUES ($1, $2, 'active', NOW(), $3)
         RETURNING id`,
        [session.userId, plan.id, expiresAt]
      );

      // Update payment
      await client.query(
        `UPDATE payments SET 
          razorpay_payment_id = $1, 
          razorpay_signature = $2,
          subscription_id = $3,
          status = 'success', 
          verified_at = NOW(), 
          updated_at = NOW()
         WHERE id = $4`,
        [razorpayPaymentId, razorpaySignature, sub.rows[0].id, payment.id]
      );
    });

    return NextResponse.json({
      success: true,
      data: {
        planSlug: plan.slug,
        message: 'Subscription activated successfully',
      },
    });
  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
