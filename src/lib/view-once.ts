import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { config } from "./config";

const SECRET_KEY = new TextEncoder().encode(config.auth.sessionSecret);

export interface ViewOnceAccessClaim {
  mediaId: string;
  recipientUserId: string;
  scope: "VIEW_ONCE_STREAM";
}

/**
 * Calculates unopened media expiration timestamp based on configurable retention hours.
 */
export function calculateUnopenedExpiryDate(
  now: Date = new Date(),
  expiryHours: number = config.viewOnce.unopenedExpiryHours
): Date {
  return new Date(now.getTime() + expiryHours * 60 * 60 * 1000);
}

/**
 * Generates a short-lived, single-use signed token for streaming View Once media.
 * The TTL is configurable via VIEW_ONCE_TOKEN_TTL_SECONDS (default 60 seconds).
 */
export async function createViewOnceStreamToken(
  mediaId: string,
  recipientUserId: string,
  ttlSeconds: number = config.viewOnce.tokenTtlSeconds
): Promise<string> {
  const nonce = crypto.randomBytes(16).toString("hex");

  return new SignJWT({
    mediaId,
    recipientUserId,
    scope: "VIEW_ONCE_STREAM",
    nonce,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(SECRET_KEY);
}

/**
 * Verifies a View Once stream claim token. Returns payload or null if expired/tampered.
 */
export async function verifyViewOnceStreamToken(
  token: string
): Promise<ViewOnceAccessClaim | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });

    if (payload.scope !== "VIEW_ONCE_STREAM") {
      return null;
    }

    return {
      mediaId: payload.mediaId as string,
      recipientUserId: payload.recipientUserId as string,
      scope: "VIEW_ONCE_STREAM",
    };
  } catch {
    return null;
  }
}
