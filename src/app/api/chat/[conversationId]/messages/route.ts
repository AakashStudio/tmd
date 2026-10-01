import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db';

// GET messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const before = searchParams.get('before');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Verify user is part of this conversation
    const conv = await queryOne(
      `SELECT c.id FROM conversations c
       JOIN matches m ON m.id = c.match_id
       WHERE c.id = $1 AND (m.user1_id = $2 OR m.user2_id = $2) AND m.status = 'active'`,
      [conversationId, session.userId]
    );
    if (!conv) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    let messagesQuery = `
      SELECT 
        msg.id,
        msg.conversation_id as "conversationId",
        msg.sender_id as "senderId",
        msg.content,
        msg.message_type as "messageType",
        msg.status,
        msg.created_at as "createdAt",
        msg.delivered_at as "deliveredAt",
        msg.read_at as "readAt",
        CASE WHEN msg.message_type = 'view_once_photo' THEN
          json_build_object(
            'id', mm.id,
            'isViewOnce', mm.is_view_once,
            'viewedAt', mm.viewed_at,
            'expiresAt', mm.expires_at
          )
        ELSE NULL END as media
      FROM messages msg
      LEFT JOIN message_media mm ON mm.message_id = msg.id
      WHERE msg.conversation_id = $1
    `;
    const queryParams: any[] = [conversationId];

    if (before) {
      messagesQuery += ` AND msg.created_at < $2`;
      queryParams.push(before);
    }

    messagesQuery += ` ORDER BY msg.created_at DESC LIMIT ${limit}`;

    const messages = await query(messagesQuery, queryParams);

    // Mark incoming messages as delivered
    await query(
      `UPDATE messages SET status = 'delivered', delivered_at = NOW()
       WHERE conversation_id = $1 AND sender_id != $2 AND status = 'sent'`,
      [conversationId, session.userId]
    );

    return NextResponse.json({
      success: true,
      data: messages.rows.reverse(), // chronological order
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}

// POST new message
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
    const body = await request.json();
    const { content, messageType = 'text' } = body;

    if (messageType === 'text' && (!content || content.trim().length === 0)) {
      return NextResponse.json({ success: false, error: 'Message content required' }, { status: 400 });
    }

    if (content && content.length > 5000) {
      return NextResponse.json({ success: false, error: 'Message too long' }, { status: 400 });
    }

    // Verify user is part of this conversation and match is active
    const conv = await queryOne<{ id: string; match_id: string }>(
      `SELECT c.id, c.match_id FROM conversations c
       JOIN matches m ON m.id = c.match_id
       WHERE c.id = $1 AND (m.user1_id = $2 OR m.user2_id = $2) AND m.status = 'active'`,
      [conversationId, session.userId]
    );
    if (!conv) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    // Check blocks
    const match = await queryOne<{ user1_id: string; user2_id: string }>(
      'SELECT user1_id, user2_id FROM matches WHERE id = $1',
      [conv.match_id]
    );
    const otherUserId = match!.user1_id === session.userId ? match!.user2_id : match!.user1_id;
    
    const blocked = await queryOne(
      'SELECT id FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
      [session.userId, otherUserId]
    );
    if (blocked) {
      return NextResponse.json({ success: false, error: 'Cannot send message' }, { status: 403 });
    }

    // Insert message
    const message = await queryOne(
      `INSERT INTO messages (conversation_id, sender_id, content, message_type, status)
       VALUES ($1, $2, $3, $4, 'sent')
       RETURNING id, conversation_id as "conversationId", sender_id as "senderId", content, 
         message_type as "messageType", status, created_at as "createdAt"`,
      [conversationId, session.userId, content?.trim(), messageType]
    );

    // Update conversation
    await query(
      'UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1',
      [conversationId]
    );

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
