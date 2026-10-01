import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const matches = await query(
      `SELECT 
        m.id,
        m.created_at as "createdAt",
        CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END as "matchedUserId",
        p.name,
        EXTRACT(YEAR FROM AGE(p.dob))::int as age,
        u.is_verified as "isVerified",
        (SELECT pp.storage_url FROM profile_photos pp WHERE pp.user_id = p.user_id AND pp.is_primary = true LIMIT 1) as "primaryPhoto",
        c.id as "conversationId"
       FROM matches m
       JOIN users u ON u.id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
       JOIN profiles p ON p.user_id = u.id
       LEFT JOIN conversations c ON c.match_id = m.id
       WHERE (m.user1_id = $1 OR m.user2_id = $1)
         AND m.status = 'active'
         AND u.status = 'active'
       ORDER BY m.created_at DESC`,
      [session.userId]
    );

    return NextResponse.json({ success: true, data: matches.rows });
  } catch (error) {
    console.error('Get matches error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
