import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne, transaction } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: blockedUserId } = await request.json();

    if (!blockedUserId || blockedUserId === session.userId) {
      return NextResponse.json({ success: false, error: 'Invalid user' }, { status: 400 });
    }

    await transaction(async (client) => {
      // Create block
      await client.query(
        `INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [session.userId, blockedUserId]
      );

      // Unmatch if matched
      await client.query(
        `UPDATE matches SET status = 'unmatched', unmatched_at = NOW(), unmatched_by = $1
         WHERE status = 'active' AND (
           (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
         )`,
        [session.userId, blockedUserId]
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Block error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
