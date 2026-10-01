import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;

    // Verify access
    const conv = await queryOne(
      `SELECT c.id FROM conversations c
       JOIN matches m ON m.id = c.match_id
       WHERE c.id = $1 AND (m.user1_id = $2 OR m.user2_id = $2)`,
      [conversationId, session.userId]
    );
    if (!conv) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    await query(
      `UPDATE messages SET status = 'read', read_at = NOW()
       WHERE conversation_id = $1 AND sender_id != $2 AND status != 'read'`,
      [conversationId, session.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Read error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
