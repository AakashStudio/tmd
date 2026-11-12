import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { sendPushNotificationToUser } from "@/lib/push-notifications";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
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

    const readablePassType = ticketType.replace("_", " ").toLowerCase();

    // 1. Notify event host immediately about new ticket purchase
    if (event.organizerId && event.organizerId !== user.id) {
      // In-app notification for host
      createNotification({
        userId: event.organizerId,
        type: "SYSTEM",
        title: "🎟️ New Pass Booked!",
        body: `${attendeeName} booked ${quantity}x ${readablePassType} for "${event.title}".`,
        linkUrl: "/map",
      }).catch(() => {});

      // Push notification for host
      sendPushNotificationToUser(event.organizerId, {
        title: "🎟️ New Pass Booked!",
        body: `${attendeeName} booked ${quantity}x ${readablePassType} for "${event.title}".`,
        url: "/map",
        tag: `event-${event.id}`,
      }).catch(() => {});

      // Email alert for host if email is available
      prisma.user
        .findUnique({
          where: { id: event.organizerId },
          select: {
            email: true,
            profile: { select: { name: true } },
          },
        })
        .then((hostUser) => {
          if (hostUser?.email) {
            const hostName = hostUser.profile?.name || "Host";
            sendEmail({
              to: hostUser.email,
              subject: `🎟️ New Pass Booked for "${event.title}"!`,
              html: `
                <div style="font-family: sans-serif; background-color: #0c0c10; color: #fff; padding: 25px; border-radius: 12px; border: 1px solid rgba(255,198,41,0.3);">
                  <h2 style="color: #FFC629; margin-top: 0;">New Ticket Booked! 🎟️</h2>
                  <p>Hi <strong>${hostName}</strong>,</p>
                  <p><strong>${attendeeName}</strong> has just booked <strong>${quantity}x ${readablePassType}</strong> for your event <strong>"${event.title}"</strong>.</p>
                  <div style="background: #14141c; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 5px 0;"><strong>Event:</strong> ${event.title}</p>
                    <p style="margin: 5px 0;"><strong>Venue:</strong> ${event.venue}</p>
                    <p style="margin: 5px 0;"><strong>Ticket Code:</strong> ${ticket.ticketCode}</p>
                    <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${Math.round(ticket.totalAmountInPaise / 100)}</p>
                    <p style="margin: 5px 0; color: #10b981;"><strong>Host Share (93%):</strong> ₹${Math.round(ticket.organizerPayoutInPaise / 100)}</p>
                  </div>
                  <p style="color: #a1a1aa; font-size: 12px;">TMD settles host payouts post-event directly. Manage your guest list on the TMD Map dashboard.</p>
                  <a href="https://tmd.dizitio.com/map" style="display: inline-block; padding: 10px 20px; background: #FFC629; color: #000; font-weight: bold; border-radius: 8px; text-decoration: none; margin-top: 10px;">View Guest List</a>
                </div>
              `,
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }

    // 2. Notify booking attendee
    createNotification({
      userId: user.id,
      type: "SYSTEM",
      title: "🎟️ Pass Confirmed!",
      body: `Your ticket for "${event.title}" is confirmed! Show QR code at entry.`,
      linkUrl: "/map",
    }).catch(() => {});

    sendPushNotificationToUser(user.id, {
      title: "🎟️ Pass Confirmed!",
      body: `Your ticket for "${event.title}" is confirmed! Show QR code at entry.`,
      url: "/map",
      tag: `ticket-${ticket.id}`,
    }).catch(() => {});

    // Email ticket to attendee if they have email
    if (user.email) {
      sendEmail({
        to: user.email,
        subject: `🎟️ Your TMD Pass for "${event.title}"!`,
        html: `
          <div style="font-family: sans-serif; background-color: #0c0c10; color: #fff; padding: 25px; border-radius: 12px; border: 1px solid rgba(255,198,41,0.3);">
            <h2 style="color: #FFC629; margin-top: 0;">You're Confirmed! 🎉</h2>
            <p>Hi <strong>${attendeeName}</strong>, your ticket for <strong>"${event.title}"</strong> has been successfully booked.</p>
            <div style="background: #14141c; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Ticket Code:</strong> <span style="color: #FFC629; font-size: 18px; font-weight: bold;">${ticket.ticketCode}</span></p>
              <p style="margin: 5px 0;"><strong>Pass Type:</strong> ${readablePassType} (${quantity} pass)</p>
              <p style="margin: 5px 0;"><strong>Venue:</strong> ${event.venue}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(event.startDateTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
            </div>
            <p style="color: #a1a1aa; font-size: 12px;">Show the QR pass on your TMD app at the cafe door for direct entry.</p>
            <a href="https://tmd.dizitio.com/map" style="display: inline-block; padding: 10px 20px; background: #FFC629; color: #000; font-weight: bold; border-radius: 8px; text-decoration: none; margin-top: 10px;">View My Pass</a>
          </div>
        `,
      }).catch(() => {});
    }

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
