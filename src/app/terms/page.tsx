"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, CheckCircle, AlertTriangle } from "lucide-react";

export default function TermsPage() {
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
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Welcome to TMD — The Match Date (&ldquo;TMD&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;). By accessing or using our mobile application, website, and dating/event marketplace, you agree to be bound by these Terms of Service.
          </p>
        </div>

        {/* 1. Eligibility */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#FFC629] flex items-center gap-2">
            <span>1. Strict Age &amp; Eligibility Requirements</span>
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            You must be at least <strong>18 years of age</strong> to create an account, access the discovery feed, or attend TMD events. Creating an account with false date-of-birth information constitutes a material breach of these terms and will result in permanent ban and forfeiture of any active passes.
          </p>
        </section>

        {/* 2. User Conduct & Zero Harassment */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#FFC629]">
            2. Community Safety &amp; Zero-Tolerance Conduct
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            TMD is built on respect and genuine real-world connection. We strictly prohibit:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400 pl-2">
            <li>Harassment, stalking, abusive language, or non-consensual sexual content.</li>
            <li>Screenshots or unauthorized recording of View-Once media.</li>
            <li>Impersonating another person or misrepresenting identity or age.</li>
            <li>Commercial solicitation, scamming, or unauthorized advertising.</li>
          </ul>
        </section>

        {/* 3. Event Hosting & Ticketing Marketplace */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#FFC629]">
            3. Events Marketplace, Pass Bookings &amp; Settlements
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            TMD provides an event hosting platform where users can publish cafe mixers, speed dating, and nightlife meetups:
          </p>
          <div className="p-3.5 rounded-2xl bg-[#14141c] border border-white/10 space-y-2 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Official UPI Routing:</strong> 100% of pass booking funds are routed directly to TMD official merchant UPI (<code className="text-[#FFC629]">8817958002@ybl</code>).</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Host Payout:</strong> Event hosts receive <strong>93% net payout</strong> of ticket face value post-event verification. TMD retains 7% platform fee + convenience fee.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Event Cancellation:</strong> If a host cancels an event, attendees receive 100% full refund to their original UPI payment mode.</span>
            </div>
          </div>
        </section>

        {/* 4. Subscriptions & Digital Goods */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#FFC629]">
            4. VIP Subscriptions &amp; Digital Entitlements
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            TMD offers optional VIP membership tiers (Tier 49, Tier 149, PRO 499). Subscriptions activate immediately upon payment confirmation. Because digital benefits (such as unlimited swipes, rewind, and who-liked-you unlocks) are delivered instantly, subscription purchases are non-refundable once consumed.
          </p>
        </section>

        {/* 5. Account Termination */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#FFC629]">
            5. Moderation &amp; Account Termination
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            We reserve the right to suspend or permanently terminate any account that violates our safety standards, harassment policies, or applicable Indian laws (including the Information Technology Act).
          </p>
        </section>

        {/* 6. Contact & Grievance */}
        <section className="pt-4 border-t border-white/10 space-y-1.5 text-xs text-zinc-400">
          <p className="font-bold text-white">Grievance &amp; Support Contact:</p>
          <p>For questions or report submissions, contact: <a href="mailto:support@tmd.dizitio.com" className="text-[#FFC629] underline">support@tmd.dizitio.com</a></p>
          <p>The Match Date (TMD), Madhya Pradesh, India.</p>
        </section>
      </div>
    </div>
  );
}
