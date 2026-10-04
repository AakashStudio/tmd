export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#080808] text-white flex flex-col items-center justify-center relative overflow-hidden px-4 py-10">
      {/* Ambient Seductive Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#E91E63]/25 via-[#9C27B0]/15 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* Atmospheric Background Image */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-20">
        <img 
          src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=2000&q=80" 
          alt="Atmosphere" 
          className="w-full h-full object-cover filter blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808]/90 via-[#080808]/95 to-[#080808]" />
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-md relative z-10 bg-[#121212]/90 backdrop-blur-2xl border border-white/[0.1] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black">
        {children}
      </div>
    </div>
  );
}
