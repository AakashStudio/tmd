import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.eventTicket.findMany({
      where: {
        userId: user.id,
        paymentStatus: "PAID",
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            category: true,
            venue: true,
            address: true,
            startDateTime: true,
            endDateTime: true,
            coverPhotoUrl: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = tickets.map((t) => ({
      id: t.id,
      ticketCode: t.ticketCode,
      ticketType: t.ticketType,
      quantity: t.quantity,
      basePriceInRupees: Math.round(t.basePriceInPaise / 100),
      totalAmountInRupees: Math.round(t.totalAmountInPaise / 100),
      checkedIn: t.checkedIn,
      checkedInAt: t.checkedInAt,
      createdAt: t.createdAt,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(t.ticketCode)}`,
      event: t.event,
    }));

    return NextResponse.json({
      tickets: formatted,
      count: formatted.length,
    });
  } catch (error: any) {
    console.error("My tickets GET error:", error);
    return NextResponse.json(
      { error: "Failed to load tickets" },
      { status: 500 }
    );
  }
}
