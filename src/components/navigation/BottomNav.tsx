"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, MapPin, MessageCircle, Crown, User } from "lucide-react";

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    async function checkUnread() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (e) {}
    }
    checkUnread();
    const interval = setInterval(checkUnread, 15000);
    return () => clearInterval(interval);
  }, [pathname]);

  const navItems = [
    { label: "Home", href: "/", icon: Flame },
    { label: "Map", href: "/map", icon: MapPin },
    { label: "Chat", href: "/chat", icon: MessageCircle },
    { label: "Plan", href: "/plan", icon: Crown },
    { label: "Profile", href: "/settings", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0c]/95 backdrop-blur-md border-t border-[#1e1e26] max-w-md mx-auto">
      <div className="flex items-center justify-around h-16 px-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors select-none ${
                isActive ? "text-[#F59E0B]" : "text-[#7a7a88] hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 mb-1 transition-transform ${
                    isActive ? "scale-110" : ""
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {item.label === "Chat" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FFC629] ring-2 ring-[#0a0a0c] shadow-sm animate-pulse" />
                )}
              </div>
              <span className={`text-[11px] font-medium tracking-tight ${isActive ? "font-bold text-white" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
