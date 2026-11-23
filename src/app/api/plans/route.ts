import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PLAN_ENTITLEMENT_MATRIX } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    // Ensure database rows match updated pricing & duration matrix (Starter 7d/₹29, Gold 15d/₹49, VIP PRO 30d/₹99)
    await Promise.allSettled([
      prisma.plan.updateMany({
        where: {
          code: "TIER_49",
          OR: [{ priceInPaise: { not: 2900 } }, { durationDays: { not: 7 } }],
        },
        data: { priceInPaise: 2900, durationDays: 7, name: "₹29 Starter / 7 Days" },
      }),
      prisma.plan.updateMany({
        where: {
          code: "TIER_149",
          OR: [{ priceInPaise: { not: 4900 } }, { durationDays: { not: 15 } }],
        },
        data: { priceInPaise: 4900, durationDays: 15, name: "₹49 Gold / 15 Days" },
      }),
      prisma.plan.updateMany({
        where: {
          code: "PRO_499",
          OR: [{ priceInPaise: { not: 9900 } }, { durationDays: { not: 30 } }],
        },
        data: { priceInPaise: 9900, durationDays: 30, name: "₹99 VIP PRO / 30 Days" },
      }),
    ]);

    const plans = await prisma.plan.findMany({
      where: { priceInPaise: { gt: 0 } },
      orderBy: { priceInPaise: "asc" },
    });

    const activePlanCode = user?.activeSubscription?.plan.code || "FREE";

    const formattedPlans = plans.map((p) => {
      const entitlements = PLAN_ENTITLEMENT_MATRIX[p.code];
      let featuresList: string[] = [];
      switch (p.code) {
        case "FREE":
          featuresList = [
            "25 likes per 12 hours",
            "Ads enabled",
            "Current city discovery",
            "No rewind",
            "Explore & join singles events",
          ];
          break;
        case "TIER_49":
          featuresList = [
            "Unlimited Likes",
            "See First 10 People Who Liked You",
            "Explore & Join Singles Events",
            "7 days validity",
          ];
          break;
        case "TIER_149":
          featuresList = [
            "Unlimited Likes",
            "See Who Likes You (Unlimited)",
            "Unlimited Rewinds",
            "Passport™ City Selection",
            "Hide Ads",
            "Explore & Join Singles Events",
            "15 days validity",
          ];
          break;
        case "PRO_499":
          featuresList = [
            "Everything in TMD Gold",
            "Host Your Own Singles Events",
            "VIP PRO & Host Verification Badge",
            "Priority Name & DOB Correction",
            "30 days VIP validity",
          ];
          break;
        default:
          featuresList = [];
      }

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        priceInPaise: p.priceInPaise,
        priceInRupees: p.priceInPaise / 100,
        durationDays: p.durationDays,
        isPro: p.isPro,
        features: featuresList,
        entitlements,
        isActive: p.code === activePlanCode,
      };
    });

    return NextResponse.json({
      plans: formattedPlans,
      activePlanCode,
      subscription:
        user?.activeSubscription && user.activeSubscription.plan.code !== "FREE"
          ? {
              id: user.activeSubscription.id,
              planCode: user.activeSubscription.plan.code,
              planName: user.activeSubscription.plan.name,
              startDate: user.activeSubscription.startDate,
              endDate: user.activeSubscription.endDate,
              daysRemaining: Math.max(
                0,
                Math.ceil(
                  (new Date(user.activeSubscription.endDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              ),
            }
          : null,
    });
  } catch (error: any) {
    console.error("Plans GET error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching plans." },
      { status: 500 }
    );
  }
}
