"use client";

import { useEffect, useState } from "react";

interface ViewOnceViewerModalProps {
  streamUrl: string;
  durationSeconds?: number;
  onClose: () => void;
}

export function ViewOnceViewerModal({
  streamUrl,
  durationSeconds = 10,
  onClose,
}: ViewOnceViewerModalProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  const progressPercent = (timeLeft / durationSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 animate-in fade-in duration-200 select-none">
      {/* Top Bar with Timer */}
      <div className="w-full max-w-sm mx-auto space-y-2">
        <div className="flex items-center justify-between text-white text-xs px-1">
          <span className="flex items-center gap-1.5 font-bold text-amber-400">
            ⏳ View Once Photo • {timeLeft}s remaining
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold"
          >
            Close ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Image Container */}
      <div className="flex-1 flex items-center justify-center py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={streamUrl}
          alt="View Once Media"
          className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl pointer-events-none"
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {/* Bottom Warning Bar */}
      <div className="w-full max-w-sm mx-auto text-center py-2">
        <p className="text-[11px] text-zinc-400 tracking-wide">
          🔒 Secure View Once: This photo disappears permanently after viewing.
        </p>
      </div>
    </div>
  );
}
