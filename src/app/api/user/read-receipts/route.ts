import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pref = await prisma.preference.findUnique({
      where: { userId: user.id },
      select: { readReceiptsEnabled: true },
    });

    const isPro = user.activeSubscription?.status === "ACTIVE" || user.role === "ADMIN";

    return NextResponse.json({
      success: true,
      readReceiptsEnabled: pref?.readReceiptsEnabled ?? true,
      isPro,
    });
  } catch (err: any) {
    console.error("GET /api/user/read-receipts error:", err);
    return NextResponse.json({ error: "Failed to fetch read receipts setting." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPro = user.activeSubscription?.status === "ACTIVE" || user.role === "ADMIN";
    if (!isPro) {
      return NextResponse.json(
        { error: "Read Receipts control is an exclusive feature for PRO members. Please upgrade to PRO to turn off read receipts." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { enabled } = body;

    const boolVal = Boolean(enabled);

    const updated = await prisma.preference.upsert({
      where: { userId: user.id },
      update: { readReceiptsEnabled: boolVal },
      create: {
        userId: user.id,
        readReceiptsEnabled: boolVal,
      },
    });

    return NextResponse.json({
      success: true,
      readReceiptsEnabled: updated.readReceiptsEnabled,
      message: boolVal
        ? "Read receipts enabled. Your matches will see green ticks when you read their messages."
        : "Read receipts disabled. Matches will only see delivered ticks.",
    });
  } catch (err: any) {
    console.error("POST /api/user/read-receipts error:", err);
    return NextResponse.json({ error: "Failed to update read receipts." }, { status: 500 });
  }
}
