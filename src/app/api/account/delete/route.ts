import { NextResponse } from 'next/server';
import { verifySession, destroySession } from '@/lib/auth/session';
import { query, transaction } from '@/lib/db';

export async function POST() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await transaction(async (client) => {
      // Mark user as deleted
      await client.query(
        `UPDATE users SET status = 'deleted', deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [session.userId]
      );

      // Hide profile from discovery
      await client.query(
        `UPDATE profiles SET is_discoverable = false, updated_at = NOW() WHERE user_id = $1`,
        [session.userId]
      );

      // Expire active subscriptions
      await client.query(
        `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW() WHERE user_id = $1 AND status = 'active'`,
        [session.userId]
      );

      // Unmatch all active matches
      await client.query(
        `UPDATE matches SET status = 'unmatched', unmatched_at = NOW() 
         WHERE (user1_id = $1 OR user2_id = $1) AND status = 'active'`,
        [session.userId]
      );
    });

    await destroySession();

    return NextResponse.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
