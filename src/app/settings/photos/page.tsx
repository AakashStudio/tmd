"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Trash2, Star, Plus, AlertCircle } from "lucide-react";

export default function PhotosManagerPage() {
  const router = useRouter();
  const { profile, addPhoto, deletePhoto, reorderPhotos, isLoading } = useProfile();

  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photos = profile?.photos || [];

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrlInput.trim()) return;
    if (photos.length >= 6) {
      setError("Maximum limit reached: You can upload a maximum of 6 photos.");
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
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
        <p className="text-xs text-[#9e9ea8]">Loading photo manager...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white max-w-md mx-auto px-5 py-4 pb-20">
      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-4 border-b border-[#1e1e26] pb-3">
        <button onClick={() => router.back()} className="p-1 hover:text-[#ff1475]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white tracking-tight">Manage Photos</h1>
          <p className="text-[11px] text-[#9e9ea8]">{photos.length} of 6 slots used</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-xs text-[#ef4444] font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Photos Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-[3/4] rounded-lg overflow-hidden border border-[#24242e] bg-[#14141a] group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {photo.isPrimary && (
                <Badge variant="primary" className="text-[10px] shadow">
                  ★ Primary
                </Badge>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between">
              {!photo.isPrimary && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(photo.id)}
                  className="text-[11px] font-semibold text-white/90 hover:text-white flex items-center gap-1 bg-black/40 px-2 py-1 rounded"
                >
                  <Star className="w-3 h-3 text-[#ff6b8b]" /> Make Primary
                </button>
              )}
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  className="p-1 text-[#ef4444] hover:text-white hover:bg-[#ef4444] rounded ml-auto transition-colors"
                  title="Delete Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Empty Placeholder Slots */}
        {Array.from({ length: Math.max(0, 6 - photos.length) }).map((_, i) => (
          <div
            key={`empty_${i}`}
            className="aspect-[3/4] rounded-lg border-2 border-dashed border-[#24242e] bg-[#0e0e12] flex flex-col items-center justify-center text-[#5e5e6e]"
          >
            <Plus className="w-6 h-6 mb-1 opacity-50" />
            <span className="text-[11px]">Slot {photos.length + i + 1}</span>
          </div>
        ))}
      </div>

      {/* Add Photo Form */}
      {photos.length < 6 && (
        <form onSubmit={handleAddPhoto} className="p-4 rounded-lg bg-[#14141a] border border-[#24242e] space-y-3">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Add New Photo
          </h3>
          <Input
            placeholder="Paste direct image URL (e.g. Unsplash, CDN)..."
            value={photoUrlInput}
            onChange={(e) => setPhotoUrlInput(e.target.value)}
            disabled={isUploading}
          />
          <Button type="submit" variant="primary" className="w-full" isLoading={isUploading}>
            Upload to Profile
          </Button>
        </form>
      )}
    </div>
  );
}
