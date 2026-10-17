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
    const filePath = path.join(process.cwd(), "public", "uploads", "photos", safeFilename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Photo Not Found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Determine MIME type
    let contentType = "image/jpeg";
    const ext = path.extname(safeFilename).toLowerCase();
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".svg") contentType = "image/svg+xml";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error serving uploaded photo:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
