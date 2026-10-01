import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { queryOne, query } from '@/lib/db';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mediaId } = await params;

    // Retrieve media record and verify ownership via message/conversation/match
    const media = await queryOne<{
      id: string;
      storage_path: string;
      media_type: string;
      is_view_once: boolean;
      viewed_at: string | null;
      expires_at: string | null;
      sender_id: string;
      user1_id: string;
      user2_id: string;
    }>(
      `SELECT mm.id, mm.storage_path, mm.media_type, mm.is_view_once, mm.viewed_at, mm.expires_at,
              m.sender_id, mat.user1_id, mat.user2_id
       FROM message_media mm
       JOIN messages m ON m.id = mm.message_id
       JOIN conversations c ON c.id = m.conversation_id
       JOIN matches mat ON mat.id = c.match_id
       WHERE mm.id = $1`,
      [mediaId]
    );

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Must be party to the match
    if (media.user1_id !== session.userId && media.user2_id !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only recipient can view a view-once photo
    if (media.sender_id === session.userId) {
      return NextResponse.json({ error: 'Sender cannot view self View Once media' }, { status: 403 });
    }

    // Check expiration
    if (media.expires_at && new Date(media.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Photo has expired' }, { status: 410 });
    }

    // If already viewed (allowing a small 10-second grace window during initial fetch)
    if (media.viewed_at) {
      const viewedTime = new Date(media.viewed_at).getTime();
      const elapsedSeconds = (Date.now() - viewedTime) / 1000;
      if (elapsedSeconds > 15) {
        return NextResponse.json({ error: 'Photo already opened and no longer accessible' }, { status: 410 });
      }
    } else {
      // Mark as viewed immediately on first access
      await query(`UPDATE message_media SET viewed_at = NOW() WHERE id = $1`, [mediaId]);
    }

    if (!existsSync(media.storage_path)) {
      return NextResponse.json({ error: 'Media file missing' }, { status: 404 });
    }

    const fileBuffer = await readFile(media.storage_path);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': media.media_type || 'image/jpeg',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Content-Disposition': 'inline',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Serve view-once photo error:', error);
    return NextResponse.json({ error: 'Failed to stream media' }, { status: 500 });
  }
}
