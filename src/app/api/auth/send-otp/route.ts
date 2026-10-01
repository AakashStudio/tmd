import { NextRequest, NextResponse } from 'next/server';
import { createOtp } from '@/lib/auth/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate Indian phone format
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const result = await createOtp(phone);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      devOtp: (result as any).devOtp,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
