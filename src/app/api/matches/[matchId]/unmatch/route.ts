import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne, transaction } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;

    // Verify the match belongs to this user
    const match = await queryOne<{ id: string }>(
      `SELECT id FROM matches 
       WHERE id = $1 AND (user1_id = $2 OR user2_id = $2) AND status = 'active'`,
      [matchId, session.userId]
    );

    if (!match) {
      return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
    }

    await transaction(async (client) => {
      // Update match status
      await client.query(
        `UPDATE matches SET status = 'unmatched', unmatched_at = NOW(), unmatched_by = $1 WHERE id = $2`,
        [session.userId, matchId]
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unmatch error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
