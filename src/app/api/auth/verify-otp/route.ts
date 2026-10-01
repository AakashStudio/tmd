import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/auth/otp';
import { createSession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = await verifyOtp(phone, otp);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await queryOne<{ id: string; role: string; status: string }>(
      'SELECT id, role, status FROM users WHERE phone = $1',
      [phone]
    );

    let needsOnboarding = false;

    if (!user) {
      // Create new user
      user = await queryOne<{ id: string; role: string; status: string }>(
        `INSERT INTO users (phone, status, role) VALUES ($1, 'active', 'user') RETURNING id, role, status`,
        [phone]
      );

      // Create auth identity
      await query(
        `INSERT INTO auth_identities (user_id, provider, provider_id) VALUES ($1, 'phone', $2)`,
        [user!.id, phone]
      );

      needsOnboarding = true;
    } else {
      // Check if user is banned/suspended
      if (user.status === 'banned') {
        return NextResponse.json(
          { success: false, error: 'This account has been banned.' },
          { status: 403 }
        );
      }
      if (user.status === 'suspended') {
        return NextResponse.json(
          { success: false, error: 'This account has been suspended.' },
          { status: 403 }
        );
      }

      // Check if profile exists
      const profile = await queryOne(
        'SELECT id FROM profiles WHERE user_id = $1',
        [user.id]
      );
      needsOnboarding = !profile;
    }

    // Update last active
    await query(
      'UPDATE users SET last_active_at = NOW(), updated_at = NOW() WHERE id = $1',
      [user!.id]
    );

    // Create session
    await createSession(user!.id, user!.role as 'user' | 'admin');

    return NextResponse.json({
      success: true,
      data: {
        userId: user!.id,
        needsOnboarding,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
