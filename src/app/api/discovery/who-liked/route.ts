import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription for entitlement
    const sub = await queryOne<{ slug: string }>(
      `SELECT p.slug FROM subscriptions s JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
       ORDER BY s.created_at DESC LIMIT 1`,
      [session.userId]
    );
    const planSlug = sub?.slug || 'free';

    if (planSlug === 'free') {
      return NextResponse.json({
        success: false,
        error: 'Who Liked You is available on paid plans',
        data: { locked: true },
      }, { status: 403 });
    }

    // Determine limit
    let limit = 'ALL';
    if (planSlug === 'basic_49') limit = '10';

    const likers = await query(
      `SELECT 
        l.liker_id as "userId",
        p.name,
        EXTRACT(YEAR FROM AGE(p.dob))::int as age,
        u.is_verified as "isVerified",
        (SELECT pp.storage_url FROM profile_photos pp WHERE pp.user_id = p.user_id AND pp.is_primary = true LIMIT 1) as "primaryPhoto",
        l.created_at as "likedAt"
       FROM likes l
       JOIN users u ON u.id = l.liker_id
       JOIN profiles p ON p.user_id = l.liker_id
       WHERE l.liked_id = $1
         AND u.status = 'active'
         AND l.liker_id NOT IN (SELECT liked_id FROM likes WHERE liker_id = $1)
         AND l.liker_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $1)
       ORDER BY l.created_at DESC
       LIMIT ${limit}`,
      [session.userId]
    );

    const totalCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM likes l
       JOIN users u ON u.id = l.liker_id
       WHERE l.liked_id = $1 AND u.status = 'active'
         AND l.liker_id NOT IN (SELECT liked_id FROM likes WHERE liker_id = $1)
         AND l.liker_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $1)`,
      [session.userId]
    );

    return NextResponse.json({
      success: true,
      data: {
        profiles: likers.rows,
        total: parseInt(totalCount?.count || '0'),
        isLimited: planSlug === 'basic_49',
      },
    });
  } catch (error) {
    console.error('Who liked error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
