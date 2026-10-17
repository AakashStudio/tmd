import { PlanCode } from "@prisma/client";

export interface UserEntitlements {
  planCode: PlanCode;
  planName: string;
  isPaid: boolean;
  isPro: boolean;
  swipesLimitPerWindow: number | null; // null = unlimited
  canRewind: boolean;
  whoLikedYouLimit: number; // 0 = locked, 10 = first 10, Infinity = unlimited
  canSelectCity: boolean;
  canUseDistanceFilter: boolean;
  locationChangesRemaining?: number;
  maxFreeLocationChanges?: number;
  hasAds: boolean;
  canAccessEvents: boolean;
  canJoinEvents: boolean;
  canCreateEvents: boolean;
  canChangeName: boolean;
  canRequestDobCorrection: boolean;
}

export const PLAN_ENTITLEMENT_MATRIX: Record<PlanCode, UserEntitlements> = {
  [PlanCode.FREE]: {
    planCode: PlanCode.FREE,
    planName: "Free",
    isPaid: false,
    isPro: false,
    swipesLimitPerWindow: 25,
    canRewind: false,
    whoLikedYouLimit: 0,
    canSelectCity: false,
    canUseDistanceFilter: false,
    locationChangesRemaining: 3,
    maxFreeLocationChanges: 3,
    hasAds: true,
    canAccessEvents: false,
    canJoinEvents: false,
    canCreateEvents: false,
    canChangeName: false,
    canRequestDobCorrection: false,
  },
  [PlanCode.TIER_49]: {
    planCode: PlanCode.TIER_49,
    planName: "₹49 / 15 Days",
    isPaid: true,
    isPro: false,
    swipesLimitPerWindow: null, // Unlimited
    canRewind: false,
    whoLikedYouLimit: 10,
    canSelectCity: false,
    canUseDistanceFilter: false,
    locationChangesRemaining: 3,
    maxFreeLocationChanges: 3,
    hasAds: true,
    canAccessEvents: false,
    canJoinEvents: false,
    canCreateEvents: false,
    canChangeName: false,
    canRequestDobCorrection: false,
  },
  [PlanCode.TIER_149]: {
    planCode: PlanCode.TIER_149,
    planName: "₹149 / 15 Days",
    isPaid: true,
    isPro: false,
    swipesLimitPerWindow: null, // Unlimited
    canRewind: true,
    whoLikedYouLimit: Infinity, // Unlimited
    canSelectCity: true,
    canUseDistanceFilter: true,
    locationChangesRemaining: Infinity,
    maxFreeLocationChanges: 3,
    hasAds: false,
    canAccessEvents: false,
    canJoinEvents: false,
    canCreateEvents: false,
    canChangeName: false,
    canRequestDobCorrection: false,
  },
  [PlanCode.PRO_499]: {
    planCode: PlanCode.PRO_499,
    planName: "₹499 PRO / 10 Days",
    isPaid: true,
    isPro: true,
    swipesLimitPerWindow: null, // Unlimited
    canRewind: true,
    whoLikedYouLimit: Infinity, // Unlimited
    canSelectCity: true,
    canUseDistanceFilter: true,
    locationChangesRemaining: Infinity,
    maxFreeLocationChanges: 3,
    hasAds: false,
    canAccessEvents: true,
    canJoinEvents: true,
    canCreateEvents: true,
    canChangeName: true,
    canRequestDobCorrection: true,
  },
};

/**
 * Pure function to resolve entitlements for a plan code.
 * Defaults safely to FREE tier if none provided or unknown.
 */
export function getEntitlementsForPlan(planCode?: PlanCode | null): UserEntitlements {
  if (!planCode || !PLAN_ENTITLEMENT_MATRIX[planCode]) {
    return PLAN_ENTITLEMENT_MATRIX[PlanCode.FREE];
  }
  return PLAN_ENTITLEMENT_MATRIX[planCode];
}

/**
 * Resolves active subscription and returns calculated server-side entitlements.
 */
export function resolveUserEntitlements(activeSubscription?: {
  plan: { code: PlanCode };
  endDate: Date;
  status: string;
} | null): UserEntitlements {
  if (!activeSubscription) {
    return PLAN_ENTITLEMENT_MATRIX[PlanCode.FREE];
  }

  // Ensure active status and non-expired
  const isCurrentlyActive =
    activeSubscription.status === "ACTIVE" &&
    new Date(activeSubscription.endDate) > new Date();

  if (!isCurrentlyActive) {
    return PLAN_ENTITLEMENT_MATRIX[PlanCode.FREE];
  }

  return getEntitlementsForPlan(activeSubscription.plan.code);
}
