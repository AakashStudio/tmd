"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Lock, EyeOff, ShieldCheck, Database } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#08080b] text-white flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-2xl bg-[#0c0c10] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-[#FFC629] hover:text-[#F59E0B] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to TMD
          </Link>
          <span className="text-[11px] text-zinc-500 font-mono">Last updated: November 2026</span>
        </div>

        <div className="space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFC629]/15 border border-[#FFC629]/30 flex items-center justify-center text-[#FFC629]">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Your privacy is foundational to TMD — The Match Date. This Privacy Policy details how we collect, encrypt, protect, and respect your personal information when using our application.
          </p>
        </div>

        {/* 1. Phone Number & Identity Protection */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#FFC629] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>1. Zero Phone Number Exposure</span>
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Your phone number is used exclusively for secure OTP authentication and account safety. <strong>We NEVER display, sell, or share your mobile number</strong> with your matches, other users, or third-party advertisers. All interactions take place securely inside TMD.
          </p>
        </section>

        {/* 2. View-Once Media Privacy & Auto-Burn */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#FFC629] flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-[#FFC629]" />
            <span>2. View-Once Ephemeral Media Encryption</span>
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            When you send a View-Once photo in chat:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400 pl-2">
            <li>The media is stored securely in an isolated private directory, inaccessible via public URLs.</li>
            <li>The recipient receives a single-use HMAC-SHA256 encrypted stream token valid for exactly 60 seconds.</li>
            <li>Immediately upon streaming, the media is marked as opened and <strong>permanently auto-burned (HTTP 410 Gone)</strong> from future views.</li>
            <li>Unopened ephemeral media automatically expires and is purged after 72 hours.</li>
          </ul>
        </section>

        {/* 3. Location & Address Masking */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#FFC629] flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span>3. Residential Address Privacy Masking</span>
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            For events hosted at private residences or villas, the exact address is masked to all unapproved users (displaying only the general neighborhood). Exact addresses and Google Maps pins are revealed <strong>strictly to confirmed pass holders</strong> after approval.
          </p>
        </section>

        {/* 4. Data Security & Storage */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#FFC629]">
            4. Enterprise-Grade Security Standards
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            TMD enforces HTTP Strict Transport Security (HSTS), HttpOnly secure session cookies, parameterized SQL queries via Prisma ORM, and encrypted credential storage. No payment card or bank credentials are ever stored on our servers.
          </p>
        </section>

        {/* 5. User Rights & Account Deletion */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#FFC629]">
            5. Your Rights: Access &amp; Permanent Deletion
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            You maintain full ownership of your data. You may update your profile photos and details, or request permanent deletion of your account and all associated messages/matches at any time from Account Settings or by contacting support.
          </p>
        </section>

        {/* Contact */}
        <section className="pt-4 border-t border-white/10 space-y-1.5 text-xs text-zinc-400">
          <p className="font-bold text-white">Privacy Officer Contact:</p>
          <p>Email: <a href="mailto:privacy@tmd.dizitio.com" className="text-[#FFC629] underline">privacy@tmd.dizitio.com</a></p>
          <p>TMD — The Match Date, Madhya Pradesh, India.</p>
        </section>
      </div>
    </div>
  );
}
