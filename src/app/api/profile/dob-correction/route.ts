import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { queryOne, query } from '@/lib/db';
import { calculateAge } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify Pro plan entitlement
    const sub = await queryOne<{ slug: string }>(
      `SELECT p.slug FROM subscriptions s JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
       ORDER BY s.created_at DESC LIMIT 1`,
      [session.userId]
    );

    if (sub?.slug !== 'pro_499') {
      return NextResponse.json({
        success: false,
        error: 'Requesting DOB correction is only available on the ₹499 Pro plan.',
      }, { status: 403 });
    }

    const { requestedDob, reason } = await request.json();

    if (!requestedDob) {
      return NextResponse.json({ success: false, error: 'Requested DOB is required' }, { status: 400 });
    }

    const newAge = calculateAge(requestedDob);
    if (newAge < 18) {
      return NextResponse.json({
        success: false,
        error: 'Requested date of birth cannot be under 18 years old.',
      }, { status: 400 });
    }

    // Check current profile DOB
    const profile = await queryOne<{ dob: string }>(
      'SELECT dob FROM profiles WHERE user_id = $1',
      [session.userId]
    );

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    // Check if there is already a pending request
    const pending = await queryOne(
      `SELECT id FROM dob_correction_requests WHERE user_id = $1 AND status = 'pending'`,
      [session.userId]
    );

    if (pending) {
      return NextResponse.json({
        success: false,
        error: 'You already have a pending DOB correction request.',
      }, { status: 409 });
    }

    const requestRecord = await queryOne(
      `INSERT INTO dob_correction_requests (user_id, current_dob, requested_dob, reason, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id, current_dob, requested_dob, status, created_at`,
      [session.userId, profile.dob, requestedDob, reason || 'User requested correction']
    );

    return NextResponse.json({
      success: true,
      message: 'DOB correction request submitted for admin verification.',
      data: requestRecord,
    }, { status: 201 });
  } catch (error) {
    console.error('DOB correction request error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
