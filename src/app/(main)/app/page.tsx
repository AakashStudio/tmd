'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, X, RotateCcw, Flame, MapPin, Briefcase, ChevronUp, ChevronDown, Sparkles, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';

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
  const [showFullProfile, setShowFullProfile] = useState(false);
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
        setShowFullProfile(false);

        if (currentIndex >= profiles.length - 2) {
          fetchProfiles();
        }
      }, 200);
    } catch (err) {
      console.error('Swipe error:', err);
    } finally {
      setTimeout(() => setSwiping(false), 200);
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
    if (Math.abs(diff) > 85) {
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-[#08080A]">
        <div className="w-16 h-16 rounded-full bg-[#1A1A22] border border-[#2D2D38] flex items-center justify-center mb-4 shadow-xl shadow-[#FF1493]/20">
          <Flame size={32} className="text-[#FF1493]" />
        </div>
        <h2 className="tmd-h1 text-white mb-2">Swipe Limit Reached</h2>
        <p className="tmd-body text-[#A1A1AA] max-w-xs mb-6">
          Free plan receives 10 swipes every 12 hours. Upgrade now for unlimited swiping and rewind.
        </p>
        <Button onClick={() => window.location.href = '/app/plan'} size="lg" className="gap-2">
          <Sparkles size={16} /> Upgrade Plan
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#08080A] relative overflow-hidden select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 h-12 flex-shrink-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF1493] to-[#FF4D6D] flex items-center justify-center shadow-md shadow-[#FF1493]/30">
            <Flame size={16} className="text-white fill-white" />
          </div>
          <span className="font-black text-xl tracking-tight text-white">TMD</span>
        </div>

        {remainingSwipes !== null && (
          <span className="text-[11px] font-bold bg-[#1A1A22] border border-[#2D2D38] text-[#FF4D6D] px-2.5 py-0.5 rounded-[6px]">
            {remainingSwipes} swipes left
          </span>
        )}
      </header>

      {/* Discovery Canvas */}
      <div className="flex-1 min-h-0 px-3 pb-2 flex flex-col relative">
        {loading && (
          <div className="w-full h-full flex items-center justify-center">
            <CardSkeleton />
          </div>
        )}

        {noMoreProfiles && (
          <div className="w-full h-full flex items-center justify-center">
            <EmptyState
              icon={Sparkles}
              title="You've seen everyone"
              description="You've seen everyone available right now. Check back soon for new profiles."
              actionLabel="Refresh Discovery"
              onAction={fetchProfiles}
            />
          </div>
        )}

        {currentProfile && (
          <div className="w-full h-full flex flex-col justify-between">
            {/* The Full Bleed Discovery Card */}
            <div
              ref={cardRef}
              style={{
                transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.04}deg)`,
                transition: dragOffset === 0 ? 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
              }}
              className={`relative flex-1 w-full rounded-[8px] overflow-hidden bg-[#121216] border border-[#1E1E26] shadow-2xl transition-opacity duration-200 cursor-grab active:cursor-grabbing ${
                swipeDirection === 'left' ? '-translate-x-[120%] -rotate-12 opacity-0' :
                swipeDirection === 'right' ? 'translate-x-[120%] rotate-12 opacity-0' : ''
              }`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Dynamic LIKE / PASS Stamps */}
              {dragOffset > 30 && (
                <div className="absolute top-8 left-6 z-40 border-3 border-[#10B981] text-[#10B981] px-4 py-1.5 rounded-[8px] font-black text-2xl uppercase tracking-wider rotate-[-12deg] bg-black/60 backdrop-blur-sm pointer-events-none shadow-2xl animate-stamp-like">
                  LIKE
                </div>
              )}
              {dragOffset < -30 && (
                <div className="absolute top-8 right-6 z-40 border-3 border-[#EF4444] text-[#EF4444] px-4 py-1.5 rounded-[8px] font-black text-2xl uppercase tracking-wider rotate-[12deg] bg-black/60 backdrop-blur-sm pointer-events-none shadow-2xl">
                  NOPE
                </div>
              )}

              {/* Full Image */}
              <div className="relative w-full h-full bg-[#121216]">
                <img
                  src={currentProfile.photos[currentPhotoIndex]?.url || currentProfile.photos[0]?.url}
                  alt={currentProfile.name}
                  className="w-full h-full object-cover object-top select-none pointer-events-none"
                  loading="eager"
                />

                {/* Photo Story Bars */}
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

                {/* Tap Zones for Next/Prev Photo */}
                {currentProfile.photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-0 top-0 w-1/3 h-3/4 z-20 opacity-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1));
                      }}
                      aria-label="Previous photo"
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 w-1/3 h-3/4 z-20 opacity-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex(Math.min(currentProfile.photos.length - 1, currentPhotoIndex + 1));
                      }}
                      aria-label="Next photo"
                    />
                  </>
                )}

                {/* High Contrast Gradient Scrim for Information */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080A] via-black/45 to-transparent pointer-events-none" />

                {/* Core Profile Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                        {currentProfile.name}, <span className="font-normal text-white/90">{currentProfile.age}</span>
                      </h2>
                      {currentProfile.isVerified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-black bg-[#FF1493] text-white px-1.5 py-0.5 rounded-[4px] shadow-sm">
                          <Check size={11} strokeWidth={3} /> VERIFIED
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowFullProfile(true)}
                      className="w-8 h-8 rounded-full bg-black/40 border border-white/20 backdrop-blur-md hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Open full profile"
                    >
                      <Info size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-white/90">
                    <span className="flex items-center gap-1 font-semibold">
                      <MapPin size={13} className="text-[#FF4D6D] flex-shrink-0" /> {currentProfile.city}
                    </span>
                    {currentProfile.profession && (
                      <>
                        <span className="text-white/40">•</span>
                        <span className="flex items-center gap-1 truncate text-white/80 font-medium">
                          <Briefcase size={13} className="text-[#A1A1AA] flex-shrink-0" /> {currentProfile.profession}
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

                  {currentProfile.bio && (
                    <p className="text-xs text-white/85 line-clamp-2 leading-relaxed">
                      {currentProfile.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tactile Discovery Controls Dock: Rewind (circular), Pass (circular), Like (circular) — NO Super Like */}
            <div className="flex items-center justify-center gap-6 py-2.5 flex-shrink-0">
              {/* Rewind (Only ₹149 & ₹499) */}
              <IconButton
                variant="rewind"
                size="md"
                onClick={handleRewind}
                disabled={swiping}
                title={canRewind ? 'Rewind last swipe' : 'Rewind available on Plus & Pro'}
                aria-label="Rewind"
              >
                <RotateCcw size={18} strokeWidth={2.4} />
              </IconButton>

              {/* Pass Button */}
              <IconButton
                variant="pass"
                size="lg"
                onClick={() => handleSwipe('pass')}
                disabled={swiping}
                aria-label="Pass"
              >
                <X size={28} strokeWidth={2.6} />
              </IconButton>

              {/* Like Button */}
              <IconButton
                variant="like"
                size="lg"
                onClick={() => handleSwipe('like')}
                disabled={swiping}
                aria-label="Like"
              >
                <Heart size={30} fill="white" strokeWidth={1} />
              </IconButton>
            </div>
          </div>
        )}
      </div>

      {/* Full Profile Sheet */}
      {currentProfile && (
        <BottomSheet
          isOpen={showFullProfile}
          onClose={() => setShowFullProfile(false)}
          title={`${currentProfile.name}, ${currentProfile.age}`}
        >
          <div className="space-y-4">
            {/* Photo Gallery */}
            <div className="grid grid-cols-2 gap-2">
              {currentProfile.photos.map((photo, i) => (
                <div key={i} className="aspect-[3/4] rounded-[8px] overflow-hidden bg-[#1A1A22] border border-[#2D2D38]">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {/* Bio & Details */}
            {currentProfile.bio && (
              <div className="space-y-1">
                <span className="tmd-metadata text-[#FF4D6D]">About</span>
                <p className="tmd-body text-white leading-relaxed">{currentProfile.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <span className="tmd-metadata text-[#71717A]">Location</span>
                <p className="tmd-body text-white font-medium">{currentProfile.city}</p>
              </div>
              {currentProfile.profession && (
                <div>
                  <span className="tmd-metadata text-[#71717A]">Work</span>
                  <p className="tmd-body text-white font-medium">{currentProfile.profession}</p>
                </div>
              )}
            </div>

            {/* Interests */}
            {currentProfile.interests && currentProfile.interests.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="tmd-metadata text-[#71717A]">Interests</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentProfile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="text-xs font-semibold bg-[#1A1A22] border border-[#2D2D38] text-[#FF4D6D] px-2.5 py-1 rounded-[6px]"
                    >
                      #{interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </BottomSheet>
      )}

      {/* "IT'S A MATCH!" Modal */}
      {showMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121216] border border-[#FF1493]/50 rounded-[8px] p-6 max-w-sm w-full text-center shadow-2xl shadow-[#FF1493]/20 space-y-4 animate-slide-up">
            <div className="space-y-1">
              <span className="tmd-metadata text-[#FF4D6D]">Mutual Attraction</span>
              <h2 className="tmd-display text-[#FF1493] tracking-tight">IT'S A MATCH!</h2>
              <p className="tmd-body-small text-[#A1A1AA]">You and {showMatch.name} liked each other</p>
            </div>

            <div className="flex justify-center items-center py-2">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#FF1493] shadow-lg shadow-[#FF1493]/30">
                {showMatch.primaryPhoto ? (
                  <img src={showMatch.primaryPhoto} alt={showMatch.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#1A1A22] flex items-center justify-center text-xs">Photo</div>
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
