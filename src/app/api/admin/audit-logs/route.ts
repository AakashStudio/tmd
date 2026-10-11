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

    const logs = await prisma.adminAuditLog.findMany({
      include: {
        adminUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        details: l.details,
        createdAt: l.createdAt,
        adminUser: l.adminUser,
      })),
    });
  } catch (error: any) {
    console.error("Admin audit logs GET error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching audit logs." },
      { status: 500 }
    );
  }
}
