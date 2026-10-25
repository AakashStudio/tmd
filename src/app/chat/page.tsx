"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/navigation/BottomNav";
import { MessageCircle, Heart, ShieldCheck, Search, Sparkles, Lock, Check, X, Send } from "lucide-react";
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

interface PreMatchRequest {
  id: string;
  createdAt: string;
  comment: string | null;
  replyType: string;
  replyContext: string | null;
  sender: {
    id: string;
    name: string;
    age: number;
    city: string;
    bio: string | null;
    profession: string | null;
    education: string | null;
    height: number | null;
    relationshipIntention: string;
    isVerified: boolean;
    photoUrl: string | null;
  };
}

export default function ChatPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [requests, setRequests] = useState<PreMatchRequest[]>([]);
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"REQUESTS" | "MATCHES" | "CHAT">("MATCHES");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [matchesRes, requestsRes] = await Promise.all([
          fetch("/api/matches"),
          fetch("/api/chat/requests"),
        ]);

        if (matchesRes.ok) {
          const data = await matchesRes.json();
          setMatches(data.matches || []);
        }

        if (requestsRes.ok) {
          const reqData = await requestsRes.json();
          setRequests(reqData.requests || []);
          if (typeof reqData.isPaid === "boolean") {
            setIsPaid(reqData.isPaid);
          }
          if (reqData.requests?.length > 0) {
            setActiveTab("REQUESTS");
          }
        }
      } catch (err) {
        console.error("Failed to load chat data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAcceptRequest = async (likeId: string) => {
    setActionInProgress(likeId);
    try {
      const res = await fetch("/api/chat/accept-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ likeId }),
      });
      if (!res.ok) throw new Error("Failed to accept request");
      const data = await res.json();
      setRequests((prev) => prev.filter((r) => r.id !== likeId));
      if (data.conversationId) {
        router.push(`/chat/${data.conversationId}`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to accept request");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeclineRequest = async (likeId: string) => {
    setActionInProgress(likeId);
    try {
      const res = await fetch("/api/chat/decline-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ likeId }),
      });
      if (!res.ok) throw new Error("Failed to decline request");
      setRequests((prev) => prev.filter((r) => r.id !== likeId));
    } catch (err: any) {
      alert(err.message || "Failed to decline request");
    } finally {
      setActionInProgress(null);
    }
  };

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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#D4AF37] via-[#F59E0B] to-[#FFC629] flex items-center justify-center text-black font-black text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <MessageCircle className="w-4 h-4 fill-current" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">Messages & Matches</h1>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 font-semibold">
          {matches.length} Total
        </span>
      </header>

      {/* Triple Tab Switcher: REQUESTS | MATCHES | CHAT */}
      <div className="flex border-b border-[#1e1e26] bg-zinc-950/70 text-xs font-bold px-3 sticky top-14 z-20">
        <button
          type="button"
          onClick={() => setActiveTab("REQUESTS")}
          className={`flex-1 py-2.5 text-center transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "REQUESTS"
              ? "text-[#FFC629] border-b-2 border-[#FFC629]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span>REQUESTS</span>
          {requests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#FFC629] text-black text-[10px] font-black animate-pulse">
              {requests.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("MATCHES")}
          className={`flex-1 py-2.5 text-center transition-all ${
            activeTab === "MATCHES"
              ? "text-[#FFC629] border-b-2 border-[#FFC629]"
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
              ? "text-[#FFC629] border-b-2 border-[#FFC629]"
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
            <div className="w-7 h-7 rounded-full border-2 border-[#FFC629] border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-400">Loading your dating connections...</p>
          </div>
        ) : activeTab === "REQUESTS" ? (
          /* TAB 1: INCOMING PRE-MATCH REQUESTS */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>Notes sent to you before matching</span>
              <span>{requests.length} pending</span>
            </div>

            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-4 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
                  <Send className="w-6 h-6 rotate-[-20deg]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-sm">No Incoming Notes Yet</h3>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                    When someone sends you a reply or note from your profile, they will appear here. If you like their note, accept to start chatting!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-[#121217] border border-zinc-800 space-y-3 shadow-lg"
                  >
                    {/* Sender Header */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border border-zinc-700 bg-zinc-800 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={req.sender.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
                          alt={req.sender.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-sm text-white truncate">
                            {req.sender.name}
                          </h4>
                          <span className="text-xs text-zinc-400 font-normal">
                            {req.sender.age}
                          </span>
                          {req.sender.isVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 block truncate">
                          📍 {req.sender.city}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {formatTimestamp(req.createdAt)}
                      </span>
                    </div>

                    {/* Pre-Match Message Bubble */}
                    <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-400">
                        <Send className="w-3 h-3 rotate-[-25deg]" />
                        <span>Replied to {req.replyType.toLowerCase()}</span>
                      </div>

                      {req.replyContext && (
                        <p className="text-[11px] text-zinc-400 italic line-clamp-1 border-l-2 border-amber-400/80 pl-2">
                          "{req.replyContext}"
                        </p>
                      )}

                      {isPaid ? (
                        <p className="text-sm text-white font-medium leading-relaxed">
                          "{req.comment || "Sent you a like!"}"
                        </p>
                      ) : (
                        <div className="relative p-2 rounded-lg bg-zinc-950/80 border border-zinc-800 text-center space-y-1.5">
                          <p className="text-xs text-zinc-300 blur-sm select-none">
                            "Hey! Really loved your photo, hope we can connect soon..."
                          </p>
                          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-400">
                            <Lock className="w-3 h-3" />
                            <span>Subscriber Feature: Unlock Pre-Match Notes</span>
                          </div>
                          <Link
                            href="/plan"
                            className="inline-block py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] text-[11px] font-black text-black shadow"
                          >
                            Upgrade Plan →
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: Accept / Decline */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDeclineRequest(req.id)}
                        disabled={actionInProgress === req.id}
                        className="flex-1 py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAcceptRequest(req.id)}
                        disabled={actionInProgress === req.id}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] hover:brightness-105 text-black text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-500/20 disabled:opacity-50"
                      >
                        {actionInProgress === req.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Heart className="w-3.5 h-3.5 fill-white" />
                            <span>Accept & Match</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "MATCHES" ? (
          /* TAB 2: MATCHES GRID */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>Your mutual matches</span>
              <span>Tap a match to message</span>
            </div>

            {matches.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center space-y-3.5">
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shadow-inner">
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
                  className="py-2.5 px-5 rounded-lg bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] font-black text-xs text-black shadow-lg shadow-amber-500/30 hover:brightness-105 transition"
                >
                  Start Exploring Profiles →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {matches.map((m) => (
                  <div
                    key={m.matchId}
                    onClick={() =>
                      m.conversationId && router.push(`/chat/${m.conversationId}`)
                    }
                    className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-amber-400/60 transition cursor-pointer flex flex-col aspect-[4/5] shadow-md"
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
                        className="w-full mt-1.5 py-1 px-2 rounded-lg bg-[#FFC629] hover:bg-[#ffcf4b] text-black text-[11px] font-black text-center transition"
                      >
                        {m.lastMessage ? "Open Chat" : "Say Hi 💬"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TAB 3: CHAT CONVERSATIONS LIST */
          <div className="space-y-3">
            {conversations.length > 3 && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FFC629]"
                />
              </div>
            )}

            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs space-y-2">
                <p>No active conversations yet.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("MATCHES")}
                  className="text-amber-400 font-semibold underline text-xs"
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
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FFC629] shrink-0 ml-2 shadow-sm shadow-amber-500/40" />
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
