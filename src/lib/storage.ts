import fs from "fs/promises";
import path from "path";
import { config } from "./config";

/**
 * Storage security boundary:
 * 
 * Media files (both Profile Photos and View Once media) are stored OUTSIDE the Next.js `public/` directory.
 * They are stored under `MEDIA_STORAGE_PATH` (default: `./storage/private_media`).
 * 
 * Invariants:
 * - No direct static HTTP access exists for these assets.
 * - All media reads must route through authenticated, authorized streaming handlers.
 * - View Once media requires an active, unredeemed ViewOnceAccessClaim token.
 */

export function getPrivateStoragePath(
  subfolder: "profile_photos" | "view_once",
  filename: string
): string {
  // Prevent directory traversal attacks
  const safeFilename = path.basename(filename);
  return path.resolve(config.storage.mediaPath, subfolder, safeFilename);
}

export async function savePrivateMedia(
  data: Buffer,
  subfolder: "profile_photos" | "view_once",
  filename: string
): Promise<string> {
  const dirPath = path.resolve(config.storage.mediaPath, subfolder);
  await fs.mkdir(dirPath, { recursive: true });
  const filePath = getPrivateStoragePath(subfolder, filename);
  await fs.writeFile(filePath, data);
  return `${subfolder}/${path.basename(filename)}`;
}

export async function readPrivateMedia(
  subfolder: "profile_photos" | "view_once",
  filename: string
): Promise<Buffer | null> {
  try {
    const filePath = getPrivateStoragePath(subfolder, filename);
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

export async function deletePrivateMedia(
  subfolder: "profile_photos" | "view_once",
  filename: string
): Promise<void> {
  try {
    const filePath = getPrivateStoragePath(subfolder, filename);
    await fs.unlink(filePath);
  } catch {
    // Ignore if already deleted
  }
}
