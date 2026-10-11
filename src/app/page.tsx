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

export default function HomePage() {
  const { user, isLoading: authLoading, hasProfile, refreshUser } = useAuth();
  const { profile, entitlements, isLoading: profileLoading, refreshProfile } = useProfile();
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

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
  } = useDiscovery();

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#ff1475] border-t-transparent animate-spin" />
          <p className="text-xs text-[#9e9ea8]">Loading TMD...</p>
        </div>
      </div>
    );
  }

  // 1. Not Authenticated State -> Welcome Landing
  if (!user) {
    return (
      <main className="min-h-screen bg-[#0a0a0c] text-white flex flex-col justify-center px-5 py-8 max-w-md mx-auto">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-lg bg-gradient-to-tr from-[#ff1475] to-[#ff6b8b] flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-[#ff1475]/30">
            TMD
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            The Match Date
          </h1>
          <p className="text-xs text-[#9e9ea8] max-w-xs mx-auto leading-relaxed">
            Real dates. Real people. Verified connections and live local events.
          </p>
        </div>

        <div className="space-y-2.5 my-6">
          <Card className="flex items-center gap-3 bg-[#14141a]/80 p-3">
            <Flame className="w-5 h-5 text-[#ff1475] shrink-0" />
            <div className="text-left text-xs">
              <span className="font-bold text-white block">Focus on Genuine Matches</span>
              <span className="text-[#7a7a88]">No Super Likes, no vanity metrics. Just mutual interest.</span>
            </div>
          </Card>
          <Card className="flex items-center gap-3 bg-[#14141a]/80 p-3">
            <ShieldCheck className="w-5 h-5 text-[#10b981] shrink-0" />
            <div className="text-left text-xs">
              <span className="font-bold text-white block">Strict 18+ Verification</span>
              <span className="text-[#7a7a88]">Verified identities with strict safety policies.</span>
            </div>
          </Card>
        </div>

        <div className="space-y-2">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => setShowAuthModal(true)}
          >
            Get Started with Mobile OTP
          </Button>
          <p className="text-[11px] text-center text-[#5e5e6e]">
            By continuing, you confirm that you are at least 18 years of age.
          </p>
        </div>

        {showAuthModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <AuthModal
              onSuccess={() => {
                setShowAuthModal(false);
                refreshUser();
                refreshProfile();
              }}
              onCancel={() => setShowAuthModal(false)}
            />
          </div>
        )}
      </main>
    );
  }

  // 2. Authenticated but Incomplete Profile -> Onboarding Flow
  if (!hasProfile || !profile) {
    return (
      <main className="min-h-screen bg-[#0a0a0c] text-white px-5 py-8 max-w-md mx-auto">
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
    <div className="min-h-screen bg-[#0a0a0c] text-white pb-24 max-w-md mx-auto flex flex-col justify-between">
      {/* Top Bar */}
      <header className="px-5 py-3 border-b border-[#1e1e26] flex items-center justify-between sticky top-0 bg-[#0a0a0c]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#ff1475] to-[#ff6b8b] flex items-center justify-center font-black text-sm text-white shadow-md shadow-[#ff1475]/30">
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
            <div className="w-8 h-8 rounded-full border-2 border-[#ff1475] border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-400">Finding dates near {profile.city}...</p>
          </div>
        ) : hasMore && currentCandidate ? (
          <div className="w-full flex flex-col items-center space-y-2">
            {/* Card Deck */}
            <DiscoveryCard candidate={currentCandidate} />

            {/* Bottom Swipe Action Controls */}
            <SwipeControls
              onPass={() => swipe("PASS")}
              onLike={() => swipe("LIKE")}
              onRewind={rewind}
              disabled={isSwiping}
              canRewind={Boolean(canRewind && entitlements?.canRewind)}
            />
          </div>
        ) : (
          /* Empty Discovery State */
          <div className="w-full max-w-xs text-center py-12 px-4 space-y-5 animate-in fade-in">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
              <Sparkles className="w-10 h-10 text-rose-500 animate-pulse" />
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
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition text-center"
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
  );
}
