"use client";

import { useState } from "react";
import { DiscoveryCandidate } from "@/hooks/useDiscovery";

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
        className="relative z-20 p-5 text-white space-y-3 cursor-pointer"
      >
        {/* Name, Age, Verification */}
        <div className="flex items-center justify-between">
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
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white shadow-md text-xs font-bold"
              >
                ✓
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile?.();
            }}
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center transition text-sm text-white"
            title="View Full Profile & Send Note"
          >
            ▼
          </button>
        </div>

        {/* City & Profession Info */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
          <span className="flex items-center gap-1 font-medium">
            📍 {candidate.city}
          </span>
          {candidate.profession && (
            <>
              <span>•</span>
              <span>💼 {candidate.profession}</span>
            </>
          )}
          {candidate.height && (
            <>
              <span>•</span>
              <span>📏 {candidate.height} cm</span>
            </>
          )}
        </div>

        {/* Relationship Intention Pill */}
        {candidate.relationshipIntention && (
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/80 text-white border border-rose-400/40 backdrop-blur-md">
            🎯 {candidate.relationshipIntention.replace(/_/g, " ")}
          </div>
        )}

        {/* Bio */}
        {candidate.bio && (
          <p className="text-sm text-zinc-200 leading-relaxed drop-shadow line-clamp-2">
            {candidate.bio}
          </p>
        )}

        {/* Interests & Quick Hint */}
        <div className="flex items-center justify-between pt-1">
          {candidate.interests.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {candidate.interests.slice(0, 3).map((interest) => (
                <span
                  key={interest.id}
                  className="px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-zinc-200 backdrop-blur-md"
                >
                  {interest.icon ? `${interest.icon} ` : ""}
                  {interest.name}
                </span>
              ))}
            </div>
          ) : <div />}

          <span className="text-[11px] text-rose-300 font-semibold flex items-center gap-1 group-hover:underline">
            View Profile & Reply ✈
          </span>
        </div>
      </div>
    </div>
  );
}
