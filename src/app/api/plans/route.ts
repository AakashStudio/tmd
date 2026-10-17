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
            "10 swipes per 12 hours",
            "Ads enabled",
            "Current city discovery",
            "No rewind",
            "Events map locked",
          ];
          break;
        case "TIER_49":
          featuresList = [
            "Unlimited swipes",
            "First 10 'Who Liked You' profiles",
            "Ads enabled",
            "Current city only",
            "15 days validity",
          ];
          break;
        case "TIER_149":
          featuresList = [
            "Unlimited swipes",
            "Unlimited 'Who Liked You'",
            "Rewind last pass",
            "City selection & distance filter",
            "Zero ads",
            "15 days validity",
          ];
          break;
        case "PRO_499":
          featuresList = [
            "Everything in ₹149 plan",
            "Events Map access",
            "Join & host singles events",
            "Organizer verification badge",
            "Name change & DOB correction request",
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
