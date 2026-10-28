"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ArrowLeft,
  Trash2,
  Star,
  Plus,
  AlertCircle,
  Image as ImageIcon,
  Camera,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function PhotosManagerPage() {
  const router = useRouter();
  const { profile, addPhoto, deletePhoto, reorderPhotos, isLoading } = useProfile();

  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photos = profile?.photos || [];

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= 6) {
      setError("Maximum limit reached: You can upload a maximum of 6 photos.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("Photo size must be less than 15MB");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      await addPhoto(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrlInput.trim()) return;
    if (photos.length >= 6) {
      setError("Maximum 6 photos allowed.");
      return;
    }
    try {
      setIsUploading(true);
      setError(null);
      await addPhoto(photoUrlInput.trim());
      setPhotoUrlInput("");
    } catch (err: any) {
      setError(err.message || "Failed to add photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (photos.length <= 1) {
      setError("You must have at least 1 profile photo.");
      return;
    }
    try {
      setError(null);
      await deletePhoto(id);
    } catch (err: any) {
      setError(err.message || "Failed to delete photo");
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      setError(null);
      const reorderedIds = [
        photoId,
        ...photos.filter((p) => p.id !== photoId).map((p) => p.id),
      ];
      await reorderPhotos(reorderedIds, photoId);
    } catch (err: any) {
      setError(err.message || "Failed to set primary photo");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08080b] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#FFC629] border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-400 font-medium">Loading photo manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col items-center justify-start py-4 sm:py-8 px-3 sm:px-4 w-full box-border overflow-x-hidden">
      <div className="w-full max-w-md bg-[#0c0c10] text-white rounded-3xl border border-white/[0.08] shadow-2xl p-5 sm:p-6 pb-24 relative box-border overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-400/50 flex items-center justify-center text-amber-400 transition active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
            </button>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Manage Photos</span>
                <Camera className="w-3.5 h-3.5 text-[#FFC629]" />
              </h1>
              <p className="text-[11px] text-zinc-400">
                {photos.length} of 6 slots used (first photo is primary)
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#FFC629] text-[10px] font-black uppercase tracking-wider">
            {photos.length}/6 Photos
          </span>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Photos Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-800/90 bg-[#14141a] group shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500";
                }}
              />

              {/* Primary Badge */}
              {photo.isPrimary && (
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="px-2.5 py-1 rounded-full bg-[#FFC629] text-black text-[10px] font-black shadow-lg flex items-center gap-1">
                    ★ Primary
                  </span>
                </div>
              )}

              {/* Bottom Actions Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between z-10">
                {!photo.isPrimary ? (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(photo.id)}
                    className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-md border border-amber-400/40 hover:bg-[#FFC629] hover:text-black px-2.5 py-1 rounded-full transition active:scale-95 flex items-center gap-1 shadow-sm"
                  >
                    <Star className="w-3 h-3 text-[#FFC629] fill-[#FFC629]" />
                    <span>Make Primary</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-zinc-400 font-semibold pl-1">
                    Card Cover
                  </span>
                )}

                {photos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition active:scale-95 ml-auto shadow-sm"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Hidden File Input for Device Gallery / Camera */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Empty Placeholder Slots (Clickable to Upload) */}
          {Array.from({ length: Math.max(0, 6 - photos.length) }).map((_, i) => (
            <button
              key={`empty_${i}`}
              type="button"
              onClick={handleTriggerUpload}
              disabled={isUploading}
              className="aspect-[3/4] rounded-2xl border-2 border-dashed border-zinc-800 hover:border-[#FFC629] bg-[#14141a] hover:bg-amber-400/5 flex flex-col items-center justify-center text-zinc-500 group cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-[#FFC629] text-amber-400 group-hover:text-black flex items-center justify-center mb-1.5 transition-all shadow-sm font-bold">
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[11px] font-semibold group-hover:text-white transition">
                Slot {photos.length + i + 1}
              </span>
            </button>
          ))}
        </div>

        {/* Upload Actions */}
        {photos.length < 6 && (
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleTriggerUpload}
              disabled={isUploading}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] text-black font-black text-sm tracking-wide shadow-xl shadow-amber-500/25 transition hover:brightness-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Uploading photo...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-black" />
                  <span>Upload from Phone Gallery / Camera</span>
                </>
              )}
            </button>

            {/* Fallback URL Input */}
            <form
              onSubmit={handleAddPhoto}
              className="p-4 rounded-2xl bg-[#14141a] border border-zinc-800/90 space-y-2"
            >
              <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                Or paste photo direct link
              </span>
              <div className="flex gap-2">
                <input
                  placeholder="Paste direct image URL (https://...)"
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  disabled={isUploading}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs font-medium focus:outline-none focus:border-[#FFC629]"
                />
                <button
                  type="submit"
                  disabled={isUploading || !photoUrlInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
