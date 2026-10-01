import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile and preferences
    const profile = await queryOne<{
      gender: string;
      interested_in: string;
      city: string;
    }>(
      'SELECT gender, interested_in, city FROM profiles WHERE user_id = $1',
      [session.userId]
    );

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Complete your profile first' }, { status: 400 });
    }

    const prefs = await queryOne<{ min_age: number; max_age: number; max_distance_km: number; preferred_city: string }>(
      'SELECT min_age, max_age, max_distance_km, preferred_city FROM preferences WHERE user_id = $1',
      [session.userId]
    );

    // Get active subscription
    const sub = await queryOne<{ slug: string; features: any }>(
      `SELECT p.slug, p.features FROM subscriptions s JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
       ORDER BY s.created_at DESC LIMIT 1`,
      [session.userId]
    );

    // Build gender filter based on interested_in
    let genderFilter = '';
    if (profile.interested_in === 'men') {
      genderFilter = `AND p.gender = 'male'`;
    } else if (profile.interested_in === 'women') {
      genderFilter = `AND p.gender = 'female'`;
    }
    // 'everyone' = no gender filter

    // Reciprocal interest filter
    let reciprocalFilter = '';
    const myGenderForFilter = profile.gender === 'male' ? 'men' : profile.gender === 'female' ? 'women' : 'everyone';
    reciprocalFilter = `AND (p.interested_in = 'everyone' OR p.interested_in = '${myGenderForFilter}')`;

    // City filter (free/basic only match in same city)
    const planSlug = sub?.slug || 'free';
    const hasLocationMatching = ['plus_149', 'pro_499'].includes(planSlug);
    let cityFilter = '';
    if (!hasLocationMatching) {
      cityFilter = `AND p.city = $2`;
    }

    const ageMin = prefs?.min_age || 18;
    const ageMax = prefs?.max_age || 50;

    // Discovery query
    const params: any[] = [session.userId];
    if (!hasLocationMatching) params.push(profile.city);

    const candidates = await query(
      `SELECT 
        p.user_id as "userId",
        p.name,
        EXTRACT(YEAR FROM AGE(p.dob))::int as age,
        p.gender,
        p.bio,
        p.profession,
        p.city,
        p.relationship_intention as "relationshipIntention",
        u.is_verified as "isVerified",
        COALESCE(
          (SELECT json_agg(json_build_object(
            'url', pp.storage_url, 'position', pp.position
          ) ORDER BY pp.position) 
          FROM profile_photos pp 
          WHERE pp.user_id = p.user_id AND pp.moderation_status != 'rejected'),
          '[]'
        ) as photos,
        COALESCE((SELECT json_agg(ui.interest) FROM user_interests ui WHERE ui.user_id = p.user_id), '[]') as interests
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id != $1
         AND u.status = 'active'
         AND p.is_discoverable = true
         AND u.last_active_at > NOW() - INTERVAL '7 days'
         AND EXTRACT(YEAR FROM AGE(p.dob))::int >= ${ageMin}
         AND EXTRACT(YEAR FROM AGE(p.dob))::int <= ${ageMax}
         ${genderFilter}
         ${reciprocalFilter}
         ${cityFilter}
         AND p.user_id NOT IN (SELECT liked_id FROM likes WHERE liker_id = $1)
         AND p.user_id NOT IN (SELECT passed_id FROM passes WHERE passer_id = $1)
         AND p.user_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $1)
         AND p.user_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = $1)
         AND EXISTS (SELECT 1 FROM profile_photos pp WHERE pp.user_id = p.user_id AND pp.moderation_status != 'rejected')
       ORDER BY
         u.last_active_at DESC,
         p.is_complete DESC,
         u.created_at DESC
       LIMIT 20`,
      params
    );

    return NextResponse.json({
      success: true,
      data: candidates.rows,
    });
  } catch (error) {
    console.error('Discovery error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
