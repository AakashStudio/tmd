"use client";

import React, { useState } from "react";
import { AuthModal } from "./AuthModal";

interface MeetupAuthHeroProps {
  onSuccess: (hasProfile: boolean) => void;
}

export const MeetupAuthHero: React.FC<MeetupAuthHeroProps> = ({ onSuccess }) => {
  const [authMode, setAuthMode] = useState<"PHONE" | "EMAIL" | null>(null);

  return (
    <div className="w-full max-w-md bg-[#0c0c10] text-white rounded-3xl border border-white/[0.08] shadow-2xl relative box-border overflow-hidden flex flex-col justify-between select-none">
      {/* Top Background Artwork Header */}
      <div className="relative w-full h-[380px] sm:h-[400px] flex flex-col items-center justify-between pt-6 pb-4 overflow-hidden">
        {/* Cinematic TMD Date Hero Artwork */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url('/images/tmd-auth-hero.jpg')`,
            backgroundPosition: "center 25%",
            backgroundSize: "cover",
          }}
        />

        {/* Smooth dark gradients for seamless blend into dark UI */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#0c0c10] via-[#0c0c10]/90 to-transparent pointer-events-none" />

        {/* Top App Branding: Official TMD Logo */}
        <div className="relative z-10 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/10 shadow-2xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#F59E0B] to-[#FFC629] flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            <svg
              className="w-4 h-4 text-black fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-base font-black tracking-wider text-white leading-tight">
              TMD
            </span>
            <span className="text-[8px] font-black tracking-[0.22em] text-amber-300 uppercase leading-none">
              The Match Date
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Content & Action Section */}
      <div className="relative z-10 px-5 pb-8 pt-2 flex flex-col justify-end space-y-4">
        {/* Hero Slogan */}
        <div className="text-center mb-1 space-y-1">
          <h1 className="text-[25px] font-black text-white tracking-tight leading-tight">
            Real Dates. Real Chemistry.
          </h1>
          <p className="text-xs text-zinc-400 font-medium">
            Discover verified singles & real-world dating events
          </p>
        </div>

        {/* Social & Primary Action Buttons (Uniform width across entire app) */}
        <div className="space-y-2.5 w-full">
          {/* Google Button */}
          <button
            type="button"
            onClick={() => setAuthMode("PHONE")}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-full bg-[#2a2a32] hover:bg-[#34343e] text-white text-[13px] font-bold tracking-wide transition-all shadow-md active:scale-[0.98]"
          >
            {/* Google G icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="whitespace-nowrap">Continue with Google</span>
          </button>

          {/* Phone Number Button */}
          <button
            type="button"
            onClick={() => setAuthMode("PHONE")}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] hover:brightness-105 text-black text-[13px] font-black tracking-wide transition-all shadow-lg shadow-amber-500/25 active:scale-[0.98] whitespace-nowrap"
          >
            {/* Phone Icon */}
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
            <span className="whitespace-nowrap">Continue with Phone Number</span>
          </button>

          {/* Terms Disclaimer */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              By continuing, you agree to TMD&apos;s{" "}
              <span className="underline cursor-pointer hover:text-zinc-400">
                Terms
              </span>{" "}
              and{" "}
              <span className="underline cursor-pointer hover:text-zinc-400">
                Privacy Policy
              </span>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Full Screen Verification */}
      {authMode && (
        <AuthModal
          initialProvider="PHONE_OTP"
          onSuccess={onSuccess}
          onCancel={() => setAuthMode(null)}
        />
      )}
    </div>
  );
};
