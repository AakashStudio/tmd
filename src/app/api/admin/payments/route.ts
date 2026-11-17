import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/admin/payments: List payments with user and plan details
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            profile: {
              select: {
                name: true,
                city: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (err: any) {
    console.error("Admin get payments error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch payments." },
      { status: 500 }
    );
  }
}

// POST /api/admin/payments: Approve or Reject a payment
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { paymentId, action } = body; // action: "APPROVE" | "REJECT"

    if (!paymentId || !action) {
      return NextResponse.json(
        { error: "paymentId and action ('APPROVE' or 'REJECT') are required." },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { plan: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    }

    if (action === "REJECT") {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "FAILED" },
      });

      return NextResponse.json({
        success: true,
        message: "Payment marked as REJECTED / FAILED.",
      });
    }

    if (action === "APPROVE") {
      // Execute in transaction: Mark payment SUCCESS & activate subscription
      const result = await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: "SUCCESS",
            razorpaySignature: `APPROVED_BY_ADMIN_${admin.id}`,
          },
        });

        // Supersede previous active subscriptions
        await tx.subscription.updateMany({
          where: {
            userId: payment.userId,
            status: "ACTIVE",
          },
          data: {
            status: "SUPERSEDED",
          },
        });

        // Create new active subscription
        const startDate = new Date();
        const durationDays = payment.plan.durationDays || 15;
        const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const newSub = await tx.subscription.create({
          data: {
            userId: payment.userId,
            planId: payment.planId,
            status: "ACTIVE",
            startDate,
            endDate,
          },
          include: { plan: true },
        });

        return { updatedPayment, newSub };
      });

      return NextResponse.json({
        success: true,
        message: `Payment approved! Plan ${payment.plan.name} is now ACTIVE for user.`,
        subscription: result.newSub,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    console.error("Admin approve payment error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process payment approval." },
      { status: 500 }
    );
  }
}
