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

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    // Determine MIME type
    let contentType = "audio/webm";
    const ext = path.extname(safeFilename).toLowerCase();
    if (ext === ".mp3") contentType = "audio/mpeg";
    else if (ext === ".mp4" || ext === ".m4a") contentType = "audio/mp4";
    else if (ext === ".ogg") contentType = "audio/ogg";
    else if (ext === ".wav") contentType = "audio/wav";
    else if (ext === ".webm") contentType = "audio/webm";

    const range = req.headers.get("range");

    if (range) {
      // Parse Range header (e.g. "bytes=0-1024" or "bytes=1024-")
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10) || 0;
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse(null, {
          status: 416, // Range Not Satisfiable
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      // Read chunk
      const fd = fs.openSync(filePath, "r");
      const buffer = Buffer.alloc(chunkSize);
      fs.readSync(fd, buffer, 0, chunkSize, start);
      fs.closeSync(fd);

      return new NextResponse(buffer, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Full file response
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Content-Length": fileSize.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error serving uploaded audio:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
