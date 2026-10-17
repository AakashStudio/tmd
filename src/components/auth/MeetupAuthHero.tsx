"use client";

import React, { useState } from "react";
import { AuthModal } from "./AuthModal";

interface MeetupAuthHeroProps {
  onSuccess: (hasProfile: boolean) => void;
}

export const MeetupAuthHero: React.FC<MeetupAuthHeroProps> = ({ onSuccess }) => {
  const [authMode, setAuthMode] = useState<"PHONE" | "EMAIL" | null>(null);

  return (
    <div className="relative min-h-screen bg-[#111116] text-white flex flex-col justify-between overflow-hidden max-w-md mx-auto select-none">
      {/* Top Background Artwork Header */}
      <div className="relative w-full h-[54vh] min-h-[350px] flex flex-col items-center justify-between pt-7 pb-4 overflow-hidden">
        {/* Cinematic TMD Date Hero Artwork (No status bar, no phone icons) */}
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
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#111116] via-[#111116]/85 to-transparent pointer-events-none" />

        {/* Top App Branding: Official TMD Logo */}
        <div className="relative z-10 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/10 shadow-2xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF3B69] via-[#FF6079] to-[#FFA0B2] flex items-center justify-center shadow-[0_0_15px_rgba(255,96,121,0.5)]">
            <svg
              className="w-4 h-4 text-white fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-base font-black tracking-wider text-white leading-tight">
              TMD
            </span>
            <span className="text-[8px] font-black tracking-[0.22em] text-pink-300 uppercase leading-none">
              The Match Date
            </span>
          </div>
        </div>

        {/* Floating subtle proof tags */}
        <div className="absolute left-4 bottom-14 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white/90 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <span>Real Dates Tonight</span>
        </div>
        <div className="absolute right-4 bottom-20 z-10 flex items-center gap-1 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-pink-200 shadow-lg">
          <span>✨ Verified Singles</span>
        </div>
      </div>

      {/* Bottom Content & Action Section */}
      <div className="relative z-10 px-5 pb-8 pt-0 flex flex-col justify-end space-y-4">
        {/* Hero Slogan */}
        <div className="text-center mb-1 space-y-1">
          <h1 className="text-[25px] font-black text-white tracking-tight leading-tight">
            Real Dates. Real Chemistry.
          </h1>
          <p className="text-xs text-zinc-400 font-medium">
            Discover verified singles & real-world dating events
          </p>
        </div>

        {/* Social & Primary Action Buttons */}
        <div className="space-y-2.5 w-full max-w-sm mx-auto">
          {/* Google Button */}
          <button
            type="button"
            onClick={() => setAuthMode("EMAIL")}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full bg-[#2a2a32] hover:bg-[#34343e] text-white text-[13px] font-bold tracking-wide transition-all shadow-md active:scale-[0.98]"
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
            <span>Continue with Google</span>
          </button>

          {/* Apple Button */}
          <button
            type="button"
            onClick={() => setAuthMode("PHONE")}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full bg-white hover:bg-zinc-100 text-black text-[13px] font-bold tracking-wide transition-all shadow-md active:scale-[0.98]"
          >
            {/* Apple Logo SVG */}
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.6-7.8-11.74-14.28-5.44-8.48-9.75-18.06-12.93-28.73-3.18-10.68-4.77-20.93-4.77-30.77 0-13.49 3.54-24.8 10.63-33.94 7.09-9.13 16.03-13.84 26.83-14.13 4.58 0 9.87 1.25 15.86 3.76 5.99 2.51 9.77 3.82 11.34 3.93 1.8.13 5.76-1.19 11.89-3.95 6.13-2.76 11.45-3.99 15.97-3.69 11.75.78 20.95 4.96 27.6 12.54-10.45 6.33-15.55 14.94-15.3 25.83.25 8.52 3.59 15.69 10.02 21.52 6.43 5.83 14.18 9.17 23.25 10.02-2.34 7.15-5.35 14.39-9.03 21.72zM119.22 31.84c0-7.14 2.65-13.9 7.95-20.27 5.3-6.38 11.75-10.4 19.34-12.07.25 1.13.38 2.14.38 3.02 0 6.91-2.8 13.79-8.41 20.65-5.61 6.85-12.18 10.9-19.72 12.13-.12-1.12-.18-2.12-.18-3.46z" />
            </svg>
            <span>Continue with Apple</span>
          </button>

          {/* Facebook Button */}
          <button
            type="button"
            onClick={() => setAuthMode("PHONE")}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full bg-[#4867aa] hover:bg-[#3d5995] text-white text-[13px] font-bold tracking-wide transition-all shadow-md active:scale-[0.98]"
          >
            {/* Facebook F icon */}
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Continue with Facebook</span>
          </button>

          {/* Divider with 'or' */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-[1px] bg-zinc-800" />
            <span className="text-xs text-zinc-500 font-medium">or</span>
            <div className="flex-1 h-[1px] bg-zinc-800" />
          </div>

          {/* Sign up with email */}
          <button
            type="button"
            onClick={() => setAuthMode("EMAIL")}
            className="w-full py-3 px-4 rounded-full bg-[#3d3257] hover:bg-[#483c66] text-white text-[13px] font-bold tracking-wide transition-all shadow-md active:scale-[0.98]"
          >
            Sign up with email
          </button>

          {/* Log in with email / phone */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setAuthMode("PHONE")}
              className="text-xs text-zinc-400 hover:text-white font-medium underline underline-offset-4 decoration-zinc-600 transition"
            >
              Log in with email or phone
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Verification Modal */}
      {authMode && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <AuthModal
            initialProvider={authMode === "PHONE" ? "PHONE_OTP" : "EMAIL_OTP"}
            onSuccess={onSuccess}
            onCancel={() => setAuthMode(null)}
          />
        </div>
      )}
    </div>
  );
};
