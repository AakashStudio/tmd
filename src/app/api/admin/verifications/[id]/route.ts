import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { calculateAge } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { decision, adminNotes } = body;

    if (decision !== "APPROVE" && decision !== "REJECT") {
      return NextResponse.json(
        { error: "Decision must be either 'APPROVE' or 'REJECT'." },
        { status: 400 }
      );
    }

    const verificationReq = await prisma.verificationRequest.findUnique({
      where: { id },
      include: { user: { include: { profile: true } } },
    });

    if (!verificationReq) {
      return NextResponse.json(
        { error: "Verification request not found." },
        { status: 404 }
      );
    }

    if (decision === "APPROVE") {
      await prisma.$transaction(async (tx) => {
        if (verificationReq.requestType === "FACE_VERIFICATION") {
          await tx.user.update({
            where: { id: verificationReq.userId },
            data: {
              isVerified: true,
              verifiedAt: new Date(),
            },
          });
        } else if (verificationReq.requestType === "DOB_CORRECTION") {
          let payload: any = {};
          try {
            payload = JSON.parse(verificationReq.payload);
          } catch {
            payload = {};
          }

          if (payload.requestedDob) {
            const requestedDob = new Date(payload.requestedDob);
            const calculatedAge = calculateAge(requestedDob);

            await tx.profile.update({
              where: { userId: verificationReq.userId },
              data: {
                dob: requestedDob,
                age: calculatedAge,
              },
            });
          }
        }

        await tx.verificationRequest.update({
          where: { id },
          data: {
            status: "VERIFIED",
            adminNotes: adminNotes || "Approved by admin",
            reviewedBy: admin.email,
            reviewedAt: new Date(),
          },
        });
      });

      await logAdminAction({
        adminUserId: admin.id,
        action: `APPROVE_${verificationReq.requestType}`,
        targetType: "VERIFICATION_REQUEST",
        targetId: verificationReq.id,
        details: { userId: verificationReq.userId },
      });

      return NextResponse.json({
        success: true,
        message: `${verificationReq.requestType} approved successfully.`,
      });
    }

    // decision === "REJECT"
    await prisma.verificationRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        adminNotes: adminNotes || "Rejected by admin",
        reviewedBy: admin.email,
        reviewedAt: new Date(),
      },
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: `REJECT_${verificationReq.requestType}`,
      targetType: "VERIFICATION_REQUEST",
      targetId: verificationReq.id,
      details: { userId: verificationReq.userId, reason: adminNotes },
    });

    return NextResponse.json({
      success: true,
      message: `${verificationReq.requestType} rejected.`,
    });
  } catch (error: any) {
    console.error("Admin verification action error:", error);
    return NextResponse.json(
      { error: "Internal server error updating verification request." },
      { status: 500 }
    );
  }
}
