import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await query(
      `SELECT 
        c.id,
        c.match_id as "matchId",
        c.updated_at as "updatedAt",
        CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END as "otherUserId",
        p.name as "otherUserName",
        u.is_verified as "otherUserVerified",
        (SELECT pp.storage_url FROM profile_photos pp WHERE pp.user_id = p.user_id AND pp.is_primary = true LIMIT 1) as "otherUserPhoto",
        (
          SELECT json_build_object(
            'id', msg.id,
            'content', msg.content,
            'senderId', msg.sender_id,
            'messageType', msg.message_type,
            'status', msg.status,
            'createdAt', msg.created_at
          )
          FROM messages msg WHERE msg.conversation_id = c.id
          ORDER BY msg.created_at DESC LIMIT 1
        ) as "lastMessage",
        (
          SELECT COUNT(*)::int FROM messages msg 
          WHERE msg.conversation_id = c.id 
          AND msg.sender_id != $1 
          AND msg.status != 'read'
        ) as "unreadCount"
       FROM conversations c
       JOIN matches m ON m.id = c.match_id
       JOIN users u ON u.id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
       JOIN profiles p ON p.user_id = u.id
       WHERE (m.user1_id = $1 OR m.user2_id = $1)
         AND m.status = 'active'
         AND u.status = 'active'
       ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`,
      [session.userId]
    );

    return NextResponse.json({ success: true, data: conversations.rows });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
