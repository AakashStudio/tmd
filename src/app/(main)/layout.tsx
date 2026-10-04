import { BottomNav } from '@/components/layout/BottomNav';
import { ToastProvider } from '@/components/ui/Toast';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-[#08080A] flex flex-col items-center justify-center text-white relative overflow-hidden">
        {/* Ambient Top Subtle Radial Glow for Depth */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#FF1493]/10 to-transparent blur-[120px] pointer-events-none -z-10" />

        {/* Responsive App Shell: Full viewport on mobile, luxury centered phone/device frame on desktop */}
        <div className="w-full sm:max-w-[460px] h-dvh sm:h-[92vh] sm:my-auto sm:max-h-[920px] bg-[#0E0E12] sm:border sm:border-[#1E1E26] sm:rounded-[12px] flex flex-col relative shadow-2xl overflow-hidden">
          <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative flex flex-col">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </ToastProvider>
  );
}
