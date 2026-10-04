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
    <nav className="w-full bg-[#0E0E12] border-t border-[#1E1E26] z-40 select-none">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-150 ${
                active ? 'text-[#FF1493]' : 'text-[#71717A] hover:text-[#A1A1AA]'
              }`}
            >
              {active && (
                <span className="absolute top-0 w-8 h-[2px] bg-gradient-to-r from-[#FF1493] to-[#FF4D6D] rounded-full shadow-[0_0_8px_rgba(255,20,147,0.7)]" />
              )}
              <Icon
                size={20}
                strokeWidth={active ? 2.4 : 1.8}
                className={`transition-transform duration-150 ${active ? 'scale-105' : ''}`}
              />
              <span className={`text-[10px] tracking-tight mt-0.5 font-bold ${active ? 'text-white' : 'text-[#71717A]'}`}>
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
