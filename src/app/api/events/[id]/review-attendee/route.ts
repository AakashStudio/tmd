import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = params;
    const body = await req.json().catch(() => ({}));
    const { attendeeId, action } = body; // action: "APPROVE" | "REJECT"

    if (!attendeeId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "attendeeId and valid action (APPROVE or REJECT) are required." },
        { status: 400 }
      );
    }

    // Verify event and that current user is the organizer
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only the event organizer can approve or reject join requests." },
        { status: 403 }
      );
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    // Update attendee status
    const updatedAttendee = await prisma.eventAttendee.update({
      where: { id: attendeeId },
      data: { status: newStatus },
      include: {
        user: {
          select: {
            profile: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Update event seatsLeft if approved
    if (newStatus === "APPROVED") {
      const approvedCount = await prisma.eventAttendee.count({
        where: { eventId, status: "APPROVED" },
      });
      await prisma.event.update({
        where: { id: eventId },
        data: { seatsLeft: Math.max(0, event.capacity - approvedCount) },
      });
    }

    return NextResponse.json({
      success: true,
      action,
      status: newStatus,
      userName: updatedAttendee.user.profile?.name || "Applicant",
      message:
        action === "APPROVE"
          ? `${updatedAttendee.user.profile?.name || "Applicant"} has been accepted into the event!`
          : `Join request has been declined.`,
    });
  } catch (error: any) {
    console.error("Review attendee error:", error);
    return NextResponse.json(
      { error: "Internal server error reviewing attendee request." },
      { status: 500 }
    );
  }
}
