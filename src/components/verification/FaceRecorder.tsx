"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Video,
} from "lucide-react";

interface FaceRecorderProps {
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

type RecordingState = "idle" | "countdown" | "recording" | "review" | "uploading";

export const FaceRecorder: React.FC<FaceRecorderProps> = ({ onSuccess, onError }) => {
  const [state, setState] = useState<RecordingState>("idle");
  const [countdown, setCountdown] = useState<number>(3);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState<number>(3);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const reviewVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fallbackFileInputRef = useRef<HTMLInputElement>(null);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (): Promise<MediaStream | null> => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play();
      }
      return stream;
    } catch (err: any) {
      console.error("Camera access error:", err);
      let msg = "Could not access camera. Please allow camera permissions.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please allow camera access in browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No front camera found on this device.";
      }
      setErrorMessage(msg);
      onError(msg);
      stopCamera();
      setState("idle");
      return null;
    }
  };

  const handleStartProcess = async () => {
    setState("countdown");
    setCountdown(3);
    setErrorMessage(null);

    const stream = await startCamera();
    if (!stream) return;

    // 3-second preparation countdown
    let count = 3;
    const countInterval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countInterval);
        start3SecondRecording(stream);
      }
    }, 1000);
  };

  const start3SecondRecording = (stream: MediaStream) => {
    setState("recording");
    setRecordingSecondsLeft(3);
    recordedChunksRef.current = [];

    let recorder: MediaRecorder | null = null;
    try {
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : MediaRecorder.isTypeSupported("video/mp4")
        ? "video/mp4"
        : "";

      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mime = recorder?.mimeType || "video/webm";
        const videoBlob = new Blob(recordedChunksRef.current, { type: mime });
        const videoUrl = URL.createObjectURL(videoBlob);
        setCapturedBlob(videoBlob);
        setCapturedPreviewUrl(videoUrl);
        stopCamera();
        setState("review");
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (e) {
      console.warn("MediaRecorder failed, falling back to canvas snapshot:", e);
    }

    // 3 seconds timer
    let seconds = 3;
    const recordInterval = setInterval(() => {
      seconds -= 1;
      setRecordingSecondsLeft(seconds);

      if (seconds <= 0) {
        clearInterval(recordInterval);
        // Take high-res snapshot from canvas if recorder is not active
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 640;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        }

        if (recorder && recorder.state !== "inactive") {
          recorder.stop();
        } else {
          // Fallback snapshot
          if (canvasRef.current) {
            canvasRef.current.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                setCapturedBlob(blob);
                setCapturedPreviewUrl(url);
                stopCamera();
                setState("review");
              }
            }, "image/jpeg", 0.92);
          }
        }
      }
    }, 1000);
  };

  const handleRetake = () => {
    stopCamera();
    if (capturedPreviewUrl) {
      URL.revokeObjectURL(capturedPreviewUrl);
    }
    setCapturedBlob(null);
    setCapturedPreviewUrl(null);
    setErrorMessage(null);
    setState("idle");
  };

  const handleSubmit = async () => {
    if (!capturedBlob) {
      setErrorMessage("No face recording captured to submit.");
      return;
    }

    try {
      setState("uploading");
      setErrorMessage(null);

      // 1. Upload file to /api/upload
      const ext = capturedBlob.type.includes("mp4")
        ? "mp4"
        : capturedBlob.type.includes("webm")
        ? "webm"
        : "jpg";

      const formData = new FormData();
      formData.append("file", capturedBlob, `face_verification_${Date.now()}.${ext}`);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || "Failed to upload recording.");
      }

      // 2. Submit to /api/profile/face-verification
      const verifyRes = await fetch("/api/profile/face-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfieUrl: uploadData.url,
          videoUrl: uploadData.url,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Failed to submit face verification.");
      }

      onSuccess(verifyData.message || "Face verified successfully! Verified badge activated.");
    } catch (err: any) {
      console.error("Verification submit error:", err);
      const msg = err.message || "Failed to submit verification.";
      setErrorMessage(msg);
      onError(msg);
      setState("review");
    }
  };

  const handleFallbackFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setCapturedBlob(file);
    setCapturedPreviewUrl(url);
    setState("review");
  };

  return (
    <div className="w-full space-y-4 text-center">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fallbackFileInputRef}
        type="file"
        accept="image/*,video/*"
        capture="user"
        className="hidden"
        onChange={handleFallbackFileSelect}
      />

      {errorMessage && (
        <div className="p-3 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 text-xs text-[#ef4444] flex items-center gap-2 text-left animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. IDLE STATE */}
      {state === "idle" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0e13] border border-[#242432] space-y-4">
          <div className="relative w-28 h-28 mx-auto rounded-full bg-gradient-to-tr from-[#F59E0B]/20 to-[#FFC629]/20 border-2 border-dashed border-[#FFC629]/60 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Camera className="w-10 h-10 text-[#FFC629] animate-pulse" />
            <div className="absolute inset-1 rounded-full border border-white/10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Live 3-Second Face Recording</h3>
            <p className="text-xs text-[#9e9ea8] max-w-xs mx-auto leading-relaxed">
              Press the button below, hold your device in front of your face, and hold still for 3 seconds.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-400 py-1 border-y border-[#1e1e28]">
            <div className="flex flex-col items-center gap-1">
              <span className="text-base">💡</span>
              <span>Good Light</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-base">👤</span>
              <span>Center Face</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-base">⏱️</span>
              <span>3 Seconds</span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Button
              type="button"
              variant="primary"
              className="w-full py-3 text-xs font-bold shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
              onClick={handleStartProcess}
            >
              <Video className="w-4 h-4" />
              <span>Start 3-Sec Face Recording</span>
            </Button>

            <button
              type="button"
              onClick={() => fallbackFileInputRef.current?.click()}
              className="text-[11px] text-[#7a7a88] hover:text-white transition underline"
            >
              Camera not opening? Upload selfie file instead
            </button>
          </div>
        </div>
      )}

      {/* 2. COUNTDOWN & 3. RECORDING STATES */}
      {(state === "countdown" || state === "recording") && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0e13] border border-[#FFC629]/50 space-y-4">
          <div className="relative w-56 h-56 sm:w-60 sm:h-60 mx-auto rounded-full overflow-hidden border-4 border-[#FFC629] shadow-2xl shadow-amber-500/40 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Face Oval Alignment Guide */}
            <div className="absolute inset-3 rounded-full border border-dashed border-white/50 pointer-events-none" />

            {/* Countdown Overlay */}
            {state === "countdown" && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                <span className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold mb-1">
                  Get Ready
                </span>
                <span className="text-5xl font-black text-white animate-ping">{countdown}</span>
              </div>
            )}

            {/* Recording Active Badge */}
            {state === "recording" && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/75 border border-[#ef4444] text-[#ef4444] text-[11px] font-extrabold flex items-center gap-1.5 shadow">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-ping" />
                <span>Recording... {recordingSecondsLeft}s</span>
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-300 font-medium">
            {state === "countdown"
              ? "Center your face inside the circle..."
              : "Hold still and smile for 3 seconds 😊"}
          </p>

          {/* Progress Bar for the 3 seconds */}
          {state === "recording" && (
            <div className="w-48 mx-auto h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] transition-all duration-1000 ease-linear"
                style={{ width: `${((3 - recordingSecondsLeft + 1) / 3) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* 4. REVIEW & 5. UPLOADING STATES */}
      {(state === "review" || state === "uploading") && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0e13] border border-[#10b981]/50 space-y-4">
          <div className="relative w-56 h-56 sm:w-60 sm:h-60 mx-auto rounded-full overflow-hidden border-4 border-[#10b981] shadow-2xl shadow-[#10b981]/30 bg-black">
            {capturedPreviewUrl && (
              capturedBlob?.type.includes("video") ? (
                <video
                  ref={reviewVideoRef}
                  src={capturedPreviewUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={capturedPreviewUrl}
                  alt="Captured Face"
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              )
            )}

            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/80 border border-[#10b981] text-[#10b981] text-[10px] font-bold flex items-center gap-1 shadow">
              <CheckCircle2 className="w-3 h-3" />
              <span>3-Sec Recording Ready</span>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white">Face Scan Captured Successfully</h4>
            <p className="text-[11px] text-[#9e9ea8]">
              Ready to verify? Submit your 3-second recording to activate your TMD Verified badge.
            </p>
          </div>

          <div className="flex gap-2.5 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 text-xs"
              onClick={handleRetake}
              disabled={state === "uploading"}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Retake</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              className="flex-1 text-xs font-bold"
              onClick={handleSubmit}
              isLoading={state === "uploading"}
              disabled={state === "uploading"}
            >
              <ShieldCheck className="w-4 h-4 mr-1" />
              <span>Submit Verification</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
