'use client';

import Link from 'next/link';
import { 
  Flame, Sparkles, MapPin, ShieldCheck, ArrowRight, 
  Layers, EyeOff, CheckCircle2, Zap, Heart, Calendar, Lock
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-black text-white flex flex-col selection:bg-[#E91E63] selection:text-white font-sans antialiased overflow-x-hidden">
      
      {/* ========================================================
          HERO SECTION: 100dvh FULL-BLEED MOBILE FIRST & DESKTOP SPLIT
          ======================================================== */}
      <section className="relative min-h-dvh flex flex-col justify-between overflow-hidden">
        
        {/* Full-Bleed Atmospheric Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=2000&q=80" 
            alt="Nightlife & Chemistry" 
            className="w-full h-full object-cover object-center scale-105"
          />
          {/* Seductive Dark Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(233,30,99,0.25)_0%,_transparent_70%)]" />
        </div>

        {/* Clean Top Navigation Bar */}
        <header className="relative z-20 px-5 sm:px-10 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E91E63] to-[#FF6F61] flex items-center justify-center text-white shadow-lg shadow-[#E91E63]/30">
              <Flame size={22} className="fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              tmd<span className="text-[#E91E63]">.date</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/80">
            <a href="#features" className="hover:text-[#E91E63] transition-colors">How It Works</a>
            <a href="#events" className="hover:text-[#E91E63] transition-colors">Nightlife Events</a>
            <a href="#membership" className="hover:text-[#E91E63] transition-colors">VIP Membership</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="px-4 py-2 text-sm font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 rounded-lg transition-all cursor-pointer">
                Sign In
              </button>
            </Link>
          </div>
        </header>

        {/* Hero Body Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-10 w-full flex-1 flex flex-col justify-end lg:justify-center pb-8 sm:pb-12 pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content (Mobile Bottom-Anchored / Desktop Left) */}
            <div className="lg:col-span-7 flex flex-col space-y-5 text-left max-w-xl">
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs font-semibold text-white/90 w-fit">
                <span className="w-2 h-2 rounded-full bg-[#E91E63] animate-pulse" />
                <span>1,840+ Verified Members Online Tonight</span>
              </div>

              {/* Bold Seductive Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white">
                Real Dates. <br />
                <span className="bg-gradient-to-r from-[#E91E63] via-[#FF5252] to-[#FF7043] bg-clip-text text-transparent">
                  Tonight.
                </span>
              </h1>

              {/* Punchy Subtitle */}
              <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-lg">
                India's private social dating club. 10 curated matches every 12 hours, secret weekend mixers, and zero fake profiles.
              </p>

              {/* Primary Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                <Link href="/login" className="w-full sm:w-auto flex-1">
                  <button className="w-full py-4 px-8 bg-gradient-to-r from-[#E91E63] to-[#D81B60] hover:from-[#FF4081] hover:to-[#E91E63] text-white font-extrabold text-base rounded-xl shadow-xl shadow-[#E91E63]/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <span>Join TMD Now</span>
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </button>
                </Link>

                <Link href="/login" className="w-full sm:w-auto flex-1">
                  <button className="w-full py-4 px-6 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 hover:border-[#E91E63]/50 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <Zap size={16} className="text-[#E91E63]" />
                    <span>1-Tap VIP Demo Access</span>
                  </button>
                </Link>
              </div>

              {/* Trust Footnote */}
              <div className="flex items-center gap-4 text-xs text-white/50 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-[#4CAF50]" /> 100% Face Verified
                </span>
                <span>•</span>
                <span>Strictly 18+ Only</span>
                <span>•</span>
                <span className="hidden sm:inline">Mumbai, Delhi, Bangalore</span>
              </div>
            </div>

            {/* Right Showcase Card (Visible on Desktop / Tablets) */}
            <div className="hidden lg:flex lg:col-span-5 justify-center relative">
              <div className="w-[360px] rounded-2xl overflow-hidden bg-[#121212]/90 border border-white/20 shadow-2xl shadow-black relative backdrop-blur-xl">
                {/* Photo 3:4 Proportions */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#181818]">
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" 
                    alt="Aria Sharma" 
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  
                  {/* Top Tags */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md text-[11px] font-bold text-white border border-white/10 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]" /> Active Now
                    </span>
                    <span className="px-2.5 py-1 bg-[#E91E63] rounded-md text-[11px] font-bold text-white">
                      Pro VIP
                    </span>
                  </div>

                  {/* Profile Info Overlay */}
                  <div className="absolute bottom-0 inset-x-0 p-5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-white">Aria Sharma, 24</h3>
                      <CheckCircle2 size={18} className="text-[#2196F3] fill-current" />
                    </div>
                    <p className="text-xs text-white/80">Bandra West, Mumbai • Architect</p>
                    <p className="text-xs text-white/70 italic">"Rooftop jazz bars, pour-over coffee, and late night drives."</p>
                  </div>
                </div>

                {/* Tactile Bottom Action Bar */}
                <div className="p-4 bg-[#141414] border-t border-white/10 flex items-center justify-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-[#222] border border-white/10 flex items-center justify-center text-white/70">✕</div>
                  <Link href="/login">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#E91E63] to-[#FF6F61] flex items-center justify-center text-white shadow-lg shadow-[#E91E63]/40">
                      <Heart size={26} className="fill-white" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="relative z-20 pb-4 text-center text-white/40 text-xs hidden sm:block">
          Scroll to explore TMD features ↓
        </div>
      </section>


      {/* ========================================================
          SECTION 2: 3 CORE PILLARS (Clean, Big Visual Cards)
          ======================================================== */}
      <section id="features" className="py-20 px-5 sm:px-10 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-[#E91E63]">Why TMD Works</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Designed for Real Connections
          </h2>
          <p className="text-sm sm:text-base text-white/60">
            No games, no endless swiping. Everything is optimized to get you on real dates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Pillar 1 */}
          <div className="bg-[#121212] rounded-2xl overflow-hidden border border-white/10 hover:border-[#E91E63]/40 transition-all flex flex-col justify-between">
            <div className="aspect-[4/3] w-full overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80" 
                alt="Curated Discovery" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
            </div>
            <div className="p-6 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-[#E91E63]/15 text-[#E91E63] flex items-center justify-center font-bold">
                <Layers size={20} />
              </div>
              <h3 className="text-xl font-bold text-white">10 Curated Matches / 12h</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                End swipe burnout. Receive 10 high-intent profiles every 12 hours. Mutual likes immediately unlock chat.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div id="events" className="bg-[#121212] rounded-2xl overflow-hidden border border-white/10 hover:border-[#FF6F61]/40 transition-all flex flex-col justify-between">
            <div className="aspect-[4/3] w-full overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80" 
                alt="Nightlife & Events" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
            </div>
            <div className="p-6 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-[#FF6F61]/15 text-[#FF6F61] flex items-center justify-center font-bold">
                <Calendar size={20} />
              </div>
              <h3 className="text-xl font-bold text-white">Curated Nightlife Events</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Secret house parties, comedy nights, and cocktail mixers. View attendee lists and meet verified singles in person.
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-[#121212] rounded-2xl overflow-hidden border border-white/10 hover:border-[#E91E63]/40 transition-all flex flex-col justify-between">
            <div className="aspect-[4/3] w-full overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80" 
                alt="Privacy & Security" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
            </div>
            <div className="p-6 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-[#E91E63]/15 text-[#E91E63] flex items-center justify-center font-bold">
                <EyeOff size={20} />
              </div>
              <h3 className="text-xl font-bold text-white">View-Once Photo Privacy</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Send private photos with single-view ephemeral encryption. Disappears after 30 seconds with screenshot warnings.
              </p>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================
          SECTION 3: VIP PLANS (Clean, Transparent Cards)
          ======================================================== */}
      <section id="membership" className="py-20 px-5 sm:px-10 bg-[#0A0A0A] border-t border-white/10">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#FF6F61]">VIP Upgrades</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Simple, Honest Memberships
            </h2>
            <p className="text-sm text-white/60">Starting at ₹49. No recurring lock-ins.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free */}
            <div className="p-6 bg-[#121212] rounded-2xl border border-white/10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Free Member</h3>
                <div className="text-3xl font-black text-white">₹0</div>
                <p className="text-xs text-white/50">Everything needed to date in your city.</p>
                <ul className="space-y-2 pt-2 text-xs text-white/70">
                  <li>✓ 10 swipes every 12h</li>
                  <li>✓ Same city discovery</li>
                  <li>✓ Unlimited 1:1 chat</li>
                </ul>
              </div>
              <Link href="/login">
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer">
                  Start Free
                </button>
              </Link>
            </div>

            {/* Basic ₹49 */}
            <div className="p-6 bg-[#121212] rounded-2xl border border-white/10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Basic Week</h3>
                <div className="text-3xl font-black text-white">₹49 <span className="text-xs text-white/40 font-normal">/ wk</span></div>
                <p className="text-xs text-white/50">Reveal who already liked you.</p>
                <ul className="space-y-2 pt-2 text-xs text-white/70">
                  <li>✓ 10 "Who Liked You" reveals</li>
                  <li>✓ Read receipts in chat</li>
                  <li>✓ 10 swipes every 12h</li>
                </ul>
              </div>
              <Link href="/login">
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer">
                  Choose Basic
                </button>
              </Link>
            </div>

            {/* Plus ₹149 */}
            <div className="p-6 bg-[#121212] rounded-2xl border border-white/10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Plus Monthly</h3>
                <div className="text-3xl font-black text-white">₹149 <span className="text-xs text-white/40 font-normal">/ mo</span></div>
                <p className="text-xs text-white/50">Unlimited swiping & India travel pass.</p>
                <ul className="space-y-2 pt-2 text-xs text-white/70">
                  <li>✓ Unlimited daily swipes</li>
                  <li>✓ All-India passport travel</li>
                  <li>✓ Unlimited likes reveal</li>
                </ul>
              </div>
              <Link href="/login">
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer">
                  Choose Plus
                </button>
              </Link>
            </div>

            {/* Pro VIP ₹499 */}
            <div className="p-6 bg-gradient-to-b from-[#1C1014] to-[#121212] rounded-2xl border border-[#E91E63]/60 shadow-xl shadow-[#E91E63]/20 flex flex-col justify-between space-y-6 relative">
              <div className="space-y-3">
                <div className="text-[10px] font-black uppercase text-[#E91E63] tracking-widest">Most Popular VIP</div>
                <h3 className="text-lg font-bold text-white">Pro VIP Pass</h3>
                <div className="text-3xl font-black text-[#E91E63]">₹499 <span className="text-xs text-white/40 font-normal">/ mo</span></div>
                <p className="text-xs text-white/50">The full elite VIP experience.</p>
                <ul className="space-y-2 pt-2 text-xs text-white/90">
                  <li className="text-[#FF6F61] font-semibold">✓ VIP Gold Verification Badge</li>
                  <li>✓ 5x Priority Profile Boost</li>
                  <li>✓ Free Nightlife Mixer RSVPs</li>
                  <li>✓ Unlimited View-Once photos</li>
                </ul>
              </div>
              <Link href="/login">
                <button className="w-full py-3 bg-gradient-to-r from-[#E91E63] to-[#FF6F61] text-white font-black rounded-xl text-xs shadow-lg shadow-[#E91E63]/30 hover:opacity-95 transition-opacity cursor-pointer">
                  Get Pro VIP
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          CLEAN FOOTER
          ======================================================== */}
      <footer className="py-10 px-5 sm:px-10 border-t border-white/10 bg-black text-center text-xs text-white/50 space-y-4">
        <div className="flex justify-center gap-6">
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/guidelines" className="hover:text-white">Guidelines</Link>
          <Link href="/login" className="hover:text-white font-bold text-[#E91E63]">Sign In</Link>
        </div>
        <p>© 2026 TMD — The Match Date. 100% 18+ Verified Platform.</p>
      </footer>

    </div>
  );
}
