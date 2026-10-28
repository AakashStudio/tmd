import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;

    // Security check to avoid path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), "public", "uploads", "audio", safeFilename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Audio Not Found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Determine MIME type
    let contentType = "audio/webm";
    const ext = path.extname(safeFilename).toLowerCase();
    if (ext === ".mp3") contentType = "audio/mpeg";
    else if (ext === ".mp4" || ext === ".m4a") contentType = "audio/mp4";
    else if (ext === ".ogg") contentType = "audio/ogg";
    else if (ext === ".wav") contentType = "audio/wav";
    else if (ext === ".webm") contentType = "audio/webm";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error serving uploaded audio:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
