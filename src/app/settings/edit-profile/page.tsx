"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { LocationPickerModal } from "@/components/profile/LocationPickerModal";
import { ArrowLeft, Lock, AlertCircle, CheckCircle, MapPin } from "lucide-react";

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
      setSuccess("Profile details saved successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
        <p className="text-xs text-[#9e9ea8]">Loading profile editor...</p>
      </div>
    );
  }

  const canEditName = entitlements?.canChangeName ?? false;

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col items-center justify-start sm:py-6 sm:px-4 w-full overflow-x-hidden">
      <div className="min-h-screen sm:min-h-[780px] bg-[#0a0a0c] text-white max-w-md w-full px-5 py-4 pb-20 sm:rounded-3xl sm:border sm:border-white/[0.08] sm:shadow-2xl relative overflow-x-hidden box-border">
        {/* Top Bar */}
      <div className="flex items-center gap-3 mb-5 border-b border-[#1e1e26] pb-3">
        <button onClick={() => router.back()} className="p-1 hover:text-amber-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-white tracking-tight">Edit Profile</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-xs text-[#ef4444] font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 text-xs text-[#10b981] font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name with Plan Guard */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider">
              Full Name
            </label>
            {!canEditName && (
              <Badge variant="neutral" className="gap-1 text-[10px]">
                <Lock className="w-3 h-3 text-amber-400" /> Locked (Pro only)
              </Badge>
            )}
          </div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEditName}
            helperText={
              !canEditName
                ? "Name change is exclusive to the ₹499 PRO plan."
                : "PRO plan allows name editing."
            }
          />
        </div>

        {/* DOB & Age (Permanently Non-Editable Directly) */}
        <div className="p-3 rounded-lg bg-[#0e0e12] border border-[#1e1e26] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider">
              Date of Birth & Age
            </span>
            <Badge variant="verified">Source of Truth</Badge>
          </div>
          <p className="text-sm font-bold text-white">
            {profile?.dob ? new Date(profile.dob).toLocaleDateString() : "—"}{" "}
            <span className="text-xs font-normal text-[#9e9ea8]">({profile?.age} years old)</span>
          </p>
          <p className="text-[11px] text-[#5e5e6e] pt-1">
            Age and DOB cannot be directly changed. ₹499 PRO users can{" "}
            <Link href="/settings/verification#dob" className="text-amber-400 hover:underline font-semibold">
              request a DOB correction
            </Link>{" "}
            with administrative verification.
          </p>
        </div>

        {/* City with 3-Time Lifetime Free Limit for Free Tier */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider">
              Current Location (Worldwide)
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
              {entitlements?.locationChangesRemaining !== undefined && (
                <span className="text-[10px] text-zinc-400 font-medium">
                  {entitlements.locationChangesRemaining === Infinity
                    ? "Unlimited (PRO)"
                    : `${entitlements.locationChangesRemaining}/3 left`}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => entitlements?.canSelectCity && setIsLocationModalOpen(true)}
            disabled={!entitlements?.canSelectCity}
            className="w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-[#FFC629] text-left text-sm transition flex items-center justify-between group disabled:opacity-50"
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
            <p className="text-[11px] text-rose-400 mt-1">
              Free location changes exhausted (3/3). Upgrade to TMD Plus or PRO for unlimited changes.
            </p>
          ) : entitlements?.locationChangesRemaining !== Infinity ? (
            <p className="text-[11px] text-[#5e5e6e] mt-1">
              You have {entitlements?.locationChangesRemaining} free lifetime location change
              {entitlements?.locationChangesRemaining === 1 ? "" : "s"} remaining.
            </p>
          ) : null}

          {latitude && longitude && (
            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
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

        {/* Profession & Height */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Profession"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            placeholder="e.g. Architect"
          />
          <Input
            label="Height (cm)"
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="175"
          />
        </div>

        <Input
          label="Education"
          value={education}
          onChange={(e) => setEducation(e.target.value)}
          placeholder="e.g. Graduate"
        />

        {/* Relationship Intention */}
        <div>
          <label className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider block mb-1">
            Relationship Intention
          </label>
          <select
            value={relationshipIntention}
            onChange={(e) => setRelationshipIntention(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-[#14141a] border border-[#24242e] text-white text-sm focus:border-[#d4af37] focus:outline-none"
          >
            <option value="LONG_TERM">Long-term relationship</option>
            <option value="SHORT_TERM_CASUAL">Short-term / casual</option>
            <option value="FRIENDSHIP">New friends</option>
            <option value="NOT_SURE_YET">Not sure yet</option>
          </select>
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider block mb-1">
            Bio
          </label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Describe yourself..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#14141a] border border-[#24242e] text-white text-sm focus:border-[#d4af37] focus:outline-none"
          />
        </div>

        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
          Save Changes
        </Button>
      </form>
      </div>
    </div>
  );
}
