"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SwipeLimitInfo } from "@/hooks/useDiscovery";

interface SwipeLimitModalProps {
  info: SwipeLimitInfo;
  onClose: () => void;
}

export function SwipeLimitModal({ info, onClose }: SwipeLimitModalProps) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(info.secondsUntilReset);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-amber-500/40 p-6 text-center shadow-2xl space-y-5 relative">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
          ⏳
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">Out of Swipes!</h2>
          <p className="text-xs text-zinc-400">
            Free accounts receive 25 free likes every 12-hour window. Your likes will reset in:
          </p>
        </div>

        {/* Countdown Box */}
        <div className="py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 font-mono text-2xl font-black tracking-wider">
          {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
          {String(seconds).padStart(2, "0")}
        </div>

        {/* Upgrade Call to action */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/plan");
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition shadow-lg text-sm"
          >
            Get Unlimited Swipes (from ₹49) 🚀
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl font-medium text-zinc-400 hover:text-white transition text-xs"
          >
            I&apos;ll wait for the reset
          </button>
        </div>
      </div>
    </div>
  );
}
