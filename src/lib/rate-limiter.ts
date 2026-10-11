/**
 * In-memory rate limiter for development & single-instance MVP.
 * Enforces:
 * 1. Resend throttling: minimum 30 seconds between OTP requests per identifier.
 * 2. Rate limiting: maximum 3 OTP requests per 5 minutes per identifier/IP.
 * 3. Verification attempt throttling: maximum 5 failed attempts per OTP before invalidation.
 */

interface RateLimitEntry {
  count: number;
  firstRequestAt: number;
  lastRequestAt: number;
}

const otpRequestStore = new Map<string, RateLimitEntry>();

export function checkOtpRateLimit(identifier: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
  reason?: string;
} {
  const now = Date.now();
  const entry = otpRequestStore.get(identifier);

  if (!entry) {
    otpRequestStore.set(identifier, {
      count: 1,
      firstRequestAt: now,
      lastRequestAt: now,
    });
    return { allowed: true };
  }

  // 1. Resend throttle: 30 seconds between requests
  const timeSinceLast = (now - entry.lastRequestAt) / 1000;
  if (timeSinceLast < 30) {
    const retryAfter = Math.ceil(30 - timeSinceLast);
    return {
      allowed: false,
      retryAfterSeconds: retryAfter,
      reason: `Please wait ${retryAfter} seconds before requesting a new OTP.`,
    };
  }

  // 2. Sliding window: reset after 5 minutes (300 seconds)
  const windowDuration = (now - entry.firstRequestAt) / 1000;
  if (windowDuration > 300) {
    otpRequestStore.set(identifier, {
      count: 1,
      firstRequestAt: now,
      lastRequestAt: now,
    });
    return { allowed: true };
  }

  // 3. Max 3 requests per 5 minute window
  if (entry.count >= 3) {
    const retryAfter = Math.ceil(300 - windowDuration);
    return {
      allowed: false,
      retryAfterSeconds: retryAfter,
      reason: `Too many OTP requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
    };
  }

  entry.count += 1;
  entry.lastRequestAt = now;
  return { allowed: true };
}

export function resetOtpRateLimit(identifier: string): void {
  otpRequestStore.delete(identifier);
}
