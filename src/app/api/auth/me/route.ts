import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { queryOne } from '@/lib/db';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await queryOne<{
      id: string;
      phone: string;
      email: string;
      role: string;
      status: string;
      is_verified: boolean;
      created_at: string;
    }>(
      `SELECT id, phone, email, role, status, is_verified, created_at FROM users WHERE id = $1`,
      [session.userId]
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get profile
    const profile = await queryOne<{
      name: string;
      dob: string;
      gender: string;
      interested_in: string;
      bio: string;
      profession: string;
      city: string;
      is_complete: boolean;
    }>(
      `SELECT name, dob, gender, interested_in, bio, profession, city, is_complete FROM profiles WHERE user_id = $1`,
      [session.userId]
    );

    // Get active subscription
    const subscription = await queryOne<{
      plan_slug: string;
      plan_name: string;
      expires_at: string;
    }>(
      `SELECT p.slug as plan_slug, p.name as plan_name, s.expires_at
       FROM subscriptions s JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 AND s.status = 'active'
       AND (s.expires_at IS NULL OR s.expires_at > NOW())
       ORDER BY s.created_at DESC LIMIT 1`,
      [session.userId]
    );

    // Update last active
    await queryOne(
      'UPDATE users SET last_active_at = NOW() WHERE id = $1 RETURNING id',
      [session.userId]
    );

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status,
          isVerified: user.is_verified,
        },
        profile: profile ? {
          name: profile.name,
          dob: profile.dob,
          gender: profile.gender,
          interestedIn: profile.interested_in,
          bio: profile.bio,
          profession: profile.profession,
          city: profile.city,
          isComplete: profile.is_complete,
        } : null,
        subscription: subscription ? {
          planSlug: subscription.plan_slug,
          planName: subscription.plan_name,
          expiresAt: subscription.expires_at,
        } : { planSlug: 'free', planName: 'Free', expiresAt: null },
        needsOnboarding: !profile,
      },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
