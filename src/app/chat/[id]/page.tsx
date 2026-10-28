"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { ViewOnceViewerModal } from "@/components/chat/ViewOnceViewerModal";
import {
  ArrowLeft,
  Send,
  Camera,
  MoreVertical,
  ShieldCheck,
  Check,
  CheckCheck,
  Eye,
  Lock,
} from "lucide-react";
import Link from "next/link";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.id as string;

  const handleBack = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const fromTab = urlParams.get("from") || sessionStorage.getItem("tmd_chat_tab") || "CHAT";
      router.push(`/chat?tab=${encodeURIComponent(fromTab)}`);
    } else {
      router.push("/chat?tab=CHAT");
    }
  };

  const {
    messages,
    partner,
    isLoading,
    isSending,
    sendMessage,
    sendViewOncePhoto,
    openViewOnce,
  } = useChat(conversationId);

  const [inputText, setInputText] = useState("");
  const [activeStreamUrl, setActiveStreamUrl] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText("");
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        sendViewOncePhoto(base64);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenMedia = async (mediaId: string) => {
    const streamUrl = await openViewOnce(mediaId);
    if (streamUrl) {
      setActiveStreamUrl(streamUrl);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col items-center justify-start py-4 sm:py-8 px-3 sm:px-4 w-full box-border overflow-x-hidden">
      <div className="w-full max-w-md h-[92vh] max-h-[844px] min-h-[600px] bg-[#0c0c10] text-white rounded-3xl border border-white/[0.08] shadow-2xl relative box-border overflow-hidden flex flex-col justify-between">
        {/* Top Header */}
      <header className="px-3.5 py-3 border-b border-zinc-800/80 flex items-center justify-between sticky top-0 bg-[#0c0c10]/95 backdrop-blur-md z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-400/50 flex items-center justify-center text-amber-400 transition active:scale-95 shadow-sm"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
          </button>

          {partner && (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-zinc-700 bg-zinc-800 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={partner.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
                  alt={partner.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200";
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-sm text-white truncate max-w-[140px]">
                    {partner.name}
                  </h2>
                  {partner.isVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-emerald-400">Active</span>
              </div>
            </div>
          )}
        </div>

        {/* Safety Options Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-44 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl py-1 z-40 text-xs animate-in fade-in">
              <button
                onClick={() => {
                  setShowMenu(false);
                  alert("To report, use the Safety center in Settings.");
                }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-rose-400"
              >
                Report User
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  alert("To block, use the Safety center in Settings.");
                }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-rose-500"
              >
                Block User
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Message Thread */}
      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs space-y-1">
            <p>No messages yet.</p>
            <p className="text-zinc-400 font-medium">Say hi and spark a date!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isText = m.type === "TEXT";
            const isViewOnce = m.type === "VIEW_ONCE_PHOTO";

            return (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.isFromMe ? "items-end" : "items-start"
                }`}
              >
                {/* Bubble Container */}
                <div
                  className={`max-w-[78%] rounded-2xl p-3 text-sm shadow-md ${
                    m.isFromMe
                      ? "bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] text-black font-medium rounded-br-xs shadow-amber-500/20"
                      : "bg-[#16161d] border border-white/[0.08] text-zinc-100 rounded-bl-xs"
                  }`}
                >
                  {isText && (
                    <p className="leading-relaxed break-words whitespace-pre-wrap">
                      {m.content}
                    </p>
                  )}

                  {isViewOnce && (
                    <div className="space-y-1.5">
                      {m.media?.isOpened ? (
                        <div className="flex items-center gap-2 text-xs text-zinc-400 py-1">
                          <Eye className="w-4 h-4 opacity-50" />
                          <span className="italic">Photo opened</span>
                        </div>
                      ) : m.media?.isExpired ? (
                        <div className="flex items-center gap-2 text-xs text-zinc-500 py-1">
                          <Lock className="w-4 h-4 opacity-50" />
                          <span className="italic">Photo expired</span>
                        </div>
                      ) : m.media?.canOpen ? (
                        /* Clickable View Once Bubble for Recipient */
                        <button
                          type="button"
                          onClick={() => handleOpenMedia(m.media!.id)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition text-xs font-semibold"
                        >
                          <Camera className="w-4 h-4 text-amber-400" />
                          <span>View Once Photo (Tap to view)</span>
                        </button>
                      ) : (
                        /* Sender View */
                        <div className="flex items-center gap-2 text-xs py-1 opacity-90 text-black">
                          <Camera className="w-4 h-4" />
                          <span>View Once Photo sent</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Metadata: Time and Status */}
                  <div
                    className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                      m.isFromMe ? "text-black/75 font-semibold" : "text-zinc-500"
                    }`}
                  >
                    <span>
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {m.isFromMe && (
                      <span>
                        {m.status === "READ" ? (
                          <CheckCheck className="w-3 h-3 text-emerald-950 font-bold" />
                        ) : m.status === "DELIVERED" ? (
                          <CheckCheck className="w-3 h-3 text-black/60" />
                        ) : (
                          <Check className="w-3 h-3 text-black/50" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Hidden File Input for View Once Photo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Input Toolbar */}
      <footer className="px-5 py-2.5 border-t border-[#1e1e26] bg-[#0a0a0c] sticky bottom-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* View Once Camera Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            title="Send View Once Photo"
            className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400 hover:bg-amber-500/10 transition active:scale-95 disabled:opacity-40"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FFC629]"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 rounded-full bg-gradient-to-tr from-[#F59E0B] via-[#FFC629] to-[#F59E0B] text-black hover:brightness-105 transition active:scale-95 disabled:opacity-40 shadow-lg shadow-amber-500/20"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        </form>
      </footer>

      {/* Fullscreen Ephemeral View Once Viewer */}
      {activeStreamUrl && (
        <ViewOnceViewerModal
          streamUrl={activeStreamUrl}
          durationSeconds={10}
          onClose={() => setActiveStreamUrl(null)}
        />
      )}
      </div>
    </div>
  );
}
