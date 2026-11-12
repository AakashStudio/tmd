"use client";

import React, { useState, useEffect } from "react";
import { Bell, X, Check, Sparkles } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const PushNotificationPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribedToast, setSubscribedToast] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check browser compatibility
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      return;
    }

    // If dismissed in this session or recently
    const dismissedAt = localStorage.getItem("tmd_push_dismissed_at");
    if (dismissedAt && Date.now() - Number(dismissedAt) < 24 * 60 * 60 * 1000) {
      return;
    }

    if (Notification.permission === "granted") {
      // Auto-ensure registration & subscription in background
      syncExistingSubscription();
    } else if (Notification.permission === "default") {
      // Delay showing the prompt slightly so user isn't bombarded on first second
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const syncExistingSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        // Need to subscribe
        await handleSubscribe(true);
      } else {
        // Sync to server
        await fetch("/api/notifications/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        }).catch(() => {});
      }
    } catch (err) {
      // Silent error in background sync
    }
  };

  const handleSubscribe = async (silent = false) => {
    if (!silent) setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShowPrompt(false);
        return;
      }

      // Fetch VAPID public key
      const keyRes = await fetch("/api/notifications/push-subscribe");
      const keyData = await keyRes.json();
      const vapidPublicKey = keyData.publicKey;

      if (!vapidPublicKey) {
        throw new Error("VAPID public key not found on server");
      }

      // Register SW
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Subscribe to PushManager
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      // Send to server
      await fetch("/api/notifications/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      setShowPrompt(false);
      if (!silent) {
        setSubscribedToast(true);
        setTimeout(() => setSubscribedToast(false), 4000);
      }
    } catch (err) {
      console.error("Push subscription failed:", err);
    } finally {
      if (!silent) setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("tmd_push_dismissed_at", Date.now().toString());
  };

  if (subscribedToast) {
    return (
      <div className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-[#121218] border border-[#FFC629]/40 rounded-2xl p-3 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
        <div className="w-8 h-8 rounded-xl bg-[#FFC629]/15 flex items-center justify-center text-[#FFC629] shrink-0">
          <Check className="w-4 h-4 stroke-[3]" />
        </div>
        <div className="flex-1 text-xs">
          <p className="font-extrabold text-white">Notifications Enabled! 🔔</p>
          <p className="text-[10px] text-zinc-400">You will get instant alerts for matches and messages.</p>
        </div>
      </div>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 inset-x-3 max-w-sm mx-auto z-50 animate-in fade-in slide-in-from-bottom duration-300">
      <div className="rounded-2xl bg-[#0f0f16]/95 backdrop-blur-xl border border-[#FFC629]/40 p-3.5 shadow-2xl text-white space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FFC629] to-[#F59E0B] flex items-center justify-center text-black shrink-0 shadow-md shadow-[#FFC629]/20">
              <Bell className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                <span>Enable Notifications</span>
                <Sparkles className="w-3 h-3 text-[#FFC629]" />
              </h4>
              <p className="text-[10px] text-zinc-400 leading-snug">
                Never miss a match, new chat message, or event pass update.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleSubscribe(false)}
            disabled={isSubscribing}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#FFC629] to-[#F59E0B] text-black font-extrabold text-xs shadow-md shadow-[#FFC629]/25 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
          >
            {isSubscribing ? "Enabling..." : "Turn On Notifications 🔔"}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-medium transition"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};
