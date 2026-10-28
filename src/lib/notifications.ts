import { prisma } from "@/lib/db";
import { NotificationType } from "@prisma/client";

export interface CreateNotificationParams {
  userId: string;
  type: "MATCH" | "MESSAGE" | "LIKE" | "CAMPAIGN" | "SYSTEM";
  title: string;
  body: string;
  linkUrl?: string;
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  linkUrl,
}: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type: type as NotificationType,
        title,
        body,
        linkUrl: linkUrl || null,
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}

export async function broadcastCampaignNotification({
  title,
  body,
  linkUrl,
  targetCity,
}: {
  title: string;
  body: string;
  linkUrl?: string;
  targetCity?: string;
}) {
  try {
    const userWhere: any = { status: "ACTIVE" };
    if (targetCity) {
      userWhere.profile = {
        city: { equals: targetCity, mode: "insensitive" },
      };
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      select: { id: true },
      take: 2000,
    });

    if (users.length === 0) return { count: 0 };

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: "CAMPAIGN" as NotificationType,
        title,
        body,
        linkUrl: linkUrl || null,
      })),
    });

    return { count: users.length };
  } catch (err) {
    console.error("Failed to broadcast campaign notification:", err);
    return { count: 0, error: err };
  }
}
