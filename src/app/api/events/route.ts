import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db';

// Helper to check Pro access
async function checkProAccess(userId: string): Promise<boolean> {
  const sub = await queryOne<{ slug: string }>(
    `SELECT p.slug FROM subscriptions s JOIN plans p ON s.plan_id = p.id
     WHERE s.user_id = $1 AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
     ORDER BY s.created_at DESC LIMIT 1`,
    [userId]
  );
  return sub?.slug === 'pro_499';
}

// GET /api/events - List events
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check Pro access
    const isPro = await checkProAccess(session.userId);
    if (!isPro) {
      return NextResponse.json({
        success: false,
        error: 'Events are available with Pro.',
        data: { locked: true, requiredPlan: 'pro_499' },
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseInt(searchParams.get('radius') || '50'); // km
    const category = searchParams.get('category');

    let categoryFilter = '';
    const params: any[] = [];
    let paramIdx = 1;

    if (category && category !== 'all') {
      categoryFilter = `AND e.category = $${paramIdx}`;
      params.push(category);
      paramIdx++;
    }

    const events = await query(
      `SELECT 
        e.id,
        e.title,
        e.description,
        e.category,
        e.cover_image_path as "coverImage",
        e.event_date as "eventDate",
        e.start_time as "startTime",
        e.end_time as "endTime",
        e.venue_name as "venueName",
        e.address,
        e.latitude,
        e.longitude,
        e.min_age as "minAge",
        e.max_age as "maxAge",
        e.event_type as "eventType",
        e.capacity,
        e.entry_fee_inr as "entryFee",
        e.attendance_mode as "attendanceMode",
        e.status,
        e.created_at as "createdAt",
        p.name as "organizerName",
        u.is_verified as "organizerVerified",
        (SELECT COUNT(*)::int FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'approved') as "attendeeCount"
       FROM events e
       JOIN users u ON u.id = e.organizer_id
       JOIN profiles p ON p.user_id = e.organizer_id
       WHERE e.status = 'published'
         AND e.event_date >= CURRENT_DATE
         ${categoryFilter}
       ORDER BY e.event_date ASC, e.start_time ASC
       LIMIT 100`,
      params
    );

    return NextResponse.json({ success: true, data: events.rows });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}

// POST /api/events - Create event
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check Pro access
    const isPro = await checkProAccess(session.userId);
    if (!isPro) {
      return NextResponse.json({ success: false, error: 'Event creation requires Pro plan' }, { status: 403 });
    }

    // Check organizer verification
    const orgVerification = await queryOne<{ status: string }>(
      `SELECT status FROM organizer_verifications WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
      [session.userId]
    );

    // For now, allow Pro users to create events even without full organizer verification
    // but log it
    if (!orgVerification || orgVerification.status !== 'approved') {
      // Auto-create pending verification for Pro users
      if (!orgVerification) {
        await query(
          `INSERT INTO organizer_verifications (user_id, status, submitted_at) VALUES ($1, 'pending', NOW())`,
          [session.userId]
        );
      }
    }

    const body = await request.json();
    const {
      title, description, category, eventDate, startTime, endTime,
      venueName, address, latitude, longitude, minAge, maxAge,
      eventType, capacity, entryFee, attendanceMode
    } = body;

    // Validate required fields
    if (!title || !description || !category || !eventDate || !startTime || !venueName || !address) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Validate category
    const validCategories = ['house_party', 'standup', 'music', 'sports', 'dinner', 'networking', 'workshop', 'game_night', 'meetup', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ success: false, error: 'Invalid category' }, { status: 400 });
    }

    // Validate event date is in the future
    if (new Date(eventDate) < new Date(new Date().toDateString())) {
      return NextResponse.json({ success: false, error: 'Event date must be in the future' }, { status: 400 });
    }

    const event = await queryOne(
      `INSERT INTO events (
        organizer_id, title, description, category, event_date, start_time, end_time,
        venue_name, address, latitude, longitude, min_age, max_age,
        event_type, capacity, entry_fee_inr, attendance_mode, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'published')
      RETURNING id, title, event_date as "eventDate", status`,
      [
        session.userId, title.trim(), description.trim(), category,
        eventDate, startTime, endTime || null,
        venueName.trim(), address.trim(),
        latitude || null, longitude || null,
        minAge || null, maxAge || null,
        eventType || 'public', capacity || 50,
        entryFee || null, attendanceMode || 'open'
      ]
    );

    // Auto-add organizer as attendee
    await query(
      `INSERT INTO event_attendees (event_id, user_id, status) VALUES ($1, $2, 'approved')`,
      [event!.id, session.userId]
    );

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
