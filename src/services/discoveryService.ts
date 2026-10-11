import { prisma } from "@/lib/db";
import { AuthenticatedUser } from "@/lib/session";
import { Prisma } from "@prisma/client";

export interface DiscoveryFeedOptions {
  user: AuthenticatedUser;
  requestedCity?: string | null;
  minAgeParam?: string | null;
  maxAgeParam?: string | null;
  cursor?: string | null;
  limit?: number;
}

export interface CandidateCard {
  userId: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  bio: string | null;
  profession: string | null;
  education: string | null;
  height: number | null;
  relationshipIntention: string;
  isVerified: boolean;
  photos: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
    order: number;
  }>;
  interests: Array<{
    id: string;
    name: string;
    icon: string | null;
  }>;
}

export interface DiscoveryFeedResult {
  candidates: CandidateCard[];
  totalCount: number;
  cityFiltered: string;
  canSelectCity: boolean;
  nextCursor: string | null;
}

/**
 * High-performance discovery feed service.
 * Leverages single-query relational NOT EXISTS filtering in Prisma
 * to eliminate N+1 sub-queries and avoids loading thousands of IDs in-memory.
 */
export async function getDiscoveryFeed(
  options: DiscoveryFeedOptions
): Promise<DiscoveryFeedResult> {
  const { user, requestedCity, minAgeParam, maxAgeParam, cursor, limit = 20 } = options;

  if (!user.profile) {
    throw new Error("PROFILE_REQUIRED");
  }

  // City constraint: Free and ₹49 plans are locked to current user's city
  let filterCity: string | undefined = user.profile.city;
  if (user.entitlements.canSelectCity && requestedCity) {
    filterCity = requestedCity.trim();
  }

  // Age bounds
  const minAge = minAgeParam ? Math.max(18, parseInt(minAgeParam, 10)) : 18;
  const maxAge = maxAgeParam ? Math.min(99, parseInt(maxAgeParam, 10)) : 99;

  // Inactivity threshold: Users inactive for > 7 days are excluded
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Gender preferences
  let targetGenders: string[] = [];
  if (user.profile.interestedIn === "MEN") {
    targetGenders = ["MALE", "MAN"];
  } else if (user.profile.interestedIn === "WOMEN") {
    targetGenders = ["FEMALE", "WOMAN"];
  }

  // Build high-efficiency where clause using direct relational filters
  const whereClause: Prisma.UserWhereInput = {
    id: { not: user.id },
    status: "ACTIVE",
    lastActiveAt: { gte: sevenDaysAgo },
    // Direct relational exclusion filters (Push filtering to PostgreSQL engine)
    likesReceived: {
      none: { fromUserId: user.id },
    },
    passesReceived: {
      none: { fromUserId: user.id },
    },
    blocksReceived: {
      none: { blockerId: user.id },
    },
    blocksInitiated: {
      none: { blockedUserId: user.id },
    },
    matchesAsUser1: {
      none: { user2Id: user.id, status: "ACTIVE" },
    },
    matchesAsUser2: {
      none: { user1Id: user.id, status: "ACTIVE" },
    },
    profile: {
      ...(filterCity ? { city: { equals: filterCity, mode: "insensitive" } } : {}),
      ...(targetGenders.length > 0 ? { gender: { in: targetGenders } } : {}),
      age: {
        gte: minAge,
        lte: maxAge,
      },
    },
  };

  const takeAmount = Math.min(Math.max(1, limit), 50);

  // Fetch candidates with exact fields selection
  const candidates = await prisma.user.findMany({
    where: whereClause,
    take: takeAmount + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ lastActiveAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      isVerified: true,
      lastActiveAt: true,
      profile: {
        select: {
          name: true,
          age: true,
          gender: true,
          city: true,
          bio: true,
          profession: true,
          education: true,
          height: true,
          relationshipIntention: true,
          photos: {
            where: { status: "APPROVED" },
            orderBy: { order: "asc" },
            select: {
              id: true,
              url: true,
              isPrimary: true,
              order: true,
            },
          },
          interests: {
            select: {
              interest: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                },
              },
            },
          },
        },
      },
    },
  });

  let nextCursor: string | null = null;
  let itemsToReturn = candidates;
  if (candidates.length > takeAmount) {
    const nextItem = candidates[takeAmount];
    nextCursor = nextItem.id;
    itemsToReturn = candidates.slice(0, takeAmount);
  }

  const feed: CandidateCard[] = itemsToReturn
    .filter((c) => c.profile !== null)
    .map((c) => {
      const p = c.profile!;
      return {
        userId: c.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        city: p.city,
        bio: p.bio,
        profession: p.profession,
        education: p.education,
        height: p.height,
        relationshipIntention: p.relationshipIntention,
        isVerified: c.isVerified,
        photos: p.photos,
        interests: p.interests.map((pi) => pi.interest),
      };
    });

  return {
    candidates: feed,
    totalCount: feed.length,
    cityFiltered: filterCity || "ANY",
    canSelectCity: user.entitlements.canSelectCity,
    nextCursor,
  };
}
