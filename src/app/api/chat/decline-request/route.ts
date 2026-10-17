import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { likeId } = body;

    if (!likeId) {
      return NextResponse.json({ error: "likeId is required" }, { status: 400 });
    }

    // Mark like as DECLINED
    await prisma.like.updateMany({
      where: {
        id: likeId,
        toUserId: user.id,
      },
      data: {
        status: "DECLINED",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Decline request error:", error);
    return NextResponse.json(
      { error: "Internal server error declining request." },
      { status: 500 }
    );
  }
}
