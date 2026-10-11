import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            phone: true,
            profile: {
              select: { name: true, city: true },
            },
          },
        },
        reportedUser: {
          select: {
            id: true,
            phone: true,
            status: true,
            profile: {
              select: { name: true, city: true },
            },
          },
        },
        reportedEvent: {
          select: { id: true, title: true, category: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        details: r.details,
        status: r.status,
        createdAt: r.createdAt,
        reviewedAt: r.reviewedAt,
        reviewedBy: r.reviewedBy,
        actionTaken: r.actionTaken,
        reporter: {
          id: r.reporter.id,
          name: r.reporter.profile?.name || "Anonymous",
        },
        reportedUser: r.reportedUser
          ? {
              id: r.reportedUser.id,
              name: r.reportedUser.profile?.name || "User",
              status: r.reportedUser.status,
            }
          : null,
        reportedEvent: r.reportedEvent
          ? {
              id: r.reportedEvent.id,
              title: r.reportedEvent.title,
            }
          : null,
      })),
    });
  } catch (error: any) {
    console.error("Admin reports GET error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching reports." },
      { status: 500 }
    );
  }
}
