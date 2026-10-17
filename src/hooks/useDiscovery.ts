"use client";

import { useState, useEffect, useCallback } from "react";

export interface DiscoveryCandidate {
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

export interface MatchCelebration {
  id: string;
  conversationId: string;
  matchedUser: {
    id: string;
    name: string;
    photoUrl: string | null;
  };
}

export interface SwipeLimitInfo {
  resetAt: string;
  secondsUntilReset: number;
  planCode: string;
}

export function useDiscovery() {
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<MatchCelebration | null>(null);
  const [swipeLimitInfo, setSwipeLimitInfo] = useState<SwipeLimitInfo | null>(null);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);
  const [canRewind, setCanRewind] = useState<boolean>(false);
  const [swipeCount, setSwipeCount] = useState<number>(0);
  const [swipesRemaining, setSwipesRemaining] = useState<number | null>(null);
  const [totalLimit, setTotalLimit] = useState<number | null>(null);
  const [showLearningReminder, setShowLearningReminder] = useState<boolean>(false);

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/discovery/feed");
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load discovery feed");
      }
      const data = await res.json();
      setCandidates(data.candidates || []);
      setCurrentIndex(0);

      if (typeof data.swipeCount === "number") {
        setSwipeCount(data.swipeCount);
        if (data.swipeCount > 0 && data.swipeCount % 5 === 0 && (data.swipesRemaining ?? 0) > 0) {
          setShowLearningReminder(true);
        }
      }
      if (data.swipesRemaining !== undefined) setSwipesRemaining(data.swipesRemaining);
      if (data.totalLimit !== undefined) setTotalLimit(data.totalLimit);
    } catch (err: any) {
      setError(err.message || "Failed to load feed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const currentCandidate = candidates[currentIndex] || null;

  const swipe = async (action: "LIKE" | "PASS") => {
    if (!currentCandidate || isSwiping) return;

    setIsSwiping(true);
    const targetUserId = currentCandidate.userId;

    try {
      const res = await fetch("/api/discovery/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setSwipeLimitInfo({
          resetAt: data.resetAt,
          secondsUntilReset: data.secondsUntilReset,
          planCode: data.planCode,
        });
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to perform swipe");
      }

      const data = await res.json();

      // Track swipe counts and 5-like milestone reminder
      if (typeof data.swipeCount === "number") {
        setSwipeCount(data.swipeCount);
        if (data.swipeCount % 5 === 0 && (data.swipesRemaining ?? 0) > 0) {
          setShowLearningReminder(true);
        }
      }
      if (data.swipesRemaining !== undefined) setSwipesRemaining(data.swipesRemaining);
      if (data.totalLimit !== undefined) setTotalLimit(data.totalLimit);

      // If matched, show celebration modal
      if (data.isMatch && data.match) {
        setActiveMatch(data.match);
      }

      // Allow rewind if it was a PASS
      if (action === "PASS") {
        setCanRewind(true);
      } else {
        setCanRewind(false);
      }

      // Advance to next candidate
      setCurrentIndex((prev) => prev + 1);
    } catch (err: any) {
      console.error("Swipe failed:", err);
      alert(err.message || "Failed to swipe");
    } finally {
      setIsSwiping(false);
    }
  };

  const rewind = async () => {
    if (isSwiping) return;
    setIsSwiping(true);

    try {
      const res = await fetch("/api/discovery/rewind", {
        method: "POST",
      });

      if (res.status === 403) {
        alert("Rewind is a premium feature available on ₹149 and PRO plans. Upgrade in Plan settings!");
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Cannot rewind");
      }

      const data = await res.json();
      if (data.candidate) {
        // Prepend rewound candidate to deck
        setCandidates((prev) => [data.candidate, ...prev.slice(currentIndex)]);
        setCurrentIndex(0);
      } else if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
      setCanRewind(false);
    } catch (err: any) {
      alert(err.message || "Failed to rewind");
    } finally {
      setIsSwiping(false);
    }
  };

  return {
    candidates,
    currentCandidate,
    hasMore: currentIndex < candidates.length,
    isLoading,
    error,
    isSwiping,
    canRewind,
    activeMatch,
    setActiveMatch,
    swipeLimitInfo,
    setSwipeLimitInfo,
    swipe,
    rewind,
    refresh: fetchFeed,
    swipeCount,
    swipesRemaining,
    totalLimit,
    showLearningReminder,
    setShowLearningReminder,
  };
}
