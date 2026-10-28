"use client";

import { useRouter } from "next/navigation";
import { MatchCelebration } from "@/hooks/useDiscovery";

interface MatchModalProps {
  match: MatchCelebration;
  currentUserPhotoUrl?: string | null;
  onClose: () => void;
}

export function MatchModal({
  match,
  currentUserPhotoUrl,
  onClose,
}: MatchModalProps) {
  const router = useRouter();

  const handleSendMessage = () => {
    onClose();
    router.push(`/chat?conversationId=${match.conversationId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-lg bg-zinc-950 border border-rose-500/50 p-5 text-center shadow-2xl space-y-5 relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-rose-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest font-extrabold text-rose-400">
            Congratulations
          </p>
          <h2 className="text-3xl font-black italic tracking-wider bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
            IT&apos;S A MATCH!
          </h2>
          <p className="text-xs text-zinc-400">
            You and <span className="text-white font-semibold">{match.matchedUser.name}</span> liked each other
          </p>
        </div>

        {/* Avatars */}
        <div className="relative flex items-center justify-center py-2">
          {/* User Photo */}
          <div className="w-20 h-20 rounded-full border-4 border-rose-500/80 overflow-hidden shadow-xl -mr-3 z-10 bg-zinc-800">
            <img
              src={currentUserPhotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"}
              alt="You"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300";
              }}
            />
          </div>

          {/* Heart Badge */}
          <div className="z-20 w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg border-2 border-zinc-950 text-xs font-bold">
            ❤️
          </div>

          {/* Matched User Photo */}
          <div className="w-20 h-20 rounded-full border-4 border-pink-500/80 overflow-hidden shadow-xl -ml-3 z-10 bg-zinc-800">
            <img
              src={match.matchedUser.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"}
              alt={match.matchedUser.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300";
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleSendMessage}
            className="w-full py-3 px-4 rounded-lg font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:opacity-95 active:scale-[0.98] transition shadow-lg shadow-rose-600/30 text-xs"
          >
            Send Message 💬
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-lg font-semibold text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 transition text-xs"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
}
