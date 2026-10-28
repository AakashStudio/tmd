"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, RotateCcw, Check, Upload, AlertCircle, Sparkles, Crown, Lock } from "lucide-react";

interface VoiceNoteRecorderProps {
  initialUrl?: string | null;
  initialDuration?: number | null;
  onSave: (url: string, durationSeconds: number) => void;
  onDelete?: () => void;
  onSkip?: () => void;
  isOnboarding?: boolean;
  canReplace?: boolean; // if false, user is locked from replacing (e.g. Free user in settings)
}

const MAX_RECORDING_SECONDS = 30;

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  initialUrl,
  initialDuration,
  onSave,
  onDelete,
  onSkip,
  isOnboarding = true,
  canReplace = true,
}) => {
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "recorded" | "uploading">(
    initialUrl ? "recorded" : "idle"
  );
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(initialUrl || null);
  const [duration, setDuration] = useState<number>(initialDuration || 0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up stream & intervals on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Update preview audio event listeners
  useEffect(() => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setPreviewCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlayingPreview(false);
      setPreviewCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [recordedUrl]);

  const startRecording = async () => {
    if (!canReplace && !isOnboarding) {
      setErrorMessage("Replacing Voice Note is exclusive to Gold & PRO members.");
      return;
    }

    setErrorMessage(null);
    audioChunksRef.current = [];
    setElapsedTime(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support audio recording. Please upload an audio file instead.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Select supported mimeType
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else {
          mimeType = "";
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualMime = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
        const localUrl = URL.createObjectURL(audioBlob);
        setRecordedBlob(audioBlob);
        setRecordedUrl(localUrl);
        setRecordingState("recorded");

        // Stop all mic tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(250); // collect chunks every 250ms
      setRecordingState("recording");

      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(secs);
        setDuration(secs);
        if (secs >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 500);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setErrorMessage(
        err?.message?.includes("Permission") || err?.name === "NotAllowedError"
          ? "Microphone permission denied. Please allow microphone access in your browser settings or upload an audio file."
          : err.message || "Failed to start audio recording."
      );
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const retakeRecording = () => {
    if (!canReplace && !isOnboarding) return;
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setIsPlayingPreview(false);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    setElapsedTime(0);
    setRecordingState("idle");
    setErrorMessage(null);
  };

  const togglePreviewPlay = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (isPlayingPreview) {
      audio.pause();
      setIsPlayingPreview(false);
    } else {
      audio.play().then(() => setIsPlayingPreview(true)).catch((err) => {
        console.warn("Audio play prevented:", err);
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canReplace && !isOnboarding) {
      setErrorMessage("Replacing Voice Note is exclusive to Gold & PRO members.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setErrorMessage("Please select a valid audio file (MP3, WAV, M4A, OGG, WebM).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("Audio file must be under 15MB.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setRecordedBlob(file);
    setRecordedUrl(localUrl);
    setDuration(15); // estimation until loaded
    setRecordingState("recorded");
    setErrorMessage(null);
  };

  const handleSave = async () => {
    // If user already has an existing uploaded URL and didn't record a new blob, just call onSave
    if (recordedUrl && !recordedBlob && recordedUrl.startsWith("/uploads/")) {
      onSave(recordedUrl, duration);
      return;
    }

    if (!recordedBlob) {
      setErrorMessage("Please record a voice note first.");
      return;
    }

    setRecordingState("uploading");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      const ext = recordedBlob.type.includes("mp4") ? "m4a" : recordedBlob.type.includes("ogg") ? "ogg" : "webm";
      formData.append("file", recordedBlob, `voice_note_${Date.now()}.${ext}`);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload voice note.");
      }

      onSave(data.url, duration || 10);
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(err.message || "Failed to upload audio. Please try again.");
      setRecordingState("recorded");
    }
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Audio element for local playback */}
      {recordedUrl && (
        <audio
          ref={previewAudioRef}
          src={recordedUrl}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const dur = (e.currentTarget as HTMLAudioElement).duration;
            if (dur && !isNaN(dur) && isFinite(dur)) {
              setDuration(Math.round(dur));
            }
          }}
        />
      )}

      {/* Membership Rule Banner */}
      <div className="w-full mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 text-left">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
              {isOnboarding ? "Free 1-Time Voice Intro" : "Voice Note Bio"}
            </h4>
            <p className="text-[12px] text-zinc-300 mt-0.5 leading-relaxed">
              {isOnboarding ? (
                <>
                  Free members record their Voice Note <strong className="text-white">once</strong> during registration.
                  Replacing or changing your voice note later in settings is exclusive to{" "}
                  <span className="text-amber-400 font-bold">Gold & PRO members</span>. Make it count!
                </>
              ) : canReplace ? (
                <>
                  You have <strong className="text-amber-400">VIP Voice privileges</strong>. You can record or replace your voice note anytime!
                </>
              ) : (
                <>
                  <span className="text-amber-400 font-bold">Gold / PRO Locked:</span> Free members can only record during onboarding. Upgrade to replace your Voice Note.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="w-full mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Recording Interactive Arena */}
      <div className="w-full bg-[#111116] border border-zinc-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* State 1: IDLE */}
        {recordingState === "idle" && (
          <div className="flex flex-col items-center">
            {!canReplace && !isOnboarding ? (
              <div className="flex flex-col items-center py-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mb-3">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-zinc-300">Replacement Locked</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  Upgrade to Gold or PRO to record a new voice note.
                </p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#FFC629] text-black flex items-center justify-center shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition cursor-pointer mb-3 group"
                >
                  <Mic className="w-9 h-9 text-black group-hover:scale-110 transition" />
                </button>
                <h3 className="text-base font-black text-white">Tap to Record Voice Note</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Say something fun about yourself (up to {MAX_RECORDING_SECONDS} seconds). People will hear this when swiping on you!
                </p>

                {/* Or upload audio file */}
                <div className="mt-4 pt-4 border-t border-zinc-800/60 w-full flex flex-col items-center">
                  <label className="text-[11px] font-bold text-amber-400/80 hover:text-amber-400 flex items-center gap-1.5 cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Or upload an audio file</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {/* State 2: RECORDING */}
        {recordingState === "recording" && (
          <div className="flex flex-col items-center py-2">
            <div className="relative mb-4">
              {/* Outer pulsing ring */}
              <span className="absolute -inset-3 rounded-full bg-red-500/20 animate-ping" />
              <button
                type="button"
                onClick={stopRecording}
                className="relative w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <Square className="w-8 h-8 fill-white" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xl font-mono font-bold text-white tracking-widest">
                {formatSec(elapsedTime)} / {formatSec(MAX_RECORDING_SECONDS)}
              </span>
            </div>

            {/* Animated equalizer waves */}
            <div className="flex items-center gap-1 h-8 my-2">
              {[40, 75, 100, 60, 90, 45, 80, 95, 50, 85, 65, 90, 70, 40].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-gradient-to-t from-red-600 to-amber-400 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${(i * 0.08).toFixed(2)}s`,
                    animationDuration: "0.6s",
                  }}
                />
              ))}
            </div>

            <p className="text-xs text-zinc-400 mt-1">Tap the red square when you're done speaking</p>
          </div>
        )}

        {/* State 3: RECORDED & PREVIEW */}
        {(recordingState === "recorded" || recordingState === "uploading") && (
          <div className="w-full flex flex-col items-center">
            {/* Playback preview controller */}
            <div className="w-full bg-black/40 border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePreviewPlay}
                    className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#FFC629] text-black flex items-center justify-center shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition cursor-pointer"
                  >
                    {isPlayingPreview ? (
                      <Pause className="w-5 h-5 fill-black" />
                    ) : (
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    )}
                  </button>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-400">
                      {isPlayingPreview ? "Listening to preview..." : "Voice Note Ready"}
                    </p>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">
                      {formatSec(isPlayingPreview ? previewCurrentTime : duration)} / {formatSec(duration)}
                    </p>
                  </div>
                </div>

                {/* Retake button (if allowed) */}
                {(canReplace || isOnboarding) && (
                  <button
                    type="button"
                    onClick={retakeRecording}
                    disabled={recordingState === "uploading"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition active:scale-95 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FFC629] transition-all duration-150"
                  style={{
                    width: `${duration > 0 ? (previewCurrentTime / duration) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-xs text-zinc-400 mt-3">
              Sounds good? Continue to save this to your profile, or tap <strong>Retake</strong> to record again.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="w-full mt-6 flex flex-col gap-3">
        {recordingState === "recorded" ? (
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#FFC629] to-[#D4AF37] text-black font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Use This Voice Note</span>
          </button>
        ) : recordingState === "uploading" ? (
          <button
            type="button"
            disabled
            className="w-full py-3.5 px-6 rounded-2xl bg-amber-500/50 text-black font-black text-sm flex items-center justify-center gap-2 cursor-wait"
          >
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span>Saving Voice Note...</span>
          </button>
        ) : null}

        {/* Skip or Delete Option */}
        <div className="flex items-center justify-center gap-4 mt-1">
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-zinc-500 hover:text-zinc-300 font-bold transition underline"
            >
              Skip Voice Note for now
            </button>
          )}
          {onDelete && initialUrl && (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-red-400/80 hover:text-red-400 font-bold transition underline"
            >
              Remove Voice Note
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
