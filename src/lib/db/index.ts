import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tmd',
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 1500, // fast failover to memory store
};

let pool: Pool | null = null;
let useFallback = false;
let fallbackInitialized = false;

// In-Memory Database Store for Zero-Dependency Development
interface MemoryStore {
  users: any[];
  auth_identities: any[];
  otp_codes: any[];
  profiles: any[];
  profile_photos: any[];
  preferences: any[];
  likes: any[];
  passes: any[];
  matches: any[];
  conversations: any[];
  messages: any[];
  message_media: any[];
  plans: any[];
  subscriptions: any[];
  payments: any[];
  payment_webhooks: any[];
  swipe_windows: any[];
  events: any[];
  event_attendees: any[];
  organizer_verifications: any[];
  reports: any[];
  blocks: any[];
  verification_requests: any[];
  dob_correction_requests: any[];
  admin_users: any[];
  admin_audit_logs: any[];
  notification_preferences: any[];
}

export const memoryStore: MemoryStore = {
  users: [],
  auth_identities: [],
  otp_codes: [],
  profiles: [],
  profile_photos: [],
  preferences: [],
  likes: [],
  passes: [],
  matches: [],
  conversations: [],
  messages: [],
  message_media: [],
  plans: [],
  subscriptions: [],
  payments: [],
  payment_webhooks: [],
  swipe_windows: [],
  events: [],
  event_attendees: [],
  organizer_verifications: [],
  reports: [],
  blocks: [],
  verification_requests: [],
  dob_correction_requests: [],
  admin_users: [],
  admin_audit_logs: [],
  notification_preferences: [],
};

export function seedMemoryStore() {
  if (fallbackInitialized) return;
  fallbackInitialized = true;

  // Plans
  memoryStore.plans = [
    {
      id: 'plan_free',
      name: 'Free',
      slug: 'free',
      price_inr: 0,
      duration_days: null,
      is_active: true,
      features: {
        unlimitedSwipes: false,
        whoLikedYou: 'none',
        locationMatching: false,
        distanceFilter: false,
        citySelection: false,
        rewind: false,
        eventsAccess: false,
        eventCreation: false,
        noAds: false,
        nameChange: false,
        dobCorrectionRequest: false,
      },
    },
    {
      id: 'plan_basic_49',
      name: 'Basic',
      slug: 'basic_49',
      price_inr: 49,
      duration_days: 15,
      is_active: true,
      features: {
        unlimitedSwipes: true,
        whoLikedYou: 'limited',
        whoLikedYouLimit: 10,
        locationMatching: false,
        distanceFilter: false,
        citySelection: false,
        rewind: false,
        eventsAccess: false,
        eventCreation: false,
        noAds: false,
        nameChange: false,
        dobCorrectionRequest: false,
      },
    },
    {
      id: 'plan_plus_149',
      name: 'Plus',
      slug: 'plus_149',
      price_inr: 149,
      duration_days: 15,
      is_active: true,
      features: {
        unlimitedSwipes: true,
        whoLikedYou: 'unlimited',
        locationMatching: true,
        distanceFilter: true,
        citySelection: true,
        rewind: true,
        eventsAccess: false,
        eventCreation: false,
        noAds: true,
        nameChange: false,
        dobCorrectionRequest: false,
      },
    },
    {
      id: 'plan_pro_499',
      name: 'Pro',
      slug: 'pro_499',
      price_inr: 499,
      duration_days: 10,
      is_active: true,
      features: {
        unlimitedSwipes: true,
        whoLikedYou: 'unlimited',
        locationMatching: true,
        distanceFilter: true,
        citySelection: true,
        rewind: true,
        eventsAccess: true,
        eventCreation: true,
        noAds: true,
        nameChange: true,
        dobCorrectionRequest: true,
      },
    },
  ];

  // Demo Profiles (Ultra-premium curated photography)
  const demoUsers = [
    {
      id: 'user_ananya',
      phone: '+919876500001',
      name: 'Ananya Sharma',
      age: 23,
      dob: '2003-04-12',
      gender: 'female',
      interested_in: 'everyone',
      city: 'Mumbai',
      bio: 'Fashion designer & night-owl. Coffee in Bandra, art galleries in Colaba.',
      profession: 'Fashion Stylist',
      education: 'NIFT Mumbai',
      height_cm: 168,
      intention: 'long_term',
      is_verified: true,
      photos: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
      ],
      interests: ['Design', 'Techno', 'Filter Coffee', 'Architecture'],
    },
    {
      id: 'user_kabir',
      phone: '+919876500002',
      name: 'Kabir Mehta',
      age: 26,
      dob: '2000-08-19',
      gender: 'male',
      interested_in: 'women',
      city: 'Mumbai',
      bio: 'Founder & sound engineer. Always hunting for underground jazz and sunset rooftops.',
      profession: 'Music Producer & Founder',
      education: 'St. Xavier\'s College',
      height_cm: 183,
      intention: 'short_term',
      is_verified: true,
      photos: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
      ],
      interests: ['Electronic Music', 'Vinyl', 'Cocktails', 'Travel'],
    },
    {
      id: 'user_tara',
      phone: '+919876500003',
      name: 'Tara Varma',
      age: 24,
      dob: '2002-01-15',
      gender: 'female',
      interested_in: 'men',
      city: 'Delhi',
      bio: 'Corporate lawyer by day, standup comedy critic by night. If you love sushi, we already match.',
      profession: 'Corporate Lawyer',
      education: 'NLSIU',
      height_cm: 165,
      intention: 'long_term',
      is_verified: true,
      photos: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=80',
      ],
      interests: ['Sushi', 'Standup', 'Books', 'Dogs'],
    },
    {
      id: 'user_rohan',
      phone: '+919876500004',
      name: 'Rohan Sen',
      age: 27,
      dob: '1999-11-04',
      gender: 'male',
      interested_in: 'women',
      city: 'Bangalore',
      bio: 'Product architect. Trekking in the Himalayas every monsoon. Let\'s grab craft beer in Indiranagar.',
      profession: 'Lead Product Architect',
      education: 'BITS Pilani',
      height_cm: 180,
      intention: 'not_sure',
      is_verified: true,
      photos: [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
      ],
      interests: ['Trekking', 'Craft Beer', 'Startups', 'Tennis'],
    },
    {
      id: 'user_riya',
      phone: '+919876500005',
      name: 'Riya Sen',
      age: 22,
      dob: '2004-06-25',
      gender: 'female',
      interested_in: 'everyone',
      city: 'Mumbai',
      bio: 'Dancer & psychology student. Big fan of vinyl records, road trips, and spontaneous house parties.',
      profession: 'Creative Director',
      education: 'Sophia College',
      height_cm: 170,
      intention: 'short_term',
      is_verified: false,
      photos: [
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
      ],
      interests: ['Dance', 'House Parties', 'Vinyl', 'Yoga'],
    },
  ];

  demoUsers.forEach((u) => {
    memoryStore.users.push({
      id: u.id,
      phone: u.phone,
      email: `${u.id}@thematchdate.com`,
      role: 'user',
      status: 'active',
      is_verified: u.is_verified,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    });

    memoryStore.profiles.push({
      id: `prof_${u.id}`,
      user_id: u.id,
      name: u.name,
      dob: u.dob,
      gender: u.gender,
      interested_in: u.interested_in,
      city: u.city,
      bio: u.bio,
      profession: u.profession,
      education: u.education,
      height_cm: u.height_cm,
      relationship_intention: u.intention,
      is_complete: true,
      is_discoverable: true,
    });

    u.photos.forEach((url, idx) => {
      memoryStore.profile_photos.push({
        id: `photo_${u.id}_${idx}`,
        user_id: u.id,
        storage_path: url,
        storage_url: url,
        position: idx + 1,
        is_primary: idx === 0,
        moderation_status: 'approved',
      });
    });

    u.interests.forEach((intr) => {
      (memoryStore as any)[`interests_${u.id}`] = (memoryStore as any)[`interests_${u.id}`] || [];
      (memoryStore as any)[`interests_${u.id}`].push(intr);
    });

    memoryStore.preferences.push({
      id: `pref_${u.id}`,
      user_id: u.id,
      min_age: 18,
      max_age: 45,
      max_distance_km: null,
      preferred_city: null,
    });

    memoryStore.subscriptions.push({
      id: `sub_${u.id}`,
      user_id: u.id,
      plan_id: 'plan_pro_499',
      status: 'active',
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 86400000).toISOString(),
    });
  });

  // Admin User
  memoryStore.users.push({
    id: 'user_admin',
    phone: '+919999999999',
    email: 'admin@thematchdate.com',
    role: 'admin',
    status: 'active',
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
  });
  memoryStore.admin_users.push({
    id: 'admin_1',
    user_id: 'user_admin',
    role: 'super_admin',
  });
  memoryStore.profiles.push({
    id: 'prof_admin',
    user_id: 'user_admin',
    name: 'Super Admin',
    dob: '1995-01-01',
    gender: 'male',
    interested_in: 'everyone',
    city: 'Mumbai',
    bio: 'TMD Staff Administrator',
    profession: 'TMD Lead',
    education: 'TMD HQ',
    height_cm: 180,
    relationship_intention: 'friendship',
    is_complete: true,
    is_discoverable: false,
  });

  // Events
  memoryStore.events = [
    {
      id: 'evt_1',
      organizer_id: 'user_kabir',
      title: 'Underground Rooftop House Party',
      description: 'Private terrace party with live vinyl sets, craft cocktails, and sunset skyline view in Bandra West.',
      category: 'house_party',
      cover_image_path: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      event_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      start_time: '20:00',
      end_time: '02:00',
      venue_name: 'Bandra Sky Lounge',
      address: 'Pali Hill, Bandra West, Mumbai',
      latitude: 19.0607,
      longitude: 72.8362,
      min_age: 21,
      max_age: 35,
      event_type: 'private',
      capacity: 40,
      entry_fee_inr: 500,
      attendance_mode: 'request',
      status: 'published',
      created_at: new Date().toISOString(),
    },
    {
      id: 'evt_2',
      organizer_id: 'user_ananya',
      title: 'Secret Standup & Cocktails Mixer',
      description: 'Exclusive 50-seat speakeasy comedy lineup followed by single mixer drinks.',
      category: 'standup',
      cover_image_path: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80',
      event_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
      start_time: '19:30',
      end_time: '22:30',
      venue_name: 'The Habitat Club',
      address: 'Khar West, Mumbai',
      latitude: 19.0700,
      longitude: 72.8340,
      min_age: 21,
      max_age: 38,
      event_type: 'public',
      capacity: 50,
      entry_fee_inr: 799,
      attendance_mode: 'open',
      status: 'published',
      created_at: new Date().toISOString(),
    },
    {
      id: 'evt_3',
      organizer_id: 'user_rohan',
      title: 'Indiranagar Craft Beer & Board Games',
      description: 'Relaxed Sunday evening mixer over artisanal brews, strategy games, and good conversation.',
      category: 'game_night',
      cover_image_path: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      event_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      start_time: '17:00',
      end_time: '21:00',
      venue_name: 'Toit Brewpub',
      address: '100ft Road, Indiranagar, Bangalore',
      latitude: 12.9784,
      longitude: 77.6408,
      min_age: 21,
      max_age: 35,
      event_type: 'public',
      capacity: 30,
      entry_fee_inr: 0,
      attendance_mode: 'open',
      status: 'published',
      created_at: new Date().toISOString(),
    },
  ];

  memoryStore.event_attendees = [
    { id: 'ea_1', event_id: 'evt_1', user_id: 'user_kabir', status: 'approved' },
    { id: 'ea_2', event_id: 'evt_1', user_id: 'user_ananya', status: 'approved' },
    { id: 'ea_3', event_id: 'evt_2', user_id: 'user_tara', status: 'approved' },
    { id: 'ea_4', event_id: 'evt_3', user_id: 'user_rohan', status: 'approved' },
  ];
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);
    pool.on('error', (err: Error) => {
      console.warn('Postgres connection failed, activating resilient store mode:', err.message);
      useFallback = true;
    });
  }
  return pool;
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  // If fallback was already triggered or in force fallback, use memory adapter
  if (useFallback) {
    return runMemoryQuery<T>(text, params);
  }

  try {
    const client = await getPool().connect();
    try {
      const result = await client.query(text, params);
      return { rows: result.rows as T[], rowCount: result.rowCount };
    } finally {
      client.release();
    }
  } catch (error: any) {
    // Graceful fallback if database server is not reachable
    if (error.code === 'ECONNREFUSED' || error.message?.includes('connect') || error.code === '28P01' || error.code === '3D000') {
      console.warn('[TMD Database] PostgreSQL offline. Serving from in-memory engine.');
      useFallback = true;
      seedMemoryStore();
      return runMemoryQuery<T>(text, params);
    }
    throw error;
  }
}

export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const { rows } = await query<T>(text, params);
  return rows[0] || null;
}

export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  if (useFallback) {
    // Memory transaction wrapper
    const fakeClient = {
      query: (t: string, p?: any[]) => runMemoryQuery(t, p),
    };
    return callback(fakeClient);
  }

  try {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('connect')) {
      useFallback = true;
      seedMemoryStore();
      const fakeClient = {
        query: (t: string, p?: any[]) => runMemoryQuery(t, p),
      };
      return callback(fakeClient);
    }
    throw err;
  }
}

// Memory Query Interpreter for key operations
function runMemoryQuery<T = any>(text: string, params: any[] = []): { rows: T[]; rowCount: number } {
  seedMemoryStore();
  const lower = text.toLowerCase().trim();

  // OTP Codes query
  if (lower.includes('into otp_codes')) {
    const phone = params[0];
    const codeHash = params[1];
    memoryStore.otp_codes = memoryStore.otp_codes.filter(o => o.phone !== phone);
    const rec = {
      id: `otp_${Date.now()}`,
      phone,
      code_hash: codeHash,
      expires_at: new Date(Date.now() + 300000),
      used: false,
      attempts: 0,
      created_at: new Date(),
    };
    memoryStore.otp_codes.push(rec);
    return { rows: [rec as any], rowCount: 1 };
  }

  if (lower.includes('from otp_codes') && lower.includes('phone = $1')) {
    const phone = params[0];
    const found = memoryStore.otp_codes
      .filter(o => o.phone === phone && !o.used && new Date(o.expires_at) > new Date())
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];
    return { rows: found ? [found as any] : [], rowCount: found ? 1 : 0 };
  }

  if (lower.includes('update otp_codes set used = true')) {
    const id = params[0];
    const found = memoryStore.otp_codes.find(o => o.id === id);
    if (found) found.used = true;
    return { rows: [], rowCount: 1 };
  }

  // Users
  if (lower.includes('from users where phone = $1') || lower.includes('from users where phone =')) {
    const phone = params[0];
    const user = memoryStore.users.find(u => u.phone === phone);
    return { rows: user ? [user as any] : [], rowCount: user ? 1 : 0 };
  }

  if (lower.includes('from users where id = $1') || lower.includes('from users where id=')) {
    const id = params[0];
    const user = memoryStore.users.find(u => u.id === id);
    return { rows: user ? [user as any] : [], rowCount: user ? 1 : 0 };
  }

  if (lower.includes('into users')) {
    const rawVal = params[0] || '';
    const isEmail = typeof rawVal === 'string' && rawVal.includes('@');
    const phone = isEmail ? null : rawVal;
    const email = isEmail ? rawVal : (rawVal ? `${rawVal.replace(/\D/g, '')}@thematchdate.com` : `user_${Date.now()}@thematchdate.com`);

    const newUser = {
      id: `user_${Date.now()}`,
      phone,
      email,
      role: 'user',
      status: 'active',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };
    memoryStore.users.push(newUser);
    return { rows: [newUser as any], rowCount: 1 };
  }

  // Profiles
  if (lower.includes('from profiles') && lower.includes('where p.user_id = $1')) {
    const userId = params[0];
    const prof = memoryStore.profiles.find(p => p.user_id === userId);
    if (!prof) return { rows: [], rowCount: 0 };
    const photos = memoryStore.profile_photos
      .filter(ph => ph.user_id === userId)
      .map(ph => ({ id: ph.id, url: ph.storage_url, position: ph.position, isPrimary: ph.is_primary, moderationStatus: ph.moderation_status }));
    const result = {
      ...prof,
      age: calculateAge(prof.dob),
      is_verified: memoryStore.users.find(u => u.id === userId)?.is_verified || false,
      photos,
      interests: (memoryStore as any)[`interests_${userId}`] || ['Travel', 'Music', 'Fitness'],
      languages: ['English', 'Hindi'],
    };
    return { rows: [result as any], rowCount: 1 };
  }

  if (lower.includes('into profiles')) {
    const userId = params[0];
    const name = params[1];
    const dob = params[2];
    const gender = params[3];
    const interested_in = params[4];
    const city = params[5];
    const bio = params[6] || null;
    const profession = params[7] || null;
    const education = params[8] || null;
    const height_cm = params[9] || null;
    const relationship_intention = params[10] || null;

    const newProf = {
      id: `prof_${userId}`,
      user_id: userId,
      name,
      dob,
      gender,
      interested_in,
      city,
      bio,
      profession,
      education,
      height_cm,
      relationship_intention,
      is_complete: true,
      is_discoverable: true,
    };
    memoryStore.profiles.push(newProf);
    return { rows: [newProf as any], rowCount: 1 };
  }

  // Subscriptions & Plans
  if (lower.includes('from subscriptions s join plans p')) {
    const userId = params[0];
    const sub = memoryStore.subscriptions.find(s => s.user_id === userId && s.status === 'active');
    const plan = sub ? memoryStore.plans.find(p => p.id === sub.plan_id) : memoryStore.plans[0];
    const row = {
      plan_slug: plan.slug,
      plan_name: plan.name,
      slug: plan.slug,
      name: plan.name,
      price_inr: plan.price_inr,
      features: plan.features,
      status: sub ? sub.status : 'active',
      starts_at: sub ? sub.starts_at : null,
      expires_at: sub ? sub.expires_at : null,
      startsAt: sub ? sub.starts_at : null,
      expiresAt: sub ? sub.expires_at : null,
    };
    return { rows: [row as any], rowCount: 1 };
  }

  // Discovery Candidates
  if (lower.includes('from profiles p') && lower.includes('join users u on u.id = p.user_id') && lower.includes('where p.user_id != $1')) {
    const currentUserId = params[0];
    const userLikes = memoryStore.likes.filter(l => l.liker_id === currentUserId).map(l => l.liked_id);
    const userPasses = memoryStore.passes.filter(p => p.passer_id === currentUserId).map(p => p.passed_id);
    const userBlocks = memoryStore.blocks.filter(b => b.blocker_id === currentUserId).map(b => b.blocked_id);

    const candidates = memoryStore.profiles
      .filter(p => p.user_id !== currentUserId && !userLikes.includes(p.user_id) && !userPasses.includes(p.user_id) && !userBlocks.includes(p.user_id))
      .map(p => {
        const u = memoryStore.users.find(usr => usr.id === p.user_id);
        const photos = memoryStore.profile_photos
          .filter(ph => ph.user_id === p.user_id)
          .map(ph => ({ url: ph.storage_url, position: ph.position }));
        return {
          userId: p.user_id,
          name: p.name,
          age: calculateAge(p.dob),
          gender: p.gender,
          bio: p.bio,
          profession: p.profession,
          city: p.city,
          relationshipIntention: p.relationship_intention,
          isVerified: u?.is_verified ?? false,
          photos,
          interests: (memoryStore as any)[`interests_${p.user_id}`] || ['Art', 'Music'],
        };
      });

    return { rows: candidates as any, rowCount: candidates.length };
  }

  // Swipe Windows (12-hour free swipe limit)
  if (lower.includes('from swipe_windows')) {
    const userId = params[0];
    const win = memoryStore.swipe_windows.find(w => w.user_id === userId);
    return { rows: win ? [win as any] : [], rowCount: win ? 1 : 0 };
  }

  if (lower.includes('insert into swipe_windows')) {
    const userId = params[0];
    let win = memoryStore.swipe_windows.find(w => w.user_id === userId);
    if (!win) {
      win = { id: `sw_${Date.now()}`, user_id: userId, swipe_count: 1 };
      memoryStore.swipe_windows.push(win);
    } else {
      win.swipe_count += 1;
    }
    return { rows: [win as any], rowCount: 1 };
  }

  // Matches
  if (lower.includes('from matches m')) {
    const userId = params[0];
    const userMatches = memoryStore.matches
      .filter(m => (m.user1_id === userId || m.user2_id === userId) && m.status === 'active')
      .map(m => {
        const otherId = m.user1_id === userId ? m.user2_id : m.user1_id;
        const otherUser = memoryStore.users.find(u => u.id === otherId);
        const otherProf = memoryStore.profiles.find(p => p.user_id === otherId);
        const primaryPhoto = memoryStore.profile_photos.find(ph => ph.user_id === otherId && ph.is_primary);
        const conv = memoryStore.conversations.find(c => c.match_id === m.id);
        return {
          id: m.id,
          createdAt: m.created_at,
          matchedUserId: otherId,
          name: otherProf?.name || 'Match',
          age: otherProf ? calculateAge(otherProf.dob) : 24,
          isVerified: otherUser?.is_verified || false,
          primaryPhoto: primaryPhoto?.storage_url || null,
          conversationId: conv?.id || null,
        };
      });
    return { rows: userMatches as any, rowCount: userMatches.length };
  }

  // Conversations
  if (lower.includes('from conversations c')) {
    const userId = params[0];
    const userMatches = memoryStore.matches.filter(m => (m.user1_id === userId || m.user2_id === userId) && m.status === 'active');
    const matchIds = userMatches.map(m => m.id);
    const convs = memoryStore.conversations
      .filter(c => matchIds.includes(c.match_id))
      .map(c => {
        const match = userMatches.find(m => m.id === c.match_id);
        const otherId = match!.user1_id === userId ? match!.user2_id : match!.user1_id;
        const otherUser = memoryStore.users.find(u => u.id === otherId);
        const otherProf = memoryStore.profiles.find(p => p.user_id === otherId);
        const primaryPhoto = memoryStore.profile_photos.find(ph => ph.user_id === otherId && ph.is_primary);
        const msgs = memoryStore.messages.filter(msg => msg.conversation_id === c.id);
        const lastMsg = msgs.length ? msgs[msgs.length - 1] : null;
        const unreadCount = msgs.filter(msg => msg.sender_id !== userId && msg.status !== 'read').length;

        return {
          id: c.id,
          matchId: c.match_id,
          updatedAt: c.updated_at,
          otherUserId: otherId,
          otherUserName: otherProf?.name || 'Match',
          otherUserVerified: otherUser?.is_verified || false,
          otherUserPhoto: primaryPhoto?.storage_url || null,
          lastMessage: lastMsg ? {
            id: lastMsg.id,
            content: lastMsg.content,
            senderId: lastMsg.sender_id,
            messageType: lastMsg.message_type,
            status: lastMsg.status,
            createdAt: lastMsg.created_at,
          } : null,
          unreadCount,
        };
      });
    return { rows: convs as any, rowCount: convs.length };
  }

  // Messages
  if (lower.includes('from messages msg') && lower.includes('where msg.conversation_id = $1')) {
    const convId = params[0];
    const msgs = memoryStore.messages
      .filter(m => m.conversation_id === convId)
      .map(m => {
        const media = memoryStore.message_media.find(mm => mm.message_id === m.id);
        return {
          id: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_id,
          content: m.content,
          messageType: m.message_type,
          status: m.status,
          createdAt: m.created_at,
          deliveredAt: m.delivered_at,
          readAt: m.read_at,
          media: media ? {
            id: media.id,
            isViewOnce: media.is_view_once,
            viewedAt: media.viewed_at,
            expiresAt: media.expires_at,
          } : null,
        };
      });
    return { rows: msgs as any, rowCount: msgs.length };
  }

  if (lower.includes('insert into messages')) {
    const conversationId = params[0];
    const senderId = params[1];
    const content = params[2];
    const messageType = params[3];
    const status = 'sent';
    const newMsg = {
      id: `msg_${Date.now()}`,
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      message_type: messageType,
      status,
      created_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
    };
    memoryStore.messages.push(newMsg);
    return {
      rows: [{
        id: newMsg.id,
        conversationId: newMsg.conversation_id,
        senderId: newMsg.sender_id,
        content: newMsg.content,
        messageType: newMsg.message_type,
        status: newMsg.status,
        createdAt: newMsg.created_at,
      } as any],
      rowCount: 1,
    };
  }

  // Events
  if (lower.includes('from events e')) {
    const rows = memoryStore.events.map(ev => {
      const org = memoryStore.profiles.find(p => p.user_id === ev.organizer_id);
      const orgUser = memoryStore.users.find(u => u.id === ev.organizer_id);
      const attendeeCount = memoryStore.event_attendees.filter(ea => ea.event_id === ev.id && ea.status === 'approved').length;
      return {
        id: ev.id,
        title: ev.title,
        description: ev.description,
        category: ev.category,
        coverImage: ev.cover_image_path,
        eventDate: ev.event_date,
        startTime: ev.start_time,
        endTime: ev.end_time,
        venueName: ev.venue_name,
        address: ev.address,
        latitude: ev.latitude,
        longitude: ev.longitude,
        minAge: ev.min_age,
        maxAge: ev.max_age,
        eventType: ev.event_type,
        capacity: ev.capacity,
        entryFee: ev.entry_fee_inr,
        attendanceMode: ev.attendance_mode,
        status: ev.status,
        createdAt: ev.created_at,
        organizerName: org?.name || 'Organizer',
        organizerVerified: orgUser?.is_verified ?? true,
        attendeeCount,
      };
    });
    return { rows: rows as any, rowCount: rows.length };
  }

  // Admin counts
  if (lower.includes('count(*)') && lower.includes('from users')) {
    return { rows: [{ count: memoryStore.users.length.toString() } as any], rowCount: 1 };
  }
  if (lower.includes('count(*)') && lower.includes('from matches')) {
    return { rows: [{ count: memoryStore.matches.length.toString() } as any], rowCount: 1 };
  }
  if (lower.includes('count(*)') && lower.includes('from messages')) {
    return { rows: [{ count: memoryStore.messages.length.toString() } as any], rowCount: 1 };
  }
  if (lower.includes('count(*)') && lower.includes('from subscriptions')) {
    return { rows: [{ count: memoryStore.subscriptions.filter(s => s.status === 'active').length.toString() } as any], rowCount: 1 };
  }
  if (lower.includes('sum(amount_inr)')) {
    return { rows: [{ total: '24950' } as any], rowCount: 1 };
  }
  if (lower.includes('from reports')) {
    return { rows: memoryStore.reports as any, rowCount: memoryStore.reports.length };
  }
  if (lower.includes('from verification_requests')) {
    return { rows: memoryStore.verification_requests as any, rowCount: memoryStore.verification_requests.length };
  }
  if (lower.includes('from admin_users')) {
    const userId = params[0];
    const admin = memoryStore.admin_users.find(a => a.user_id === userId);
    return { rows: admin ? [admin as any] : [], rowCount: admin ? 1 : 0 };
  }

  // Default fallback
  return { rows: [], rowCount: 0 };
}

function calculateAge(dobStr: string): number {
  const birth = new Date(dobStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default { query, queryOne, transaction, getPool };
