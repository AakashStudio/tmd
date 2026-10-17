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
      className={`fixed inset-0 z-50 flex flex-col justify-between items-center bg-black text-white px-6 py-12 transition-opacity duration-400 ease-out ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="w-full flex justify-between items-center text-xs text-zinc-500 pt-2 opacity-0">
        <span>TMD</span>
      </div>

      {/* Center Floating Organic Logo */}
      <div className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
        <div className="relative flex items-center justify-center">
          {/* Organic Blob SVG with 'm' branding */}
          <svg
            className="w-28 h-28 drop-shadow-[0_10px_25px_rgba(255,107,139,0.35)] animate-pulse"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M38.5 24.2C54.2 14.8 77.1 19.3 89.2 33.1C101.4 46.9 102.8 70 93.1 84.8C83.4 99.6 62.6 106.1 46.1 101.9C29.6 97.7 17.4 82.8 17.1 65.8C16.8 48.8 22.8 33.6 38.5 24.2Z"
              fill="#FF6079"
            />
            {/* Small decorative splash droplet */}
            <circle cx="21" cy="35" r="4" fill="#FF6079" />
            <path
              d="M74 100C78 100 83 98 84 96C83 94 77 95 72 96C70 96.5 70 100 74 100Z"
              fill="#FF6079"
            />
            {/* Stylized 'm' letterform */}
            <path
              d="M40 70V54C40 50 43 47 47 47C51 47 54 50 54 54V70M54 54C54 50 57 47 61 47C65 47 68 50 68 54V70M68 54C68 50 71 47 75 47C79 47 82 50 82 54V70"
              stroke="#FFA0B2"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="flex flex-col items-center gap-1.5 pb-4">
        <span className="text-[11px] tracking-wide text-zinc-400 font-medium">
          Made with <span className="text-[#FF6079] inline-block">♥</span> for Singles
        </span>
        <span className="text-xs font-black tracking-widest text-white uppercase flex items-center gap-1.5">
          TMD <span className="text-zinc-600">•</span> THE MATCH DATE
        </span>
      </div>
    </div>
  );
};
