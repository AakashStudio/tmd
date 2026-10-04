'use client';

import Link from 'next/link';
import { Flame, Heart, X, Sparkles, ShieldCheck, MapPin, Calendar, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#08080A] text-white flex flex-col select-none relative overflow-x-hidden">
      {/* Ambient Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#FF1493]/15 to-transparent blur-[140px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="w-full border-b border-[#1E1E26] bg-[#0E0E12]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF1493] to-[#FF4D6D] flex items-center justify-center shadow-md shadow-[#FF1493]/30">
              <Flame size={18} className="fill-white text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-white">TMD</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto px-5 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A22] border border-[#2D2D38] text-xs font-semibold text-[#FF4D6D]">
              <Sparkles size={13} />
              <span>Dating without the noise</span>
            </div>

            <h1 className="tmd-display text-white text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
              Find dates. <br />
              <span className="bg-gradient-to-r from-[#FF1493] to-[#FF4D6D] bg-clip-text text-transparent">
                Not pen pals.
              </span>
            </h1>

            <p className="tmd-body-large text-[#A1A1AA] max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Curated verified matches, exclusive real-world nightlife events, and privacy-protected single-view conversations.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <span>Enter TMD Now</span>
                  <ArrowRight size={17} />
                </Button>
              </Link>
              <span className="text-xs text-[#71717A] pt-1 sm:pt-0">
                18+ verified singles only
              </span>
            </div>
          </div>

          {/* Realistic Mobile Discovery Mockup Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[320px] aspect-[3/4.2] rounded-[8px] overflow-hidden bg-[#121216] border border-[#1E1E26] shadow-2xl p-2.5 flex flex-col justify-between">
              {/* Card Photo Surface */}
              <div className="relative flex-1 rounded-[6px] overflow-hidden bg-[#1A1A22]">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80"
                  alt="Discovery Card Preview"
                  className="w-full h-full object-cover"
                />

                {/* Scrim Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080A] via-black/40 to-transparent pointer-events-none" />

                {/* Card Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-white">Ananya, 24</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#FF1493] text-white flex items-center justify-center text-[8px] font-bold">
                      ✓
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/80">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-[#FF4D6D]" /> Bandra, Mumbai
                    </span>
                  </div>
                  <span className="inline-block text-[10px] font-semibold bg-white/15 backdrop-blur-md px-2 py-0.5 rounded-[4px] text-white">
                    Long-term relationship
                  </span>
                </div>
              </div>

              {/* Discovery Buttons */}
              <div className="flex items-center justify-center gap-5 pt-2 pb-0.5">
                <div className="w-12 h-12 rounded-full bg-[#121216] border border-[#2D2D38] flex items-center justify-center text-[#EF4444] shadow-md">
                  <X size={22} strokeWidth={2.5} />
                </div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF1493] to-[#FF4D6D] flex items-center justify-center text-white shadow-xl shadow-[#FF1493]/30">
                  <Heart size={26} fill="white" strokeWidth={1} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-16 border-t border-[#1E1E26] mt-16">
          <div className="p-5 rounded-[8px] bg-[#121216] border border-[#1E1E26] space-y-2">
            <div className="w-9 h-9 rounded-full bg-[#FF1493]/15 text-[#FF1493] flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <h3 className="tmd-h3 text-white">Real Humans Only</h3>
            <p className="tmd-body-small text-[#A1A1AA] leading-relaxed">
              Biometric face verification eliminates fake accounts, catfishes, and AI generators.
            </p>
          </div>

          <div className="p-5 rounded-[8px] bg-[#121216] border border-[#1E1E26] space-y-2">
            <div className="w-9 h-9 rounded-full bg-[#FF4D6D]/15 text-[#FF4D6D] flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <h3 className="tmd-h3 text-white">Nightlife Events Map</h3>
            <p className="tmd-body-small text-[#A1A1AA] leading-relaxed">
              Join or host real mixers, comedy gigs, and private rooftop house parties in your city.
            </p>
          </div>

          <div className="p-5 rounded-[8px] bg-[#121216] border border-[#1E1E26] space-y-2">
            <div className="w-9 h-9 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center">
              <Flame size={18} />
            </div>
            <h3 className="tmd-h3 text-white">Ephemeral Privacy</h3>
            <p className="tmd-body-small text-[#A1A1AA] leading-relaxed">
              Encrypted direct chat with protected single-view photos that self-destruct in 15 seconds.
            </p>
          </div>
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-[#1E1E26] bg-[#0E0E12] py-6 px-5 select-none">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">TMD — The Match Date</span>
            <span>• © {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/guidelines" className="hover:text-white transition-colors">Guidelines</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
