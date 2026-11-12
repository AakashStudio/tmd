import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * GET: Returns VAPID public key for the browser push subscription flow
 */
export async function GET() {
  return NextResponse.json({
    publicKey: config.vapid.publicKey,
  });
}

/**
 * POST: Saves or updates browser PushSubscription for the current logged-in user
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { endpoint, keys } = body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: "Invalid PushSubscription payload. Missing endpoint or keys." },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get("user-agent") || null;

    // Upsert subscription
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
      },
      update: {
        userId: user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error("push-subscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error saving push subscription." },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Removes a subscription when user opts out
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { endpoint } = body;

    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: {
          userId: user.id,
          endpoint,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("push-unsubscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error unsubscribing." },
      { status: 500 }
    );
  }
}
