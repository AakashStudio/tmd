'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Flame, MapPin, MessageSquare, Sparkles, User } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'home', label: 'Home', href: '/app', icon: Flame },
  { key: 'map', label: 'Map', href: '/app/map', icon: MapPin },
  { key: 'chat', label: 'Chat', href: '/app/chat', icon: MessageSquare },
  { key: 'plan', label: 'Plan', href: '/app/plan', icon: Sparkles },
  { key: 'settings', label: 'Settings', href: '/app/settings', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/app') return pathname === '/app';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-[#0E0E0E]/95 backdrop-blur-xl border-t border-[#1C1C1C]">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-150 select-none ${
                active ? 'text-[#E91E63]' : 'text-[#616161] hover:text-[#A0A0A0]'
              }`}
            >
              {active && (
                <span className="absolute top-0 w-6 h-[2px] bg-[#E91E63] rounded-[1px] shadow-[0_0_8px_rgba(233,30,99,0.8)]" />
              )}
              <Icon
                size={21}
                strokeWidth={active ? 2.4 : 1.75}
                className={`transition-transform duration-150 ${active ? 'scale-105 drop-shadow-[0_0_8px_rgba(233,30,99,0.35)]' : ''}`}
              />
              <span className={`text-[10px] tracking-tight mt-1 font-semibold ${active ? 'text-white' : 'text-[#616161]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
