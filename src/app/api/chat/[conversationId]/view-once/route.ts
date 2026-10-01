import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne, transaction } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'view-once');
const VIEW_ONCE_EXPIRY_HOURS = 24;

// POST - Send View Once photo
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
    const conv = await queryOne<{ id: string; match_id: string }>(
      `SELECT c.id, c.match_id FROM conversations c
       JOIN matches m ON m.id = c.match_id
       WHERE c.id = $1 AND (m.user1_id = $2 OR m.user2_id = $2) AND m.status = 'active'`,
      [conversationId, session.userId]
    );
    if (!conv) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Photo required' }, { status: 400 });
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large' }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = file.type.split('/')[1];
    const filename = `vo_${randomUUID()}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const expiresAt = new Date(Date.now() + VIEW_ONCE_EXPIRY_HOURS * 60 * 60 * 1000);

    const result = await transaction(async (client) => {
      const msg = await client.query(
        `INSERT INTO messages (conversation_id, sender_id, content, message_type, status)
         VALUES ($1, $2, '[View Once Photo]', 'view_once_photo', 'sent')
         RETURNING id, conversation_id as "conversationId", sender_id as "senderId", 
           message_type as "messageType", status, created_at as "createdAt"`,
        [conversationId, session.userId]
      );

      const message = msg.rows[0];

      await client.query(
        `INSERT INTO message_media (message_id, storage_path, media_type, is_view_once, expires_at)
         VALUES ($1, $2, $3, true, $4)`,
        [message.id, filepath, file.type, expiresAt.toISOString()]
      );

      await client.query(
        'UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1',
        [conversationId]
      );

      return message;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('View once error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}

// PATCH - View the View Once photo (marks as viewed)
export async function PATCH(
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
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json({ success: false, error: 'Message ID required' }, { status: 400 });
    }

    // Get the message and verify it's a view_once in this conversation, sent to this user
    const msg = await queryOne<{ id: string; sender_id: string }>(
      `SELECT msg.id, msg.sender_id FROM messages msg
       WHERE msg.id = $1 AND msg.conversation_id = $2 AND msg.message_type = 'view_once_photo'`,
      [messageId, conversationId]
    );

    if (!msg) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    // Only the recipient can view
    if (msg.sender_id === session.userId) {
      return NextResponse.json({ success: false, error: 'Cannot view your own View Once photo' }, { status: 400 });
    }

    // Check if already viewed
    const media = await queryOne<{ id: string; viewed_at: string | null; expires_at: string; storage_path: string }>(
      'SELECT id, viewed_at, expires_at, storage_path FROM message_media WHERE message_id = $1 AND is_view_once = true',
      [messageId]
    );

    if (!media) {
      return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });
    }

    if (media.viewed_at) {
      return NextResponse.json({ success: false, error: 'Already viewed' }, { status: 410 });
    }

    if (new Date(media.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'Photo has expired' }, { status: 410 });
    }

    // Mark as viewed
    await query(
      'UPDATE message_media SET viewed_at = NOW() WHERE id = $1',
      [media.id]
    );

    // Return a temporary URL to view the photo
    // In production, this would be a signed URL with short expiry
    return NextResponse.json({
      success: true,
      data: {
        url: `/api/media/view-once/${media.id}`,
        expiresIn: 30, // seconds before this URL expires
      },
    });
  } catch (error) {
    console.error('View once view error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
