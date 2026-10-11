import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { reportSchema, formatZodError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = reportSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { reportedUserId, reportedEventId, reason, details } = parseResult.data;
    const autoBlock = Boolean(body.autoBlock);

    // Create Report record
    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedUserId: reportedUserId || null,
        reportedEventId: reportedEventId || null,
        reason,
        details: details || null,
        status: "PENDING",
      },
    });

    // If autoBlock requested and user reported, block them immediately
    if (autoBlock && reportedUserId && reportedUserId !== user.id) {
      await prisma.block.upsert({
        where: {
          blockerId_blockedUserId: {
            blockerId: user.id,
            blockedUserId: reportedUserId,
          },
        },
        update: {},
        create: {
          blockerId: user.id,
          blockedUserId: reportedUserId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: "Report submitted successfully to the moderation safety team.",
    });
  } catch (error: any) {
    console.error("Report API error:", error);
    return NextResponse.json(
      { error: "Internal server error submitting report." },
      { status: 500 }
    );
  }
}
