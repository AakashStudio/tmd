import { setVapidDetails, sendNotification } from "web-push";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

// Initialize VAPID details
if (config.vapid.publicKey && config.vapid.privateKey) {
  try {
    setVapidDetails(
      config.vapid.subject,
      config.vapid.publicKey,
      config.vapid.privateKey
    );
  } catch (err) {
    console.error("Failed to initialize VAPID details:", err);
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
}

/**
 * Send push notification to a specific user across all their registered browser subscriptions.
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<number> {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (!subscriptions || subscriptions.length === 0) {
      return 0;
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
      icon: payload.icon || "/icons/icon-192.png",
      tag: payload.tag || "tmd-alert",
    });

    let successCount = 0;
    const staleSubscriptionIds: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushConfig = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await sendNotification(pushConfig, payloadString);
          successCount++;
        } catch (err: any) {
          // If 410 (Gone) or 404 (Not Found), subscription expired or unsubscribed
          if (err.statusCode === 410 || err.statusCode === 404) {
            staleSubscriptionIds.push(sub.id);
          } else {
            console.error(`Push notification failed for endpoint ${sub.endpoint.slice(0, 30)}...:`, err.message);
          }
        }
      })
    );

    // Clean up expired or invalid subscriptions
    if (staleSubscriptionIds.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: staleSubscriptionIds } },
      }).catch(() => {});
    }

    return successCount;
  } catch (error) {
    console.error("sendPushNotificationToUser error:", error);
    return 0;
  }
}
