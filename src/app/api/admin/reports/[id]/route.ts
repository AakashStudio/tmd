import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
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
    const { action, actionTaken } = body;

    const report = await prisma.report.findUnique({
      where: { id },
      include: { reportedUser: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (action === "BAN_USER") {
      if (report.reportedUserId) {
        await prisma.user.update({
          where: { id: report.reportedUserId },
          data: { status: "BANNED" },
        });

        await logAdminAction({
          adminUserId: admin.id,
          action: "BAN_USER",
          targetType: "USER",
          targetId: report.reportedUserId,
          details: { reportId: report.id, reason: report.reason },
        });
      }

      await prisma.report.update({
        where: { id },
        data: {
          status: "ACTIONED",
          actionTaken: "User banned from platform",
          reviewedBy: admin.email,
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "User banned and report resolved.",
      });
    }

    if (action === "DISMISS") {
      await prisma.report.update({
        where: { id },
        data: {
          status: "DISMISSED",
          actionTaken: actionTaken || "Dismissed by moderator",
          reviewedBy: admin.email,
          reviewedAt: new Date(),
        },
      });

      await logAdminAction({
        adminUserId: admin.id,
        action: "DISMISS_REPORT",
        targetType: "REPORT",
        targetId: report.id,
      });

      return NextResponse.json({
        success: true,
        message: "Report dismissed.",
      });
    }

    // Default RESOLVED
    await prisma.report.update({
      where: { id },
      data: {
        status: "ACTIONED",
        actionTaken: actionTaken || "Reviewed and addressed",
        reviewedBy: admin.email,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Report marked as actioned.",
    });
  } catch (error: any) {
    console.error("Admin report action error:", error);
    return NextResponse.json(
      { error: "Internal server error actioning report." },
      { status: 500 }
    );
  }
}
