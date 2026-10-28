"use client";

import React, { useState } from "react";
import { DiscoveryCandidate } from "@/hooks/useDiscovery";
import { ReplyModal } from "./ReplyModal";
import { VoiceNotePlayer } from "@/components/profile/VoiceNotePlayer";
import {
  X,
  Heart,
  Send,
  MoreHorizontal,
  Search,
  MessageSquare,
  Music,
  MapPin,
  Briefcase,
  GraduationCap,
  Ruler,
  Play,
  ArrowDown,
  ShieldCheck,
  Flag,
  UserX,
  Mic,
} from "lucide-react";

interface ProfileDetailSheetProps {
  candidate: DiscoveryCandidate | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (options?: { comment?: string; replyType?: string; replyContext?: string }) => void;
  onPass: () => void;
}

export function ProfileDetailSheet({
  candidate,
  isOpen,
  onClose,
  onLike,
  onPass,
}: ProfileDetailSheetProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [replyConfig, setReplyConfig] = useState<{
    isOpen: boolean;
    replyType: "PHOTO" | "BIO" | "ESSENTIALS" | "PROMPT" | "ANTHEM";
    replyContext?: string;
  }>({
    isOpen: false,
    replyType: "PHOTO",
  });
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen || !candidate) return null;

  const photos =
    candidate.photos && candidate.photos.length > 0
      ? candidate.photos
      : [
          {
            id: "fallback",
            url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800",
            isPrimary: true,
            order: 0,
          },
        ];

  const currentPhoto = photos[photoIndex] || photos[0];

  const openReply = (
    replyType: "PHOTO" | "BIO" | "ESSENTIALS" | "PROMPT" | "ANTHEM",
    replyContext?: string
  ) => {
    setReplyConfig({
      isOpen: true,
      replyType,
      replyContext,
    });
  };

  const handleSendReply = async (
    message: string,
    replyType: string,
    replyContext?: string
  ) => {
    setIsSendingReply(true);
    try {
      await onLike({
        comment: message,
        replyType,
        replyContext,
      });
      setReplyConfig((prev) => ({ ...prev, isOpen: false }));
      onClose();
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleBlock = () => {
    setActionNotice(`${candidate.name} has been blocked.`);
    setTimeout(() => {
      setActionNotice(null);
      onPass();
      onClose();
    }, 1200);
  };

  const handleReport = () => {
    setActionNotice(`Report submitted for ${candidate.name}. Our safety team will review.`);
    setTimeout(() => {
      setActionNotice(null);
      onPass();
      onClose();
    }, 1500);
  };

  const promptQ = candidate.promptQuestion || "I feel happiest when...";
  const promptA = candidate.promptAnswer || "I'm around dogs and away from drama.";
  const anthemTitle = candidate.anthemTitle || 'Tum Ho Toh (From "Saiyaara")';
  const anthemArtist = candidate.anthemArtist || "Vishal Mishra · Spotify";
  const anthemCover = candidate.anthemCoverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black text-white animate-in fade-in slide-in-from-bottom-6 duration-200">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="fixed top-5 inset-x-4 z-50 max-w-sm mx-auto p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-center text-xs font-semibold text-rose-300 shadow-2xl animate-in fade-in">
          {actionNotice}
        </div>
      )}

      {/* Top Floating App Bar */}
      <div className="sticky top-0 inset-x-0 z-40 bg-black/85 backdrop-blur-md px-5 py-3.5 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tight">{candidate.name}</h1>
          <span className="text-2xl font-normal text-zinc-300">{candidate.age}</span>
          {candidate.isVerified && (
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
          )}
        </div>

        {/* Down Collapse Button matching screenshot */}
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center shadow-lg transition active:scale-95"
          title="Close Profile"
        >
          <ArrowDown className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 pt-3 pb-32 space-y-3.5">
        {/* 1. Large Photo View */}
        <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-900 shadow-xl border border-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPhoto.url}
            alt={candidate.name}
            className="w-full h-full object-cover select-none"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800";
            }}
          />

          {/* Photo Navigation tap zones */}
          {photos.length > 1 && (
            <div className="absolute inset-0 flex">
              <div
                className="w-1/2 h-full cursor-pointer"
                onClick={() => setPhotoIndex((p) => Math.max(0, p - 1))}
              />
              <div
                className="w-1/2 h-full cursor-pointer"
                onClick={() => setPhotoIndex((p) => Math.min(photos.length - 1, p + 1))}
              />
            </div>
          )}

          {/* Top Indicators */}
          {photos.length > 1 && (
            <div className="absolute top-3 inset-x-0 flex gap-1.5 px-4 z-10 pointer-events-none">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    i === photoIndex ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Screenshot 1 exact style: White Pill Reply button at bottom right */}
          <button
            type="button"
            onClick={() => openReply("PHOTO", `${candidate.name}'s photo`)}
            className="absolute bottom-4 right-4 z-20 px-3.5 py-1.5 rounded-full bg-white/95 text-zinc-900 hover:bg-white shadow-xl flex items-center gap-1.5 text-xs font-bold transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5 text-sky-500 fill-sky-500 rotate-[-25deg]" />
            <span>Reply</span>
          </button>
        </div>

        {/* 2. Looking for Card */}
        <div className="p-4 rounded-2xl bg-[#121216] border border-zinc-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <Search className="w-3.5 h-3.5" />
            <span>Looking for</span>
          </div>
          <p className="text-base font-extrabold text-white">
            {candidate.relationshipIntention
              ? candidate.relationshipIntention.replace(/_/g, " ")
              : "Long-term partner"}
          </p>
        </div>

        {/* 2.5 Voice Note Audio Intro Card */}
        {candidate.voicePromptUrl && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#181820] to-[#121216] border border-amber-500/30 space-y-3 shadow-lg shadow-amber-500/5">
            <div className="flex items-center justify-between text-zinc-400">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                <span className="uppercase tracking-wider font-extrabold text-[11px]">Voice Note Intro</span>
              </div>
              <span className="text-[10px] bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2 py-0.5 rounded-full font-bold">
                Audio Bio
              </span>
            </div>

            <VoiceNotePlayer
              url={candidate.voicePromptUrl}
              durationSeconds={candidate.voicePromptDuration}
              candidateName={candidate.name}
            />

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => openReply("BIO", `${candidate.name}'s voice note`)}
                className="px-3.5 py-1.5 rounded-full bg-zinc-800/90 text-white hover:bg-zinc-700 shadow-md flex items-center gap-1.5 text-xs font-bold transition active:scale-95 border border-zinc-700/60"
              >
                <Send className="w-3.5 h-3.5 text-amber-400 fill-amber-400 rotate-[-25deg]" />
                <span>Reply to Voice</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. About Me Card */}
        <div className="p-4 rounded-2xl bg-[#121216] border border-zinc-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-zinc-400">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <span className="text-sm font-serif">❝</span>
              <span>About me</span>
            </div>
            <button type="button" className="text-zinc-500 hover:text-zinc-300">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-zinc-200 leading-relaxed font-normal">
            {candidate.bio ||
              "I'm at a stage in life where effort, honesty, and emotional availability matter more than games or mixed signals. I want a relationship where we support each other, grow together, and still find little reasons to fall for each other every day. ❤️"}
          </p>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => openReply("BIO", candidate.bio || "About me")}
              className="px-3.5 py-1.5 rounded-full bg-zinc-800/90 text-white hover:bg-zinc-700 shadow-md flex items-center gap-1.5 text-xs font-bold transition active:scale-95 border border-zinc-700/60"
            >
              <Send className="w-3.5 h-3.5 text-sky-400 fill-sky-400 rotate-[-25deg]" />
              <span>Reply</span>
            </button>
          </div>
        </div>

        {/* 4. Essentials Card */}
        <div className="p-4 rounded-2xl bg-[#121216] border border-zinc-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-zinc-400">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
              <span>Essentials</span>
            </div>
            <button type="button" className="text-zinc-500 hover:text-zinc-300">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-sm text-zinc-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-zinc-400" />
              <span>11 kilometers away • {candidate.city}</span>
            </div>
            {candidate.profession && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-zinc-400" />
                <span>{candidate.profession}</span>
              </div>
            )}
            {candidate.education && (
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-zinc-400" />
                <span>{candidate.education}</span>
              </div>
            )}
            {candidate.height && (
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-zinc-400" />
                <span>{candidate.height} cm</span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => openReply("ESSENTIALS", `11 kilometers away in ${candidate.city}`)}
              className="px-3.5 py-1.5 rounded-full bg-zinc-800/90 text-white hover:bg-zinc-700 shadow-md flex items-center gap-1.5 text-xs font-bold transition active:scale-95 border border-zinc-700/60"
            >
              <Send className="w-3.5 h-3.5 text-sky-400 fill-sky-400 rotate-[-25deg]" />
              <span>Reply</span>
            </button>
          </div>
        </div>

        {/* 5. Prompt Card */}
        <div className="p-4 rounded-2xl bg-[#121216] border border-zinc-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-zinc-400">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <span className="text-sm font-serif">❝</span>
              <span>{promptQ}</span>
            </div>
            <button type="button" className="text-zinc-500 hover:text-zinc-300">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xl font-extrabold text-white leading-tight">
            {promptA}
          </p>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => openReply("PROMPT", `${promptQ} ${promptA}`)}
              className="px-3.5 py-1.5 rounded-full bg-zinc-800/90 text-white hover:bg-zinc-700 shadow-md flex items-center gap-1.5 text-xs font-bold transition active:scale-95 border border-zinc-700/60"
            >
              <Send className="w-3.5 h-3.5 text-sky-400 fill-sky-400 rotate-[-25deg]" />
              <span>Reply</span>
            </button>
          </div>
        </div>

        {/* 6. My Anthem Card */}
        <div className="p-4 rounded-2xl bg-[#121216] border border-zinc-800/80 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <Music className="w-3.5 h-3.5 text-zinc-400" />
            <span>My anthem</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Album Cover with Play button */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-800 bg-zinc-900 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={anthemCover}
                alt={anthemTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-black fill-black ml-0.5" />
                </div>
              </div>
            </div>

            {/* Song & Artist Info */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <h4 className="font-extrabold text-sm text-white truncate">
                {anthemTitle}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate">
                <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#1DB954] text-black font-black text-[9px] flex items-center justify-center">
                  ●
                </span>
                <span className="truncate">{anthemArtist}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => openReply("ANTHEM", anthemTitle)}
              className="px-3.5 py-1.5 rounded-full bg-zinc-800/90 text-white hover:bg-zinc-700 shadow-md flex items-center gap-1.5 text-xs font-bold transition active:scale-95 border border-zinc-700/60"
            >
              <Send className="w-3.5 h-3.5 text-sky-400 fill-sky-400 rotate-[-25deg]" />
              <span>Reply</span>
            </button>
          </div>
        </div>

        {/* 7. Block Button */}
        <button
          type="button"
          onClick={handleBlock}
          className="w-full py-3.5 rounded-2xl bg-[#1a1a22] hover:bg-zinc-800 text-zinc-200 text-sm font-semibold transition flex items-center justify-center gap-2 border border-zinc-800/80 active:scale-[0.99]"
        >
          <UserX className="w-4 h-4 text-zinc-400" />
          <span>Block {candidate.name}</span>
        </button>

        {/* 8. Report Button */}
        <button
          type="button"
          onClick={handleReport}
          className="w-full py-3.5 rounded-2xl bg-[#1a1a22] hover:bg-zinc-800 text-rose-400 text-sm font-semibold transition flex items-center justify-center gap-2 border border-zinc-800/80 active:scale-[0.99]"
        >
          <Flag className="w-4 h-4 text-rose-500" />
          <span>Report {candidate.name}</span>
        </button>
      </div>

      {/* 9. Floating Bottom Pass & Like Bar matching screenshot */}
      <div className="fixed bottom-4 inset-x-0 z-40 flex items-center justify-center gap-8 pointer-events-none">
        <button
          type="button"
          onClick={() => {
            onPass();
            onClose();
          }}
          className="w-14 h-14 rounded-full bg-[#181820]/95 hover:bg-zinc-800 border border-zinc-700/80 text-white shadow-2xl flex items-center justify-center pointer-events-auto transition active:scale-90"
          title="Pass"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={() => {
            onLike();
            onClose();
          }}
          className="w-14 h-14 rounded-full bg-[#181820]/95 hover:bg-zinc-800 border border-zinc-700/80 text-rose-500 shadow-2xl flex items-center justify-center pointer-events-auto transition active:scale-90"
          title="Like"
        >
          <Heart className="w-7 h-7 fill-rose-500 text-rose-500" />
        </button>
      </div>

      {/* Reply Modal */}
      <ReplyModal
        isOpen={replyConfig.isOpen}
        onClose={() => setReplyConfig((prev) => ({ ...prev, isOpen: false }))}
        targetName={candidate.name}
        replyType={replyConfig.replyType}
        replyContext={replyConfig.replyContext}
        onSend={handleSendReply}
        isSending={isSendingReply}
      />
    </div>
  );
}
