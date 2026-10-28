"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles, MessageCircle, Heart, Bell, X } from "lucide-react";

interface AppNotification {
  id: string;
  type: "MATCH" | "MESSAGE" | "LIKE" | "CAMPAIGN" | "SYSTEM";
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationListener() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDone = useRef(false);

  // Request browser Notification permission on first user interaction
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => null);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;

        const data = await res.json();
        const notifications: AppNotification[] = data.notifications || [];

        if (!initialFetchDone.current) {
          // Initialize already existing notification IDs so we don't alert old ones
          notifications.forEach((n) => seenIdsRef.current.add(n.id));
          initialFetchDone.current = true;
          return;
        }

        // Detect newly arrived unread notifications
        const newUnread = notifications.filter(
          (n) => !n.isRead && !seenIdsRef.current.has(n.id)
        );

        if (newUnread.length > 0 && isMounted) {
          const newest = newUnread[0];
          seenIdsRef.current.add(newest.id);

          // Don't show toast if user is already inside that conversation
          if (newest.linkUrl && pathname === newest.linkUrl) {
            return;
          }

          setActiveToast(newest);

          // Trigger native Web Push/Browser Notification if permitted
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification(newest.title, {
                body: newest.body,
                icon: "/favicon.ico",
              });
            } catch (e) {}
          }
        }
      } catch (err) {
        // Silent fail on polling errors
      }
    }

    checkNotifications();
    const interval = setInterval(checkNotifications, 7000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pathname]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const handleToastClick = async () => {
    if (!activeToast) return;
    const toast = activeToast;
    setActiveToast(null);

    // Mark as read
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: toast.id }),
    }).catch(() => null);

    if (toast.linkUrl) {
      router.push(toast.linkUrl);
    }
  };

  if (!activeToast) return null;

  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        onClick={handleToastClick}
        className="pointer-events-auto max-w-sm w-full bg-[#16161f]/95 border border-[#FFC629]/50 text-white rounded-2xl p-3.5 shadow-2xl shadow-amber-950/40 backdrop-blur-md cursor-pointer hover:border-[#FFC629] transition flex items-start gap-3 select-none"
      >
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D4AF37] via-[#F59E0B] to-[#FFC629] text-black flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
          {activeToast.type === "MATCH" ? (
            <Heart className="w-5 h-5 fill-black" />
          ) : activeToast.type === "MESSAGE" ? (
            <MessageCircle className="w-5 h-5 fill-black" />
          ) : activeToast.type === "CAMPAIGN" ? (
            <Sparkles className="w-5 h-5 fill-black" />
          ) : (
            <Bell className="w-5 h-5 fill-black" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between mb-0.5">
            <h4 className="text-xs font-black text-[#FFC629] truncate tracking-tight">
              {activeToast.title}
            </h4>
            <span className="text-[10px] text-zinc-500">Just now</span>
          </div>
          <p className="text-xs text-zinc-200 line-clamp-2 leading-snug">
            {activeToast.body}
          </p>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveToast(null);
          }}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
