import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session';
import { queryOne, query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { role = 'pro_499' } = await request.json();

    let userId = 'user_ananya';
    let userRole: 'user' | 'admin' = 'user';
    let targetRedirect = '/app';

    if (role === 'admin') {
      userId = 'user_admin';
      userRole = 'admin';
      targetRedirect = '/admin';
    } else if (role === 'kabir') {
      userId = 'user_kabir';
    } else if (role === 'tara') {
      userId = 'user_tara';
    } else if (role === 'rohan') {
      userId = 'user_rohan';
    }

    // Ensure session is set
    await createSession(userId, userRole);

    return NextResponse.json({
      success: true,
      redirect: targetRedirect,
      userId,
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json({ success: false, error: 'Demo login failed' }, { status: 500 });
  }
}
