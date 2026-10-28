"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/Badge";
import { LocationPickerModal } from "@/components/profile/LocationPickerModal";
import {
  ArrowLeft,
  Lock,
  AlertCircle,
  CheckCircle,
  MapPin,
  Sparkles,
  ChevronDown,
  Loader2,
  Calendar,
  Briefcase,
  GraduationCap,
  Ruler,
  Heart,
  FileText,
} from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const { profile, entitlements, updateProfile, isLoading } = useProfile();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [countryName, setCountryName] = useState("India");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [bio, setBio] = useState("");
  const [profession, setProfession] = useState("");
  const [education, setEducation] = useState("");
  const [height, setHeight] = useState("");
  const [relationshipIntention, setRelationshipIntention] = useState("LONG_TERM");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setCity(profile.city || "");
      setStateName(profile.state || "");
      setCountryName(profile.country || "India");
      setLatitude(profile.latitude ?? null);
      setLongitude(profile.longitude ?? null);
      setBio(profile.bio || "");
      setProfession(profile.profession || "");
      setEducation(profile.education || "");
      setHeight(profile.height ? String(profile.height) : "");
      setRelationshipIntention(profile.relationshipIntention || "LONG_TERM");
    }
  }, [profile]);

  const handleDetectGps = () => {
    if (!entitlements?.canSelectCity) {
      alert("Free location changes exhausted. Upgrade to TMD Gold or VIP PRO for unlimited changes.");
      return;
    }
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setIsDetectingGps(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
            );
            if (res.ok) {
              const data = await res.json();
              const detectedCity = data.city || data.locality || data.principalSubdivision;
              if (detectedCity) {
                setCity(detectedCity);
              }
              if (data.principalSubdivision) {
                setStateName(data.principalSubdivision);
              }
              if (data.countryName) {
                setCountryName(data.countryName);
              }
            }
          } catch (e) {
            console.warn(e);
          } finally {
            setIsDetectingGps(false);
          }
        },
        (err) => {
          setIsDetectingGps(false);
          alert("Could not detect location. Please grant browser location permission.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      const updates: Record<string, any> = {
        city: city.trim(),
        state: stateName.trim() || null,
        country: countryName.trim() || "India",
        bio: bio.trim() || null,
        profession: profession.trim() || null,
        education: education.trim() || null,
        height: height ? parseInt(height, 10) : null,
        relationshipIntention,
      };

      if (latitude !== null) updates.latitude = latitude;
      if (longitude !== null) updates.longitude = longitude;

      // Only include name if user is Pro and changed it
      if (entitlements?.canChangeName && name !== profile?.name) {
        updates.name = name.trim();
      }

      await updateProfile(updates);
      setSuccess("Profile details saved successfully! ✨");
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08080b] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#FFC629] border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-400 font-medium">Loading profile editor...</p>
        </div>
      </div>
    );
  }

  const canEditName = entitlements?.canChangeName ?? false;
  const remainingChanges = typeof entitlements?.locationChangesRemaining === "number"
    ? entitlements.locationChangesRemaining
    : entitlements?.canSelectCity
    ? 3
    : 0;

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col items-center justify-start py-4 sm:py-8 px-3 sm:px-4 w-full box-border overflow-x-hidden">
      <div className="w-full max-w-md bg-[#0c0c10] text-white rounded-3xl border border-white/[0.08] shadow-2xl p-5 sm:p-6 pb-24 relative box-border overflow-hidden">
        {/* Top Header with Back Button */}
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
                <span>Edit Profile</span>
                <Sparkles className="w-3.5 h-3.5 text-[#FFC629]" />
              </h1>
              <p className="text-[11px] text-zinc-400">Manage your bio, location & details</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#FFC629] text-[10px] font-black uppercase tracking-wider">
            Aura Gold
          </span>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-medium flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Full Name */}
          <div className="p-4 rounded-2xl bg-[#14141a] border border-zinc-800/90 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                Full Name
              </label>
              {!canEditName && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#FFC629] text-[10px] font-bold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Locked (PRO only)
                </span>
              )}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEditName}
              placeholder="Your full name"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-sm focus:outline-none focus:border-[#FFC629] disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="text-[11px] text-zinc-500">
              {!canEditName
                ? "Name change is exclusive to the ₹499 VIP PRO plan."
                : "PRO plan allows custom name editing."}
            </p>
          </div>

          {/* 2. Date of Birth & Age (Source of Truth) */}
          <div className="p-4 rounded-2xl bg-[#14141a] border border-zinc-800/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FFC629]" />
                <span>Date of Birth & Age</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[#FFC629] text-[10px] font-extrabold">
                Source of Truth
              </span>
            </div>
            <p className="text-sm font-extrabold text-white">
              {profile?.dob ? new Date(profile.dob).toLocaleDateString() : "—"}{" "}
              <span className="text-xs font-normal text-zinc-400">({profile?.age} years old)</span>
            </p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Age and DOB cannot be directly changed. ₹499 PRO users can{" "}
              <Link href="/settings/verification#dob" className="text-[#FFC629] hover:underline font-bold">
                request a DOB correction
              </Link>{" "}
              with administrative verification.
            </p>
          </div>

          {/* 3. Location (Country -> State -> City Dropdown) */}
          <div className="p-4 rounded-2xl bg-[#14141a] border border-zinc-800/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FFC629]" />
                <span>Current Location</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={!entitlements?.canSelectCity || isDetectingGps}
                  className="text-[11px] font-bold text-[#FFC629] flex items-center gap-1 hover:underline disabled:opacity-40"
                >
                  <MapPin className="w-3 h-3 text-[#FFC629]" />
                  <span>{isDetectingGps ? "Detecting..." : "Detect GPS"}</span>
                </button>
                <span className="text-[10px] text-zinc-400 font-bold bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  {remainingChanges === Infinity ? "Unlimited (PRO)" : `${remainingChanges}/3 left`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => entitlements?.canSelectCity && setIsLocationModalOpen(true)}
              disabled={!entitlements?.canSelectCity}
              className="w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-[#FFC629] text-left text-sm transition flex items-center justify-between group active:scale-[0.99] disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="text-base">📍</span>
                <span className="text-white font-bold truncate">
                  {city
                    ? `${city}${stateName ? `, ${stateName}` : ""}${countryName ? `, ${countryName}` : ""}`
                    : "Select Country, State, City..."}
                </span>
              </div>
              <span className="text-xs font-bold text-amber-400 group-hover:underline shrink-0">
                Change Dropdown ▾
              </span>
            </button>

            {!entitlements?.canSelectCity ? (
              <p className="text-[11px] text-rose-400">
                Free location changes exhausted (3/3). Upgrade to TMD Plus or PRO for unlimited changes.
              </p>
            ) : remainingChanges !== Infinity ? (
              <p className="text-[11px] text-zinc-500">
                You have {remainingChanges} free lifetime location change{remainingChanges === 1 ? "" : "s"} remaining.
              </p>
            ) : null}

            {latitude && longitude && (
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Location pinned: {latitude.toFixed(3)}°, {longitude.toFixed(3)}°
              </p>
            )}

            {/* Worldwide Location Dropdown Modal */}
            <LocationPickerModal
              isOpen={isLocationModalOpen}
              onClose={() => setIsLocationModalOpen(false)}
              currentCity={city}
              currentState={stateName}
              currentCountry={countryName}
              onSave={async (loc) => {
                setCity(loc.city);
                if (loc.state) setStateName(loc.state);
                if (loc.country) setCountryName(loc.country);
                if (loc.latitude) setLatitude(loc.latitude);
                if (loc.longitude) setLongitude(loc.longitude);
                setIsLocationModalOpen(false);
              }}
            />
          </div>

          {/* 4. Profession & Height */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#14141a] border border-zinc-800/90 space-y-1.5">
              <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-[#FFC629]" />
                <span>Work / Job</span>
              </label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="e.g. Architect"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs font-semibold focus:outline-none focus:border-[#FFC629]"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#14141a] border border-zinc-800/90 space-y-1.5">
              <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Ruler className="w-3 h-3 text-[#FFC629]" />
                <span>Height (cm)</span>
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs font-semibold focus:outline-none focus:border-[#FFC629]"
              />
            </div>
          </div>

          {/* 5. Education */}
          <div className="p-4 rounded-2xl bg-[#14141a] border border-zinc-800/90 space-y-1.5">
            <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#FFC629]" />
              <span>Education</span>
            </label>
            <input
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g. Master's in Design"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-sm font-semibold focus:outline-none focus:border-[#FFC629]"
            />
          </div>

          {/* 6. Relationship Intention */}
          <div className="p-4 rounded-2xl bg-[#14141a] border border-zinc-800/90 space-y-1.5">
            <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#FFC629]" />
              <span>Relationship Intention</span>
            </label>
            <div className="relative">
              <select
                value={relationshipIntention}
                onChange={(e) => setRelationshipIntention(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-sm font-semibold focus:outline-none focus:border-[#FFC629] appearance-none cursor-pointer pr-10"
              >
                <option value="LONG_TERM" className="bg-zinc-900 text-white">Long-term relationship</option>
                <option value="SHORT_TERM_CASUAL" className="bg-zinc-900 text-white">Short-term / casual</option>
                <option value="FRIENDSHIP" className="bg-zinc-900 text-white">New friends</option>
                <option value="NOT_SURE_YET" className="bg-zinc-900 text-white">Not sure yet</option>
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 7. Bio */}
          <div className="p-4 rounded-2xl bg-[#14141a] border border-zinc-800/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#FFC629]" />
                <span>Bio / About Yourself</span>
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {bio.length}/500
              </span>
            </div>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              placeholder="Describe yourself, what makes you smile, your favorite weekend activities..."
              className="w-full px-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-sm focus:outline-none focus:border-[#FFC629] resize-none leading-relaxed"
            />
          </div>

          {/* Sticky/Prominent Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] text-black font-black text-sm tracking-wide shadow-xl shadow-amber-500/25 transition hover:brightness-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
