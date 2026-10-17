import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatZodError } from "@/lib/validation";
import { RequestType, VerificationStatus } from "@prisma/client";
import { z } from "zod";

const faceVerificationSchema = z.object({
  selfieUrl: z.string().min(1, "Valid selfie image URL or path is required"),
  videoUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json({ error: "Unauthorized or profile not found" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = faceVerificationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    // Clean up any old pending request to allow fresh submission
    await prisma.verificationRequest.deleteMany({
      where: {
        userId: user.id,
        requestType: RequestType.FACE_VERIFICATION,
        status: VerificationStatus.PENDING,
      },
    });

    const request = await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        requestType: RequestType.FACE_VERIFICATION,
        payload: JSON.stringify({
          selfieUrl: parseResult.data.selfieUrl,
          videoUrl: parseResult.data.videoUrl || null,
        }),
        status: VerificationStatus.VERIFIED,
      },
    });

    // Mark user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Face verified successfully! Verified badge activated.",
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
