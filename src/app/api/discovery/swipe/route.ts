import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne, transaction } from '@/lib/db';

const FREE_SWIPE_LIMIT = 10;
const SWIPE_WINDOW_HOURS = 12;

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, action } = body;

    if (!targetUserId || !['like', 'pass'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid swipe action' }, { status: 400 });
    }

    // Don't allow self-swipe
    if (targetUserId === session.userId) {
      return NextResponse.json({ success: false, error: 'Cannot swipe on yourself' }, { status: 400 });
    }

    // Check target exists and is active
    const targetUser = await queryOne<{ status: string }>(
      'SELECT u.status FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = $1',
      [targetUserId]
    );
    if (!targetUser || targetUser.status !== 'active') {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check if blocked
    const blocked = await queryOne(
      'SELECT id FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
      [session.userId, targetUserId]
    );
    if (blocked) {
      return NextResponse.json({ success: false, error: 'Cannot interact with this user' }, { status: 403 });
    }

    // Check active subscription for swipe limit
    const sub = await queryOne<{ slug: string }>(
      `SELECT p.slug FROM subscriptions s JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
       ORDER BY s.created_at DESC LIMIT 1`,
      [session.userId]
    );
    const planSlug = sub?.slug || 'free';
    const hasUnlimitedSwipes = planSlug !== 'free';

    if (!hasUnlimitedSwipes) {
      // Enforce 12-hour window swipe limit
      const windowStart = getWindowStart();
      
      const window = await queryOne<{ swipe_count: number }>(
        `SELECT swipe_count FROM swipe_windows 
         WHERE user_id = $1 AND window_start = $2`,
        [session.userId, windowStart.toISOString()]
      );

      if (window && window.swipe_count >= FREE_SWIPE_LIMIT) {
        const windowEnd = new Date(windowStart.getTime() + SWIPE_WINDOW_HOURS * 60 * 60 * 1000);
        return NextResponse.json({
          success: false,
          error: 'Swipe limit reached',
          data: {
            limit: FREE_SWIPE_LIMIT,
            resetsAt: windowEnd.toISOString(),
          },
        }, { status: 429 });
      }

      // Increment swipe count
      await query(
        `INSERT INTO swipe_windows (user_id, window_start, swipe_count)
         VALUES ($1, $2, 1)
         ON CONFLICT (user_id, window_start) DO UPDATE SET swipe_count = swipe_windows.swipe_count + 1`,
        [session.userId, windowStart.toISOString()]
      );
    }

    let isMatch = false;
    let matchId: string | null = null;

    if (action === 'like') {
      // Check for duplicate
      const existingLike = await queryOne(
        'SELECT id FROM likes WHERE liker_id = $1 AND liked_id = $2',
        [session.userId, targetUserId]
      );
      if (!existingLike) {
        await query(
          'INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2)',
          [session.userId, targetUserId]
        );
      }

      // Check for mutual like (match)
      const mutualLike = await queryOne(
        'SELECT id FROM likes WHERE liker_id = $1 AND liked_id = $2',
        [targetUserId, session.userId]
      );

      if (mutualLike) {
        // Check if already matched
        const existingMatch = await queryOne(
          `SELECT id FROM matches 
           WHERE ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1))
           AND status = 'active'`,
          [session.userId, targetUserId]
        );

        if (!existingMatch) {
          // Create match and conversation
          const result = await transaction(async (client) => {
            const match = await client.query(
              `INSERT INTO matches (user1_id, user2_id, status) VALUES ($1, $2, 'active') RETURNING id`,
              [session.userId, targetUserId]
            );
            const newMatchId = match.rows[0].id;

            await client.query(
              'INSERT INTO conversations (match_id) VALUES ($1)',
              [newMatchId]
            );

            return newMatchId;
          });

          isMatch = true;
          matchId = result;
        }
      }
    } else {
      // Pass
      const existingPass = await queryOne(
        'SELECT id FROM passes WHERE passer_id = $1 AND passed_id = $2',
        [session.userId, targetUserId]
      );
      if (!existingPass) {
        await query(
          'INSERT INTO passes (passer_id, passed_id) VALUES ($1, $2)',
          [session.userId, targetUserId]
        );
      }
    }

    // Get remaining swipes for free users
    let remainingSwipes: number | null = null;
    if (!hasUnlimitedSwipes) {
      const windowStart = getWindowStart();
      const window = await queryOne<{ swipe_count: number }>(
        'SELECT swipe_count FROM swipe_windows WHERE user_id = $1 AND window_start = $2',
        [session.userId, windowStart.toISOString()]
      );
      remainingSwipes = FREE_SWIPE_LIMIT - (window?.swipe_count || 0);
    }

    // If match, get matched user info
    let matchedUser = null;
    if (isMatch) {
      matchedUser = await queryOne(
        `SELECT p.name, EXTRACT(YEAR FROM AGE(p.dob))::int as age, u.is_verified as "isVerified",
          (SELECT pp.storage_url FROM profile_photos pp WHERE pp.user_id = p.user_id AND pp.is_primary = true LIMIT 1) as "primaryPhoto"
         FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = $1`,
        [targetUserId]
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        action,
        isMatch,
        matchId,
        matchedUser,
        remainingSwipes,
      },
    });
  } catch (error) {
    console.error('Swipe error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}

// Calculate the start of the current 12-hour window
function getWindowStart(): Date {
  const now = new Date();
  const hours = now.getUTCHours();
  const windowHour = hours < 12 ? 0 : 12;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), windowHour, 0, 0, 0));
}
