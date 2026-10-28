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
  promptQuestion?: string | null;
  promptAnswer?: string | null;
  anthemTitle?: string | null;
  anthemArtist?: string | null;
  anthemCoverUrl?: string | null;
  voicePromptUrl?: string | null;
  voicePromptDuration?: number | null;
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
          promptQuestion: true,
          promptAnswer: true,
          anthemTitle: true,
          anthemArtist: true,
          anthemCoverUrl: true,
          voicePromptUrl: true,
          voicePromptDuration: true,
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

  const defaultPrompts = [
    { question: "I feel happiest when...", answer: "I'm around dogs and away from drama." },
    { question: "Together, we could...", answer: "Explore cute cozy cafes and debate who has better music taste." },
    { question: "The key to my heart is...", answer: "Warm banter, thoughtful gestures, and spontaneous road trips." },
    { question: "I'm looking for someone who...", answer: "Knows how to communicate with honesty and isn't afraid to laugh at themselves." },
  ];

  const defaultAnthems = [
    { title: "Tum Ho Toh (From \"Saiyaara\")", artist: "Vishal Mishra · Spotify", coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200" },
    { title: "Kesariya (From \"Brahmastra\")", artist: "Arijit Singh · Spotify", coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200" },
    { title: "Apna Bana Le", artist: "Arijit Singh, Sachin-Jigar · Spotify", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200" },
  ];

  const defaultVoiceNotes = [
    { url: "/uploads/audio/lisa_voice.wav", duration: 10 },
    { url: "/uploads/audio/aanya_voice.wav", duration: 9 },
    { url: "/uploads/audio/aarav_voice.wav", duration: 9 },
    { url: "/uploads/audio/priya_voice.wav", duration: 8 },
  ];

  const feed: CandidateCard[] = itemsToReturn
    .filter((c) => c.profile !== null)
    .map((c, index) => {
      const p = c.profile!;
      const promptFallback = defaultPrompts[index % defaultPrompts.length];
      const anthemFallback = defaultAnthems[index % defaultAnthems.length];
      const voiceFallback = defaultVoiceNotes[index % defaultVoiceNotes.length];

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
        promptQuestion: p.promptQuestion || promptFallback.question,
        promptAnswer: p.promptAnswer || promptFallback.answer,
        anthemTitle: p.anthemTitle || anthemFallback.title,
        anthemArtist: p.anthemArtist || anthemFallback.artist,
        anthemCoverUrl: p.anthemCoverUrl || anthemFallback.coverUrl,
        voicePromptUrl: p.voicePromptUrl || voiceFallback.url,
        voicePromptDuration: p.voicePromptDuration || voiceFallback.duration,
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
