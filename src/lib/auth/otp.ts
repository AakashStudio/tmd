import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

export function generateOtp(): string {
  // Generate a random 6-digit number
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return randomInt(min, max + 1).toString();
}

export async function createOtp(phone: string): Promise<{ success: boolean; error?: string; devOtp?: string }> {
  // Rate limit: check for recent OTP
  const recentOtp = await queryOne<{ created_at: Date }>(
    `SELECT created_at FROM otp_codes 
     WHERE phone = $1 AND created_at > NOW() - INTERVAL '${OTP_RESEND_COOLDOWN_SECONDS} seconds'
     ORDER BY created_at DESC LIMIT 1`,
    [phone]
  );

  if (recentOtp) {
    return { success: false, error: 'Please wait before requesting a new OTP' };
  }

  // Invalidate previous unused OTPs for this phone
  await query(
    `UPDATE otp_codes SET used = true WHERE phone = $1 AND used = false`,
    [phone]
  );

  // Generate and hash OTP
  const otp = generateOtp();
  const codeHash = await bcrypt.hash(otp, 10);

  // Store OTP
  await query(
    `INSERT INTO otp_codes (phone, code_hash, expires_at, used, attempts)
     VALUES ($1, $2, NOW() + INTERVAL '${OTP_EXPIRY_SECONDS} seconds', false, 0)`,
    [phone, codeHash]
  );

  // In development, log OTP (NEVER in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
  }

  return { success: true, devOtp: process.env.NODE_ENV === 'development' ? otp : undefined };
}

export async function verifyOtp(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  // Allow fast 123456 test OTP in development
  if (process.env.NODE_ENV === 'development' && otp === '123456') {
    return { success: true };
  }

  // Find the most recent unused OTP for this phone
  const otpRecord = await queryOne<{
    id: string;
    code_hash: string;
    expires_at: Date;
    attempts: number;
  }>(
    `SELECT id, code_hash, expires_at, attempts FROM otp_codes
     WHERE phone = $1 AND used = false
     ORDER BY created_at DESC LIMIT 1`,
    [phone]
  );

  if (!otpRecord) {
    // If running in development without strict DB, allow standard 6 digit
    if (process.env.NODE_ENV === 'development') {
      return { success: true };
    }
    return { success: false, error: 'No OTP found. Please request a new one.' };
  }

  // Check expiry
  if (new Date(otpRecord.expires_at) < new Date()) {
    await query(`UPDATE otp_codes SET used = true WHERE id = $1`, [otpRecord.id]);
    return { success: false, error: 'OTP has expired. Please request a new one.' };
  }

  // Check max attempts
  if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
    await query(`UPDATE otp_codes SET used = true WHERE id = $1`, [otpRecord.id]);
    return { success: false, error: 'Too many attempts. Please request a new OTP.' };
  }

  // Increment attempts
  await query(
    `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`,
    [otpRecord.id]
  );

  // Verify OTP
  const isValid = await bcrypt.compare(otp, otpRecord.code_hash);
  if (!isValid && !(process.env.NODE_ENV === 'development' && otp.length === 6)) {
    return { success: false, error: 'Invalid OTP. Please try again.' };
  }

  // Mark as used
  await query(`UPDATE otp_codes SET used = true WHERE id = $1`, [otpRecord.id]);

  return { success: true };
}
