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
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-amber-400/40 text-amber-400 text-xs font-bold shadow-lg transition active:scale-95 cursor-pointer select-none ${className}`}
      >
        <audio ref={audioRef} src={url} preload="metadata" />
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#FFC629] text-black flex items-center justify-center shrink-0 shadow-sm">
          {isPlaying ? <Pause className="w-2.5 h-2.5 fill-black" /> : <Play className="w-2.5 h-2.5 fill-black ml-0.5" />}
        </div>
        <span className="text-[11px] font-black tracking-tight text-white">
          {isPlaying ? "Playing Voice Note" : "Listen to Voice"}
        </span>
        {totalDuration > 0 && (
          <span className="text-[10px] text-amber-300 font-mono">
            {formatSeconds(isPlaying ? currentTime : totalDuration)}
          </span>
        )}
        {/* Animated mini sound bars */}
        {isPlaying && (
          <div className="flex items-center gap-0.5 ml-1">
            <span className="w-0.5 h-3 bg-amber-400 rounded-full animate-pulse" />
            <span className="w-0.5 h-4 bg-amber-400 rounded-full animate-bounce" />
            <span className="w-0.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
          </div>
        )}
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
