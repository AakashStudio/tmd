import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payments = await query(
      `SELECT 
        pay.id,
        p.name as "planName",
        p.slug as "planSlug",
        pay.amount_inr as "amount",
        pay.status,
        pay.razorpay_order_id as "razorpayOrderId",
        pay.razorpay_payment_id as "razorpayPaymentId",
        pay.created_at as "createdAt",
        pay.verified_at as "verifiedAt"
       FROM payments pay
       JOIN plans p ON p.id = pay.plan_id
       WHERE pay.user_id = $1
       ORDER BY pay.created_at DESC
       LIMIT 50`,
      [session.userId]
    );

    return NextResponse.json({ success: true, data: payments.rows });
  } catch (error) {
    console.error('Payment history error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
