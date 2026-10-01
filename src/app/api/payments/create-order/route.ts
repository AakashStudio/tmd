import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { queryOne, transaction } from '@/lib/db';

// Razorpay SDK would be used here in production
// For now, we'll use the REST API directly
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { planSlug } = await request.json();

    if (!planSlug || planSlug === 'free') {
      return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 });
    }

    // Get plan details
    const plan = await queryOne<{ id: string; name: string; slug: string; price_inr: number; duration_days: number }>(
      'SELECT id, name, slug, price_inr, duration_days FROM plans WHERE slug = $1 AND is_active = true',
      [planSlug]
    );

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }

    // Check for duplicate pending payments
    const pendingPayment = await queryOne(
      `SELECT id FROM payments WHERE user_id = $1 AND plan_id = $2 AND status IN ('created', 'processing') AND created_at > NOW() - INTERVAL '30 minutes'`,
      [session.userId, plan.id]
    );

    if (pendingPayment) {
      return NextResponse.json({ success: false, error: 'A payment is already in progress' }, { status: 409 });
    }

    // Create Razorpay order via API
    let razorpayOrder: any;

    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      const authHeader = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const rpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          amount: plan.price_inr * 100, // Razorpay expects paise
          currency: 'INR',
          receipt: `tmd_${session.userId}_${Date.now()}`,
          notes: {
            userId: session.userId,
            planSlug: plan.slug,
            planName: plan.name,
          },
        }),
      });

      if (!rpRes.ok) {
        const rpError = await rpRes.json();
        console.error('Razorpay order error:', rpError);
        return NextResponse.json({ success: false, error: 'Failed to create payment order' }, { status: 500 });
      }

      razorpayOrder = await rpRes.json();
    } else {
      // Development mode - mock order
      razorpayOrder = {
        id: `order_dev_${Date.now()}`,
        amount: plan.price_inr * 100,
        currency: 'INR',
        status: 'created',
      };
    }

    // Store payment record
    const payment = await queryOne(
      `INSERT INTO payments (user_id, plan_id, razorpay_order_id, amount_inr, currency, status)
       VALUES ($1, $2, $3, $4, 'INR', 'created')
       RETURNING id, razorpay_order_id`,
      [session.userId, plan.id, razorpayOrder.id, plan.price_inr]
    );

    return NextResponse.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: plan.price_inr * 100,
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID || 'rzp_test_development',
        planName: plan.name,
        planSlug: plan.slug,
        paymentId: payment!.id,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
