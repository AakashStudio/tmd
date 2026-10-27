import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PLAN_ENTITLEMENT_MATRIX } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
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
            "Events map locked",
          ];
          break;
        case "TIER_49":
          featuresList = [
            "Unlimited Likes",
            "See First 10 People Who Liked You",
            "Local Singles Discovery",
            "15 days validity",
          ];
          break;
        case "TIER_149":
          featuresList = [
            "Unlimited Likes",
            "See Who Likes You (Unlimited)",
            "Unlimited Rewinds",
            "Passport™ City Selection",
            "Hide Ads",
            "15 days validity",
          ];
          break;
        case "PRO_499":
          featuresList = [
            "Everything in TMD Gold",
            "Singles Events Map Access",
            "Host & Join Singles Events",
            "VIP PRO & Host Verification Badge",
            "Priority Name & DOB Correction",
            "10 days VIP validity",
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
