import Link from 'next/link';
import { Heart, Sparkles, MapPin, ShieldCheck, ArrowRight, Layers } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white flex flex-col justify-between selection:bg-[#E91E63] selection:text-white">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-[#1E1E1E] bg-[#121212]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E91E63] to-[#FF6F61] flex items-center justify-center text-white font-black text-sm shadow-md shadow-[#E91E63]/25">
            tmd
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            tmd<span className="text-[#E91E63]">.date</span>
          </span>
        </div>
        <Link href="/login">
          <button className="px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#E91E63] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">
            Sign In
          </button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-md mx-auto px-6 py-12 flex flex-col justify-center text-center">
        <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-[6px] bg-[#E91E63]/15 border border-[#E91E63]/30 text-xs font-bold text-[#E91E63] mx-auto mb-6">
          <Sparkles size={14} /> The Authentic Dating Experience
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4 text-white">
          Real Dates. <br />
          <span className="bg-gradient-to-r from-[#E91E63] to-[#FF6F61] bg-clip-text text-transparent">Real People.</span>
        </h1>

        <p className="text-sm text-[#9E9E9E] leading-relaxed mb-8 max-w-sm mx-auto">
          Match with verified members nearby and discover exclusive curated nightlife events. Zero bots. Zero fake photos.
        </p>

        <div className="space-y-3 mb-10">
          <Link href="/login" className="block w-full">
            <button className="w-full py-3.5 bg-gradient-to-r from-[#E91E63] to-[#C2185B] text-white font-bold rounded-lg text-base flex items-center justify-center gap-2 shadow-xl shadow-[#E91E63]/25 hover:opacity-95 transition-all cursor-pointer">
              <span>Join TMD Now</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </Link>
          <p className="text-[11px] text-[#666666]">
            Strictly 18+ verified profiles only. Complete safety & privacy controls.
          </p>
        </div>

        {/* Feature Tiles */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="bg-[#141414] p-4 rounded-lg border border-[#242424] hover:border-[#E91E63]/40 transition-colors">
            <Layers size={22} className="text-[#E91E63] mb-2" />
            <h3 className="text-xs font-bold text-white mb-1">Smart Discovery</h3>
            <p className="text-[11px] text-[#888888]">Mutual likes create immediate private conversations.</p>
          </div>

          <div className="bg-[#141414] p-4 rounded-lg border border-[#242424] hover:border-[#E91E63]/40 transition-colors">
            <MapPin size={22} className="text-[#FF6F61] mb-2" />
            <h3 className="text-xs font-bold text-white mb-1">Events Map</h3>
            <p className="text-[11px] text-[#888888]">Discover house parties, standup comedy & mixers.</p>
          </div>

          <div className="bg-[#141414] p-4 rounded-lg border border-[#242424] hover:border-[#E91E63]/40 transition-colors">
            <Sparkles size={22} className="text-[#E91E63] mb-2" />
            <h3 className="text-xs font-bold text-white mb-1">View Once Media</h3>
            <p className="text-[11px] text-[#888888]">Ephemeral single-view photos with high security.</p>
          </div>

          <div className="bg-[#141414] p-4 rounded-lg border border-[#242424] hover:border-[#4CAF50]/40 transition-colors">
            <ShieldCheck size={22} className="text-[#4CAF50] mb-2" />
            <h3 className="text-xs font-bold text-white mb-1">Face Verified</h3>
            <p className="text-[11px] text-[#888888]">Authentic community protected by active moderation.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-[#1C1C1C] text-center text-xs text-[#666666]">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/guidelines" className="hover:text-white transition-colors">Guidelines</Link>
        </div>
        <p>© 2026 TMD — The Match Date.</p>
      </footer>
    </div>
  );
}
