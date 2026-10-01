import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db';
import { calculateAge, isAtLeast18 } from '@/lib/utils';

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await queryOne(
      `SELECT p.*, 
        EXTRACT(YEAR FROM AGE(p.dob))::int as age,
        u.is_verified,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', pp.id, 'url', pp.storage_url, 'position', pp.position, 
            'isPrimary', pp.is_primary, 'moderationStatus', pp.moderation_status
          ) ORDER BY pp.position) FROM profile_photos pp WHERE pp.user_id = p.user_id AND pp.moderation_status != 'rejected'),
          '[]'
        ) as photos,
        COALESCE((SELECT json_agg(ui.interest) FROM user_interests ui WHERE ui.user_id = p.user_id), '[]') as interests,
        COALESCE((SELECT json_agg(ul.language) FROM user_languages ul WHERE ul.user_id = p.user_id), '[]') as languages
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [session.userId]
    );

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}

// POST /api/profile - Create profile (during onboarding)
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if profile already exists
    const existing = await queryOne('SELECT id FROM profiles WHERE user_id = $1', [session.userId]);
    if (existing) {
      return NextResponse.json({ success: false, error: 'Profile already exists' }, { status: 409 });
    }

    const body = await request.json();
    const { name, dob, gender, interestedIn, city, bio, profession, education, heightCm, relationshipIntention } = body;

    // Validate required fields
    if (!name || !dob || !gender || !interestedIn || !city) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Validate name
    if (name.trim().length < 2 || name.trim().length > 50) {
      return NextResponse.json({ success: false, error: 'Name must be 2-50 characters' }, { status: 400 });
    }

    // Validate DOB - must be 18+
    if (!isAtLeast18(dob)) {
      return NextResponse.json({ success: false, error: 'You must be at least 18 years old' }, { status: 400 });
    }

    // Validate gender
    const validGenders = ['male', 'female', 'non_binary', 'other'];
    if (!validGenders.includes(gender)) {
      return NextResponse.json({ success: false, error: 'Invalid gender' }, { status: 400 });
    }

    // Validate interested in
    const validInterests = ['men', 'women', 'everyone'];
    if (!validInterests.includes(interestedIn)) {
      return NextResponse.json({ success: false, error: 'Invalid interest preference' }, { status: 400 });
    }

    // Validate relationship intention if provided
    const validIntentions = ['long_term', 'short_term', 'friendship', 'not_sure'];
    if (relationshipIntention && !validIntentions.includes(relationshipIntention)) {
      return NextResponse.json({ success: false, error: 'Invalid relationship intention' }, { status: 400 });
    }

    // Validate height
    if (heightCm && (heightCm < 100 || heightCm > 250)) {
      return NextResponse.json({ success: false, error: 'Invalid height' }, { status: 400 });
    }

    // Check if photos exist
    const photoCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM profile_photos WHERE user_id = $1',
      [session.userId]
    );

    const hasPhotos = photoCount && parseInt(photoCount.count) > 0;

    // Create profile
    const profile = await queryOne(
      `INSERT INTO profiles (user_id, name, dob, gender, interested_in, city, bio, profession, education, height_cm, relationship_intention, is_complete, is_discoverable)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
       RETURNING *`,
      [session.userId, name.trim(), dob, gender, interestedIn, city.trim(), bio || null, profession || null, education || null, heightCm || null, relationshipIntention || null, hasPhotos]
    );

    // Create default preferences
    await query(
      `INSERT INTO preferences (user_id, min_age, max_age) VALUES ($1, 18, 50)
       ON CONFLICT (user_id) DO NOTHING`,
      [session.userId]
    );

    // Create default notification preferences
    await query(
      `INSERT INTO notification_preferences (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [session.userId]
    );

    return NextResponse.json({ success: true, data: profile }, { status: 201 });
  } catch (error) {
    console.error('Create profile error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}

// PATCH /api/profile - Update profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const allowedFields = ['bio', 'profession', 'education', 'heightCm', 'city', 'interestedIn', 'relationshipIntention'];
    
    // Check plan for name change
    if (body.name !== undefined) {
      const sub = await queryOne<{ slug: string }>(
        `SELECT p.slug FROM subscriptions s JOIN plans p ON s.plan_id = p.id
         WHERE s.user_id = $1 AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
         ORDER BY s.created_at DESC LIMIT 1`,
        [session.userId]
      );
      const planSlug = sub?.slug || 'free';
      if (planSlug !== 'pro_499') {
        return NextResponse.json({ success: false, error: 'Name change requires Pro plan' }, { status: 403 });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      bio: 'bio', profession: 'profession', education: 'education',
      heightCm: 'height_cm', city: 'city', interestedIn: 'interested_in',
      relationshipIntention: 'relationship_intention', name: 'name',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (body[key] !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        values.push(body[key]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    values.push(session.userId);
    const profile = await queryOne(
      `UPDATE profiles SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
