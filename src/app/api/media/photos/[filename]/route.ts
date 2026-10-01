import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Sanitize filename to prevent directory traversal
    const safeFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '');
    const filepath = join(process.cwd(), 'uploads', 'photos', safeFilename);

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(filepath);
    const ext = safeFilename.split('.').pop()?.toLowerCase();

    let contentType = 'image/jpeg';
    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webp') contentType = 'image/webp';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (error) {
    console.error('Serve photo error:', error);
    return NextResponse.json({ error: 'Failed to load photo' }, { status: 500 });
  }
}
