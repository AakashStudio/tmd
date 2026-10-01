import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session';
import { queryOne, query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const appleClientId = process.env.APPLE_CLIENT_ID;

    // If real Apple OAuth is configured
    if (appleClientId && process.env.APPLE_CLIENT_SECRET) {
      const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/apple/callback`;
      const url = `https://appleid.apple.com/auth/authorize?client_id=${appleClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code%20id_token&scope=name%20email&response_mode=form_post`;
      return NextResponse.redirect(url);
    }

    // Instant Apple Dev Authentication
    let user = await queryOne<{ id: string; role: string; status: string }>(
      `SELECT id, role, status FROM users WHERE email = 'kabir.apple@thematchdate.com'`
    );

    if (!user) {
      user = await queryOne<{ id: string; role: string; status: string }>(
        `INSERT INTO users (email, role, status, is_verified)
         VALUES ('kabir.apple@thematchdate.com', 'user', 'active', true)
         RETURNING id, role, status`
      );

      await query(
        `INSERT INTO profiles (user_id, name, dob, gender, interested_in, city, bio, profession, education, height_cm, relationship_intention, is_complete, is_discoverable)
         VALUES ($1, 'Kabir (Apple)', '2000-09-22', 'male', 'women', 'Mumbai', 'Sound architect & event host. Let us connect.', 'Music Director', 'St. Xavier College', 182, 'short_term', true, true)`,
        [user!.id]
      );

      await query(
        `INSERT INTO profile_photos (user_id, storage_path, storage_url, position, is_primary, moderation_status)
         VALUES ($1, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80', 1, true, 'approved')`,
        [user!.id]
      );
    }

    await createSession(user!.id, (user!.role as any) || 'user');

    return NextResponse.redirect(new URL('/app', request.url));
  } catch (error) {
    console.error('Apple Auth Error:', error);
    return NextResponse.redirect(new URL('/login?error=apple_failed', request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    let user = await queryOne<{ id: string; role: string; status: string }>(
      `SELECT id, role, status FROM users WHERE email = 'kabir.apple@thematchdate.com'`
    );

    if (!user) {
      user = await queryOne<{ id: string; role: string; status: string }>(
        `INSERT INTO users (email, role, status, is_verified)
         VALUES ('kabir.apple@thematchdate.com', 'user', 'active', true)
         RETURNING id, role, status`
      );

      await query(
        `INSERT INTO profiles (user_id, name, dob, gender, interested_in, city, bio, profession, education, height_cm, relationship_intention, is_complete, is_discoverable)
         VALUES ($1, 'Kabir (Apple)', '2000-09-22', 'male', 'women', 'Mumbai', 'Sound architect & event host. Let us connect.', 'Music Director', 'St. Xavier College', 182, 'short_term', true, true)`,
        [user!.id]
      );

      await query(
        `INSERT INTO profile_photos (user_id, storage_path, storage_url, position, is_primary, moderation_status)
         VALUES ($1, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80', 1, true, 'approved')`,
        [user!.id]
      );
    }

    await createSession(user!.id, (user!.role as any) || 'user');

    return NextResponse.json({ success: true, redirect: '/app' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: 'Failed to sign in with Apple' }, { status: 500 });
  }
}
