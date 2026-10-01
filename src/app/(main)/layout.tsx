import { BottomNav } from '@/components/layout/BottomNav';
import { ToastProvider } from '@/components/ui/Toast';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-[#070707] flex justify-center text-white">
        {/* Centered Device Viewport for Mobile First & Desktop Cohesion */}
        <div className="w-full max-w-[430px] min-h-dvh bg-[#0A0A0A] border-x border-[#1A1A1A] flex flex-col relative pb-20 shadow-2xl shadow-black">
          <main className="flex-1 w-full">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </ToastProvider>
  );
}
