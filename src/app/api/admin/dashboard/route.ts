import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      activeSubscriptions,
      pendingVerifications,
      pendingReports,
      revenueResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "BANNED" } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.verificationRequest.count({ where: { status: "PENDING" } }),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amountInPaise: true },
      }),
    ]);

    const totalRevenuePaise = revenueResult._sum.amountInPaise || 0;

    return NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers,
        activeSubscriptions,
        pendingVerifications,
        pendingReports,
        totalRevenueRupees: totalRevenuePaise / 100,
        totalRevenuePaise,
      },
    });
  } catch (error: any) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching admin dashboard." },
      { status: 500 }
    );
  }
}
