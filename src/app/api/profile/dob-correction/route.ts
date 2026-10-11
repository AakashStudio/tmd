import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { dobCorrectionRequestSchema, formatZodError } from "@/lib/validation";
import { RequestType, VerificationStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json({ error: "Unauthorized or profile not found" }, { status: 401 });
    }

    // 1. Entitlement Enforcement: Only ₹499 PRO subscribers can submit DOB correction requests
    if (!user.entitlements.canRequestDobCorrection) {
      return NextResponse.json(
        {
          error: "DOB Correction requests are an exclusive feature of the ₹499 PRO plan.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = dobCorrectionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { requestedDob, documentUrl, notes } = parseResult.data;

    // 2. Prevent duplicate pending requests
    const existingPending = await prisma.verificationRequest.findFirst({
      where: {
        userId: user.id,
        requestType: RequestType.DOB_CORRECTION,
        status: VerificationStatus.PENDING,
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a pending DOB correction request under review." },
        { status: 400 }
      );
    }

    // 3. Create VerificationRequest
    const request = await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        requestType: RequestType.DOB_CORRECTION,
        payload: JSON.stringify({
          currentDob: user.profile.dob.toISOString(),
          requestedDob: requestedDob.toISOString(),
          documentUrl,
          notes: notes || null,
        }),
        status: VerificationStatus.PENDING,
      },
    });

    return NextResponse.json({
      success: true,
      message: "DOB correction request submitted for administrative review.",
      request,
    });
  } catch (error) {
    console.error("Error in POST /api/profile/dob-correction:", error);
    return NextResponse.json(
      { error: "Failed to submit DOB correction request" },
      { status: 500 }
    );
  }
}
