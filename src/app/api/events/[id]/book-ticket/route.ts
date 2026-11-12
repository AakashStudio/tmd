import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { sendPushNotificationToUser } from "@/lib/push-notifications";
import crypto from "crypto";

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
    const ticketType = body.ticketType || "GENERAL_PASS";
    const quantity = Math.max(1, Math.min(5, Number(body.quantity) || 1));
    const attendeePhone = body.attendeePhone || user.phone || "";

    const userProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { name: true },
    });
    const attendeeName = body.attendeeName || userProfile?.name || "Attendee";

    // 1. Fetch Event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            phone: true,
            profile: { select: { name: true } },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status !== "ACTIVE" || new Date(event.endDateTime) < new Date()) {
      return NextResponse.json(
        { error: "This event is closed or has already concluded." },
        { status: 400 }
      );
    }

    if (event.seatsLeft < quantity) {
      return NextResponse.json(
        { error: `Only ${event.seatsLeft} seat(s) remaining for this event.` },
        { status: 400 }
      );
    }

    // 2. Determine Unit Base Price
    let unitPrice = event.generalPassPrice || 399;
    if (ticketType === "MALE_PASS") {
      unitPrice = event.malePassPrice || 499;
    } else if (ticketType === "FEMALE_PASS") {
      unitPrice = event.femalePassPrice || 199;
    } else if (ticketType === "COUPLE_PASS") {
      unitPrice = event.couplePassPrice || 799;
    }

    const basePriceInPaise = unitPrice * quantity * 100;
    const convenienceFee = event.convenienceFee || 39;
    const convenienceFeeInPaise = convenienceFee * 100; // e.g. ₹39 per booking
    const totalAmountInPaise = basePriceInPaise + convenienceFeeInPaise;

    // Platform profit calculation:
    // TMD keeps: 100% of convenienceFee (₹39) + 7% host commission from base ticket!
    const commissionRate = event.tmdCommissionPercent || 0.07;
    const tmdCommissionInPaise = Math.round(basePriceInPaise * commissionRate);
    const organizerPayoutInPaise = basePriceInPaise - tmdCommissionInPaise;

    // 3. Generate unique ticket code and QR token
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const ticketCode = `TMD-EVT-${randomSuffix}`;
    const qrData = JSON.stringify({
      code: ticketCode,
      evt: event.id,
      usr: user.id,
      qty: quantity,
      type: ticketType,
      ts: Date.now(),
    });

    // 4. Atomic Transaction: Create Ticket + Update Seats + Approve Attendee
    const ticket = await prisma.$transaction(async (tx) => {
      const newTicket = await tx.eventTicket.create({
        data: {
          eventId: event.id,
          userId: user.id,
          ticketType,
          quantity,
          basePriceInPaise,
          convenienceFeeInPaise,
          totalAmountInPaise,
          tmdCommissionInPaise,
          organizerPayoutInPaise,
          ticketCode,
          qrData,
          paymentStatus: "PAID",
          paymentMethod: body.paymentMethod || "UPI",
          paymentTxnId: `txn_upi_${Date.now()}`,
          attendeeName,
          attendeePhone,
        },
      });

      // Decrement seats
      await tx.event.update({
        where: { id: event.id },
        data: {
          seatsLeft: { decrement: quantity },
        },
      });

      // Upsert attendee to APPROVED
      await tx.eventAttendee.upsert({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId: user.id,
          },
        },
        update: {
          status: "APPROVED",
        },
        create: {
          eventId: event.id,
          userId: user.id,
          status: "APPROVED",
          note: `Booked ${quantity}x ${ticketType}`,
        },
      });

      return newTicket;
    });

    // Notify event host about new booking
    if (event.organizerId && event.organizerId !== user.id) {
      sendPushNotificationToUser(event.organizerId, {
        title: "🎟️ New Pass Booked!",
        body: `${attendeeName} booked ${quantity}x ${ticketType} for "${event.title}".`,
        url: "/map",
        tag: `event-${event.id}`,
      }).catch(() => {});
    }

    // Notify booking attendee
    sendPushNotificationToUser(user.id, {
      title: "🎟️ Pass Confirmed!",
      body: `Your ticket for "${event.title}" is confirmed! Show QR code at entry.`,
      url: "/map",
      tag: `ticket-${ticket.id}`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Ticket booked successfully! 🎉",
      ticket: {
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        ticketType: ticket.ticketType,
        quantity: ticket.quantity,
        totalAmountInRupees: Math.round(ticket.totalAmountInPaise / 100),
        basePriceInRupees: Math.round(ticket.basePriceInPaise / 100),
        convenienceFeeInRupees: Math.round(ticket.convenienceFeeInPaise / 100),
        qrData: ticket.qrData,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(ticket.ticketCode)}`,
        attendeeName: ticket.attendeeName,
        event: {
          id: event.id,
          title: event.title,
          venue: event.venue,
          address: event.address,
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
          coverPhotoUrl: event.coverPhotoUrl,
        },
      },
    });
  } catch (error: any) {
    console.error("Book ticket error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to book ticket" },
      { status: 500 }
    );
  }
}
