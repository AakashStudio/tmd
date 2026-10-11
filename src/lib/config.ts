import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  APP_TIMEZONE: z.string().default("Asia/Kolkata"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),
  VIEW_ONCE_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  VIEW_ONCE_UNOPENED_EXPIRY_HOURS: z.coerce.number().int().positive().default(72),
  MEDIA_STORAGE_PATH: z.string().default("./storage/private_media"),
  RAZORPAY_KEY_ID: z.string().default("rzp_test_placeholder"),
  RAZORPAY_KEY_SECRET: z.string().default("placeholder_secret"),
  RAZORPAY_WEBHOOK_SECRET: z.string().default("placeholder_webhook"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const config = {
  db: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/tmd_db?schema=public",
  },
  app: {
    timezone: process.env.APP_TIMEZONE || "Asia/Kolkata",
    isProduction: process.env.NODE_ENV === "production",
    env: process.env.NODE_ENV || "development",
  },
  auth: {
    sessionSecret:
      process.env.SESSION_SECRET ||
      "tmd_development_session_secret_key_32_characters_minimum",
    cookieName: "tmd_session",
    sessionTtlSeconds: 60 * 60 * 24 * 30, // 30 days
  },
  viewOnce: {
    tokenTtlSeconds: Number(process.env.VIEW_ONCE_TOKEN_TTL_SECONDS) || 60,
    unopenedExpiryHours:
      Number(process.env.VIEW_ONCE_UNOPENED_EXPIRY_HOURS) || 72,
  },
  storage: {
    mediaPath: process.env.MEDIA_STORAGE_PATH || "./storage/private_media",
  },
  payments: {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
    razorpayWebhookSecret:
      process.env.RAZORPAY_WEBHOOK_SECRET || "placeholder_webhook",
  },
};

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.warn("⚠️ Warning: Environment configuration has missing/invalid values:", result.error.format());
  }
  return result.success;
}
