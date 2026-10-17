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

    const body = await req.json().catch(() => ({}));
    const { linkedinUrl, note } = body;

    // Check LinkedIn requirement if organizer set it as mandatory
    if (event.requireLinkedin && event.isLinkedinMandatory) {
      if (!linkedinUrl || !linkedinUrl.trim()) {
        return NextResponse.json(
          {
            error: "LinkedIn profile URL is mandatory for this event. Please provide your profile link to submit request.",
          },
          { status: 400 }
        );
      }

      // Basic URL format validation
      const urlRegex = /^https?:\/\/(www\.)?linkedin\.com\/.*$/i;
      if (!urlRegex.test(linkedinUrl.trim())) {
        return NextResponse.json(
          {
            error: "Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/your-name).",
          },
          { status: 400 }
        );
      }
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

    // As requested: all attendees submit a request for the organizer to approve
    const newStatus = "REQUESTED" as const;

    const attendee = await prisma.eventAttendee.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
      update: {
        status: newStatus,
        linkedinUrl: linkedinUrl ? linkedinUrl.trim() : undefined,
        note: note ? note.trim() : undefined,
      },
      create: {
        eventId,
        userId: user.id,
        status: newStatus,
        linkedinUrl: linkedinUrl ? linkedinUrl.trim() : null,
        note: note ? note.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      status: attendee.status,
      message: "Your request has been submitted to the organizer for approval.",
    });
  } catch (error: any) {
    console.error("Join event error:", error);
    return NextResponse.json(
      { error: "Internal server error joining event." },
      { status: 500 }
    );
  }
}
