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

    if (!user.entitlements.canJoinEvents) {
      return NextResponse.json(
        {
          error: "Joining events is an exclusive feature for TMD PRO members.",
          code: "PRO_REQUIRED",
        },
        { status: 403 }
      );
    }

    const { id: eventId } = params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        attendees: {
          where: { status: "APPROVED" },
        },
      },
    });

    if (!event || event.status !== "ACTIVE" || event.endDateTime <= new Date()) {
      return NextResponse.json(
        { error: "Event not found, cancelled, or has already ended." },
        { status: 404 }
      );
    }

    // Age validation
    if (user.profile && user.profile.age < event.minAge) {
      return NextResponse.json(
        {
          error: `You must be at least ${event.minAge} years old to attend this event.`,
        },
        { status: 400 }
      );
    }

    // Check capacity
    if (event.attendees.length >= event.capacity) {
      return NextResponse.json(
        { error: "This event is currently at full capacity." },
        { status: 400 }
      );
    }

    // Determine status based on attendanceMode
    const newStatus =
      event.attendanceMode === "OPEN_JOIN" ? "APPROVED" : "REQUESTED";

    const attendee = await prisma.eventAttendee.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
      update: {
        status: newStatus,
      },
      create: {
        eventId,
        userId: user.id,
        status: newStatus,
      },
    });

    // Update seatsLeft if approved
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
      status: attendee.status,
      message:
        newStatus === "APPROVED"
          ? "You are confirmed for this event!"
          : "Your request has been submitted to the organizer for approval.",
    });
  } catch (error: any) {
    console.error("Join event error:", error);
    return NextResponse.json(
      { error: "Internal server error joining event." },
      { status: 500 }
    );
  }
}
