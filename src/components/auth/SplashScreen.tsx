"use client";

import React, { useEffect, useState } from "react";

interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 2000,
}) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, Math.max(500, durationMs - 400));

    const endTimer = setTimeout(() => {
      onFinish?.();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between items-center bg-[#09090c] text-white px-6 py-12 transition-opacity duration-400 ease-out select-none ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="w-full flex justify-between items-center text-xs text-zinc-500 pt-2 opacity-0">
        <span>TMD</span>
      </div>

      {/* Center Floating Premium Gold Emblem */}
      <div className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
        <div className="relative flex items-center justify-center">
          {/* Ambient Gold Glow Aura */}
          <div className="absolute w-44 h-44 rounded-full bg-amber-500/20 blur-3xl pointer-events-none animate-pulse" />

          {/* Bumble Gold Icon Badge */}
          <div className="relative z-10 w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#D4AF37] via-[#F59E0B] to-[#FFC629] flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.45)] border border-amber-300/40">
            <svg
              className="w-12 h-12 text-black fill-current drop-shadow-sm"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>

        {/* Brand Text */}
        <div className="mt-5 flex flex-col items-center text-center">
          <span className="text-2xl font-black tracking-wider text-white">
            TMD
          </span>
          <span className="text-[9px] font-black tracking-[0.28em] text-amber-300 uppercase mt-1">
            The Match Date
          </span>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="flex flex-col items-center gap-1.5 pb-4">
        <span className="text-[11px] tracking-wide text-zinc-400 font-medium">
          Made with <span className="text-[#FFC629] inline-block">💛</span> for Singles
        </span>
        <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
          TMD <span className="text-zinc-600">•</span> REAL DATES. REAL CHEMISTRY.
        </span>
      </div>
    </div>
  );
};
