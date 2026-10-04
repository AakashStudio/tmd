import { BottomNav } from '@/components/layout/BottomNav';
import { ToastProvider } from '@/components/ui/Toast';
import { Flame } from 'lucide-react';
import Link from 'next/link';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-[#080808] flex items-center justify-center text-white relative overflow-hidden">
        {/* Desktop Ambient Background Photography & Seductive Glow */}
        <div className="fixed inset-0 pointer-events-none -z-10 hidden sm:block opacity-25">
          <img 
            src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=2000&q=80" 
            alt="Nightlife Background" 
            className="w-full h-full object-cover filter blur-[4px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080808]/85 via-[#080808]/95 to-[#080808]" />
        </div>

        {/* Ambient Top Glow */}
        <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#E91E63]/20 via-[#FF6F61]/10 to-transparent blur-[140px] rounded-full pointer-events-none -z-10 hidden sm:block" />

        {/* Centered Device Viewport */}
        <div className="w-full sm:max-w-[430px] min-h-dvh sm:min-h-[880px] sm:max-h-[94vh] bg-[#0A0A0A] sm:border sm:border-white/[0.12] sm:rounded-2xl flex flex-col relative pb-20 shadow-2xl sm:shadow-[0_0_80px_-15px_rgba(233,30,99,0.35)] overflow-hidden">
          <main className="flex-1 w-full overflow-y-auto no-scrollbar">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </ToastProvider>
  );
}
