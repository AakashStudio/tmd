"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/navigation/BottomNav";
import { MessageCircle, Heart, ShieldCheck, Search, Sparkles } from "lucide-react";
import Link from "next/link";

interface MatchItem {
  matchId: string;
  conversationId: string | null;
  matchedAt: string;
  partner: {
    userId: string;
    name: string;
    age: number;
    city: string;
    photoUrl: string | null;
    isVerified: boolean;
  };
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    isFromMe: boolean;
    status: string;
  } | null;
}

export default function ChatPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"MATCHES" | "CHAT">("MATCHES");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await fetch("/api/matches");
        if (res.ok) {
          const data = await res.json();
          setMatches(data.matches || []);
        }
      } catch (err) {
        console.error("Failed to load matches:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMatches();
  }, []);

  const conversations = matches.filter((m) => Boolean(m.lastMessage));

  const filteredConversations = conversations.filter((c) =>
    c.partner.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white pb-24 max-w-md mx-auto flex flex-col">
      {/* Top Header */}
      <header className="px-5 py-4 border-b border-[#1e1e26] flex items-center justify-between sticky top-0 bg-[#0a0a0c]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white font-black text-sm">
            <MessageCircle className="w-4 h-4" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">Messages & Matches</h1>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 font-semibold">
          {matches.length} Total
        </span>
      </header>

      {/* Mandatory Dual Tab Switcher: MATCHES | CHAT */}
      <div className="flex border-b border-[#1e1e26] bg-zinc-950/70 text-xs font-bold px-5 sticky top-14 z-20">
        <button
          type="button"
          onClick={() => setActiveTab("MATCHES")}
          className={`flex-1 py-2.5 text-center transition-all ${
            activeTab === "MATCHES"
              ? "text-rose-500 border-b-2 border-rose-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          MATCHES ({matches.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("CHAT")}
          className={`flex-1 py-2.5 text-center transition-all ${
            activeTab === "CHAT"
              ? "text-rose-500 border-b-2 border-rose-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          CHAT ({conversations.length})
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 flex flex-col px-5 py-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-400">Loading your dating connections...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center space-y-3.5">
            <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500 shadow-inner">
              <Heart className="w-7 h-7 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">No Matches Yet</h2>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                When you and another member like each other, they will appear here and you can start chatting!
              </p>
            </div>
            <Link
              href="/"
              className="py-2.5 px-5 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 font-bold text-xs text-white shadow-lg shadow-rose-600/30 hover:opacity-95 transition"
            >
              Start Exploring Profiles →
            </Link>
          </div>
        ) : activeTab === "MATCHES" ? (
          /* TAB 1: MATCHES GRID */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>Your mutual matches</span>
              <span>Tap a match to message</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {matches.map((m) => (
                <div
                  key={m.matchId}
                  onClick={() =>
                    m.conversationId && router.push(`/chat/${m.conversationId}`)
                  }
                  className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-rose-500/60 transition cursor-pointer flex flex-col aspect-[4/5] shadow-md"
                >
                  {/* Photo */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.partner.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"}
                    alt={m.partner.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                  {/* Info Overlay */}
                  <div className="absolute bottom-2.5 inset-x-2.5 text-white space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm drop-shadow">{m.partner.name}</span>
                      <span className="text-xs text-zinc-300 font-light">{m.partner.age}</span>
                      {m.partner.isVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-300 block truncate">📍 {m.partner.city}</span>

                    <button
                      type="button"
                      className="w-full mt-1.5 py-1 px-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-bold text-center transition"
                    >
                      {m.lastMessage ? "Open Chat" : "Say Hi 💬"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* TAB 2: CHAT CONVERSATIONS LIST */
          <div className="space-y-3">
            {conversations.length > 3 && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/60"
                />
              </div>
            )}

            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs space-y-2">
                <p>No active conversations yet.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("MATCHES")}
                  className="text-rose-400 font-semibold underline text-xs"
                >
                  Pick a match from the MATCHES tab to begin →
                </button>
              </div>
            ) : (
              <div className="space-y-1 divide-y divide-zinc-900">
                {filteredConversations.map((c) => (
                  <div
                    key={c.matchId}
                    onClick={() =>
                      c.conversationId && router.push(`/chat/${c.conversationId}`)
                    }
                    className="flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-zinc-900/60 cursor-pointer transition active:scale-[0.99]"
                  >
                    {/* Avatar */}
                    <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border border-zinc-800 bg-zinc-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.partner.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
                        alt={c.partner.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white truncate">
                            {c.partner.name}
                          </span>
                          {c.partner.isVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          )}
                        </div>
                        {c.lastMessage && (
                          <span className="text-[10px] text-zinc-500 shrink-0">
                            {formatTimestamp(c.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs truncate ${
                            !c.lastMessage?.isFromMe && c.lastMessage?.status !== "READ"
                              ? "text-white font-semibold"
                              : "text-zinc-400"
                          }`}
                        >
                          {c.lastMessage?.isFromMe && (
                            <span className="text-zinc-500">You: </span>
                          )}
                          {c.lastMessage?.content || "Say hello!"}
                        </p>

                        {!c.lastMessage?.isFromMe && c.lastMessage?.status !== "READ" && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
