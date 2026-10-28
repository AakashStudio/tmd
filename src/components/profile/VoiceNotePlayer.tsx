"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Mic, Volume2 } from "lucide-react";

interface VoiceNotePlayerProps {
  url: string;
  durationSeconds?: number | null;
  candidateName?: string;
  className?: string;
  compact?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  url,
  durationSeconds,
  candidateName,
  className = "",
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationSeconds || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [url]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn("Audio play prevented:", err);
      });
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  if (compact) {
    return (
      <div
        onClick={togglePlay}
        className={`group relative flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-2xl bg-black/75 hover:bg-black/90 backdrop-blur-md border border-amber-400/40 hover:border-amber-400 text-white shadow-xl transition-all active:scale-[0.98] cursor-pointer select-none overflow-hidden ${className}`}
      >
        <audio ref={audioRef} src={url} preload="metadata" />

        {/* Subtle background progress fill when playing */}
        {isPlaying && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-amber-500/15 to-transparent pointer-events-none transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        )}

        <div className="flex items-center gap-2.5 z-10 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#F59E0B] to-[#FFC629] text-black flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 group-hover:scale-105 transition">
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-black" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
            )}
          </div>

          <span className="text-xs font-black tracking-tight text-white whitespace-nowrap truncate flex items-center gap-1.5">
            <span>{isPlaying ? "Playing Voice Note" : candidateName ? `${candidateName}'s Voice Note` : "Listen to Voice"}</span>
            <Mic className="w-3 h-3 text-amber-400 shrink-0" />
          </span>
        </div>

        {/* Right side: Equalizer wave + Time */}
        <div className="flex items-center gap-2 z-10 shrink-0">
          {isPlaying ? (
            <div className="flex items-center gap-0.5 h-4 px-1">
              <span className="w-1 h-3 bg-amber-400 rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-amber-300 rounded-full animate-bounce" />
              <span className="w-1 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="w-1 h-3.5 bg-amber-300 rounded-full animate-bounce" />
            </div>
          ) : (
            <div className="flex items-center gap-0.5 opacity-60">
              <span className="w-0.5 h-2 bg-zinc-500 rounded-full" />
              <span className="w-0.5 h-3.5 bg-zinc-400 rounded-full" />
              <span className="w-0.5 h-2 bg-zinc-500 rounded-full" />
            </div>
          )}

          <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
            {totalDuration > 0
              ? `${formatSeconds(isPlaying ? currentTime : 0)} / ${formatSeconds(totalDuration)}`
              : "Voice"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`p-4 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-[#181820]/90 to-zinc-900/90 border border-amber-400/30 shadow-xl select-none ${className}`}
    >
      <audio ref={audioRef} src={url} preload="metadata" />
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#FFC629]">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black text-white block leading-tight">
              {candidateName ? `${candidateName}'s Voice Note` : "Voice Note"}
            </span>
            <span className="text-[10px] text-amber-300/80 font-medium">Audio Bio • Real Voice Intro</span>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold text-amber-400">
          {formatSeconds(currentTime)} / {formatSeconds(totalDuration || 15)}
        </span>
      </div>

      {/* Progress & Waveform Slider */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#F59E0B] to-[#FFC629] text-black flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 hover:brightness-110 active:scale-95 transition cursor-pointer"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
        </button>

        {/* Progress Bar / Waveform track */}
        <div
          onClick={(e) => {
            const audio = audioRef.current;
            if (!audio || !totalDuration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            audio.currentTime = clickPos * totalDuration;
          }}
          className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden relative cursor-pointer"
        >
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-[#FFC629] to-amber-300 rounded-full transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <Volume2 className="w-4 h-4 text-zinc-500 shrink-0" />
      </div>
    </div>
  );
};
