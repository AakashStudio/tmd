import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;

    const event = await queryOne(
      `SELECT 
        e.*,
        p.name as "organizerName",
        u.is_verified as "organizerVerified",
        (SELECT COUNT(*)::int FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'approved') as "attendeeCount",
        (SELECT ea.status FROM event_attendees ea WHERE ea.event_id = e.id AND ea.user_id = $2) as "myAttendeeStatus"
       FROM events e
       JOIN users u ON u.id = e.organizer_id
       JOIN profiles p ON p.user_id = e.organizer_id
       WHERE e.id = $1`,
      [eventId, session.userId]
    );

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}

// PATCH - Update event (organizer only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;

    // Verify ownership
    const event = await queryOne<{ organizer_id: string }>(
      'SELECT organizer_id FROM events WHERE id = $1',
      [eventId]
    );
    if (!event || event.organizer_id !== session.userId) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields: Record<string, string> = {
      title: 'title', description: 'description', category: 'category',
      eventDate: 'event_date', startTime: 'start_time', endTime: 'end_time',
      venueName: 'venue_name', address: 'address', latitude: 'latitude',
      longitude: 'longitude', capacity: 'capacity', entryFee: 'entry_fee_inr',
      attendanceMode: 'attendance_mode', status: 'status',
    };

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, dbField] of Object.entries(allowedFields)) {
      if (body[key] !== undefined) {
        updates.push(`${dbField} = $${idx}`);
        values.push(body[key]);
        idx++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    values.push(eventId);
    const updated = await queryOne(
      `UPDATE events SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id, title, status`,
      values
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
