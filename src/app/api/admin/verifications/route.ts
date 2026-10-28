import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const requests = await prisma.verificationRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            isVerified: true,
            profile: {
              select: {
                name: true,
                dob: true,
                age: true,
                city: true,
                photos: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formatted = requests.map((r) => {
      let parsedPayload: any = {};
      try {
        parsedPayload = JSON.parse(r.payload);
      } catch {
        parsedPayload = { raw: r.payload };
      }

      return {
        id: r.id,
        userId: r.userId,
        requestType: r.requestType,
        status: r.status,
        payload: parsedPayload,
        adminNotes: r.adminNotes,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt,
        createdAt: r.createdAt,
        user: {
          id: r.user.id,
          phone: r.user.phone,
          isVerified: r.user.isVerified,
          name: r.user.profile?.name || "User",
          currentDob: r.user.profile?.dob || null,
          currentAge: r.user.profile?.age || null,
          city: r.user.profile?.city || null,
          photoUrl: r.user.profile?.photos[0]?.url || null,
        },
      };
    });

    return NextResponse.json({ requests: formatted });
  } catch (error: any) {
    console.error("Admin verifications GET error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching verifications." },
      { status: 500 }
    );
  }
}
