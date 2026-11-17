import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "liked"; // "liked" | "passed"

    if (type === "passed") {
      const rawPasses = await prisma.pass.findMany({
        where: { fromUserId: user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          toUser: {
            select: {
              id: true,
              isVerified: true,
              profile: {
                select: {
                  name: true,
                  age: true,
                  gender: true,
                  city: true,
                  profession: true,
                  relationshipIntention: true,
                  photos: {
                    where: { status: "APPROVED" },
                    orderBy: { order: "asc" },
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      });

      // Deduplicate by target userId
      const seen = new Set<string>();
      const items = [];

      for (const p of rawPasses) {
        if (!p.toUser?.profile) continue;
        if (seen.has(p.toUserId)) continue;
        seen.add(p.toUserId);

        const prof = p.toUser.profile;
        items.push({
          id: p.id,
          userId: p.toUserId,
          name: prof.name,
          age: prof.age,
          gender: prof.gender,
          city: prof.city,
          profession: prof.profession,
          relationshipIntention: prof.relationshipIntention,
          photoUrl: prof.photos[0]?.url || null,
          isVerified: p.toUser.isVerified,
          status: "PASSED",
          statusLabel: "Passed / Skipped",
          createdAt: p.createdAt.toISOString(),
        });
      }

      return NextResponse.json({ success: true, type: "passed", items, totalCount: items.length });
    }

    // Default: type === "liked"
    const rawLikes = await prisma.like.findMany({
      where: { fromUserId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        toUser: {
          select: {
            id: true,
            isVerified: true,
            profile: {
              select: {
                name: true,
                age: true,
                gender: true,
                city: true,
                profession: true,
                relationshipIntention: true,
                photos: {
                  where: { status: "APPROVED" },
                  orderBy: { order: "asc" },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });

    const seen = new Set<string>();
    const items = [];

    for (const l of rawLikes) {
      if (!l.toUser?.profile) continue;
      if (seen.has(l.toUserId)) continue;
      seen.add(l.toUserId);

      const prof = l.toUser.profile;
      let statusLabel = "Sent Like • Pending";
      if (l.status === "ACCEPTED") statusLabel = "Connected • Matched 🎉";
      if (l.status === "DECLINED") statusLabel = "Declined";

      items.push({
        id: l.id,
        userId: l.toUserId,
        name: prof.name,
        age: prof.age,
        gender: prof.gender,
        city: prof.city,
        profession: prof.profession,
        relationshipIntention: prof.relationshipIntention,
        photoUrl: prof.photos[0]?.url || null,
        isVerified: l.toUser.isVerified,
        comment: l.comment,
        status: l.status,
        statusLabel,
        createdAt: l.createdAt.toISOString(),
      });
    }

    return NextResponse.json({ success: true, type: "liked", items, totalCount: items.length });
  } catch (err: any) {
    console.error("GET /api/discovery/history error:", err);
    return NextResponse.json({ error: "Failed to fetch interaction history." }, { status: 500 });
  }
}
