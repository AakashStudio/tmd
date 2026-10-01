import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportedUserId, reportedEventId, reportedMessageId, reportType, reason, description } = body;

    // Validate
    const validTypes = ['profile', 'photo', 'chat', 'event', 'organizer', 'attendee'];
    const validReasons = ['fake_profile', 'ai_image', 'others_photo', 'harassment', 'scam', 'spam', 'inappropriate_photo', 'underage', 'other'];

    if (!reportType || !validTypes.includes(reportType)) {
      return NextResponse.json({ success: false, error: 'Invalid report type' }, { status: 400 });
    }
    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json({ success: false, error: 'Invalid reason' }, { status: 400 });
    }

    const report = await queryOne(
      `INSERT INTO reports (reporter_id, reported_user_id, reported_event_id, reported_message_id, report_type, reason, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id`,
      [session.userId, reportedUserId || null, reportedEventId || null, reportedMessageId || null, reportType, reason, description || null]
    );

    return NextResponse.json({ success: true, data: { id: report!.id, message: 'Report submitted' } }, { status: 201 });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
