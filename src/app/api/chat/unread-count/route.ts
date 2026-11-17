import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const unreadCount = await prisma.message.count({
      where: {
        senderId: { not: user.id },
        status: { in: ["SENT", "DELIVERED"] },
        conversation: {
          match: {
            OR: [{ user1Id: user.id }, { user2Id: user.id }],
            status: "ACTIVE",
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (err: any) {
    console.error("GET /api/chat/unread-count error:", err);
    return NextResponse.json({ unreadCount: 0 });
  }
}
