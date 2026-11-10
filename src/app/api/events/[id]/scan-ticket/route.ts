import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = params.id;
    const body = await req.json().catch(() => ({}));
    const ticketCode = (body.ticketCode || "").trim().toUpperCase();

    if (!ticketCode) {
      return NextResponse.json(
        { error: "Ticket code is required." },
        { status: 400 }
      );
    }

    // Verify user is organizer of this event or an admin
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only the event organizer or cafe host can scan tickets." },
        { status: 403 }
      );
    }

    // Find Ticket
    const ticket = await prisma.eventTicket.findFirst({
      where: {
        eventId,
        ticketCode,
        paymentStatus: "PAID",
      },
      include: {
        user: {
          include: {
            profile: {
              select: {
                name: true,
                age: true,
                photos: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Invalid ticket! No matching paid ticket found for this event." },
        { status: 404 }
      );
    }

    if (ticket.checkedIn) {
      return NextResponse.json(
        {
          error: `Ticket ALREADY CHECKED-IN on ${new Date(
            ticket.checkedInAt || Date.now()
          ).toLocaleTimeString("en-IN")}. Cannot reuse pass.`,
          alreadyCheckedIn: true,
          checkedInAt: ticket.checkedInAt,
        },
        { status: 409 }
      );
    }

    // Mark checked in
    const updated = await prisma.eventTicket.update({
      where: { id: ticket.id },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Check-in Approved! Welcome to the event! 🎉",
      ticket: {
        id: updated.id,
        ticketCode: updated.ticketCode,
        ticketType: updated.ticketType,
        quantity: updated.quantity,
        attendeeName: ticket.attendeeName || ticket.user.profile?.name || "Guest",
        attendeePhoto: ticket.user.profile?.photos[0]?.url || null,
        checkedInAt: updated.checkedInAt,
      },
    });
  } catch (error: any) {
    console.error("Scan ticket error:", error);
    return NextResponse.json(
      { error: "Failed to scan ticket." },
      { status: 500 }
    );
  }
}
