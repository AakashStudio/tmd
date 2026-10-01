import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'photos');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check current photo count
    const countResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM profile_photos WHERE user_id = $1',
      [session.userId]
    );
    const currentCount = parseInt(countResult?.count || '0');

    const formData = await request.formData();
    const files = formData.getAll('photos') as File[];

    if (!files.length) {
      return NextResponse.json({ success: false, error: 'No photos provided' }, { status: 400 });
    }

    if (currentCount + files.length > 6) {
      return NextResponse.json({ success: false, error: 'Maximum 6 photos allowed' }, { status: 400 });
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    const photos = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ success: false, error: `Invalid file type: ${file.type}` }, { status: 400 });
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: 'File too large (max 10MB)' }, { status: 400 });
      }

      // Generate unique filename
      const ext = file.type.split('/')[1];
      const filename = `${session.userId}_${randomUUID()}.${ext}`;
      const filepath = join(UPLOAD_DIR, filename);

      // Write file
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);

      const position = currentCount + i + 1;
      const isPrimary = currentCount === 0 && i === 0;

      // Insert into DB
      const photo = await queryOne(
        `INSERT INTO profile_photos (user_id, storage_path, storage_url, position, is_primary, moderation_status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING id, storage_url as url, position, is_primary`,
        [session.userId, filepath, `/api/media/photos/${filename}`, position, isPrimary]
      );

      photos.push(photo);
    }

    return NextResponse.json({ success: true, data: photos }, { status: 201 });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload photos' }, { status: 500 });
  }
}

// DELETE individual photo
export async function DELETE(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('id');

    if (!photoId) {
      return NextResponse.json({ success: false, error: 'Photo ID required' }, { status: 400 });
    }

    // Verify ownership
    const photo = await queryOne<{ id: string; is_primary: boolean }>(
      'SELECT id, is_primary FROM profile_photos WHERE id = $1 AND user_id = $2',
      [photoId, session.userId]
    );

    if (!photo) {
      return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 });
    }

    // Check minimum photo count
    const countResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM profile_photos WHERE user_id = $1',
      [session.userId]
    );
    if (parseInt(countResult?.count || '0') <= 1) {
      return NextResponse.json({ success: false, error: 'Must have at least 1 photo' }, { status: 400 });
    }

    // Delete photo
    await query('DELETE FROM profile_photos WHERE id = $1', [photoId]);

    // If was primary, make the first remaining photo primary
    if (photo.is_primary) {
      await query(
        `UPDATE profile_photos SET is_primary = true 
         WHERE user_id = $1 AND id = (
           SELECT id FROM profile_photos WHERE user_id = $1 ORDER BY position LIMIT 1
         )`,
        [session.userId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete photo error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
