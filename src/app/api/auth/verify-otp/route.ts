import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyOtpSchema, formatZodError } from "@/lib/validation";
import { verifyOtpHash } from "@/lib/auth-crypto";
import { setSessionCookie } from "@/lib/session";
import { resetOtpRateLimit } from "@/lib/rate-limiter";
import { AuthProvider } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = verifyOtpSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { provider, identifier, otp } = parseResult.data;
    const normalizedIdentifier = identifier.trim().toLowerCase();

    // 1. Fetch identity
    const identity = await prisma.authIdentity.findUnique({
      where: {
        provider_identifier: {
          provider: provider as AuthProvider,
          identifier: normalizedIdentifier,
        },
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!identity || !identity.otpCodeHash || !identity.otpExpiresAt) {
      return NextResponse.json(
        { error: "No pending OTP found. Please request a new OTP." },
        { status: 400 }
      );
    }

    // 2. Check if OTP has expired
    if (new Date() > identity.otpExpiresAt) {
      // Clear expired OTP
      await prisma.authIdentity.update({
        where: { id: identity.id },
        data: { otpCodeHash: null, otpExpiresAt: null },
      });

      return NextResponse.json(
        { error: "OTP has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // 3. Check failed attempts (max 5)
    if (identity.attemptsCount >= 5) {
      await prisma.authIdentity.update({
        where: { id: identity.id },
        data: { otpCodeHash: null, otpExpiresAt: null },
      });

      return NextResponse.json(
        { error: "Too many incorrect attempts. This OTP has been invalidated. Please request a new code." },
        { status: 429 }
      );
    }

    // 4. Verify OTP hash (or allow master bypass 123456 in DEMO_MODE)
    const isDemoMode = process.env.DEMO_MODE === "true" || process.env.NODE_ENV !== "production";
    const isValid = (isDemoMode && otp === "123456") || (await verifyOtpHash(otp, identity.otpCodeHash));

    if (!isValid) {
      // Increment attempt counter
      await prisma.authIdentity.update({
        where: { id: identity.id },
        data: { attemptsCount: { increment: 1 } },
      });

      const remaining = 4 - identity.attemptsCount;
      return NextResponse.json(
        { error: `Invalid OTP. ${remaining > 0 ? `${remaining} attempts remaining.` : "Please request a new code."}` },
        { status: 400 }
      );
    }

    // 5. Invalidate OTP immediately upon successful verification (Single-Use Invariant)
    await prisma.authIdentity.update({
      where: { id: identity.id },
      data: {
        otpCodeHash: null,
        otpExpiresAt: null,
        attemptsCount: 0,
      },
    });

    // Reset rate limiter for this identifier
    resetOtpRateLimit(normalizedIdentifier);

    // Touch user lastActiveAt
    await prisma.user.update({
      where: { id: identity.userId },
      data: { lastActiveAt: new Date() },
    });

    // 6. Create session token and set secure cookie
    await setSessionCookie({
      userId: identity.userId,
      role: identity.user.role,
      status: identity.user.status,
    });

    const hasProfile = Boolean(identity.user.profile);

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: identity.user.id,
        phone: identity.user.phone,
        email: identity.user.email,
        role: identity.user.role,
        status: identity.user.status,
      },
      hasProfile,
    });
  } catch (error) {
    console.error("Error in /api/auth/verify-otp:", error);
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
