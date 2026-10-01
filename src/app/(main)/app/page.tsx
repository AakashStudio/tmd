'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, X, RotateCcw, Flame, MapPin, Briefcase, ChevronUp, ChevronDown, Sparkles, User, Info, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

interface DiscoveryProfile {
  userId: string;
  name: string;
  age: number;
  gender: string;
  bio: string | null;
  profession: string | null;
  city: string;
  relationshipIntention: string | null;
  isVerified: boolean;
  photos: { url: string; position: number }[];
  interests: string[];
}

export default function HomePage() {
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [showMatch, setShowMatch] = useState<any>(null);
  const [remainingSwipes, setRemainingSwipes] = useState<number | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [expandedInfo, setExpandedInfo] = useState(false);
  const [currentUserPlan, setCurrentUserPlan] = useState<string>('free');

  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  const fetchProfiles = useCallback(async () => {
    try {
      const [discoveryRes, meRes] = await Promise.all([
        fetch('/api/discovery'),
        fetch('/api/auth/me'),
      ]);
      const data = await discoveryRes.json();
      const meData = await meRes.json();

      if (meData.success && meData.data?.subscription) {
        setCurrentUserPlan(meData.data.subscription.planSlug || 'free');
      }

      if (data.success && Array.isArray(data.data)) {
        setProfiles(data.data);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Failed to fetch discovery profiles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (swiping || !profiles[currentIndex]) return;
    setSwiping(true);
    setSwipeDirection(action === 'like' ? 'right' : 'left');

    try {
      const res = await fetch('/api/discovery/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: profiles[currentIndex].userId,
          action,
        }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.data.remainingSwipes !== null && data.data.remainingSwipes !== undefined) {
          setRemainingSwipes(data.data.remainingSwipes);
        }
        if (data.data.isMatch) {
          setShowMatch({
            ...data.data.matchedUser,
            matchId: data.data.matchId,
          });
        }
      } else if (res.status === 429) {
        setRemainingSwipes(0);
      }

      setTimeout(() => {
        setSwipeDirection(null);
        setDragOffset(0);
        setCurrentIndex((prev) => prev + 1);
        setCurrentPhotoIndex(0);
        setExpandedInfo(false);

        if (currentIndex >= profiles.length - 2) {
          fetchProfiles();
        }
      }, 220);
    } catch (err) {
      console.error('Swipe error:', err);
    } finally {
      setTimeout(() => setSwiping(false), 220);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    const diff = currentX.current - startX.current;
    if (Math.abs(diff) > 80) {
      handleSwipe(diff > 0 ? 'like' : 'pass');
    } else {
      setDragOffset(0);
    }
  };

  const currentProfile = profiles[currentIndex];
  const noMoreProfiles = !loading && (!profiles.length || currentIndex >= profiles.length);

  const intentionLabels: Record<string, string> = {
    long_term: 'Long-term relationship',
    short_term: 'Short-term / casual',
    friendship: 'Friendship',
    not_sure: 'Not sure yet',
  };

  const canRewind = ['plus_149', 'pro_499'].includes(currentUserPlan);

  const handleRewind = () => {
    if (!canRewind) {
      window.location.href = '/app/plan';
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
      setCurrentPhotoIndex(0);
    }
  };

  // 12-Hour Swipe Limit State for Free Plan
  if (remainingSwipes === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center select-none">
        <div className="w-16 h-16 rounded-[8px] bg-[#141414] border border-[#242424] flex items-center justify-center mb-4 shadow-xl shadow-[#E91E63]/15">
          <Flame size={30} className="text-[#E91E63]" />
        </div>
        <h2 className="tmd-h1 text-white mb-2">10 Swipes Used</h2>
        <p className="tmd-body text-[#9E9E9E] max-w-xs mb-6">
          Free accounts receive 10 swipes every 12-hour window. Upgrade for unlimited instant discovery.
        </p>
        <Button onClick={() => window.location.href = '/app/plan'} size="lg" className="gap-2">
          <Sparkles size={16} /> Unlock Unlimited Swipes
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100dvh-4rem)] flex flex-col justify-between overflow-hidden select-none px-3.5 pt-2 pb-2">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between h-11 px-1 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[6px] bg-gradient-to-tr from-[#E91E63] to-[#FF6F61] flex items-center justify-center shadow-md shadow-[#E91E63]/25">
            <Flame size={16} className="text-white fill-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">TMD</span>
        </div>

        <div className="flex items-center gap-2">
          {remainingSwipes !== null && (
            <span className="text-[11px] font-bold bg-[#141414] border border-[#242424] text-[#FF6F61] px-2.5 py-1 rounded-[6px]">
              {remainingSwipes} swipes left
            </span>
          )}
        </div>
      </header>

      {/* Discovery Canvas */}
      <main className="flex-1 relative flex flex-col justify-center min-h-0 my-1">
        {loading && (
          <div className="w-full h-full flex items-center justify-center">
            <CardSkeleton />
          </div>
        )}

        {noMoreProfiles && (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#121212] border border-[#202020] rounded-[8px] shadow-2xl">
            <div className="w-14 h-14 rounded-[8px] bg-[#181818] border border-[#262626] flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-[#E91E63]" />
            </div>
            <h3 className="tmd-h2 text-white mb-2">You've seen everyone</h3>
            <p className="tmd-body-small text-[#9E9E9E] max-w-xs mb-6">
              There are no new profiles matching your filters right now. Expand your preferences or check back soon.
            </p>
            <Button variant="secondary" size="md" onClick={fetchProfiles}>
              Refresh Discovery
            </Button>
          </div>
        )}

        {currentProfile && (
          <div className="relative w-full h-full flex flex-col">
            {/* The Master Profile Card — Hero Photo Dominant */}
            <div
              ref={cardRef}
              style={{
                transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.04}deg)`,
                transition: dragOffset === 0 ? 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
              }}
              className={`relative flex-1 w-full rounded-[8px] overflow-hidden bg-[#141414] border border-[#222222] shadow-2xl transition-opacity duration-200 ${
                swipeDirection === 'left' ? '-translate-x-[120%] -rotate-12 opacity-0' :
                swipeDirection === 'right' ? 'translate-x-[120%] rotate-12 opacity-0' : ''
              }`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Dynamic Like/Pass Indicator Stamps */}
              {dragOffset > 25 && (
                <div className="absolute top-6 left-6 z-40 border-2 border-[#10B981] text-[#10B981] px-3 py-1 rounded-[6px] font-black text-lg uppercase tracking-wider rotate-[-10deg] bg-black/70 backdrop-blur-sm pointer-events-none shadow-xl">
                  LIKE
                </div>
              )}
              {dragOffset < -25 && (
                <div className="absolute top-6 right-6 z-40 border-2 border-[#EF4444] text-[#EF4444] px-3 py-1 rounded-[6px] font-black text-lg uppercase tracking-wider rotate-[10deg] bg-black/70 backdrop-blur-sm pointer-events-none shadow-xl">
                  PASS
                </div>
              )}

              {/* Full-bleed Photo Container */}
              <div className="relative w-full h-full bg-[#181818] overflow-hidden">
                <img
                  src={currentProfile.photos[currentPhotoIndex]?.url || currentProfile.photos[0]?.url}
                  alt={currentProfile.name}
                  className="w-full h-full object-cover object-top pointer-events-none select-none"
                  loading="eager"
                />

                {/* Photo Story Progress Bars */}
                {currentProfile.photos.length > 1 && (
                  <div className="absolute top-2.5 left-0 right-0 flex justify-center gap-1.5 px-3 z-30">
                    {currentProfile.photos.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 max-w-12 rounded-[2px] transition-all duration-150 ${
                          i === currentPhotoIndex ? 'bg-white shadow-sm' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Left/Right Tap Zones for Rapid Photo Browsing */}
                {currentProfile.photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-0 top-0 w-2/5 h-3/4 z-20 opacity-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1));
                      }}
                      aria-label="Previous photo"
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 w-2/5 h-3/4 z-20 opacity-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex(Math.min(currentProfile.photos.length - 1, currentPhotoIndex + 1));
                      }}
                      aria-label="Next photo"
                    />
                  </>
                )}

                {/* Smooth Dark Scrim Gradient for Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/50 to-transparent pointer-events-none" />

                {/* Information Layer Over Photo */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                        {currentProfile.name}, <span className="font-normal text-white/90">{currentProfile.age}</span>
                      </h2>
                      {currentProfile.isVerified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-black bg-[#E91E63] text-white px-1.5 py-0.5 rounded-[4px] shadow-sm tracking-wider">
                          <Check size={11} strokeWidth={3} /> VERIFIED
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedInfo(!expandedInfo)}
                      className="w-8 h-8 rounded-[8px] bg-black/40 border border-white/15 backdrop-blur-md hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Toggle profile details"
                    >
                      {expandedInfo ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-white/90">
                    <span className="flex items-center gap-1 font-semibold">
                      <MapPin size={13} className="text-[#FF6F61] flex-shrink-0" /> {currentProfile.city}
                    </span>
                    {currentProfile.profession && (
                      <>
                        <span className="text-white/40">•</span>
                        <span className="flex items-center gap-1 truncate text-white/85 font-medium">
                          <Briefcase size={13} className="text-[#A0A0A0] flex-shrink-0" /> {currentProfile.profession}
                        </span>
                      </>
                    )}
                  </div>

                  {currentProfile.relationshipIntention && (
                    <div>
                      <span className="text-[11px] font-semibold bg-white/15 backdrop-blur-md text-white px-2.5 py-0.5 rounded-[6px] inline-block">
                        {intentionLabels[currentProfile.relationshipIntention] || currentProfile.relationshipIntention}
                      </span>
                    </div>
                  )}

                  {/* Expandable Bio & Interests Drawer */}
                  {expandedInfo && (
                    <div className="pt-2 border-t border-white/15 space-y-2 text-xs animate-slide-up">
                      {currentProfile.bio && (
                        <p className="text-white/95 leading-relaxed font-normal">{currentProfile.bio}</p>
                      )}
                      {currentProfile.interests && currentProfile.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {currentProfile.interests.map((interest) => (
                            <span
                              key={interest}
                              className="text-[10px] font-semibold bg-[#181818] border border-[#2E2E2E] text-[#FF6F61] px-2 py-0.5 rounded-[6px]"
                            >
                              #{interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ergonomic Floating Action Controls (Max 8px radius, no 5 giant circles) */}
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
              {/* Rewind */}
              <button
                type="button"
                onClick={handleRewind}
                disabled={swiping}
                className={`w-11 h-11 rounded-[8px] flex items-center justify-center transition-all cursor-pointer ${
                  canRewind
                    ? 'bg-[#141414] border border-[#282828] text-[#FF6F61] hover:bg-[#1E1E1E] active:scale-95'
                    : 'bg-[#121212] border border-[#202020] text-[#555555] opacity-60'
                }`}
                title={canRewind ? 'Rewind last swipe' : 'Rewind available on Plus & Pro'}
                aria-label="Rewind"
              >
                <RotateCcw size={17} strokeWidth={2.2} />
              </button>

              <div className="flex items-center gap-4">
                {/* Pass Action Button */}
                <button
                  type="button"
                  onClick={() => handleSwipe('pass')}
                  disabled={swiping}
                  className="w-14 h-12 rounded-[8px] bg-[#141414] border border-[#282828] flex items-center justify-center text-[#EF4444] hover:bg-[#1C1C1C] hover:border-[#EF4444]/40 active:scale-95 transition-all shadow-md cursor-pointer"
                  aria-label="Pass"
                >
                  <X size={26} strokeWidth={2.4} />
                </button>

                {/* Like Hero Action Button */}
                <button
                  type="button"
                  onClick={() => handleSwipe('like')}
                  disabled={swiping}
                  className="w-20 h-12 rounded-[8px] bg-gradient-to-r from-[#E91E63] to-[#FF4081] flex items-center justify-center text-white hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#E91E63]/25 cursor-pointer"
                  aria-label="Like"
                >
                  <Heart size={26} fill="white" strokeWidth={1} />
                </button>
              </div>

              {/* Profile Details Sheet Trigger */}
              <button
                type="button"
                onClick={() => setExpandedInfo(!expandedInfo)}
                className="w-11 h-11 rounded-[8px] bg-[#141414] border border-[#282828] text-[#9E9E9E] hover:text-white hover:bg-[#1E1E1E] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                aria-label="Info"
              >
                <Info size={17} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Romantic & Exciting "IT'S A MATCH!" Modal */}
      {showMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#141414] border border-[#E91E63]/50 rounded-[8px] p-6 max-w-sm w-full text-center shadow-2xl shadow-[#E91E63]/25 space-y-4 animate-slide-up">
            <div className="space-y-1">
              <span className="tmd-section-title text-[#FF6F61]">Mutual Attraction</span>
              <h2 className="tmd-display text-[#E91E63] tracking-tight">IT'S A MATCH!</h2>
              <p className="tmd-body-small text-[#9E9E9E]">You and {showMatch.name} liked each other</p>
            </div>

            <div className="flex justify-center items-center gap-4 py-3">
              <div className="w-20 h-20 rounded-[8px] overflow-hidden border-2 border-[#E91E63] shadow-lg shadow-[#E91E63]/30">
                {showMatch.primaryPhoto ? (
                  <img src={showMatch.primaryPhoto} alt={showMatch.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#202020] flex items-center justify-center text-xs">Photo</div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button onClick={() => {
                setShowMatch(null);
                window.location.href = '/app/chat';
              }} fullWidth size="lg">
                Send Message
              </Button>
              <Button variant="secondary" onClick={() => setShowMatch(null)} fullWidth size="md">
                Continue Discovering
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
