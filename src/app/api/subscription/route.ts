import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { queryOne } from '@/lib/db';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check and expire any expired subscriptions
    await queryOne(
      `UPDATE subscriptions SET status = 'expired' 
       WHERE user_id = $1 AND status = 'active' AND expires_at IS NOT NULL AND expires_at <= NOW()
       RETURNING id`,
      [session.userId]
    );

    const subscription = await queryOne(
      `SELECT s.id, p.slug as "planSlug", p.name as "planName", p.price_inr as "priceInr",
        p.features, s.status, s.starts_at as "startsAt", s.expires_at as "expiresAt"
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = $1 AND s.status = 'active'
       ORDER BY s.created_at DESC LIMIT 1`,
      [session.userId]
    );

    if (!subscription) {
      // Return free plan
      const freePlan = await queryOne(
        `SELECT slug as "planSlug", name as "planName", price_inr as "priceInr", features 
         FROM plans WHERE slug = 'free'`
      );
      return NextResponse.json({
        success: true,
        data: { ...freePlan, status: 'active', startsAt: null, expiresAt: null },
      });
    }

    return NextResponse.json({ success: true, data: subscription });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
