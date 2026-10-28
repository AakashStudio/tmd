import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createEventSchema, formatZodError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // STRICT PRO GATING: Only PRO users can view events
    if (!user.entitlements.canAccessEvents) {
      return NextResponse.json(
        {
          error: "Events is an exclusive feature for TMD PRO members.",
          code: "PRO_REQUIRED",
          isPro: false,
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const events = await prisma.event.findMany({
      where: {
        status: "ACTIVE",
        endDateTime: { gt: new Date() },
        ...(category && category !== "ALL" ? { category } : {}),
      },
      include: {
        organizer: {
          include: {
            profile: {
              include: {
                photos: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        attendees: {
          where: { status: "APPROVED" },
          select: {
            id: true,
            userId: true,
            status: true,
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    name: true,
                    photos: {
                      where: { isPrimary: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startDateTime: "asc" },
    });

    // BATCH ATTENDANCE QUERY: Eliminate N+1 queries by fetching all attendances in 1 query
    const eventIds = events.map((e) => e.id);
    const userAttendances = await prisma.eventAttendee.findMany({
      where: {
        userId: user.id,
        eventId: { in: eventIds },
      },
    });
    const attendanceMap = new Map<string, string>(
      userAttendances.map((a) => [a.eventId, a.status])
    );

    // Format events & apply residential masking
    const formattedEvents = events.map((event) => {
      const myAttendanceStatus = attendanceMap.get(event.id) || null;
      const isOrganizer = event.organizerId === user.id;
      const isApproved = myAttendanceStatus === "APPROVED";

        // Residential Privacy Masking: Hide exact address and coordinates if residential and not approved
        let displayAddress = event.address;
        let displayLatitude = event.latitude;
        let displayLongitude = event.longitude;

        if (event.isResidential && !isOrganizer && !isApproved) {
          displayAddress = "Residential Area (Exact address revealed upon RSVP approval)";
          displayLatitude = null;
          displayLongitude = null;
        }

        return {
          id: event.id,
          title: event.title,
          category: event.category,
          description: event.description,
          coverPhotoUrl: event.coverPhotoUrl,
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
          venue: event.venue,
          address: displayAddress,
          latitude: displayLatitude,
          longitude: displayLongitude,
          isResidential: event.isResidential,
          minAge: event.minAge,
          capacity: event.capacity,
          seatsLeft: event.seatsLeft,
          feeInPaise: event.feeInPaise,
          feeInRupees: event.entryFee || event.feeInPaise / 100,
          isPaid: event.isPaid || event.entryFee > 0 || event.feeInPaise > 0,
          entryFee: event.entryFee || Math.round(event.feeInPaise / 100),
          requireLinkedin: event.requireLinkedin,
          isLinkedinMandatory: event.isLinkedinMandatory,
          organizerLinkedin: event.organizerLinkedin,
          attendanceMode: event.attendanceMode,
          organizer: {
            id: event.organizer.id,
            name: event.organizer.profile?.name || "Organizer",
            photoUrl: event.organizer.profile?.photos[0]?.url || null,
            isVerified: event.organizer.isVerified,
          },
          attendeeCount: event.attendees.length,
          sampleAttendees: event.attendees.slice(0, 3).map((a) => ({
            userId: a.userId,
            name: a.user.profile?.name || "Attendee",
            photoUrl: a.user.profile?.photos[0]?.url || null,
          })),
          myAttendanceStatus,
          isOrganizer,
        };
      });

    return NextResponse.json({
      events: formattedEvents,
      count: formattedEvents.length,
    });
  } catch (error: any) {
    console.error("Events GET error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching events." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // STRICT PRO GATING: Only PRO users can create events
    if (!user.entitlements.canCreateEvents) {
      return NextResponse.json(
        {
          error: "Creating events is a TMD PRO exclusive feature.",
          code: "PRO_REQUIRED",
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = createEventSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Ensure Organizer record exists for user
    await prisma.organizer.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        verificationStatus: "VERIFIED",
        agreementAcceptedAt: new Date(),
      },
    });

    // Create Event & Auto-Approve Organizer as attendee
    const event = await prisma.event.create({
      data: {
        organizerId: user.id,
        title: data.title,
        category: data.category,
        description: data.description,
        coverPhotoUrl:
          data.coverPhotoUrl ||
          "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800",
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
        venue: data.venue,
        address: data.address,
        latitude: data.latitude || 23.2599, // default Bhopal coordinates if none
        longitude: data.longitude || 77.4126,
        isResidential: data.isResidential,
        minAge: data.minAge,
        capacity: data.capacity,
        seatsLeft: Math.max(0, data.capacity - 1),
        feeInPaise: (data.entryFee || 0) * 100 || data.feeInPaise,
        isPaid: data.isPaid || data.entryFee > 0,
        entryFee: data.entryFee || Math.round(data.feeInPaise / 100),
        requireLinkedin: data.requireLinkedin || data.isLinkedinMandatory,
        isLinkedinMandatory: data.isLinkedinMandatory,
        organizerLinkedin: data.organizerLinkedin || null,
        attendanceMode: "REQUEST_APPROVAL",
        status: "ACTIVE",
        attendees: {
          create: {
            userId: user.id,
            status: "APPROVED",
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Event created successfully!",
      event: {
        id: event.id,
        title: event.title,
        category: event.category,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        venue: event.venue,
        seatsLeft: event.seatsLeft,
      },
    });
  } catch (error: any) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Internal server error creating event." },
      { status: 500 }
    );
  }
}
