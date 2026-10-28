import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./db";
import { verifySessionToken, createSessionToken, SessionPayload } from "./auth-crypto";
import { config } from "./config";
import { resolveUserEntitlements, UserEntitlements } from "./entitlements";
import { UserRole, UserStatus } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  lastActiveAt: Date;
  profile: {
    id: string;
    name: string;
    dob: Date;
    age: number;
    gender: string;
    interestedIn: string;
    city: string;
    bio: string | null;
    profession: string | null;
    education: string | null;
    height: number | null;
    relationshipIntention: string;
    isNameLocked: boolean;
    photos: Array<{
      id: string;
      url: string;
      order: number;
      isPrimary: boolean;
      status: string;
    }>;
  } | null;
  activeSubscription: {
    id: string;
    planId: string;
    status: string;
    startDate: Date;
    endDate: Date;
    plan: {
      code: any;
      name: string;
      priceInPaise: number;
      durationDays: number;
      isPro: boolean;
    };
  } | null;
  entitlements: UserEntitlements;
}

/**
 * Sets the secure session cookie on the response.
 */
export async function setSessionCookie(payload: SessionPayload): Promise<string> {
  const token = await createSessionToken(payload);
  const cookieStore = cookies();
  
  cookieStore.set(config.auth.cookieName, token, {
    httpOnly: true,
    secure: config.app.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: config.auth.sessionTtlSeconds,
  });

  return token;
}

/**
 * Clears the session cookie on logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(config.auth.cookieName);
}

/**
 * Retrieves the current session token from cookies or request headers.
 */
export async function getSessionToken(req?: NextRequest): Promise<string | null> {
  if (req) {
    const cookieVal = req.cookies.get(config.auth.cookieName)?.value;
    if (cookieVal) return cookieVal;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);
  }
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(config.auth.cookieName);
    return sessionCookie?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Retrieves and validates the current authenticated user from the session cookie or request.
 * Also touches `lastActiveAt` if more than 15 minutes have passed (auto-reactivating inactive users).
 */
export async function getCurrentUser(req?: NextRequest): Promise<AuthenticatedUser | null> {
  const token = await getSessionToken(req);
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload || !payload.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      profile: {
        include: {
          photos: {
            orderBy: { order: "asc" },
          },
        },
      },
      subscriptions: {
        where: {
          status: "ACTIVE",
          endDate: { gt: new Date() },
        },
        include: {
          plan: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user || user.status === "BANNED" || user.status === "DELETED") {
    return null;
  }

  // Auto-reactivate / touch lastActiveAt if more than 15 minutes since last update
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  if (user.lastActiveAt < fifteenMinutesAgo) {
    // Fire and forget update
    prisma.user
      .update({
        where: { id: user.id },
        data: { lastActiveAt: now },
      })
      .catch((err) => console.error("Failed to touch lastActiveAt:", err));
  }

  const activeSub = user.subscriptions[0] || null;
  const baseEntitlements = resolveUserEntitlements(activeSub);
  
  // Calculate dynamic free location changes remaining
  const locationChangeCount = user.profile?.locationChangeCount ?? 0;
  const isPaidUnlimited = baseEntitlements.canSelectCity; // ₹149 and ₹499 have unlimited
  const locationChangesRemaining = isPaidUnlimited
    ? Infinity
    : Math.max(0, 3 - locationChangeCount);

  const entitlements = {
    ...baseEntitlements,
    locationChangesRemaining,
    maxFreeLocationChanges: 3,
    // If user has free location changes remaining, allow selecting city
    canSelectCity: isPaidUnlimited || locationChangesRemaining > 0,
  };

  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    lastActiveAt: user.lastActiveAt,
    profile: user.profile
      ? {
          id: user.profile.id,
          name: user.profile.name,
          dob: user.profile.dob,
          age: user.profile.age,
          gender: user.profile.gender,
          interestedIn: user.profile.interestedIn,
          city: user.profile.city,
          bio: user.profile.bio,
          profession: user.profile.profession,
          education: user.profile.education,
          height: user.profile.height,
          relationshipIntention: user.profile.relationshipIntention,
          isNameLocked: user.profile.isNameLocked,
          photos: user.profile.photos.map((p) => ({
            id: p.id,
            url: p.url,
            order: p.order,
            isPrimary: p.isPrimary,
            status: p.status,
          })),
        }
      : null,
    activeSubscription: activeSub
      ? {
          id: activeSub.id,
          planId: activeSub.planId,
          status: activeSub.status,
          startDate: activeSub.startDate,
          endDate: activeSub.endDate,
          plan: {
            code: activeSub.plan.code,
            name: activeSub.plan.name,
            priceInPaise: activeSub.plan.priceInPaise,
            durationDays: activeSub.plan.durationDays,
            isPro: activeSub.plan.isPro,
          },
        }
      : null,
    entitlements,
  };
}
