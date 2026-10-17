import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "photos");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const contentType = req.headers.get("content-type") || "";

    // 1. Handle multipart/form-data (File upload from device gallery/camera)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      // Check max size (15MB)
      if (file.size > 15 * 1024 * 1024) {
        return NextResponse.json({ error: "File exceeds 15MB size limit" }, { status: 400 });
      }

      // Determine extension
      let ext = "jpg";
      if (file.type === "image/png") ext = "png";
      else if (file.type === "image/webp") ext = "webp";
      else if (file.type === "image/gif") ext = "gif";
      else if (file.type === "image/heic") ext = "heic";

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uniqueFilename = `photo_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${ext}`;
      const filePath = path.join(uploadDir, uniqueFilename);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/photos/${uniqueFilename}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: uniqueFilename,
      });
    }

    // 2. Handle base64 JSON payload
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { base64, filename } = body;

      if (!base64 || typeof base64 !== "string") {
        return NextResponse.json({ error: "No base64 data provided" }, { status: 400 });
      }

      const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = "jpg";

      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes("png")) ext = "png";
        else if (mime.includes("webp")) ext = "webp";
        else if (mime.includes("gif")) ext = "gif";
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(base64, "base64");
      }

      const uniqueFilename = `photo_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${ext}`;
      const filePath = path.join(uploadDir, uniqueFilename);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/photos/${uniqueFilename}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: uniqueFilename,
      });
    }

    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in POST /api/upload:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload photo" },
      { status: 500 }
    );
  }
}
