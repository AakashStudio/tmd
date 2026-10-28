import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);

function detectValidImage(buffer: Buffer): { valid: boolean; ext: string; mime: string } {
  if (buffer.length < 12) return { valid: false, ext: "", mime: "" };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, ext: "jpg", mime: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, ext: "png", mime: "image/png" };
  }

  // GIF: GIF87a or GIF89a (47 49 46 38)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { valid: true, ext: "gif", mime: "image/gif" };
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, ext: "webp", mime: "image/webp" };
  }

  // HEIC: ftypheic / ftypmif1
  const brand = buffer.toString("ascii", 4, 12);
  if (brand.startsWith("ftyp") && (brand.includes("heic") || brand.includes("mif1"))) {
    return { valid: true, ext: "heic", mime: "image/heic" };
  }

  return { valid: false, ext: "", mime: "" };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

      // Handle audio / voice note upload
      const isAudio =
        file.type.startsWith("audio/") ||
        file.name.endsWith(".webm") ||
        file.name.endsWith(".mp3") ||
        file.name.endsWith(".m4a") ||
        file.name.endsWith(".ogg") ||
        file.name.endsWith(".wav") ||
        formData.get("type") === "audio";

      if (isAudio) {
        const audioDir = path.join(process.cwd(), "public", "uploads", "audio");
        if (!fs.existsSync(audioDir)) {
          fs.mkdirSync(audioDir, { recursive: true });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        let ext = "webm";
        if (file.type.includes("mp3") || file.name.endsWith(".mp3")) ext = "mp3";
        else if (file.type.includes("mp4") || file.type.includes("m4a") || file.name.endsWith(".m4a")) ext = "m4a";
        else if (file.type.includes("ogg") || file.name.endsWith(".ogg")) ext = "ogg";
        else if (file.type.includes("wav") || file.name.endsWith(".wav")) ext = "wav";

        const uniqueFilename = `voice_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${ext}`;
        const filePath = path.join(audioDir, uniqueFilename);
        fs.writeFileSync(filePath, buffer);

        const publicUrl = `/uploads/audio/${uniqueFilename}`;
        return NextResponse.json({
          success: true,
          url: publicUrl,
          filename: uniqueFilename,
        });
      }

      // Explicit MIME check
      if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
        return NextResponse.json(
          { error: "Invalid file type. Only JPEG, PNG, WebP, GIF, and HEIC images are allowed." },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Deep binary magic bytes inspection
      const imageInspection = detectValidImage(buffer);
      if (!imageInspection.valid) {
        return NextResponse.json(
          { error: "File content is not a valid image format." },
          { status: 400 }
        );
      }

      // MIME and binary signature consistency check
      if (file.type && file.type.toLowerCase() !== imageInspection.mime) {
        return NextResponse.json(
          {
            error: `MIME type mismatch: declared '${file.type}' does not match inspected format '${imageInspection.mime}'.`,
          },
          { status: 400 }
        );
      }

      const ext = imageInspection.ext;
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
      let declaredMime: string | null = null;

      if (matches && matches.length === 3) {
        declaredMime = matches[1].toLowerCase();
        if (!ALLOWED_MIME_TYPES.has(declaredMime)) {
          return NextResponse.json(
            { error: "Invalid image format. Allowed formats: JPEG, PNG, WebP, GIF, HEIC." },
            { status: 400 }
          );
        }
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(base64, "base64");
      }

      // Check max size (15MB)
      if (buffer.length > 15 * 1024 * 1024) {
        return NextResponse.json({ error: "File exceeds 15MB size limit" }, { status: 400 });
      }

      const imageInspection = detectValidImage(buffer);
      if (!imageInspection.valid) {
        return NextResponse.json(
          { error: "File content is not a valid image format." },
          { status: 400 }
        );
      }

      if (declaredMime && declaredMime !== imageInspection.mime) {
        return NextResponse.json(
          {
            error: `MIME type mismatch: declared '${declaredMime}' does not match inspected format '${imageInspection.mime}'.`,
          },
          { status: 400 }
        );
      }

      const ext = imageInspection.ext;
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
