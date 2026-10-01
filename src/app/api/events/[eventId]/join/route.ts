import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { queryOne, query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;

    // Check Pro
    const sub = await queryOne<{ slug: string }>(
      `SELECT p.slug FROM subscriptions s JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
       ORDER BY s.created_at DESC LIMIT 1`,
      [session.userId]
    );
    if (sub?.slug !== 'pro_499') {
      return NextResponse.json({ success: false, error: 'Events require Pro plan' }, { status: 403 });
    }

    // Get event
    const event = await queryOne<{
      id: string; capacity: number; attendance_mode: string; status: string;
      min_age: number | null; max_age: number | null;
    }>(
      `SELECT id, capacity, attendance_mode, status, min_age, max_age FROM events WHERE id = $1 AND status = 'published'`,
      [eventId]
    );
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    // Check capacity
    const attendeeCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM event_attendees WHERE event_id = $1 AND status = 'approved'`,
      [eventId]
    );
    if (parseInt(attendeeCount?.count || '0') >= event.capacity) {
      return NextResponse.json({ success: false, error: 'Event is full' }, { status: 400 });
    }

    // Check age restriction
    if (event.min_age || event.max_age) {
      const profile = await queryOne<{ dob: string }>(
        'SELECT dob FROM profiles WHERE user_id = $1',
        [session.userId]
      );
      if (profile) {
        const age = Math.floor((Date.now() - new Date(profile.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (event.min_age && age < event.min_age) {
          return NextResponse.json({ success: false, error: `Minimum age: ${event.min_age}` }, { status: 400 });
        }
        if (event.max_age && age > event.max_age) {
          return NextResponse.json({ success: false, error: `Maximum age: ${event.max_age}` }, { status: 400 });
        }
      }
    }

    // Check if already joined
    const existing = await queryOne(
      'SELECT id, status FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, session.userId]
    );
    if (existing) {
      return NextResponse.json({ success: false, error: 'Already joined or requested' }, { status: 409 });
    }

    // Determine status based on attendance mode
    const status = event.attendance_mode === 'open' ? 'approved' : 'pending';

    await query(
      `INSERT INTO event_attendees (event_id, user_id, status) VALUES ($1, $2, $3)`,
      [eventId, session.userId, status]
    );

    return NextResponse.json({
      success: true,
      data: {
        status,
        message: status === 'approved' ? 'You\'ve joined the event!' : 'Join request sent to organizer',
      },
    });
  } catch (error) {
    console.error('Join event error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
