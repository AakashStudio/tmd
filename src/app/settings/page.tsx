"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ProfileDetailSheet } from "@/components/discovery/ProfileDetailSheet";
import { DiscoveryCandidate } from "@/hooks/useDiscovery";
import {
  User,
  Settings as SettingsIcon,
  ShieldCheck,
  ChevronRight,
  Plus,
  Edit2,
  Sparkles,
  Camera,
  Music,
  LogOut,
  X,
  Eye,
} from "lucide-react";

export default function ProfileHubPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { profile, entitlements, updateProfile, addPhoto, isLoading: profileLoading } = useProfile();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [activeQuickEdit, setActiveQuickEdit] = useState<
    "LIVING_IN" | "HEIGHT" | "JOB" | "EDUCATION" | "ABOUT_ME" | "PROMPT" | "ANTHEM" | null
  >(null);

  const [quickInputVal, setQuickInputVal] = useState("");
  const [promptAnswerVal, setPromptAnswerVal] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadToast, setUploadToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleDirectUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if ((profile?.photos?.length || 0) >= 6) {
      alert("You already have 6 photos (maximum limit). Edit photos to replace.");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to upload photo");
      }

      await addPhoto(data.url);
      setUploadToast("Photo uploaded successfully! 🎉");
      setTimeout(() => setUploadToast(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const openQuickEdit = (
    type: "LIVING_IN" | "HEIGHT" | "JOB" | "EDUCATION" | "ABOUT_ME" | "PROMPT" | "ANTHEM"
  ) => {
    setActiveQuickEdit(type);
    if (!profile) return;
    if (type === "LIVING_IN") setQuickInputVal(profile.city || "");
    if (type === "HEIGHT") setQuickInputVal(profile.height ? String(profile.height) : "");
    if (type === "JOB") setQuickInputVal(profile.profession || "");
    if (type === "EDUCATION") setQuickInputVal(profile.education || "");
    if (type === "ABOUT_ME") setQuickInputVal(profile.bio || "");
    if (type === "PROMPT") {
      setQuickInputVal(profile.promptQuestion || "I feel happiest when...");
      setPromptAnswerVal(profile.promptAnswer || "");
    }
    if (type === "ANTHEM") {
      setQuickInputVal(profile.anthemTitle || 'Tum Ho Toh (From "Saiyaara")');
    }
  };

  const handleSaveQuickEdit = async () => {
    if (!activeQuickEdit) return;
    setIsSaving(true);
    try {
      const updates: Record<string, any> = {};
      if (activeQuickEdit === "LIVING_IN") updates.city = quickInputVal.trim();
      if (activeQuickEdit === "HEIGHT") updates.height = quickInputVal ? parseInt(quickInputVal, 10) : null;
      if (activeQuickEdit === "JOB") updates.profession = quickInputVal.trim() || null;
      if (activeQuickEdit === "EDUCATION") updates.education = quickInputVal.trim() || null;
      if (activeQuickEdit === "ABOUT_ME") updates.bio = quickInputVal.trim() || null;
      if (activeQuickEdit === "PROMPT") {
        updates.promptQuestion = quickInputVal.trim();
        updates.promptAnswer = promptAnswerVal.trim();
      }
      if (activeQuickEdit === "ANTHEM") {
        updates.anthemTitle = quickInputVal.trim();
        updates.anthemArtist = "Spotify";
      }

      await updateProfile(updates);
      setActiveQuickEdit(null);
    } catch (err: any) {
      alert(err.message || "Failed to update detail");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#0c0c10] flex items-center justify-center text-white">
        <div className="w-8 h-8 rounded-full border-2 border-[#FFC629] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-[#0c0c10] flex flex-col items-center justify-center p-6 text-white text-center">
        <h2 className="text-xl font-bold mb-2">Sign in to view Profile</h2>
        <p className="text-xs text-zinc-400 mb-4">Please log in to manage your TMD profile and preferences.</p>
        <Link href="/" className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] text-black font-black text-xs">
          Go to Login
        </Link>
      </div>
    );
  }

  const photos = profile.photos || [];
  const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0];
  const photoSlots = Array.from({ length: 6 }, (_, i) => photos[i] || null);

  // Convert current user's profile to CandidateCard format for the live preview sheet
  const userCandidateView: DiscoveryCandidate = {
    userId: user.id,
    name: profile.name,
    age: profile.age,
    gender: profile.gender,
    city: profile.city,
    bio: profile.bio,
    profession: profile.profession,
    education: profile.education,
    height: profile.height,
    relationshipIntention: profile.relationshipIntention,
    isVerified: user.isVerified,
    photos: photos.map((p) => ({
      id: p.id,
      url: p.url,
      isPrimary: p.isPrimary,
      order: p.order,
    })),
    interests: profile.interests.map((pi) => pi.interest),
    promptQuestion: profile.promptQuestion || "I feel happiest when...",
    promptAnswer: profile.promptAnswer || "I'm around dogs and away from drama.",
    anthemTitle: profile.anthemTitle || 'Tum Ho Toh (From "Saiyaara")',
    anthemArtist: profile.anthemArtist || "Vishal Mishra · Spotify",
    anthemCoverUrl: profile.anthemCoverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200",
  };

  // Completion calculation
  let completedFields = 0;
  if (photos.length >= 2) completedFields += 2;
  if (photos.length >= 6) completedFields += 1;
  if (profile.bio) completedFields += 2;
  if (profile.profession) completedFields += 1;
  if (profile.education) completedFields += 1;
  if (profile.height) completedFields += 1;
  if (profile.promptAnswer) completedFields += 1;
  if (profile.anthemTitle) completedFields += 1;
  const completionPercentage = Math.min(100, Math.round((completedFields / 10) * 100));

  // Circular progress math (circumference = 2 * PI * 52 = ~326.7)
  const ringRadius = 52;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeOffset = ringCircumference - (ringCircumference * completionPercentage) / 100;

  return (
    <div className="min-h-screen bg-[#0c0c10] text-white pb-28 max-w-md mx-auto select-none">
      {/* Hidden Gallery Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Toast Notification */}
      {uploadToast && (
        <div className="fixed top-5 inset-x-4 z-50 max-w-sm mx-auto p-3 rounded-xl bg-zinc-900 border border-amber-400/40 text-center text-xs font-semibold text-amber-300 shadow-2xl animate-in fade-in">
          {uploadToast}
        </div>
      )}

      {/* ================= 1. BUMBLE-STYLE TOP BAR ================= */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <Link
          href="/settings/verification"
          className="w-10 h-10 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition shadow-sm"
          title="Safety & Verification"
        >
          <ShieldCheck className="w-5 h-5 text-amber-400" />
        </Link>

        <span className="text-xs font-black tracking-widest text-zinc-400 uppercase">
          Profile
        </span>

        <button
          type="button"
          onClick={() => setIsSettingsDrawerOpen(true)}
          className="w-10 h-10 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition shadow-sm"
          title="Account Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {/* ================= 2. BUMBLE-STYLE CENTERED AVATAR & RING ================= */}
      <div className="pt-3 pb-5 flex flex-col items-center justify-center text-center px-4">
        {/* Avatar with Circular Completion Ring */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Circular SVG Ring */}
          <svg className="w-32 h-32 transform -rotate-90 pointer-events-none" viewBox="0 0 120 120">
            {/* Background ring track */}
            <circle
              cx="60"
              cy="60"
              r={ringRadius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="5"
              fill="transparent"
            />
            {/* Animated Bumble Gold progress ring */}
            <circle
              cx="60"
              cy="60"
              r={ringRadius}
              stroke="#FFC629"
              strokeWidth="5"
              strokeDasharray={ringCircumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Centered Circular Photo */}
          <div className="absolute inset-2.5 rounded-full overflow-hidden bg-zinc-900 border-2 border-zinc-950 shadow-2xl">
            {primaryPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryPhoto.url}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <User className="w-10 h-10" />
              </div>
            )}
          </div>

          {/* Bottom-right Bumble Gold Camera Upload Button */}
          <button
            type="button"
            onClick={handleDirectUploadClick}
            disabled={isUploadingPhoto}
            className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-[#FFC629] text-black hover:bg-[#ffcf4b] flex items-center justify-center shadow-lg active:scale-90 transition border-2 border-[#0c0c10]"
            title="Upload photo"
          >
            {isUploadingPhoto ? (
              <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
            ) : (
              <Camera className="w-4 h-4 fill-current stroke-[2.5]" />
            )}
          </button>
        </div>

        {/* User Name & Age with Gold Verified Checkmark */}
        <div className="mt-3 flex items-center gap-1.5 justify-center">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {profile.name}{profile.age ? `, ${profile.age}` : ""}
          </h1>
          {user.isVerified ? (
            <span
              className="w-5 h-5 rounded-full bg-[#FFC629] text-black flex items-center justify-center text-[11px] font-black shadow-md shadow-amber-500/30"
              title="Verified Single"
            >
              ✓
            </span>
          ) : (
            <Link
              href="/settings/verification"
              className="w-5 h-5 rounded-full bg-zinc-800 text-amber-400 border border-amber-400/40 hover:border-amber-400 flex items-center justify-center text-[10px] font-bold"
              title="Get Verified"
            >
              ✓
            </Link>
          )}
        </div>

        {/* Bumble Pill Action Buttons: Complete Profile & Preview */}
        <div className="mt-4 flex items-center gap-2.5">
          <Link
            href="/settings/edit-profile"
            className="py-2.5 px-6 rounded-full bg-[#FFC629] hover:bg-[#ffcf4b] text-black text-xs font-black tracking-wide shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-1.5"
          >
            <span>Complete profile</span>
            <span className="text-[11px] font-black opacity-80">({completionPercentage}%)</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="py-2.5 px-5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white text-xs font-bold active:scale-95 transition flex items-center gap-1.5 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-300" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* ================= MY BASICS ================= */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">My Basics</span>
            <Link
              href="/settings/edit-profile"
              className="text-xs font-bold text-[#FFC629] hover:underline"
            >
              Edit all
            </Link>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold text-zinc-300">
            <button
              type="button"
              onClick={() => openQuickEdit("LIVING_IN")}
              className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-400/40 whitespace-nowrap flex items-center gap-1.5 transition active:scale-95"
            >
              <span>🏠 Living in</span>
              <span className="text-amber-400">{profile.city || "+ Add"}</span>
            </button>

            <button
              type="button"
              onClick={() => openQuickEdit("HEIGHT")}
              className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-400/40 whitespace-nowrap flex items-center gap-1.5 transition active:scale-95"
            >
              <span>📏 Height</span>
              <span className="text-amber-400">{profile.height ? `${profile.height} cm` : "+ Add"}</span>
            </button>

            <button
              type="button"
              onClick={() => openQuickEdit("JOB")}
              className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-400/40 whitespace-nowrap flex items-center gap-1.5 transition active:scale-95"
            >
              <span>💼 Work</span>
              <span className="text-amber-400">{profile.profession || "+ Add"}</span>
            </button>

            <button
              type="button"
              onClick={() => openQuickEdit("EDUCATION")}
              className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-400/40 whitespace-nowrap flex items-center gap-1.5 transition active:scale-95"
            >
              <span>🎓 Education</span>
              <span className="text-amber-400">{profile.education || "+ Add"}</span>
            </button>
          </div>
        </div>

        {/* ================= 5. MY PHOTOS (6 SLOTS) ================= */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white">My Photos</h3>
              <span className="text-xs font-bold text-amber-400">
                {photos.length}/6
              </span>
            </div>
            <Link
              href="/settings/photos"
              className="py-1 px-3.5 rounded-full bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-[#FFC629] text-xs font-bold transition active:scale-95"
            >
              Manage
            </Link>
          </div>

          {/* 6 Photo Slots Grid */}
          <div className="grid grid-cols-6 gap-2">
            {photoSlots.map((photo, idx) => (
              <div
                key={idx}
                onClick={photo ? () => router.push("/settings/photos") : handleDirectUploadClick}
                className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#16161c] border border-zinc-800 hover:border-amber-400/50 transition cursor-pointer flex items-center justify-center group"
              >
                {photo ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {photo.isPrimary && (
                      <span className="absolute bottom-1 left-1 px-1 rounded bg-[#FFC629] text-[9px] font-black text-black">
                        ★
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-500 group-hover:text-amber-400 transition">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ================= 6. BUMBLE PROMPT & BIO CARDS ================= */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white">Profile Prompts</h3>
            <span className="text-xs font-bold text-zinc-400">Stand out</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: About me */}
            <div
              onClick={() => openQuickEdit("ABOUT_ME")}
              className="relative p-4 rounded-2xl bg-[#14141a] border border-zinc-800 hover:border-amber-400/40 transition cursor-pointer space-y-2 flex flex-col justify-between min-h-[110px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-serif text-[#FFC629]">❝</span>
                <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center">
                  <Edit2 className="w-3 h-3 text-amber-400" />
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-white">About me</h4>
                <p className="text-[11px] text-zinc-400 line-clamp-3">
                  {profile.bio || "Write something interesting about yourself..."}
                </p>
              </div>
            </div>

            {/* Card 2: Select a prompt */}
            <div
              onClick={() => openQuickEdit("PROMPT")}
              className="relative p-4 rounded-2xl bg-[#14141a] border border-zinc-800 hover:border-amber-400/40 transition cursor-pointer space-y-2 flex flex-col justify-between min-h-[110px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-serif text-[#FFC629]">❝</span>
                <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center">
                  <Edit2 className="w-3 h-3 text-amber-400" />
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-white truncate">
                  {profile.promptQuestion || "Prompt"}
                </h4>
                <p className="text-[11px] text-zinc-400 line-clamp-3">
                  {profile.promptAnswer || "Answer a fun prompt to stand out..."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 7. INTERESTS & SPOTIFY ================= */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-3">
            {/* Interests Card */}
            <Link
              href="/settings/edit-profile"
              className="p-3.5 rounded-2xl bg-[#14141a] border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between min-h-[96px]"
            >
              <div className="text-xl">✨</div>
              <div>
                <h4 className="font-bold text-xs text-white">Interests</h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  {profile.interests?.length > 0
                    ? profile.interests.map((i) => i.interest.name).join(", ")
                    : "Add your passions"}
                </p>
              </div>
            </Link>

            {/* Spotify Anthem */}
            <div
              onClick={() => openQuickEdit("ANTHEM")}
              className="p-3.5 rounded-2xl bg-[#14141a] border border-zinc-800 hover:border-zinc-700 transition cursor-pointer flex flex-col justify-between min-h-[96px]"
            >
              <div className="flex items-center gap-1 text-emerald-400">
                <Music className="w-4 h-4" />
                <span className="text-[10px] font-bold text-[#1DB954]">Spotify</span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-white truncate">My Anthem</h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  {profile.anthemTitle || "Choose a song"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= QUICK DETAIL EDIT MODAL ================= */}
      {activeQuickEdit && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#121217] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-white">
                {activeQuickEdit === "LIVING_IN" && "Edit City / Location"}
                {activeQuickEdit === "HEIGHT" && "Edit Height (cm)"}
                {activeQuickEdit === "JOB" && "Edit Profession / Work"}
                {activeQuickEdit === "EDUCATION" && "Edit Education"}
                {activeQuickEdit === "ABOUT_ME" && "Edit About Me"}
                {activeQuickEdit === "PROMPT" && "Edit Prompt & Answer"}
                {activeQuickEdit === "ANTHEM" && "Choose Spotify Anthem"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveQuickEdit(null)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeQuickEdit === "ABOUT_ME" ? (
              <textarea
                value={quickInputVal}
                onChange={(e) => setQuickInputVal(e.target.value)}
                placeholder="Write about yourself..."
                rows={4}
                className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#FFC629]"
              />
            ) : activeQuickEdit === "PROMPT" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-zinc-400 font-semibold mb-1 block">
                    Prompt Question
                  </label>
                  <input
                    type="text"
                    value={quickInputVal}
                    onChange={(e) => setQuickInputVal(e.target.value)}
                    placeholder="e.g. I feel happiest when..."
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#FFC629]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-semibold mb-1 block">
                    Your Answer
                  </label>
                  <textarea
                    value={promptAnswerVal}
                    onChange={(e) => setPromptAnswerVal(e.target.value)}
                    placeholder="e.g. I'm around dogs and away from drama."
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#FFC629]"
                  />
                </div>
              </div>
            ) : (
              <input
                type={activeQuickEdit === "HEIGHT" ? "number" : "text"}
                value={quickInputVal}
                onChange={(e) => setQuickInputVal(e.target.value)}
                placeholder="Enter value..."
                className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#FFC629]"
              />
            )}

            <button
              type="button"
              onClick={handleSaveQuickEdit}
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] text-black font-extrabold text-xs transition hover:brightness-105 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ================= FULL ACCOUNT SETTINGS DRAWER ================= */}
      {isSettingsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#121217] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 text-white space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-white">Account Settings</h3>
              <button
                type="button"
                onClick={() => setIsSettingsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Link
                href="/settings/edit-profile"
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white transition"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>Full Profile Editor</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </Link>

              <Link
                href="/settings/photos"
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white transition"
              >
                <div className="flex items-center gap-3">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Manage 6 Photos</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </Link>

              <Link
                href="/settings/verification"
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white transition"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Face Verification & Verified Badge</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </Link>

              <Link
                href="/plan"
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white transition"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Membership Plans ({entitlements?.planName || "Free"})</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </Link>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full mt-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold text-xs flex items-center justify-center gap-2 border border-red-500/20 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= LIVE PROFILE PREVIEW SHEET ================= */}
      <ProfileDetailSheet
        candidate={userCandidateView}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onLike={() => setIsPreviewOpen(false)}
        onPass={() => setIsPreviewOpen(false)}
      />

      <BottomNav />
    </div>
  );
}
