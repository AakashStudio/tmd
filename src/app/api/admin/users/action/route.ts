import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { queryOne, query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const admin = await queryOne<{ role: string }>(
      'SELECT role FROM admin_users WHERE user_id = $1',
      [session.userId]
    );
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Not admin' }, { status: 403 });
    }

    const { userId, action, reason } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    const validActions = ['activate', 'suspend', 'ban', 'unban', 'verify', 'unverify'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    let newStatus: string | null = null;
    switch (action) {
      case 'activate': case 'unban': newStatus = 'active'; break;
      case 'suspend': newStatus = 'suspended'; break;
      case 'ban': newStatus = 'banned'; break;
    }

    if (newStatus) {
      await query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2', [newStatus, userId]);
      if (newStatus === 'banned' || newStatus === 'suspended') {
        await query('UPDATE profiles SET is_discoverable = false WHERE user_id = $1', [userId]);
      } else if (newStatus === 'active') {
        await query('UPDATE profiles SET is_discoverable = true WHERE user_id = $1', [userId]);
      }
    }

    if (action === 'verify') {
      await query('UPDATE users SET is_verified = true WHERE id = $1', [userId]);
    } else if (action === 'unverify') {
      await query('UPDATE users SET is_verified = false WHERE id = $1', [userId]);
    }

    // Audit log
    await query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, reason)
       VALUES ($1, $2, 'user', $3, $4)`,
      [session.userId, action, userId, reason || null]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
