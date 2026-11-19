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
import { Sparkles, RefreshCw, Flame, ShieldCheck, Heart, MapPin, Compass, ChevronDown } from "lucide-react";
import Link from "next/link";

import { SplashScreen } from "@/components/auth/SplashScreen";
import { MeetupAuthHero } from "@/components/auth/MeetupAuthHero";
import { ProfileDetailSheet } from "@/components/discovery/ProfileDetailSheet";
import { LocationPickerModal } from "@/components/profile/LocationPickerModal";

export default function HomePage() {
  const { user, isLoading: authLoading, hasProfile, refreshUser } = useAuth();
  const { profile, entitlements, isLoading: profileLoading, refreshProfile, updateProfile } = useProfile();
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState<boolean>(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [isSavingLocation, setIsSavingLocation] = useState<boolean>(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);

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

  const handleSaveLocation = async (loc: {
    city: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    setIsSavingLocation(true);
    try {
      await updateProfile({
        city: loc.city,
        state: loc.state || null,
        country: loc.country || "India",
        ...(loc.latitude ? { latitude: loc.latitude } : {}),
        ...(loc.longitude ? { longitude: loc.longitude } : {}),
      });
      setIsLocationModalOpen(false);
      setLocationToast(`Location switched to ${loc.city}! 📍`);
      setTimeout(() => setLocationToast(null), 3000);
      await refresh();
    } catch (err: any) {
      alert(err.message || "Failed to update location");
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleQuickSwitchCity = async (cityName: string, stateName?: string) => {
    setIsSavingLocation(true);
    try {
      await updateProfile({
        city: cityName,
        state: stateName || null,
        country: "India",
      });
      setLocationToast(`Switched to ${cityName}! 📍`);
      setTimeout(() => setLocationToast(null), 3000);
      await refresh();
    } catch (err: any) {
      alert(err.message || "Failed to switch city");
    } finally {
      setIsSavingLocation(false);
    }
  };

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
      <div className="min-h-screen bg-[#08080b] flex flex-col items-center justify-start py-4 sm:py-8 px-3 sm:px-4 w-full box-border overflow-x-hidden">
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
      <div className="min-h-screen bg-[#08080b] flex flex-col items-center justify-start py-4 sm:py-8 px-3 sm:px-4 w-full box-border overflow-x-hidden">
        <OnboardingWizard
          onCompleted={() => {
            refreshUser();
            refreshProfile();
          }}
        />
      </div>
    );
  }

  // 3. Authenticated & Onboarded -> Core Dating Discovery Engine
  const currentUserPhoto = profile.photos?.find((p) => p.isPrimary)?.url || profile.photos?.[0]?.url;

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col items-center justify-start py-4 sm:py-8 px-3 sm:px-4 w-full box-border overflow-x-hidden">
      <div className="w-full max-w-md bg-[#0c0c10] text-white rounded-3xl border border-white/[0.08] shadow-2xl relative box-border overflow-hidden flex flex-col justify-between pb-24">
        {/* Top Bar */}
      <header className="px-5 py-3 border-b border-[#1e1e26] flex items-center justify-between sticky top-0 bg-[#0a0a0c]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#D4AF37] via-[#F59E0B] to-[#FFC629] flex items-center justify-center font-black text-sm text-black shadow-md shadow-amber-500/30">
            TMD
          </div>
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-400/40 text-xs font-semibold text-zinc-200 transition active:scale-95 cursor-pointer"
            title="Change Discovery Location"
          >
            <MapPin className="w-3 h-3 text-[#FFC629]" />
            <span className="max-w-[100px] truncate">{profile.city || "Select City"}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>
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
                <img
                  src={currentUserPhoto}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs">👤</div>
              )}
            </div>
          </Link>
        </div>
      </header>

      {/* Floating Location Toast */}
      {locationToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900/95 border border-amber-400/50 text-amber-300 text-xs font-bold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 fade-in">
          {locationToast}
        </div>
      )}

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
          /* Empty Discovery State -> Location Range Booster Card */
          <div className="w-full max-w-sm text-center py-4 px-2 space-y-4 animate-in fade-in">
            {/* Top Sparkle & Header */}
            <div className="space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
                <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">All Caught Up!</h3>
                <p className="text-xs text-zinc-400 leading-relaxed px-2">
                  You&apos;ve seen all active profiles in{" "}
                  <span className="text-amber-300 font-bold">{profile.city}</span> for now.
                </p>
              </div>
            </div>

            {/* Prominent Location Card (Range Booster) */}
            <div className="w-full rounded-2xl bg-gradient-to-b from-[#181822] to-[#121217] border border-amber-500/30 p-4 space-y-3.5 shadow-2xl text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5 text-[#FFC629]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 block">
                      Location & Matches Booster
                    </span>
                    <h4 className="text-sm font-black text-white flex items-center gap-1">
                      <span>Expand Discovery Range</span>
                    </h4>
                  </div>
                </div>
                {entitlements?.isPro || entitlements?.planCode === "TIER_149" ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                    ⚡ Unlimited
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {entitlements?.locationChangesRemaining ?? 3} Free Left
                  </span>
                )}
              </div>

              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Yahan matches khatam ho gaye? Location change karke doosre shehar ke verified singles ko unlock karein aur matches ki range badhayein!
              </p>

              {/* Big Change Location Button */}
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                disabled={isSavingLocation}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] text-black font-extrabold text-xs tracking-wide shadow-lg shadow-amber-500/20 hover:brightness-105 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-black" />
                <span>{isSavingLocation ? "Updating Location..." : "Change City / Location 📍"}</span>
              </button>

              {/* Quick Hubs 1-Tap Switch */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <span>🔥</span> Or Explore Popular Hubs:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { city: "Indore", state: "Madhya Pradesh" },
                    { city: "Bhopal", state: "Madhya Pradesh" },
                    { city: "Delhi", state: "Delhi" },
                    { city: "Mumbai", state: "Maharashtra" },
                    { city: "Pune", state: "Maharashtra" },
                    { city: "Bangalore", state: "Karnataka" },
                  ].map((hub) => (
                    <button
                      key={hub.city}
                      type="button"
                      disabled={isSavingLocation || profile.city?.toLowerCase() === hub.city.toLowerCase()}
                      onClick={() => handleQuickSwitchCity(hub.city, hub.state)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition active:scale-95 ${
                        profile.city?.toLowerCase() === hub.city.toLowerCase()
                          ? "bg-[#FFC629] text-black cursor-default"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-amber-400/40 hover:text-white cursor-pointer"
                      }`}
                    >
                      📍 {hub.city}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Check Again / Plan Upsell */}
            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={refresh}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Check {profile.city} Again
              </button>
              {!entitlements?.canSelectCity && (
                <Link
                  href="/plan"
                  className="w-full py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[11px] font-semibold hover:bg-amber-400/20 transition text-center"
                >
                  Unlock Unlimited City Hopping with Plus (₹149) →
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

      {/* Worldwide Country / State / City Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentCity={profile?.city}
        currentState={profile?.state}
        currentCountry={profile?.country}
        onSave={handleSaveLocation}
        isSaving={isSavingLocation}
      />

      <BottomNav />
      </div>
    </div>
  );
}
