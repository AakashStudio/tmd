"use client";

import React, { useState } from "react";
import { Send, X, Sparkles } from "lucide-react";

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  replyType: "PHOTO" | "BIO" | "ESSENTIALS" | "PROMPT" | "ANTHEM";
  replyContext?: string;
  onSend: (message: string, replyType: string, replyContext?: string) => void;
  isSending?: boolean;
}

export function ReplyModal({
  isOpen,
  onClose,
  targetName,
  replyType,
  replyContext,
  onSend,
  isSending = false,
}: ReplyModalProps) {
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const quickPrompts: Record<string, string[]> = {
    PHOTO: [
      "Stunning picture! ✨",
      "You have an amazing smile! 😊",
      "Where was this taken? 📍",
    ],
    BIO: [
      "I completely agree with this! 💯",
      "Your energy is so refreshing ✨",
      "Couldn't have said it better myself!",
    ],
    ESSENTIALS: [
      "Hey neighbor! Small world 👋",
      "Looks like we aren't too far apart 📍",
    ],
    PROMPT: [
      "Dogs are genuinely the best! 🐶",
      "100% no drama allowed 🙌",
      "What kind of dogs do you love most?",
    ],
    ANTHEM: [
      "Obsessed with this song too! 🎶",
      "Vishal Mishra never misses! 🔥",
      "Adding this to my favorite playlist right now 🎧",
    ],
  };

  const currentSuggestions = quickPrompts[replyType] || quickPrompts.BIO;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    onSend(message.trim(), replyType, replyContext);
    setMessage("");
  };

  const getSectionTitle = () => {
    switch (replyType) {
      case "PHOTO":
        return `Replying to ${targetName}'s photo`;
      case "BIO":
        return `Replying to ${targetName}'s bio`;
      case "ESSENTIALS":
        return `Replying to ${targetName}'s essentials`;
      case "PROMPT":
        return `Replying to "${replyContext || "Prompt"}"`;
      case "ANTHEM":
        return `Replying to ${targetName}'s anthem`;
      default:
        return `Send a note to ${targetName}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#121217] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{getSectionTitle()}</h3>
              <p className="text-[11px] text-zinc-400">Pre-match message • Seen before matching</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Context Preview Quote */}
        {replyContext && (
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 italic border-l-4 border-l-rose-500">
            "{replyContext}"
          </div>
        )}

        {/* Quick Suggestion Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Quick replies</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currentSuggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMessage(s)}
                className="text-xs px-2.5 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Write a thoughtful message to ${targetName}...`}
              maxLength={300}
              rows={3}
              autoFocus
              className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-rose-500 resize-none transition"
            />
            <div className="text-[10px] text-zinc-500 text-right pr-2">
              {message.length}/300
            </div>
          </div>

          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Send Note & Like</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
