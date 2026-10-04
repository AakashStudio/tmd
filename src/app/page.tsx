import Link from 'next/link';
import { 
  Heart, Sparkles, MapPin, ShieldCheck, ArrowRight, Layers, 
  EyeOff, Star, CheckCircle2, Flame, Users, Calendar, Lock,
  ChevronRight, Smartphone
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#080808] text-white flex flex-col selection:bg-[#E91E63] selection:text-white overflow-x-hidden font-sans">
      {/* Ambient Gradient Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#E91E63]/20 via-[#FF6F61]/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -left-60 w-[600px] h-[600px] bg-[#9C27B0]/15 blur-[160px] rounded-full" />
        <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-[#E91E63]/15 blur-[160px] rounded-full" />
      </div>

      {/* Top Banner: Online Live Pulse */}
      <div className="relative z-20 bg-gradient-to-r from-[#E91E63]/15 via-[#1A1A1A] to-[#E91E63]/15 border-b border-white/5 py-2 px-4 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-white/90">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E91E63] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E91E63]" />
          </span>
          <span className="font-semibold text-white">1,840+ Verified Members</span> active tonight in Mumbai, Delhi & Bangalore
          <Link href="/login" className="text-[#FF6F61] hover:underline font-bold ml-1 hidden sm:inline">
            Join the Guestlist →
          </Link>
        </div>
      </div>

      {/* Sticky Glassmorphic Header */}
      <header className="relative z-30 px-6 lg:px-12 py-4 flex items-center justify-between border-b border-white/[0.08] bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#E91E63] to-[#FF6F61] flex items-center justify-center text-white font-black text-base shadow-lg shadow-[#E91E63]/30 group-hover:scale-105 transition-transform">
              <Flame size={20} className="fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              tmd<span className="text-[#E91E63]">.date</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
            <a href="#discovery" className="hover:text-white transition-colors">Smart Discovery</a>
            <a href="#events" className="hover:text-white transition-colors">Nightlife Events</a>
            <a href="#privacy" className="hover:text-white transition-colors">View-Once Vault</a>
            <a href="#membership" className="hover:text-white transition-colors">VIP Plans</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <button className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer">
              Sign In
            </button>
          </Link>
          <Link href="/login">
            <button className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-[#E91E63] to-[#FF6F61] text-white text-xs sm:text-sm font-bold rounded-lg shadow-lg shadow-[#E91E63]/25 hover:shadow-[#E91E63]/40 hover:scale-[1.02] transition-all flex items-center gap-1.5 cursor-pointer">
              <span>Join TMD</span>
              <ArrowRight size={15} />
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section: Full-Width 2-Column Responsive */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-20 lg:py-24">
        {/* Background Hero Image with Moody Vignette */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=2000&q=80" 
            alt="Nightlife ambiance" 
            className="w-full h-full object-cover filter blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-transparent to-[#080808]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/80 to-[#080808]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 flex flex-col text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E91E63]/10 border border-[#E91E63]/30 text-xs font-bold text-[#E91E63] w-fit shadow-inner">
              <Sparkles size={14} className="text-[#E91E63]" /> The Anti-Ghosting Social Club
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white">
              Real Dates. <br />
              <span className="bg-gradient-to-r from-[#E91E63] via-[#FF5252] to-[#FF7043] bg-clip-text text-transparent">
                Zero Games.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
              India's premier private dating club. No endless zombie scrolling, no fake bots. Just <span className="text-white font-semibold">10 curated matches every 12 hours</span>, private nightlife mixers, and ephemeral single-view photo privacy.
            </p>

            {/* CTAs Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link href="/login" className="flex-1 sm:flex-initial">
                <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#E91E63] to-[#D81B60] hover:from-[#FF4081] hover:to-[#E91E63] text-white font-extrabold text-base rounded-lg shadow-xl shadow-[#E91E63]/30 hover:shadow-[#E91E63]/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <span>Enter TMD Web App</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              </Link>

              <Link href="/login" className="flex-1 sm:flex-initial">
                <button className="w-full sm:w-auto px-6 py-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-[#E91E63]/50 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Flame size={18} className="text-[#E91E63]" />
                  <span>1-Tap VIP Demo Access</span>
                </button>
              </Link>
            </div>

            {/* Trust Proof & Safety Metrics */}
            <div className="pt-6 border-t border-white/[0.08] grid grid-cols-3 gap-4 max-w-xl">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">100%</div>
                <div className="text-xs text-white/50 font-medium">Face Verified</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-[#E91E63]">10 / 12h</div>
                <div className="text-xs text-white/50 font-medium">Curated Discovery</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">4.9 ★</div>
                <div className="text-xs text-white/50 font-medium">Member Rating</div>
              </div>
            </div>

            {/* Supported Cities */}
            <div className="flex items-center gap-2 text-xs text-white/40 pt-1">
              <MapPin size={14} className="text-[#E91E63]" />
              <span>Active in Mumbai • Delhi NCR • Bangalore • Pune • Goa • Hyderabad</span>
            </div>
          </div>

          {/* Right Column: Hero Interactive Dating Card Preview */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Ambient Back Glow for Phone Mockup */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E91E63]/30 via-transparent to-[#FF6F61]/20 blur-3xl -z-10 rounded-full scale-110" />

            {/* Floating Match Toast Badge */}
            <div className="absolute -top-6 -left-4 sm:-left-8 z-30 bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce [animation-duration:3s]">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#E91E63]">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" 
                  alt="Aria" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>It's a Match!</span>
                  <span className="text-[10px] bg-[#E91E63] text-white px-1.5 py-0.2 rounded font-black">98%</span>
                </div>
                <div className="text-[11px] text-white/60">Aria liked your profile</div>
              </div>
            </div>

            {/* Main Interactive Profile Card */}
            <div className="w-full max-w-[360px] sm:max-w-[390px] rounded-xl overflow-hidden bg-[#121212] border border-white/[0.12] shadow-2xl shadow-black relative group">
              {/* Photo Area with 3:4 Proportions */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#181818]">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" 
                  alt="Aria Sharma" 
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                />

                {/* Top Status Indicators */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                  <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md text-[11px] font-bold text-white border border-white/10 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]" /> Active Now
                  </span>
                  <span className="px-2.5 py-1 bg-[#E91E63]/90 backdrop-blur-md rounded-md text-[11px] font-bold text-white shadow-md">
                    Pro Verified
                  </span>
                </div>

                {/* Dark Vignette Overlay for Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Profile Identity Details Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-5 z-10 space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-white">Aria Sharma, 24</h2>
                    <CheckCircle2 size={18} className="text-[#2196F3] fill-current" />
                  </div>

                  <p className="text-xs text-white/80 font-medium flex items-center gap-1">
                    <MapPin size={12} className="text-[#E91E63]" /> Bandra West, Mumbai • Architect
                  </p>

                  <p className="text-xs text-white/70 italic line-clamp-2">
                    "Looking for someone to explore rooftop jazz bars, pour-over coffee spots, and midnight drives."
                  </p>

                  {/* Interests Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded text-[10px] text-white/90">
                      🎨 Architecture
                    </span>
                    <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded text-[10px] text-white/90">
                      🍸 Rooftop Bars
                    </span>
                    <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded text-[10px] text-white/90">
                      🎧 Techno
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Tactile Action Buttons */}
              <div className="p-4 bg-[#141414] border-t border-white/[0.06] flex items-center justify-center gap-6">
                <button className="w-12 h-12 rounded-lg bg-[#202020] border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center text-white/70 hover:text-red-400 transition-all cursor-pointer">
                  <span className="text-lg font-bold">✕</span>
                </button>
                <button className="w-12 h-12 rounded-lg bg-[#202020] border border-white/10 hover:border-yellow-500/50 hover:bg-yellow-500/10 flex items-center justify-center text-yellow-400 transition-all cursor-pointer">
                  <Star size={20} className="fill-yellow-400" />
                </button>
                <Link href="/login">
                  <button className="w-14 h-14 rounded-lg bg-gradient-to-tr from-[#E91E63] to-[#FF6F61] flex items-center justify-center text-white shadow-lg shadow-[#E91E63]/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                    <Heart size={26} className="fill-white" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Floating Event Guestlist Badge */}
            <div className="absolute -bottom-6 -right-2 sm:-right-6 z-30 bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/10 p-3 rounded-lg shadow-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E91E63]/15 flex items-center justify-center text-[#E91E63]">
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

      {/* Section 2: Why TMD Hits Different (Comparison) */}
      <section className="relative z-10 border-y border-white/[0.06] bg-[#0E0E0E] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#E91E63]">The Modern Standard</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Why TMD Hits Different
            </h2>
            <p className="text-sm sm:text-base text-white/60">
              We ditched the addictive casino mechanics of traditional dating apps to build a platform that actually gets you on dates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* The Old Way */}
            <div className="bg-[#121212] p-8 rounded-xl border border-white/[0.06] space-y-4">
              <div className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <span>✕</span> Other Dating Apps
              </div>
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold mt-0.5">•</span>
                  Endless swiping addiction with zero real-life meetings.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold mt-0.5">•</span>
                  Bot accounts, inactive profiles, and catfishes everywhere.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold mt-0.5">•</span>
                  Constant ghosting because matches don't expire or matter.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold mt-0.5">•</span>
                  Zero real-world event integration or verified party mixers.
                </li>
              </ul>
            </div>

            {/* The TMD Club Way */}
            <div className="bg-gradient-to-br from-[#1C1014] to-[#141414] p-8 rounded-xl border border-[#E91E63]/30 shadow-xl shadow-[#E91E63]/10 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E91E63]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="text-sm font-bold text-[#E91E63] uppercase tracking-wider flex items-center gap-2">
                <Flame size={16} /> The TMD Experience
              </div>
              <ul className="space-y-3 text-sm text-white/90">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-[#E91E63] flex-shrink-0 mt-0.5" />
                  <span><strong>12-Hour Curated Batches:</strong> 10 intentional daily profiles to end burnout.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-[#E91E63] flex-shrink-0 mt-0.5" />
                  <span><strong>100% Face Verified:</strong> Mandatory live biometric verification.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-[#E91E63] flex-shrink-0 mt-0.5" />
                  <span><strong>Nightlife & Social Events:</strong> Curated mixers, comedy gigs, and house parties.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-[#E91E63] flex-shrink-0 mt-0.5" />
                  <span><strong>View-Once Privacy:</strong> Single-view photo vault with screenshot prevention.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Feature Pillars Grid */}
      <section id="discovery" className="relative z-10 py-20 lg:py-28 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-[#FF6F61]">Engineered For Intent</span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Everything You Need For Real Chemistry
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-[#121212] p-6 rounded-xl border border-white/[0.08] hover:border-[#E91E63]/50 transition-all group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#E91E63]/10 text-[#E91E63] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">12-Hour Discovery</h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                Receive 10 hyper-compatible profiles every 12-hour cycle. High attention, meaningful conversations, zero spam.
              </p>
            </div>
            <div className="pt-4 text-xs font-bold text-[#E91E63] flex items-center gap-1">
              Learn more <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 2 */}
          <div id="events" className="bg-[#121212] p-6 rounded-xl border border-white/[0.08] hover:border-[#FF6F61]/50 transition-all group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#FF6F61]/10 text-[#FF6F61] flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Interactive Events Map</h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                Discover underground comedy shows, cocktail mixers, and house parties nearby. RSVP and meet members in real life.
              </p>
            </div>
            <div className="pt-4 text-xs font-bold text-[#FF6F61] flex items-center gap-1">
              Explore events <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 3 */}
          <div id="privacy" className="bg-[#121212] p-6 rounded-xl border border-white/[0.08] hover:border-[#E91E63]/50 transition-all group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#E91E63]/10 text-[#E91E63] flex items-center justify-center group-hover:scale-110 transition-transform">
                <EyeOff size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">View-Once Media Vault</h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                Share private photos safely. Recipient can view once for 30 seconds before it self-destructs from our servers forever.
              </p>
            </div>
            <div className="pt-4 text-xs font-bold text-[#E91E63] flex items-center gap-1">
              View security specs <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-[#121212] p-6 rounded-xl border border-white/[0.08] hover:border-[#4CAF50]/50 transition-all group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#4CAF50]/10 text-[#4CAF50] flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Biometric Face Verified</h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                AI live selfie verification combined with human audit ensures the person you are texting is the exact person you meet.
              </p>
            </div>
            <div className="pt-4 text-xs font-bold text-[#4CAF50] flex items-center gap-1">
              Verification policy <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Upcoming Events Showcase */}
      <section className="relative z-10 border-t border-white/[0.06] bg-[#0A0A0A] py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#E91E63]">Real World Connections</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">Curated Weekend Mixers</h2>
              <p className="text-sm text-white/60 mt-1">Exclusive guestlists for verified TMD members.</p>
            </div>
            <Link href="/login">
              <button className="px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">
                View All Events →
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Event 1 */}
            <div className="bg-[#121212] rounded-xl overflow-hidden border border-white/[0.08] hover:border-[#E91E63]/40 transition-all group">
              <div className="aspect-[16/9] w-full overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80" 
                  alt="Rooftop party" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-bold text-white">
                  📍 Mumbai
                </div>
              </div>
              <div className="p-5 space-y-2">
                <div className="text-xs font-bold text-[#E91E63]">Friday • 8:00 PM onwards</div>
                <h3 className="text-lg font-bold text-white">Rooftop Sunset & House Music Social</h3>
                <p className="text-xs text-white/60">Bandra West, Mumbai • 38 Singles Attending</p>
              </div>
            </div>

            {/* Event 2 */}
            <div className="bg-[#121212] rounded-xl overflow-hidden border border-white/[0.08] hover:border-[#FF6F61]/40 transition-all group">
              <div className="aspect-[16/9] w-full overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80" 
                  alt="Cocktail party" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-bold text-white">
                  📍 Bangalore
                </div>
              </div>
              <div className="p-5 space-y-2">
                <div className="text-xs font-bold text-[#FF6F61]">Saturday • 7:30 PM</div>
                <h3 className="text-lg font-bold text-white">Indie Vinyl & Natural Wine Mixer</h3>
                <p className="text-xs text-white/60">Indiranagar, Bangalore • 24 Singles Attending</p>
              </div>
            </div>

            {/* Event 3 */}
            <div className="bg-[#121212] rounded-xl overflow-hidden border border-white/[0.08] hover:border-[#E91E63]/40 transition-all group">
              <div className="aspect-[16/9] w-full overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80" 
                  alt="Social gathering" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-bold text-white">
                  📍 Delhi NCR
                </div>
              </div>
              <div className="p-5 space-y-2">
                <div className="text-xs font-bold text-[#E91E63]">Sunday • 6:00 PM</div>
                <h3 className="text-lg font-bold text-white">Standup Comedy & Craft Cocktail Night</h3>
                <p className="text-xs text-white/60">Hauz Khas Village, Delhi • 42 Singles Attending</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Membership & VIP Tiers */}
      <section id="membership" className="relative z-10 py-20 lg:py-28 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-[#E91E63]">Transparent Pricing</span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Choose Your Dating Velocity
          </h2>
          <p className="text-sm sm:text-base text-white/60">
            Fair, transparent, micro-pricing starting at just ₹49. No recurring traps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Free */}
          <div className="bg-[#121212] p-6 rounded-xl border border-white/[0.08] flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white">Free Member</h3>
              <div className="text-3xl font-black text-white">₹0</div>
              <p className="text-xs text-white/50">For genuine singles taking things steady.</p>
              <ul className="space-y-2 pt-4 text-xs text-white/70">
                <li className="flex items-center gap-2">✓ 10 swipes every 12h</li>
                <li className="flex items-center gap-2">✓ Same city discovery</li>
                <li className="flex items-center gap-2">✓ 1:1 chat on match</li>
              </ul>
            </div>
            <Link href="/login">
              <button className="w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.15] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer">
                Get Started
              </button>
            </Link>
          </div>

          {/* Basic ₹49 */}
          <div className="bg-[#121212] p-6 rounded-xl border border-white/[0.08] flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white">Basic Week</h3>
              <div className="text-3xl font-black text-white">₹49 <span className="text-xs font-normal text-white/40">/ week</span></div>
              <p className="text-xs text-white/50">See who has already liked you.</p>
              <ul className="space-y-2 pt-4 text-xs text-white/70">
                <li className="flex items-center gap-2">✓ 10 swipes per 12h</li>
                <li className="flex items-center gap-2">✓ 10 "Who Liked You" reveals</li>
                <li className="flex items-center gap-2">✓ Read receipts in chat</li>
              </ul>
            </div>
            <Link href="/login">
              <button className="w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.15] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer">
                Unlock Basic
              </button>
            </Link>
          </div>

          {/* Plus ₹149 */}
          <div className="bg-[#121212] p-6 rounded-xl border border-white/[0.08] flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white">Plus Monthly</h3>
              <div className="text-3xl font-black text-white">₹149 <span className="text-xs font-normal text-white/40">/ month</span></div>
              <p className="text-xs text-white/50">For active singles on the move.</p>
              <ul className="space-y-2 pt-4 text-xs text-white/70">
                <li className="flex items-center gap-2">✓ Unlimited daily swipes</li>
                <li className="flex items-center gap-2">✓ Nationwide location passport</li>
                <li className="flex items-center gap-2">✓ Unlimited "Who Liked You"</li>
              </ul>
            </div>
            <Link href="/login">
              <button className="w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.15] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer">
                Unlock Plus
              </button>
            </Link>
          </div>

          {/* Pro VIP ₹499 */}
          <div className="bg-gradient-to-b from-[#1C1014] to-[#121212] p-6 rounded-xl border border-[#E91E63]/50 shadow-xl shadow-[#E91E63]/20 flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E91E63] text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full tracking-wider">
              Most Popular VIP
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                <span>Pro VIP Pass</span>
                <Sparkles size={16} className="text-[#FF6F61]" />
              </h3>
              <div className="text-3xl font-black text-[#E91E63]">₹499 <span className="text-xs font-normal text-white/40">/ month</span></div>
              <p className="text-xs text-white/50">The complete high-status VIP experience.</p>
              <ul className="space-y-2 pt-4 text-xs text-white/90">
                <li className="flex items-center gap-2 text-[#FF6F61] font-semibold">✓ Exclusive VIP Golden Badge</li>
                <li className="flex items-center gap-2">✓ 5x Priority Profile Boost</li>
                <li className="flex items-center gap-2">✓ Free Nightlife Mixer RSVPs</li>
                <li className="flex items-center gap-2">✓ Unlimited View-Once photos</li>
              </ul>
            </div>
            <Link href="/login">
              <button className="w-full py-3 bg-gradient-to-r from-[#E91E63] to-[#FF6F61] text-white font-extrabold rounded-lg text-xs shadow-lg shadow-[#E91E63]/30 hover:opacity-95 transition-opacity cursor-pointer">
                Get VIP Access
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 6: Final Cinematic Call To Action Banner */}
      <section className="relative z-10 py-20 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden relative border border-white/[0.12] bg-[#121212]">
          {/* Background image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1920&q=80" 
              alt="Couples laughing" 
              className="w-full h-full object-cover opacity-25 filter blur-[1px]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/60" />
          </div>

          <div className="relative z-10 p-8 sm:p-16 lg:p-20 max-w-2xl space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E91E63]/20 border border-[#E91E63]/40 text-xs font-bold text-[#E91E63]">
              <Flame size={14} /> Join Tonight
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Your Next Great Story Begins Tonight.
            </h2>
            <p className="text-base text-white/70 leading-relaxed">
              Step into a dating experience where members are verified, conversations lead to plans, and authentic chemistry comes first.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link href="/login">
                <button className="px-8 py-4 bg-gradient-to-r from-[#E91E63] to-[#D81B60] text-white font-extrabold text-base rounded-lg shadow-xl shadow-[#E91E63]/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 cursor-pointer">
                  <span>Start Dating On TMD</span>
                  <ArrowRight size={18} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Multi-Column Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#070707] py-12 px-6 lg:px-12 text-xs text-white/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-gradient-to-br from-[#E91E63] to-[#FF6F61] flex items-center justify-center text-white font-black text-xs">
                tmd
              </div>
              <span className="text-lg font-black text-white">tmd<span className="text-[#E91E63]">.date</span></span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              TMD — The Match Date. India's premium social dating club connecting verified singles through curated discovery and private nightlife events.
            </p>
          </div>

          {/* Links Col 1 */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform</h4>
            <div className="flex flex-col space-y-1.5">
              <Link href="/login" className="hover:text-white transition-colors">Web App Login</Link>
              <Link href="/login" className="hover:text-white transition-colors">1-Tap Demo Mode</Link>
              <Link href="/app/plan" className="hover:text-white transition-colors">VIP Membership Plans</Link>
              <Link href="/app/events" className="hover:text-white transition-colors">Events & Nightlife</Link>
            </div>
          </div>

          {/* Links Col 2 */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Safety & Legal</h4>
            <div className="flex flex-col space-y-1.5">
              <Link href="/guidelines" className="hover:text-white transition-colors">Community Guidelines</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span className="text-white/30">100% 18+ Verified Policy</span>
            </div>
          </div>

          {/* Security Col */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Trust & Security</h4>
            <p className="text-xs text-white/40 leading-relaxed">
              Biometric face verification and active human moderation protect our members 24/7. Zero tolerance for harassment or fake profiles.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p>© 2026 TMD — The Match Date. All rights reserved.</p>
          <p className="text-white/40">Crafted with precision for authentic modern dating.</p>
        </div>
      </footer>
    </div>
  );
}
