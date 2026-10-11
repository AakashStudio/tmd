import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.entitlements.canAccessEvents) {
      return NextResponse.json(
        { error: "Events is a PRO 499 exclusive feature", code: "PRO_REQUIRED" },
        { status: 403 }
      );
    }

    const { id } = params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          include: {
            profile: {
              include: {
                photos: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        attendees: {
          include: {
            user: {
              include: {
                profile: {
                  include: {
                    photos: { where: { isPrimary: true }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const myAttendance = event.attendees.find((a) => a.userId === user.id);
    const isOrganizer = event.organizerId === user.id;
    const isApproved = myAttendance?.status === "APPROVED";

    let displayAddress = event.address;
    let displayLatitude = event.latitude;
    let displayLongitude = event.longitude;

    if (event.isResidential && !isOrganizer && !isApproved) {
      displayAddress = "Residential Area (Exact address revealed upon RSVP approval)";
      displayLatitude = null;
      displayLongitude = null;
    }

    return NextResponse.json({
      event: {
        ...event,
        address: displayAddress,
        latitude: displayLatitude,
        longitude: displayLongitude,
        isOrganizer,
        myAttendanceStatus: myAttendance?.status || null,
        approvedAttendees: event.attendees
          .filter((a) => a.status === "APPROVED")
          .map((a) => ({
            id: a.id,
            userId: a.userId,
            name: a.user.profile?.name || "Attendee",
            photoUrl: a.user.profile?.photos[0]?.url || null,
            joinedAt: a.joinedAt,
          })),
        pendingAttendees: isOrganizer
          ? event.attendees
              .filter((a) => a.status === "REQUESTED")
              .map((a) => ({
                id: a.id,
                userId: a.userId,
                name: a.user.profile?.name || "Applicant",
                photoUrl: a.user.profile?.photos[0]?.url || null,
                joinedAt: a.joinedAt,
              }))
          : [],
      },
    });
  } catch (error: any) {
    console.error("Event detail error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching event." },
      { status: 500 }
    );
  }
}
