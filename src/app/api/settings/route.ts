import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db';

// GET settings
export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [prefs, notifPrefs, blockedUsers] = await Promise.all([
      queryOne(
        'SELECT min_age, max_age, max_distance_km, preferred_city FROM preferences WHERE user_id = $1',
        [session.userId]
      ),
      queryOne(
        'SELECT matches, messages, likes, events, plans FROM notification_preferences WHERE user_id = $1',
        [session.userId]
      ),
      query(
        `SELECT b.id, b.blocked_id as "blockedUserId", p.name, b.created_at as "createdAt"
         FROM blocks b JOIN profiles p ON p.user_id = b.blocked_id
         WHERE b.blocker_id = $1 ORDER BY b.created_at DESC`,
        [session.userId]
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        preferences: prefs || { min_age: 18, max_age: 50, max_distance_km: null, preferred_city: null },
        notifications: notifPrefs || { matches: true, messages: true, likes: true, events: true, plans: true },
        blockedUsers: blockedUsers.rows,
      },
    });
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}

// PATCH update settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences, notifications } = body;

    if (preferences) {
      const { minAge, maxAge, maxDistanceKm, preferredCity } = preferences;

      // Check plan for distance/city features
      if (maxDistanceKm || preferredCity) {
        const sub = await queryOne<{ slug: string }>(
          `SELECT p.slug FROM subscriptions s JOIN plans p ON s.plan_id = p.id
           WHERE s.user_id = $1 AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
           ORDER BY s.created_at DESC LIMIT 1`,
          [session.userId]
        );
        const planSlug = sub?.slug || 'free';
        if (!['plus_149', 'pro_499'].includes(planSlug)) {
          return NextResponse.json({ success: false, error: 'This feature requires Plus or Pro plan' }, { status: 403 });
        }
      }

      await query(
        `INSERT INTO preferences (user_id, min_age, max_age, max_distance_km, preferred_city)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET
           min_age = COALESCE($2, preferences.min_age),
           max_age = COALESCE($3, preferences.max_age),
           max_distance_km = $4,
           preferred_city = $5,
           updated_at = NOW()`,
        [session.userId, minAge || 18, maxAge || 50, maxDistanceKm || null, preferredCity || null]
      );
    }

    if (notifications) {
      const { matches, messages, likes, events, plans } = notifications;
      await query(
        `INSERT INTO notification_preferences (user_id, matches, messages, likes, events, plans)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET
           matches = COALESCE($2, notification_preferences.matches),
           messages = COALESCE($3, notification_preferences.messages),
           likes = COALESCE($4, notification_preferences.likes),
           events = COALESCE($5, notification_preferences.events),
           plans = COALESCE($6, notification_preferences.plans)`,
        [session.userId, matches ?? true, messages ?? true, likes ?? true, events ?? true, plans ?? true]
      );
    }

    return NextResponse.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
