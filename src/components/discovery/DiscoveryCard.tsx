"use client";

import { useState } from "react";
import { DiscoveryCandidate } from "@/hooks/useDiscovery";
import { VoiceNotePlayer } from "@/components/profile/VoiceNotePlayer";
import { ChevronUp, ShieldCheck } from "lucide-react";

interface DiscoveryCardProps {
  candidate: DiscoveryCandidate;
  onOpenProfile?: () => void;
}

export function DiscoveryCard({ candidate, onOpenProfile }: DiscoveryCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);

  const photos = candidate.photos.length > 0
    ? candidate.photos
    : [{ id: "placeholder", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800", isPrimary: true, order: 0 }];

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex < photos.length - 1) {
      setPhotoIndex((prev) => prev + 1);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex > 0) {
      setPhotoIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="relative w-full h-[520px] max-h-[72vh] rounded-lg overflow-hidden shadow-2xl bg-zinc-900 border border-zinc-800 select-none flex flex-col justify-end">
      {/* Background Image Carousel */}
      <img
        src={photos[photoIndex]?.url}
        alt={candidate.name}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-all duration-300"
        onError={(e) => {
          e.currentTarget.src =
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800";
        }}
      />

      {/* Touch/Click zones for photo navigation */}
      <div className="absolute inset-0 z-10 flex">
        <div className="w-1/2 h-4/5 cursor-pointer" onClick={prevPhoto} />
        <div className="w-1/2 h-4/5 cursor-pointer" onClick={nextPhoto} />
      </div>

      {/* Top Photo Progress Indicators */}
      {photos.length > 1 && (
        <div className="absolute top-3 inset-x-0 z-20 flex gap-1.5 px-4">
          {photos.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                i === photoIndex ? "bg-white shadow" : "bg-white/30 backdrop-blur-sm"
              }`}
            />
          ))}
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

      {/* Content Area */}
      <div
        onClick={onOpenProfile}
        className="relative z-20 p-5 text-white space-y-2.5 cursor-pointer"
      >
        {/* Top Header: Left (Name, Age, Verified) + Right (Show Profile Icon Button) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-md">
              {candidate.name}
            </h2>
            <span className="text-2xl font-light text-zinc-300 drop-shadow-md">
              {candidate.age}
            </span>
            {candidate.isVerified && (
              <span
                title="Verified Profile"
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white shadow-md text-xs font-bold shrink-0"
              >
                ✓
              </span>
            )}
          </div>

          {/* Show Profile Icon Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile?.();
            }}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 active:scale-90 backdrop-blur-md border border-white/25 flex items-center justify-center transition text-white shadow-lg shrink-0 cursor-pointer"
            title="Open Full Profile"
            aria-label="Open Full Profile"
          >
            <ChevronUp className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Right-aligned Meta Info: Long Term + Location, Profession, Height */}
        <div className="flex flex-col items-end gap-1.5 text-right w-full">
          {/* Relationship Intention Pill (Right Side) */}
          {candidate.relationshipIntention && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/85 text-white border border-rose-400/40 backdrop-blur-md shadow-md">
              <span>💍</span>
              <span className="uppercase tracking-wider text-[11px]">
                {candidate.relationshipIntention.replace(/_/g, " ")}
              </span>
            </div>
          )}

          {/* Location, Profession, Height (Right Side) */}
          <div className="flex flex-wrap items-center justify-end gap-x-2 text-xs font-semibold text-zinc-200 drop-shadow">
            {candidate.city && (
              <span className="flex items-center gap-1">📍 {candidate.city}</span>
            )}
            {candidate.profession && (
              <>
                <span className="text-zinc-400">•</span>
                <span className="flex items-center gap-1">💼 {candidate.profession}</span>
              </>
            )}
            {candidate.height && (
              <>
                <span className="text-zinc-400">•</span>
                <span className="flex items-center gap-1">📏 {candidate.height} cm</span>
              </>
            )}
          </div>
        </div>

        {/* Bio (Left Aligned) */}
        {candidate.bio && (
          <p className="text-sm text-zinc-100 font-medium leading-relaxed drop-shadow line-clamp-2">
            "{candidate.bio}"
          </p>
        )}

        {/* Voice Note Bar - Placed at the very bottom where tags used to be */}
        {candidate.voicePromptUrl ? (
          <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
            <VoiceNotePlayer
              url={candidate.voicePromptUrl}
              durationSeconds={candidate.voicePromptDuration || 10}
              candidateName={candidate.name}
              compact={true}
              className="w-full"
            />
          </div>
        ) : (
          <div className="flex items-center justify-end pt-0.5">
            <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 hover:text-white transition">
              View Profile ↗
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
