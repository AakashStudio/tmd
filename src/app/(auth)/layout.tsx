export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#08080A] text-white flex flex-col items-center justify-center relative overflow-hidden px-4 py-8 select-none">
      {/* Ambient Top Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#FF1493]/15 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Auth Container (Max 8px radius) */}
      <div className="w-full max-w-md relative z-10 bg-[#121216] border border-[#1E1E26] rounded-[8px] p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
