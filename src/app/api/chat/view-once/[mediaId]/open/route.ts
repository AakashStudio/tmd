import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createViewOnceStreamToken } from "@/lib/view-once";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    mediaId: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mediaId } = params;

    // Use Prisma transaction to guarantee atomic single-use open
    const result = await prisma.$transaction(async (tx) => {
      const media = await tx.messageMedia.findUnique({
        where: { id: mediaId },
        include: {
          message: {
            include: {
              conversation: {
                include: {
                  match: true,
                },
              },
            },
          },
        },
      });

      if (!media) {
        return { error: "Media not found", status: 404 };
      }

      const match = media.message.conversation.match;
      const isParticipant = match.user1Id === user.id || match.user2Id === user.id;

      if (!isParticipant) {
        return {
          error: "Forbidden: You are not authorized to view this media.",
          status: 403,
        };
      }

      // Sender cannot open their own View Once photo
      if (media.message.senderId === user.id) {
        return {
          error: "Sender cannot open View Once media.",
          status: 403,
        };
      }

      // Single-use invariant: Check if already opened in snapshot
      if (media.openedAt !== null) {
        return {
          error: "This view-once photo has already been opened and expired.",
          code: "VIEW_ONCE_ALREADY_OPENED",
          status: 410,
        };
      }

      // Expiry check: Check if retention window passed
      if (media.expiresAt && media.expiresAt < new Date()) {
        return {
          error: "This view-once photo has expired unopened.",
          code: "VIEW_ONCE_EXPIRED",
          status: 410,
        };
      }

      // Atomic database claim: Strictly claim media ONLY IF openedAt is still null and non-expired
      const claim = await tx.messageMedia.updateMany({
        where: {
          id: mediaId,
          openedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        data: {
          openedAt: new Date(),
          openedByUserId: user.id,
        },
      });

      if (claim.count === 0) {
        return {
          error: "This view-once photo has already been opened and expired.",
          code: "VIEW_ONCE_ALREADY_OPENED",
          status: 410,
        };
      }

      return { success: true, mediaId: media.id };
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status }
      );
    }

    // Generate short-lived streaming access token
    const streamToken = await createViewOnceStreamToken(
      mediaId,
      user.id,
      config.viewOnce.tokenTtlSeconds
    );

    return NextResponse.json({
      success: true,
      streamToken,
      expiresInSeconds: config.viewOnce.tokenTtlSeconds,
    });
  } catch (error: any) {
    console.error("View Once open error:", error);
    return NextResponse.json(
      { error: "Internal server error opening view-once media." },
      { status: 500 }
    );
  }
}
