import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const VERIFICATION_DIR = join(process.cwd(), 'uploads', 'verification');

// GET verification status
export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const verification = await queryOne(
      `SELECT id, status, submitted_at as "submittedAt", reviewed_at as "reviewedAt", notes
       FROM verification_requests WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
      [session.userId]
    );

    const user = await queryOne<{ is_verified: boolean }>(
      'SELECT is_verified FROM users WHERE id = $1',
      [session.userId]
    );

    return NextResponse.json({
      success: true,
      data: {
        isVerified: user?.is_verified || false,
        latestRequest: verification || null,
      },
    });
  } catch (error) {
    console.error('Verification status error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}

// POST submit verification selfie
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check for pending verification
    const pending = await queryOne(
      `SELECT id FROM verification_requests WHERE user_id = $1 AND status = 'pending'`,
      [session.userId]
    );
    if (pending) {
      return NextResponse.json({ success: false, error: 'Verification already pending' }, { status: 409 });
    }

    const formData = await request.formData();
    const selfie = formData.get('selfie') as File;

    if (!selfie) {
      return NextResponse.json({ success: false, error: 'Selfie required' }, { status: 400 });
    }

    await mkdir(VERIFICATION_DIR, { recursive: true });

    const ext = selfie.type.split('/')[1] || 'jpg';
    const filename = `verify_${session.userId}_${randomUUID()}.${ext}`;
    const filepath = join(VERIFICATION_DIR, filename);
    const buffer = Buffer.from(await selfie.arrayBuffer());
    await writeFile(filepath, buffer);

    const verification = await queryOne(
      `INSERT INTO verification_requests (user_id, selfie_path, status, submitted_at)
       VALUES ($1, $2, 'pending', NOW())
       RETURNING id, status`,
      [session.userId, filepath]
    );

    return NextResponse.json({ success: true, data: verification }, { status: 201 });
  } catch (error) {
    console.error('Verification submit error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
