import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatZodError } from "@/lib/validation";
import { RequestType, VerificationStatus } from "@prisma/client";
import { z } from "zod";

const faceVerificationSchema = z.object({
  selfieUrl: z.string().url("Valid selfie image URL is required"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json({ error: "Unauthorized or profile not found" }, { status: 401 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "Your profile is already verified." },
        { status: 200 }
      );
    }

    const body = await req.json();
    const parseResult = faceVerificationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    // Check for existing pending request
    const existingPending = await prisma.verificationRequest.findFirst({
      where: {
        userId: user.id,
        requestType: RequestType.FACE_VERIFICATION,
        status: VerificationStatus.PENDING,
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a face verification request under review." },
        { status: 400 }
      );
    }

    const request = await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        requestType: RequestType.FACE_VERIFICATION,
        payload: JSON.stringify({
          selfieUrl: parseResult.data.selfieUrl,
        }),
        status: VerificationStatus.PENDING,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Face verification request submitted for review.",
      request,
    });
  } catch (error) {
    console.error("Error in POST /api/profile/face-verification:", error);
    return NextResponse.json(
      { error: "Failed to submit face verification request" },
      { status: 500 }
    );
  }
}
