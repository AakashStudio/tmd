"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useDiscovery } from "@/hooks/useDiscovery";
import { AuthModal } from "@/components/auth/AuthModal";
import { OnboardingWizard } from "@/components/profile/OnboardingWizard";
import { BottomNav } from "@/components/navigation/BottomNav";
import { DiscoveryCard } from "@/components/discovery/DiscoveryCard";
import { SwipeControls } from "@/components/discovery/SwipeControls";
import { MatchModal } from "@/components/discovery/MatchModal";
import { SwipeLimitModal } from "@/components/discovery/SwipeLimitModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Sparkles, RefreshCw, Flame, ShieldCheck, Heart } from "lucide-react";
import Link from "next/link";

import { SplashScreen } from "@/components/auth/SplashScreen";
import { MeetupAuthHero } from "@/components/auth/MeetupAuthHero";
import { ProfileDetailSheet } from "@/components/discovery/ProfileDetailSheet";

export default function HomePage() {
  const { user, isLoading: authLoading, hasProfile, refreshUser } = useAuth();
  const { profile, entitlements, isLoading: profileLoading, refreshProfile } = useProfile();
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState<boolean>(false);

  const {
    candidates,
    currentCandidate,
    hasMore,
    isLoading: feedLoading,
    isSwiping,
    canRewind,
    activeMatch,
    setActiveMatch,
    swipeLimitInfo,
    setSwipeLimitInfo,
    swipe,
    rewind,
    refresh,
    swipeCount,
    swipesRemaining,
    totalLimit,
    showLearningReminder,
    setShowLearningReminder,
  } = useDiscovery();

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} durationMs={1800} />;
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#FFC629] border-t-transparent animate-spin" />
          <p className="text-xs text-[#9e9ea8]">Loading TMD...</p>
        </div>
      </div>
    );
  }

  // 1. Not Authenticated State -> Meetup Design Auth Hero
  if (!user) {
    return (
      <div className="min-h-screen bg-[#08080b] flex flex-col items-center justify-center sm:py-6 sm:px-4 w-full overflow-x-hidden">
        <MeetupAuthHero
          onSuccess={() => {
            refreshUser();
            refreshProfile();
          }}
        />
      </div>
    );
  }

  // 2. Authenticated but Incomplete Profile -> Onboarding Flow
  if (!hasProfile || !profile) {
    return (
      <main className="min-h-[100dvh] bg-[#08080b] text-white px-4 sm:px-6 py-6 sm:py-10 max-w-md w-full mx-auto flex flex-col justify-center box-border overflow-x-hidden">
        <OnboardingWizard
          onCompleted={() => {
            refreshUser();
            refreshProfile();
          }}
        />
      </main>
    );
  }

  // 3. Authenticated & Onboarded -> Core Dating Discovery Engine
  const currentUserPhoto = profile.photos?.find((p) => p.isPrimary)?.url || profile.photos?.[0]?.url;

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col items-center justify-start sm:py-6 sm:px-4 w-full overflow-x-hidden">
      <div className="min-h-screen sm:min-h-[844px] sm:max-h-[92vh] bg-[#0a0a0c] text-white pb-24 max-w-md w-full mx-auto flex flex-col justify-between sm:rounded-3xl sm:border sm:border-white/[0.08] sm:shadow-2xl overflow-x-hidden relative box-border">
        {/* Top Bar */}
      <header className="px-5 py-3 border-b border-[#1e1e26] flex items-center justify-between sticky top-0 bg-[#0a0a0c]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#D4AF37] via-[#F59E0B] to-[#FFC629] flex items-center justify-center font-black text-sm text-black shadow-md shadow-amber-500/30">
            TMD
          </div>
          <span className="font-bold text-sm tracking-tight">The Match Date</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/plan">
            <Badge variant={entitlements?.isPro ? "pro" : "neutral"} className="cursor-pointer">
              {entitlements?.isPro ? "PRO Tier" : "Upgrade"}
            </Badge>
          </Link>
          <Link href="/settings">
            <div className="w-8 h-8 rounded-full border border-zinc-700 overflow-hidden bg-zinc-800">
              {currentUserPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentUserPhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs">👤</div>
              )}
            </div>
          </Link>
        </div>
      </header>

      {/* Main Discovery Deck Area */}
      <main className="flex-1 px-5 py-2 flex flex-col items-center justify-start relative max-w-md w-full mx-auto">
        {feedLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#FFC629] border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-400">Finding dates near {profile.city}...</p>
          </div>
        ) : hasMore && currentCandidate ? (
          <div className="w-full flex flex-col items-center space-y-2">
            {/* Top 5-Likes Milestone Reminder Pill (Learning your type) */}
            {showLearningReminder && swipesRemaining !== null && swipesRemaining > 0 && (
              <div className="w-full max-w-sm mx-auto mb-1 animate-in slide-in-from-top-2 fade-in duration-300">
                <div className="w-full bg-white text-black rounded-full px-4 py-2.5 flex items-center justify-between shadow-2xl shadow-black/50 border border-white/20 select-none">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center shrink-0">
                      <Heart className="w-3.5 h-3.5 fill-[#FFC629] text-[#FFC629] animate-pulse" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-black text-zinc-900 leading-tight">
                        Learning your type
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-600 leading-tight">
                        Send {swipesRemaining} more Likes to get started
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLearningReminder(false)}
                    className="w-5 h-5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center text-[10px] font-bold transition ml-2 shrink-0 cursor-pointer"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Card Deck */}
            <DiscoveryCard
              candidate={currentCandidate}
              onOpenProfile={() => setIsProfileSheetOpen(true)}
            />

            {/* Bottom Swipe Action Controls */}
            <SwipeControls
              onPass={() => swipe("PASS")}
              onLike={() => swipe("LIKE")}
              onRewind={rewind}
              disabled={isSwiping}
              canRewind={Boolean(canRewind && entitlements?.canRewind)}
            />

            {/* Full Profile Details Sheet (Matches User Reference Screenshots) */}
            <ProfileDetailSheet
              candidate={currentCandidate}
              isOpen={isProfileSheetOpen}
              onClose={() => setIsProfileSheetOpen(false)}
              onLike={(options) => swipe("LIKE", options)}
              onPass={() => swipe("PASS")}
            />
          </div>
        ) : (
          /* Empty Discovery State */
          <div className="w-full max-w-xs text-center py-12 px-4 space-y-5 animate-in fade-in">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
              <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">All Caught Up!</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                You&apos;ve seen all active profiles in <span className="text-zinc-200 font-semibold">{profile.city}</span> for now. Check back soon for new singles joining TMD.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={refresh}
                className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Check for New Profiles
              </button>
              {!entitlements?.canSelectCity && (
                <Link
                  href="/plan"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F59E0B]/20 to-[#FFC629]/20 border border-amber-400/40 text-amber-300 text-xs font-semibold hover:bg-amber-400/30 transition text-center"
                >
                  Unlock Any City & Distance with Plus (₹149) →
                </Link>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Reciprocal Match Celebration Modal */}
      {activeMatch && (
        <MatchModal
          match={activeMatch}
          currentUserPhotoUrl={currentUserPhoto}
          onClose={() => setActiveMatch(null)}
        />
      )}

      {/* Swipe Limit Exhaustion Modal */}
      {swipeLimitInfo && (
        <SwipeLimitModal
          info={swipeLimitInfo}
          onClose={() => setSwipeLimitInfo(null)}
        />
      )}

      <BottomNav />
      </div>
    </div>
  );
}
