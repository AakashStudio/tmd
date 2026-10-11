import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOtpSchema, formatZodError } from "@/lib/validation";
import { generateNumericOtp, hashOtp } from "@/lib/auth-crypto";
import { checkOtpRateLimit } from "@/lib/rate-limiter";
import { config } from "@/lib/config";
import { AuthProvider } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = sendOtpSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { provider, identifier } = parseResult.data;
    const normalizedIdentifier = identifier.trim().toLowerCase();

    // 1. Rate Limiting & Resend Throttling
    const rateLimit = checkOtpRateLimit(normalizedIdentifier);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.reason, retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429 }
      );
    }

    // 2. Generate and hash OTP
    const rawOtp = generateNumericOtp();
    const otpHash = await hashOtp(rawOtp);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 3. Find or create User placeholder for this identity
    const existingIdentity = await prisma.authIdentity.findUnique({
      where: {
        provider_identifier: {
          provider: provider as AuthProvider,
          identifier: normalizedIdentifier,
        },
      },
      include: { user: true },
    });

    let userId: string;

    if (existingIdentity) {
      userId = existingIdentity.userId;
      // Update identity with new OTP hash, reset attempts count
      await prisma.authIdentity.update({
        where: { id: existingIdentity.id },
        data: {
          otpCodeHash: otpHash,
          otpExpiresAt,
          attemptsCount: 0,
          lastSentAt: new Date(),
        },
      });
    } else {
      // Create user record
      const newUser = await prisma.user.create({
        data: {
          phone: provider === "PHONE_OTP" ? normalizedIdentifier : null,
          email: provider === "EMAIL_OTP" ? normalizedIdentifier : null,
          authIdentities: {
            create: {
              provider: provider as AuthProvider,
              identifier: normalizedIdentifier,
              otpCodeHash: otpHash,
              otpExpiresAt,
              attemptsCount: 0,
              lastSentAt: new Date(),
            },
          },
        },
      });
      userId = newUser.id;

      // Assign default Free plan
      const freePlan = await prisma.plan.findUnique({
        where: { code: "FREE" },
      });

      if (freePlan) {
        await prisma.subscription.create({
          data: {
            userId: newUser.id,
            planId: freePlan.id,
            status: "ACTIVE",
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year baseline
          },
        });
      }
    }

    // Never log or leak OTP in production
    const isDev = !config.app.isProduction;
    if (isDev) {
      console.log(`[DEV ONLY] OTP for ${normalizedIdentifier}: ${rawOtp}`);
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to ${identifier}`,
      // Only include devOtp in non-production for automated / localhost manual testing
      ...(isDev ? { devOtp: rawOtp } : {}),
    });
  } catch (error) {
    console.error("Error in /api/auth/send-otp:", error);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
