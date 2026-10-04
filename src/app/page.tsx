'use client';

import Link from 'next/link';
import { 
  Flame, Sparkles, MapPin, ShieldCheck, ArrowRight, 
  Layers, EyeOff, CheckCircle2, Zap, Heart, Calendar, Lock,
  Star, ChevronRight, MessageCircle, RotateCcw
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#080808] text-white flex flex-col selection:bg-[#FF1E6D] selection:text-white font-sans antialiased overflow-x-hidden">
      
      {/* ========================================================
          AMBIENT ATMOSPHERIC LIGHTING & BACKDROP
          ======================================================== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top vibrant hot-pink / magenta bloom */}
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] bg-gradient-to-b from-[#FF1E6D]/20 via-[#FF5E62]/10 to-transparent blur-[160px] rounded-full" />
        {/* Mid-left purple moody bloom */}
        <div className="absolute top-[40%] -left-72 w-[700px] h-[700px] bg-[#7928CA]/15 blur-[180px] rounded-full" />
        {/* Bottom-right rose bloom */}
        <div className="absolute bottom-10 -right-60 w-[700px] h-[700px] bg-[#FF1E6D]/15 blur-[180px] rounded-full" />
      </div>

      {/* ========================================================
          STICKY ULTRA-LUXURY GLASSMORPHIC HEADER
          ======================================================== */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#080808]/75 backdrop-blur-2xl transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF1E6D] via-[#FF5E62] to-[#FFA07A] flex items-center justify-center text-white shadow-[0_0_25px_rgba(255,30,109,0.4)] group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(255,30,109,0.6)] transition-all duration-300">
              <Flame size={22} className="fill-white" />
            </div>
            <span className="text-2xl font-black tracking-[-0.03em] text-white">
              tmd<span className="text-[#FF1E6D]">.date</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-10 text-sm font-semibold text-white/70">
            <a href="#discovery" className="hover:text-white transition-colors duration-200">How It Works</a>
            <a href="#events" className="hover:text-white transition-colors duration-200">Nightlife Events</a>
            <a href="#privacy" className="hover:text-white transition-colors duration-200">View-Once Vault</a>
            <a href="#membership" className="hover:text-white transition-colors duration-200">VIP Membership</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            <Link href="/login">
              <button className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white/90 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 rounded-full backdrop-blur-xl transition-all duration-200 active:scale-95 cursor-pointer">
                Sign In
              </button>
            </Link>
            <Link href="/login" className="hidden sm:inline-block">
              <button className="px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-[#FF1E6D] to-[#E91E63] hover:from-[#FF4081] hover:to-[#FF1E6D] rounded-full shadow-[0_0_30px_rgba(255,30,109,0.35)] hover:shadow-[0_0_40px_rgba(255,30,109,0.55)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                Join TMD Free
              </button>
            </Link>
          </div>

        </div>
      </header>


      {/* ========================================================
          HERO SECTION: 2-COLUMN LUXURY SPLIT (MOBILE COHESION)
          ======================================================== */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-12 sm:pt-20 pb-20 sm:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Typography, Value Proposition, Action Cluster */}
          <div className="lg:col-span-7 flex flex-col text-left">
            
            {/* Live Status Beacon Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/10 text-xs font-semibold text-white/90 w-fit mb-6 sm:mb-8 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF1E6D] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF1E6D]" />
              </span>
              <span className="text-white font-bold">1,840+ Singles Online</span>
              <span className="text-white/40">•</span>
              <span className="text-white/60">Mumbai, Delhi, Bangalore</span>
            </div>

            {/* Massive Editorial Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[1.06] mb-6 text-white">
              Real Dates. <br />
              <span className="bg-gradient-to-r from-[#FF1E6D] via-[#FF5E62] to-[#FFA07A] bg-clip-text text-transparent">
                Real Chemistry.
              </span>
            </h1>

            {/* Subtitle with perfect line height and spacing */}
            <p className="text-base sm:text-lg text-white/70 font-normal leading-[1.7] max-w-xl mb-10">
              India's premier private dating club. No endless zombie scrolling, no fake bots. Just <span className="text-white font-semibold">10 curated matches every 12 hours</span>, secret nightlife mixers, and ephemeral single-view photo privacy.
            </p>

            {/* Primary Action Button Cluster */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5 mb-12">
              <Link href="/login" className="flex-1 sm:flex-initial">
                <button className="group w-full sm:w-auto h-14 px-8 rounded-full bg-gradient-to-r from-[#FF1E6D] to-[#E91E63] hover:from-[#FF4081] hover:to-[#FF1E6D] text-white font-extrabold text-sm sm:text-base shadow-[0_0_40px_-5px_rgba(255,30,109,0.5)] hover:shadow-[0_0_55px_rgba(255,30,109,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer">
                  <span>Enter TMD Web App</span>
                  <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </Link>

              <Link href="/login" className="flex-1 sm:flex-initial">
                <button className="w-full sm:w-auto h-14 px-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-white/30 text-white font-bold text-sm backdrop-blur-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer">
                  <Zap size={17} className="text-[#FF1E6D]" />
                  <span>1-Tap VIP Demo Login</span>
                </button>
              </Link>
            </div>

            {/* Social Proof & Trust Metrics Bar */}
            <div className="pt-8 border-t border-white/[0.08] flex flex-wrap items-center gap-8 sm:gap-12">
              
              {/* Member Avatar Stack */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5 overflow-hidden">
                  <img className="inline-block h-9 w-9 rounded-full ring-2 ring-black object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Member" />
                  <img className="inline-block h-9 w-9 rounded-full ring-2 ring-black object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="Member" />
                  <img className="inline-block h-9 w-9 rounded-full ring-2 ring-black object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80" alt="Member" />
                  <img className="inline-block h-9 w-9 rounded-full ring-2 ring-black object-cover" src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80" alt="Member" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">14,200+ Verified</div>
                  <div className="text-[11px] text-white/50">Active singles in India</div>
                </div>
              </div>

              {/* Rating Proof */}
              <div className="flex items-center gap-2">
                <div className="flex text-[#FFB800] gap-0.5">
                  <Star size={14} className="fill-[#FFB800]" />
                  <Star size={14} className="fill-[#FFB800]" />
                  <Star size={14} className="fill-[#FFB800]" />
                  <Star size={14} className="fill-[#FFB800]" />
                  <Star size={14} className="fill-[#FFB800]" />
                </div>
                <div className="text-xs font-bold text-white">
                  4.9 / 5 <span className="text-white/50 font-normal">(8,500+ Dates)</span>
                </div>
              </div>

              {/* Safety Badge */}
              <div className="flex items-center gap-1.5 text-xs text-[#10B981] font-semibold">
                <ShieldCheck size={16} />
                <span>100% Face Verified</span>
              </div>

            </div>

          </div>

          {/* Right Column: Master Profile Card Showcase with Micro-Interactions */}
          <div className="lg:col-span-5 relative flex justify-center items-center py-6">
            
            {/* Ambient Background Aura */}
            <div className="absolute w-[400px] h-[400px] bg-gradient-to-tr from-[#FF1E6D]/30 to-[#FF5E62]/20 blur-[100px] -z-10 rounded-full" />

            {/* Floating Match Toast Pill (Micro-UX) */}
            <div className="absolute -top-3 -left-4 sm:-left-8 z-30 bg-[#161616]/95 backdrop-blur-2xl border border-white/15 px-4 py-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] flex items-center gap-3.5 animate-bounce [animation-duration:4s]">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#FF1E6D] flex-shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" 
                  alt="Aria" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>It's a Match! 🎉</span>
                  <span className="text-[10px] bg-[#FF1E6D] text-white px-1.5 py-0.2 rounded font-black">98%</span>
                </div>
                <div className="text-[11px] text-white/60">Aria wants to get drinks tonight</div>
              </div>
            </div>

            {/* Main Interactive Dating Card Container */}
            <div className="w-[340px] sm:w-[380px] rounded-3xl overflow-hidden bg-[#141414] border border-white/[0.14] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95)] relative group transition-all duration-300 hover:border-white/25">
              
              {/* Photo Area 3:4 Proportions */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#181818]">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" 
                  alt="Aria Sharma" 
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Photo Pagination Indicator Bars */}
                <div className="absolute top-3.5 inset-x-4 flex gap-1.5 z-20">
                  <div className="h-1 flex-1 rounded-full bg-white shadow-sm" />
                  <div className="h-1 flex-1 rounded-full bg-white/35" />
                  <div className="h-1 flex-1 rounded-full bg-white/35" />
                </div>

                {/* Status Badges */}
                <div className="absolute top-8 inset-x-4 flex items-center justify-between z-20">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] font-bold text-white border border-white/10 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Active 12m ago
                  </span>
                  <span className="px-3 py-1 bg-gradient-to-r from-[#FF1E6D] to-[#E91E63] rounded-full text-[11px] font-black text-white shadow-md">
                    PRO VIP
                  </span>
                </div>

                {/* Seductive Dark Gradient for Text Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent z-10" />

                {/* Profile Identity Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-6 z-20 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-white tracking-tight">Aria Sharma, 24</h3>
                    <CheckCircle2 size={20} className="text-[#2196F3] fill-current" />
                  </div>

                  <p className="text-xs text-white/80 font-medium flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#FF1E6D]" /> Bandra West, Mumbai • Architect
                  </p>

                  {/* Micro Dating Prompt Bubble */}
                  <div className="p-3 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/10 text-xs text-white/90 italic leading-relaxed">
                    💬 "Looking for someone to explore rooftop jazz bars, pour-over coffee spots, and midnight drives."
                  </div>

                  {/* Interest Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-semibold text-white/90">
                      🎨 Architecture
                    </span>
                    <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-semibold text-white/90">
                      🍸 Rooftop Bars
                    </span>
                    <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-semibold text-white/90">
                      🎧 Deep House
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Tactile Action Button Bar with Hover States */}
              <div className="py-4 px-6 bg-[#161616] border-t border-white/[0.08] flex items-center justify-center gap-5">
                {/* Rewind Button */}
                <button className="w-11 h-11 rounded-full bg-[#222222] border border-white/10 hover:border-[#FFB800]/50 hover:bg-[#FFB800]/10 flex items-center justify-center text-white/60 hover:text-[#FFB800] transition-all duration-200 cursor-pointer active:scale-90">
                  <RotateCcw size={18} />
                </button>
                {/* Pass Button */}
                <button className="w-13 h-13 rounded-full bg-[#222222] border border-white/10 hover:border-[#EF4444]/60 hover:bg-[#EF4444]/15 flex items-center justify-center text-white/70 hover:text-[#EF4444] transition-all duration-200 cursor-pointer active:scale-90">
                  <span className="text-xl font-bold">✕</span>
                </button>
                {/* Super Like Button */}
                <button className="w-11 h-11 rounded-full bg-[#222222] border border-white/10 hover:border-[#2196F3]/50 hover:bg-[#2196F3]/10 flex items-center justify-center text-[#2196F3] transition-all duration-200 cursor-pointer active:scale-90">
                  <Star size={19} className="fill-[#2196F3]" />
                </button>
                {/* Like Button (Hero Heart) */}
                <Link href="/login">
                  <button className="w-15 h-15 rounded-full bg-gradient-to-tr from-[#FF1E6D] to-[#FF5E62] flex items-center justify-center text-white shadow-[0_0_30px_rgba(255,30,109,0.5)] hover:shadow-[0_0_45px_rgba(255,30,109,0.7)] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer">
                    <Heart size={28} className="fill-white" />
                  </button>
                </Link>
              </div>

            </div>

            {/* Floating Event Guestlist Pill (Micro-UX) */}
            <div className="absolute -bottom-4 -right-4 sm:-right-8 z-30 bg-[#161616]/95 backdrop-blur-2xl border border-white/15 px-4 py-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF1E6D]/15 text-[#FF1E6D] flex items-center justify-center font-bold">
                <Calendar size={20} />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">Rooftop Sunset Social</div>
                <div className="text-[11px] text-white/60">Bandra, Mumbai • 38 Attending</div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================
          SECTION 2: WHY TMD HITS DIFFERENT (THE ANTI-GHOSTING CLUB)
          ======================================================== */}
      <section className="relative z-10 border-y border-white/[0.08] bg-[#0C0C0C] py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          
          <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20 space-y-3">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#FF1E6D]">The Modern Dating Standard</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.02em] text-white">
              Why TMD Hits Different
            </h2>
            <p className="text-sm sm:text-base text-white/60 leading-relaxed">
              We eliminated the casino swipe addiction to build a platform that actually results in real dates and chemistry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
            
            {/* The Old Way */}
            <div className="bg-[#141414] p-8 sm:p-10 rounded-3xl border border-white/[0.06] space-y-6">
              <div className="text-sm font-bold text-[#EF4444] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Other Dating Apps
              </div>
              <ul className="space-y-4 text-sm text-white/60">
                <li className="flex items-start gap-3.5">
                  <span className="text-[#EF4444] font-black text-base leading-none mt-1">✕</span>
                  <span>Endless swiping addiction with zero real-life meetings.</span>
                </li>
                <li className="flex items-start gap-3.5">
                  <span className="text-[#EF4444] font-black text-base leading-none mt-1">✕</span>
                  <span>Bot accounts, inactive profiles, and catfishes everywhere.</span>
                </li>
                <li className="flex items-start gap-3.5">
                  <span className="text-[#EF4444] font-black text-base leading-none mt-1">✕</span>
                  <span>Constant ghosting because matches don't expire or matter.</span>
                </li>
                <li className="flex items-start gap-3.5">
                  <span className="text-[#EF4444] font-black text-base leading-none mt-1">✕</span>
                  <span>Zero offline event integration or verified party mixers.</span>
                </li>
              </ul>
            </div>

            {/* The TMD Club Way */}
            <div className="bg-gradient-to-br from-[#1F1015] to-[#141414] p-8 sm:p-10 rounded-3xl border border-[#FF1E6D]/40 shadow-[0_15px_40px_-10px_rgba(255,30,109,0.2)] space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF1E6D]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="text-sm font-bold text-[#FF1E6D] uppercase tracking-wider flex items-center gap-2">
                <Flame size={16} /> The TMD Club Standard
              </div>
              <ul className="space-y-4 text-sm text-white/90">
                <li className="flex items-start gap-3.5">
                  <CheckCircle2 size={18} className="text-[#FF1E6D] flex-shrink-0 mt-0.5" />
                  <span><strong>12-Hour Curated Batches:</strong> 10 intentional daily profiles to end burnout.</span>
                </li>
                <li className="flex items-start gap-3.5">
                  <CheckCircle2 size={18} className="text-[#FF1E6D] flex-shrink-0 mt-0.5" />
                  <span><strong>100% Face Verified:</strong> Mandatory live biometric selfie verification.</span>
                </li>
                <li className="flex items-start gap-3.5">
                  <CheckCircle2 size={18} className="text-[#FF1E6D] flex-shrink-0 mt-0.5" />
                  <span><strong>Nightlife & Social Mixers:</strong> Curated cocktail tastings, comedy gigs, and house parties.</span>
                </li>
                <li className="flex items-start gap-3.5">
                  <CheckCircle2 size={18} className="text-[#FF1E6D] flex-shrink-0 mt-0.5" />
                  <span><strong>View-Once Privacy:</strong> Single-view photo vault with screenshot prevention.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================
          SECTION 3: CORE PILLARS (Clean, Big Visual Cards)
          ======================================================== */}
      <section id="discovery" className="relative z-10 py-24 sm:py-32 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
        
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-3">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[#FF5E62]">Engineered For Intent</span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.02em] text-white">
            Everything You Need For Real Dates
          </h2>
          <p className="text-sm sm:text-base text-white/60">
            A high-status ecosystem designed for ambitious singles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          
          {/* Pillar 1: Discovery */}
          <div className="bg-[#121212] rounded-3xl overflow-hidden border border-white/[0.08] hover:border-[#FF1E6D]/40 transition-all duration-300 flex flex-col justify-between group">
            <div className="aspect-[4/3] w-full overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80" 
                alt="Curated Discovery" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
            </div>
            <div className="p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FF1E6D]/15 text-[#FF1E6D] flex items-center justify-center font-bold">
                <Layers size={22} />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">10 Curated Matches / 12h</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                End swipe fatigue forever. Get 10 verified, high-compatibility profiles every 12-hour cycle. Mutual likes immediately unlock chat.
              </p>
            </div>
          </div>

          {/* Pillar 2: Nightlife Events */}
          <div id="events" className="bg-[#121212] rounded-3xl overflow-hidden border border-white/[0.08] hover:border-[#FF5E62]/40 transition-all duration-300 flex flex-col justify-between group">
            <div className="aspect-[4/3] w-full overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80" 
                alt="Nightlife & Events" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
            </div>
            <div className="p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FF5E62]/15 text-[#FF5E62] flex items-center justify-center font-bold">
                <Calendar size={22} />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Curated Nightlife Events</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                House parties, comedy mixers, and rooftop tastings. Check attendee guestlists, buy passes, and meet singles in real life.
              </p>
            </div>
          </div>

          {/* Pillar 3: View-Once Privacy */}
          <div id="privacy" className="bg-[#121212] rounded-3xl overflow-hidden border border-white/[0.08] hover:border-[#FF1E6D]/40 transition-all duration-300 flex flex-col justify-between group">
            <div className="aspect-[4/3] w-full overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80" 
                alt="Privacy & Security" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
            </div>
            <div className="p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FF1E6D]/15 text-[#FF1E6D] flex items-center justify-center font-bold">
                <EyeOff size={22} />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">View-Once Photo Vault</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Send private photos with single-view ephemeral encryption. Disappears after 30 seconds with screenshot warnings.
              </p>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================
          SECTION 4: TRANSPARENT VIP MEMBERSHIP
          ======================================================== */}
      <section id="membership" className="py-24 sm:py-32 bg-[#0B0B0B] border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
          
          <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20 space-y-3">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#FF5E62]">VIP Velocity</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-[-0.02em]">
              Simple, Honest Memberships
            </h2>
            <p className="text-sm text-white/60">Starting at ₹49. No recurring trap contracts.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            
            {/* Free */}
            <div className="p-8 bg-[#121212] rounded-3xl border border-white/10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Free Member</h3>
                <div className="text-3xl font-black text-white">₹0</div>
                <p className="text-xs text-white/50">Everything needed to date in your city.</p>
                <ul className="space-y-2.5 pt-4 text-xs text-white/70">
                  <li>✓ 10 swipes every 12h</li>
                  <li>✓ Same city discovery</li>
                  <li>✓ Unlimited 1:1 chat on match</li>
                </ul>
              </div>
              <Link href="/login">
                <button className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer">
                  Start Free
                </button>
              </Link>
            </div>

            {/* Basic ₹49 */}
            <div className="p-8 bg-[#121212] rounded-3xl border border-white/10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Basic Week</h3>
                <div className="text-3xl font-black text-white">₹49 <span className="text-xs text-white/40 font-normal">/ wk</span></div>
                <p className="text-xs text-white/50">Reveal who already liked you.</p>
                <ul className="space-y-2.5 pt-4 text-xs text-white/70">
                  <li>✓ 10 "Who Liked You" reveals</li>
                  <li>✓ Read receipts in chat</li>
                  <li>✓ 10 swipes every 12h</li>
                </ul>
              </div>
              <Link href="/login">
                <button className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer">
                  Choose Basic
                </button>
              </Link>
            </div>

            {/* Plus ₹149 */}
            <div className="p-8 bg-[#121212] rounded-3xl border border-white/10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Plus Monthly</h3>
                <div className="text-3xl font-black text-white">₹149 <span className="text-xs text-white/40 font-normal">/ mo</span></div>
                <p className="text-xs text-white/50">Unlimited swiping & India travel pass.</p>
                <ul className="space-y-2.5 pt-4 text-xs text-white/70">
                  <li>✓ Unlimited daily swipes</li>
                  <li>✓ All-India passport travel</li>
                  <li>✓ Unlimited likes reveal</li>
                </ul>
              </div>
              <Link href="/login">
                <button className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer">
                  Choose Plus
                </button>
              </Link>
            </div>

            {/* Pro VIP ₹499 */}
            <div className="p-8 bg-gradient-to-b from-[#1C1014] to-[#121212] rounded-3xl border border-[#FF1E6D]/60 shadow-[0_10px_35px_rgba(255,30,109,0.25)] flex flex-col justify-between space-y-6 relative">
              <div className="space-y-3">
                <div className="text-[10px] font-black uppercase text-[#FF1E6D] tracking-widest">Most Popular VIP</div>
                <h3 className="text-lg font-bold text-white">Pro VIP Pass</h3>
                <div className="text-3xl font-black text-[#FF1E6D]">₹499 <span className="text-xs text-white/40 font-normal">/ mo</span></div>
                <p className="text-xs text-white/50">The full elite VIP experience.</p>
                <ul className="space-y-2.5 pt-4 text-xs text-white/90">
                  <li className="text-[#FF5E62] font-semibold">✓ VIP Gold Verification Badge</li>
                  <li>✓ 5x Priority Profile Boost</li>
                  <li>✓ Free Nightlife Mixer RSVPs</li>
                  <li>✓ Unlimited View-Once photos</li>
                </ul>
              </div>
              <Link href="/login">
                <button className="w-full py-3.5 bg-gradient-to-r from-[#FF1E6D] to-[#FF5E62] text-white font-black rounded-2xl text-xs shadow-lg shadow-[#FF1E6D]/30 hover:opacity-95 transition-opacity cursor-pointer">
                  Get Pro VIP
                </button>
              </Link>
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================
          SECTION 5: FINAL SEDUCTIVE CALL TO ACTION
          ======================================================== */}
      <section className="relative z-10 py-16 sm:py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden relative border border-white/[0.12] bg-[#121212]">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1920&q=80" 
              alt="Couples laughing" 
              className="w-full h-full object-cover opacity-25 filter blur-[1px]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/60" />
          </div>

          <div className="relative z-10 p-8 sm:p-16 lg:p-20 max-w-2xl space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FF1E6D]/20 border border-[#FF1E6D]/40 text-xs font-bold text-[#FF1E6D]">
              <Flame size={14} /> Join Tonight
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Your Next Great Story Begins Tonight.
            </h2>
            <p className="text-base text-white/70 leading-relaxed">
              Step into a dating experience where members are verified, conversations lead to plans, and authentic chemistry comes first.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <button className="h-14 px-8 bg-gradient-to-r from-[#FF1E6D] to-[#E91E63] text-white font-extrabold text-sm sm:text-base rounded-full shadow-[0_0_35px_rgba(255,30,109,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 cursor-pointer">
                  <span>Start Dating On TMD</span>
                  <ArrowRight size={18} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ========================================================
          CLEAN LUXURY FOOTER
          ======================================================== */}
      <footer className="py-12 px-6 sm:px-10 lg:px-16 border-t border-white/[0.08] bg-black text-xs text-white/50 space-y-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF1E6D] to-[#FF5E62] flex items-center justify-center text-white">
              <Flame size={16} className="fill-white" />
            </div>
            <span className="text-lg font-black text-white">tmd<span className="text-[#FF1E6D]">.date</span></span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/guidelines" className="hover:text-white transition-colors">Community Guidelines</Link>
            <Link href="/login" className="hover:text-white font-bold text-[#FF1E6D]">1-Tap Demo Access</Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-white/[0.04] text-center text-[11px] text-white/40">
          © 2026 TMD — The Match Date. Strictly 18+ verified platform. Crafted with precision for authentic modern dating.
        </div>
      </footer>

    </div>
  );
}
