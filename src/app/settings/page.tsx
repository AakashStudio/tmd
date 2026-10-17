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
  Users,
  ShieldCheck,
  ChevronRight,
  Plus,
  Edit2,
  Sparkles,
  Camera,
  Star,
  Zap,
  Flame,
  Home,
  Ruler,
  Briefcase,
  GraduationCap,
  Heart,
  Globe,
  Music,
  Share2,
  LogOut,
  X,
  Check,
  AlertCircle,
  HelpCircle,
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
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-6 text-white text-center">
        <h2 className="text-xl font-bold mb-2">Sign in to view Profile</h2>
        <p className="text-xs text-[#9e9ea8] mb-4">Please log in to manage your TMD profile and preferences.</p>
        <Link href="/" className="py-2.5 px-6 rounded-xl bg-rose-500 font-bold text-xs">
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

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white pb-28 max-w-md mx-auto select-none">
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
        <div className="fixed top-5 inset-x-4 z-50 max-w-sm mx-auto p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-center text-xs font-semibold text-rose-300 shadow-2xl animate-in fade-in">
          {uploadToast}
        </div>
      )}

      {/* 1. TOP HEADER (Exact Screenshot Layout) */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        {/* User Info & Avatar */}
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-md shrink-0">
            {primaryPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryPhoto.url}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <User className="w-7 h-7" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-black text-white tracking-tight">
                {profile.name}
              </h1>
              {user.isVerified ? (
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
              ) : (
                <Link
                  href="/settings/verification"
                  className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center justify-center text-[9px] hover:text-white"
                  title="Get Verified"
                >
                  ✓
                </Link>
              )}
            </div>

            {/* Preview > button that opens full profile preview */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-0.5 mt-0.5 transition font-medium"
            >
              <span>Preview</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top Right Action Icons: Safety & Settings Gear */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/settings/verification"
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition shadow"
            title="Safety & Verification"
          >
            <Users className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => setIsSettingsDrawerOpen(true)}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition shadow"
            title="Account Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-5 py-3 space-y-5">
        {/* 2. COMPLETE YOUR PROFILE CAPSULE */}
        <div
          onClick={() => openQuickEdit("ABOUT_ME")}
          className="w-full py-2.5 px-4 rounded-full bg-[#181820] border border-zinc-800 hover:border-zinc-700 transition flex items-center justify-between cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center text-xs font-black">
              !
            </div>
            <span className="text-xs font-bold text-zinc-200">
              Complete your profile ({completionPercentage}%)
            </span>
          </div>
          <span className="text-[11px] font-semibold text-rose-400">
            Edit →
          </span>
        </div>

        {/* 3. HORIZONTAL SCROLLABLE TAG PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold text-zinc-300">
          <button
            type="button"
            onClick={() => openQuickEdit("LIVING_IN")}
            className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 whitespace-nowrap flex items-center gap-1.5 transition active:scale-95"
          >
            <span>🏠 Living in</span>
            <span className="text-zinc-500">{profile.city || "+"}</span>
          </button>

          <button
            type="button"
            onClick={() => openQuickEdit("HEIGHT")}
            className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 whitespace-nowrap flex items-center gap-1.5 transition active:scale-95"
          >
            <span>📏 Height</span>
            <span className="text-zinc-500">{profile.height ? `${profile.height} cm` : "+"}</span>
          </button>

          <button
            type="button"
            onClick={() => openQuickEdit("JOB")}
            className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 whitespace-nowrap flex items-center gap-1.5 transition active:scale-95 relative"
          >
            <span>💼 Job</span>
            <span className="text-zinc-500">{profile.profession || "+"}</span>
            {!profile.profession && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute -top-0.5 right-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => openQuickEdit("EDUCATION")}
            className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 whitespace-nowrap flex items-center gap-1.5 transition active:scale-95"
          >
            <span>🎓 Education</span>
            <span className="text-zinc-500">{profile.education || "+"}</span>
          </button>

          <Link
            href="/settings/edit-profile"
            className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 whitespace-nowrap flex items-center gap-1.5 transition active:scale-95"
          >
            <span>Basics +</span>
          </Link>

          <Link
            href="/settings/edit-profile"
            className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 whitespace-nowrap flex items-center gap-1.5 transition active:scale-95"
          >
            <span>🍸 Lifestyle +</span>
          </Link>

          <Link
            href="/settings/edit-profile"
            className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 whitespace-nowrap flex items-center gap-1.5 transition active:scale-95"
          >
            <span>文 Languages +</span>
          </Link>
        </div>

        {/* 4. MY PHOTOS SECTION (Matches Screenshot 1) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-base text-white">My Photos</h3>
              {photos.length < 6 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black">
                  !
                </span>
              )}
            </div>
            {photos.length < 6 && (
              <span className="text-xs font-semibold text-rose-500">
                Add {6 - photos.length} more {6 - photos.length === 1 ? "photo" : "photos"}
              </span>
            )}
          </div>

          {/* 6 Photo Slots Row */}
          <div className="grid grid-cols-6 gap-2">
            {photoSlots.map((photo, idx) => (
              <div
                key={idx}
                onClick={photo ? () => router.push("/settings/photos") : handleDirectUploadClick}
                className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#16161c] border border-zinc-800 hover:border-zinc-600 transition cursor-pointer flex items-center justify-center group"
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
                      <span className="absolute bottom-1 left-1 px-1 rounded bg-black/70 text-[9px] font-bold text-white">
                        ★
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-500 group-hover:text-white transition">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom hint & Edit button */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-zinc-400">
              Get up to 2x more Likes with 6 pics.
            </p>
            <Link
              href="/settings/photos"
              className="py-1 px-4 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-bold transition active:scale-95 shadow"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* 5. MY PROMPTS SECTION (Matches Screenshot 1) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-base text-white">My Prompts</h3>
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black">
                !
              </span>
            </div>
            <span className="text-xs font-semibold text-rose-500">
              Add 2 more prompts
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: About me */}
            <div
              onClick={() => openQuickEdit("ABOUT_ME")}
              className="relative p-4 rounded-2xl bg-[#14141a] border border-zinc-800 hover:border-zinc-700 transition cursor-pointer space-y-2 flex flex-col justify-between min-h-[110px]"
            >
              <button
                type="button"
                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <div className="space-y-1">
                <span className="text-xl font-serif text-zinc-400">❝</span>
                <h4 className="font-bold text-sm text-white">About me</h4>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2">
                {profile.bio || "Write something interesting about yourself..."}
              </p>
            </div>

            {/* Card 2: Select a prompt */}
            <div
              onClick={() => openQuickEdit("PROMPT")}
              className="relative p-4 rounded-2xl bg-[#14141a] border border-zinc-800 hover:border-zinc-700 transition cursor-pointer space-y-2 flex flex-col justify-between min-h-[110px]"
            >
              <button
                type="button"
                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <div className="space-y-1">
                <span className="text-xl font-serif text-zinc-400">❝</span>
                <h4 className="font-bold text-sm text-white">
                  {profile.promptQuestion ? "My Prompt" : "Select a prompt"}
                </h4>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2">
                {profile.promptAnswer || "Answer a fun prompt to stand out..."}
              </p>
            </div>
          </div>
        </div>

        {/* 6. MY INTERESTS SECTION (Matches Screenshot 2) */}
        <div className="space-y-2">
          <h3 className="font-extrabold text-base text-white">My Interests</h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Currently Into */}
            <Link
              href="/settings/edit-profile"
              className="relative p-4 rounded-2xl bg-[#14141a] border border-zinc-800 hover:border-zinc-700 transition space-y-2 flex flex-col justify-between min-h-[110px]"
            >
              <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl">🛼</div>
              <div>
                <h4 className="font-bold text-xs text-white">Currently Into</h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  {profile.interests?.length > 0
                    ? profile.interests.map((i) => i.interest.name).join(", ")
                    : "Choose Interests"}
                </p>
              </div>
            </Link>

            {/* Card 2: Listening to (Spotify Anthem) */}
            <div
              onClick={() => openQuickEdit("ANTHEM")}
              className="relative p-4 rounded-2xl bg-[#14141a] border border-zinc-800 hover:border-zinc-700 transition cursor-pointer space-y-2 flex flex-col justify-between min-h-[110px]"
            >
              <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl text-emerald-400">🎵</div>
              <div>
                <h4 className="font-bold text-xs text-white">Listening to</h4>
                <div className="flex items-center gap-1 text-[11px] text-zinc-400 truncate">
                  <span className="text-[#1DB954]">●</span>
                  <span className="truncate">{profile.anthemTitle || "Choose Songs"}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Top Artists */}
            <div
              onClick={() => openQuickEdit("ANTHEM")}
              className="relative p-4 rounded-2xl bg-[#14141a] border border-zinc-800 hover:border-zinc-700 transition cursor-pointer space-y-2 flex flex-col justify-between min-h-[110px]"
            >
              <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl text-sky-400">🎧</div>
              <div>
                <h4 className="font-bold text-xs text-white">Top artists</h4>
                <div className="flex items-center gap-1 text-[11px] text-zinc-400 truncate">
                  <span className="text-[#1DB954]">●</span>
                  <span>{profile.anthemArtist || "Connect Spotify"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 7. MORE PROFILE CONTROLS BUTTON */}
        <button
          type="button"
          onClick={() => setIsSettingsDrawerOpen(true)}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#15151c] hover:bg-zinc-800 text-zinc-300 font-bold text-xs transition flex items-center justify-between border border-zinc-800"
        >
          <span>More Profile Controls</span>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>

        {/* 8. GOLD / PRO BANNER (Exact Screenshot Styling) */}
        <Link href="/plan" className="block">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa771c] text-black shadow-lg shadow-amber-900/20 flex items-center justify-between transition hover:opacity-95 active:scale-[0.99]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-wider">TMD</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-black text-amber-300">
                  GOLD
                </span>
              </div>
              <p className="text-xs font-semibold text-zinc-900">
                See who Likes you. Match faster.
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0">
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </div>
          </div>
        </Link>

        {/* 9. QUICK ACTION CAPSULE BAR */}
        <div className="py-2.5 px-4 rounded-full bg-[#181822] border border-zinc-800 flex items-center justify-around text-xs font-bold text-zinc-300">
          <Link href="/plan" className="flex items-center gap-1.5 hover:text-white transition">
            <Star className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
            <span>0 Super Likes</span>
          </Link>

          <span className="text-zinc-700">|</span>

          <Link href="/plan" className="flex items-center gap-1.5 hover:text-white transition">
            <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
            <span>1 Boost</span>
          </Link>

          <span className="text-zinc-700">|</span>

          <Link href="/plan" className="flex items-center gap-1.5 hover:text-white transition">
            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Subscriptions</span>
          </Link>
        </div>
      </div>

      {/* QUICK DETAIL EDIT MODAL */}
      {activeQuickEdit && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#121217] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-white">
                {activeQuickEdit === "LIVING_IN" && "Edit City / Location"}
                {activeQuickEdit === "HEIGHT" && "Edit Height (cm)"}
                {activeQuickEdit === "JOB" && "Edit Profession / Job"}
                {activeQuickEdit === "EDUCATION" && "Edit Education"}
                {activeQuickEdit === "ABOUT_ME" && "Edit About Me (Bio)"}
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
                className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-rose-500"
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
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-rose-500"
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
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            ) : (
              <input
                type={activeQuickEdit === "HEIGHT" ? "number" : "text"}
                value={quickInputVal}
                onChange={(e) => setQuickInputVal(e.target.value)}
                placeholder="Enter value..."
                className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-rose-500"
              />
            )}

            <button
              type="button"
              onClick={handleSaveQuickEdit}
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs transition hover:opacity-95 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* FULL ACCOUNT SETTINGS DRAWER / MODAL */}
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
                  <User className="w-4 h-4 text-rose-500" />
                  <span>Full Profile Editor</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </Link>

              <Link
                href="/settings/photos"
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white transition"
              >
                <div className="flex items-center gap-3">
                  <Camera className="w-4 h-4 text-rose-500" />
                  <span>Manage 6 Photos</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </Link>

              <Link
                href="/settings/verification"
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white transition"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Face Verification & Blue Tick</span>
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
              className="w-full mt-4 py-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold text-xs flex items-center justify-center gap-2 border border-rose-500/20 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* LIVE PROFILE PREVIEW SHEET (What other users see!) */}
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
