"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { calculateAge } from "@/lib/validation";
import { Camera, Image as ImageIcon, Plus, Trash2, Loader2, MapPin, ChevronDown, ChevronUp } from "lucide-react";

interface OnboardingWizardProps {
  onCompleted: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onCompleted }) => {
  const [step, setStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Location Permission Step 0 State
  const [showLocationInfo, setShowLocationInfo] = useState<boolean>(false);
  const [showLocationPopup, setShowLocationPopup] = useState<boolean>(false);
  const [locationPermission, setLocationPermission] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [dobString, setDobString] = useState("2000-01-01");
  const [is18PlusConfirmed, setIs18PlusConfirmed] = useState(false);
  const [gender, setGender] = useState("Male");
  const [interestedIn, setInterestedIn] = useState("Female");
  const [city, setCity] = useState("Delhi");
  const [bio, setBio] = useState("");
  const [profession, setProfession] = useState("");
  const [education, setEducation] = useState("");
  const [height, setHeight] = useState<string>("175");
  const [relationshipIntention, setRelationshipIntention] = useState("LONG_TERM");

  // Catalogs
  const [catalogs, setCatalogs] = useState<{
    interests: Array<{ id: string; name: string; slug: string }>;
    languages: Array<{ id: string; name: string; code: string }>;
  }>({ interests: [], languages: [] });

  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<string[]>([]);

  // Photos (up to 6)
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [targetSlotIndex, setTargetSlotIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live calculated age
  const calculatedAge = dobString ? calculateAge(new Date(dobString)) : 0;
  const isUnder18 = calculatedAge < 18;

  useEffect(() => {
    fetch("/api/catalogs")
      .then((res) => res.json())
      .then((data) => {
        if (data.interests && data.languages) {
          setCatalogs(data);
          // Preselect 2 defaults
          if (data.interests.length >= 2) {
            setSelectedInterestIds([data.interests[0].id, data.interests[1].id]);
          }
          if (data.languages.length >= 2) {
            setSelectedLanguageIds([data.languages[0].id, data.languages[1].id]);
          }
        }
      })
      .catch((e) => console.error("Failed to load catalogs:", e));
  }, []);

  const handleTriggerUpload = (slotIndex?: number) => {
    setTargetSlotIndex(slotIndex !== undefined ? slotIndex : null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("Photo size exceeds 15MB limit");
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
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to upload photo");
      }

      setPhotos((prev) => {
        if (targetSlotIndex !== null && targetSlotIndex < prev.length) {
          const next = [...prev];
          next[targetSlotIndex] = data.url;
          return next;
        } else {
          if (prev.length >= 6) return prev;
          return [...prev, data.url];
        }
      });
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      setTargetSlotIndex(null);
    }
  };

  const handleAddPhoto = () => {
    if (!photoInput.trim()) return;
    if (photos.length >= 6) {
      setError("Maximum 6 photos allowed");
      return;
    }
    setPhotos((prev) => [...prev, photoInput.trim()]);
    setPhotoInput("");
    setError(null);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (isUnder18) {
      setError("Under 18 registration is strictly prohibited.");
      return;
    }
    if (!is18PlusConfirmed) {
      setError("You must explicitly confirm you are at least 18 years old.");
      return;
    }
    if (photos.length === 0) {
      setError("Please upload at least 1 photo to complete your profile.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const payload = {
        name: name.trim(),
        dob: new Date(dobString).toISOString(),
        is18PlusConfirmed,
        gender,
        interestedIn,
        city: city.trim(),
        bio: bio.trim() || undefined,
        profession: profession.trim() || undefined,
        education: education.trim() || undefined,
        height: height ? parseInt(height, 10) : undefined,
        relationshipIntention,
        interestIds: selectedInterestIds,
        languageIds: selectedLanguageIds,
        photoUrls: photos,
      };

      const res = await fetch("/api/profile/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Onboarding failed");
      }

      onCompleted();
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChoice = (choice: "WHILE_USING" | "THIS_TIME" | "DENIED") => {
    setLocationPermission(choice);
    try {
      localStorage.setItem("tmd_location_permission", choice);
    } catch (e) {}

    if (choice !== "DENIED" && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("Location detected:", pos.coords.latitude, pos.coords.longitude);
        },
        () => {},
        { timeout: 5000 }
      );
    }

    setShowLocationPopup(false);
    setStep(1);
  };

  /* ================= STEP 0: MANDATORY LOCATION PERMISSION ================= */
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0c] text-white flex flex-col justify-between max-w-md mx-auto w-full h-[100dvh] px-6 py-10 overflow-y-auto animate-in fade-in duration-200">
        {/* Top Header Section */}
        <div className="text-center pt-6 space-y-3">
          <h1 className="text-2xl sm:text-[30px] font-black tracking-tight text-white leading-tight">
            So, are you from<br />around here?
          </h1>
          <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-xs mx-auto">
            Set your location to see who&apos;s in your neighborhood or beyond. You won&apos;t be able to match with people otherwise.
          </p>
        </div>

        {/* Center Graphic: Large White Circular Badge with Pin */}
        <div className="my-auto py-8 flex flex-col items-center justify-center">
          <div className="w-36 h-36 rounded-full bg-white flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.12)]">
            <svg
              className="w-16 h-16 text-zinc-500 stroke-[1.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21c-4.97-4.97-8-8.5-8-12a8 8 0 1116 0c0 3.5-3.03 7.03-8 12z"
              />
              <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Bottom Actions Section */}
        <div className="space-y-4 pb-4">
          {/* Continue Button */}
          <button
            type="button"
            onClick={() => setShowLocationPopup(true)}
            className="w-full py-4 px-6 rounded-full bg-white hover:bg-zinc-100 text-black font-black text-sm tracking-wide shadow-xl active:scale-[0.98] transition cursor-pointer"
          >
            Continue
          </button>

          {/* How is my location used toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowLocationInfo((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-bold transition cursor-pointer"
            >
              <span>How is my location used?</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  showLocationInfo ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Expandable Explanation Drawer / Sheet */}
          {showLocationInfo && (
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-left animate-in slide-in-from-bottom-2 fade-in duration-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <ChevronUp className="w-4 h-4 text-[#ff1475]" />
                <h4 className="text-sm font-black text-white">Don&apos;t worry—</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your location helps us show potential matches nearby or slightly further away. Your exact location is never shared.
              </p>
            </div>
          )}
        </div>

        {/* Location Permission System Popup Modal */}
        {showLocationPopup && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-150">
            <div className="w-full max-w-[290px] rounded-3xl bg-[#1c1c24] border border-white/10 p-6 text-center shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 mx-auto mb-3.5 rounded-full bg-[#ff1475]/15 border border-[#ff1475]/30 flex items-center justify-center text-[#ff1475]">
                <MapPin className="w-6 h-6" />
              </div>

              <h3 className="text-sm font-bold text-white mb-2 leading-snug">
                Allow TMD to access this device&apos;s location?
              </h3>

              <p className="text-[11px] text-zinc-400 mb-5 leading-relaxed">
                TMD uses location to show nearby singles, local events, and distance accuracy.
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handlePermissionChoice("WHILE_USING")}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF1475] to-[#FF6079] text-white font-bold text-xs shadow-md active:scale-95 transition cursor-pointer"
                >
                  While using the app
                </button>

                <button
                  type="button"
                  onClick={() => handlePermissionChoice("THIS_TIME")}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs active:scale-95 transition cursor-pointer"
                >
                  Only this time
                </button>

                <button
                  type="button"
                  onClick={() => handlePermissionChoice("DENIED")}
                  className="w-full py-2 px-3 rounded-xl text-zinc-400 hover:text-white font-medium text-xs transition cursor-pointer"
                >
                  Don&apos;t allow
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-5 sm:p-6 rounded-2xl bg-[#14141a] border border-[#24242e] shadow-2xl text-left overflow-hidden box-border">
      <div className="flex items-center justify-between mb-4 border-b border-[#1e1e26] pb-3">
        <h2 className="text-base font-bold text-white tracking-tight">Create Your Profile</h2>
        <span className="text-xs font-semibold text-[#ff1475] bg-[#ff1475]/10 px-2.5 py-0.5 rounded-full border border-[#ff1475]/30">
          Step {step} of 4
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-xs text-[#ef4444] font-medium">
          {error}
        </div>
      )}

      {/* STEP 1: Core Identity & Mandatory 18+ Verification */}
      {step === 1 && (
        <div className="space-y-4 w-full box-border">
          <Input
            label="Full Name"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            helperText="Name cannot be changed on Free plan"
          />

          <div className="w-full box-border">
            <label className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider block mb-1">
              Date of Birth (Mandatory)
            </label>
            <input
              type="date"
              value={dobString}
              onChange={(e) => {
                setDobString(e.target.value);
                setError(null);
              }}
              className="w-full block max-w-full box-border px-3.5 py-2.5 rounded-lg bg-[#14141a] border border-[#24242e] text-white text-sm focus:border-[#ff1475] focus:outline-none appearance-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-[#9e9ea8]">Calculated Age:</span>
              <Badge variant={isUnder18 ? "danger" : "verified"}>
                {calculatedAge} Years Old {isUnder18 ? "(Under 18 - Blocked)" : "(Eligible)"}
              </Badge>
            </div>
          </div>

          {isUnder18 && (
            <div className="p-3 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/40 text-xs text-[#ef4444] font-semibold">
              ⛔ Registration Blocked: You must be at least 18 years old to join TMD.
            </div>
          )}

          <div className="p-3 rounded-lg bg-[#0e0e12] border border-[#1e1e26] space-y-2 box-border">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={is18PlusConfirmed}
                onChange={(e) => setIs18PlusConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-[#383848] text-[#ff1475] focus:ring-[#ff1475]"
              />
              <span className="text-xs text-[#9e9ea8] leading-tight">
                I confirm that I am at least 18 years of age and that my provided date of birth is accurate.
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full box-border">
            <div className="w-full box-border">
              <label className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider block mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full block max-w-full box-border px-3 py-2.5 rounded-lg bg-[#14141a] border border-[#24242e] text-white text-sm focus:border-[#ff1475] focus:outline-none cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
              </select>
            </div>

            <div className="w-full box-border">
              <label className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider block mb-1">
                Interested In
              </label>
              <select
                value={interestedIn}
                onChange={(e) => setInterestedIn(e.target.value)}
                className="w-full block max-w-full box-border px-3 py-2.5 rounded-lg bg-[#14141a] border border-[#24242e] text-white text-sm focus:border-[#ff1475] focus:outline-none cursor-pointer"
              >
                <option value="Female">Women</option>
                <option value="Male">Men</option>
                <option value="Everyone">Everyone</option>
              </select>
            </div>
          </div>

          <Button
            variant="primary"
            className="w-full mt-4"
            disabled={!name.trim() || isUnder18 || !is18PlusConfirmed}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </div>
      )}

      {/* STEP 2: Location, Vocation, Bio & Intention */}
      {step === 2 && (
        <div className="space-y-4">
          <Input
            label="Current City (Required)"
            placeholder="e.g. Delhi, Mumbai, Bengaluru"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Profession"
              placeholder="e.g. Software Engineer"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
            />
            <Input
              label="Height (cm)"
              type="number"
              placeholder="175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>

          <Input
            label="Education"
            placeholder="e.g. University Graduate"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
          />

          <div className="w-full box-border">
            <label className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider block mb-1">
              Relationship Intention
            </label>
            <select
              value={relationshipIntention}
              onChange={(e) => setRelationshipIntention(e.target.value)}
              className="w-full block max-w-full box-border px-3.5 py-2.5 rounded-lg bg-[#14141a] border border-[#24242e] text-white text-sm focus:border-[#ff1475] focus:outline-none cursor-pointer"
            >
              <option value="LONG_TERM">Long-term relationship</option>
              <option value="SHORT_TERM_CASUAL">Short-term / casual</option>
              <option value="FRIENDSHIP">New friends</option>
              <option value="NOT_SURE_YET">Not sure yet</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider block mb-1">
              Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share a short glimpse of your life and passions..."
              className="w-full px-3.5 py-2 rounded-lg bg-[#14141a] border border-[#24242e] text-white text-sm focus:border-[#ff1475] focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="primary" className="flex-1" disabled={!city.trim()} onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Interests & Spoken Languages */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider block mb-2">
              Select Your Interests
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
              {catalogs.interests.map((item) => {
                const isSelected = selectedInterestIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedInterestIds(
                        isSelected
                          ? selectedInterestIds.filter((id) => id !== item.id)
                          : [...selectedInterestIds, item.id]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isSelected
                        ? "bg-[#ff1475] text-white font-bold border-[#ff1475]"
                        : "bg-[#14141a] text-[#9e9ea8] border-[#24242e] hover:border-[#383848]"
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider block mb-2">
              Languages You Speak
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
              {catalogs.languages.map((item) => {
                const isSelected = selectedLanguageIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedLanguageIds(
                        isSelected
                          ? selectedLanguageIds.filter((id) => id !== item.id)
                          : [...selectedLanguageIds, item.id]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isSelected
                        ? "bg-[#ff4088] text-white font-bold border-[#ff4088]"
                        : "bg-[#14141a] text-[#9e9ea8] border-[#24242e] hover:border-[#383848]"
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="primary" className="flex-1" onClick={() => setStep(4)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Photos (6 Slots Dating App Grid) */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider block">
                Profile Photos ({photos.length}/6)
              </label>
              {photos.length === 0 && (
                <span className="text-[11px] text-[#ff1475] font-medium animate-pulse">
                  * 1 photo required
                </span>
              )}
            </div>
            <p className="text-xs text-[#6e6e80] mb-3">
              Add at least 1 photo. Tap any box to select from your phone gallery or camera. Slot 1 is your main discovery photo.
            </p>

            {/* Hidden File Input for Device Gallery / Camera */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* 6 Dating App Photo Slots (3x2 Grid) */}
            <div className="grid grid-cols-3 gap-2.5 mb-3.5">
              {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                const photoUrl = photos[slotIdx];
                const isPrimary = slotIdx === 0;

                if (photoUrl) {
                  return (
                    <div
                      key={slotIdx}
                      className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-[#2e2e3d] bg-[#0e0e12] shadow-sm hover:border-[#ff1475]/60 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt={`Profile photo ${slotIdx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Primary badge for Slot 1 */}
                      {isPrimary && (
                        <span className="absolute top-1.5 left-1.5 bg-gradient-to-r from-[#ff1475] to-[#ff6b8b] text-[9px] text-white font-extrabold px-1.5 py-0.5 rounded shadow pointer-events-none">
                          ★ Main
                        </span>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(slotIdx);
                        }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/75 hover:bg-[#ef4444] text-white text-xs flex items-center justify-center font-bold transition shadow"
                        title="Remove photo"
                      >
                        ✕
                      </button>

                      {/* Tap to replace indicator */}
                      <button
                        type="button"
                        onClick={() => handleTriggerUpload(slotIdx)}
                        className="absolute bottom-1 right-1 p-1 rounded-md bg-black/70 hover:bg-[#ff1475] text-white opacity-80 sm:opacity-0 group-hover:opacity-100 transition text-[10px] flex items-center gap-0.5"
                        title="Replace photo"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                    </div>
                  );
                }

                return (
                  <button
                    key={slotIdx}
                    type="button"
                    onClick={() => handleTriggerUpload(slotIdx)}
                    disabled={isUploading}
                    className="aspect-[3/4] rounded-xl border-2 border-dashed border-[#262634] hover:border-[#ff1475]/70 hover:bg-[#ff1475]/5 bg-[#101016] flex flex-col items-center justify-center p-2 text-center transition group cursor-pointer focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1b1b26] group-hover:bg-[#ff1475] text-[#ff1475] group-hover:text-white flex items-center justify-center mb-1.5 transition font-bold shadow-sm">
                      <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[10px] font-semibold text-[#666678] group-hover:text-white transition">
                      {isPrimary ? "+ Main" : `+ Slot ${slotIdx + 1}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Prominent Gallery Upload Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#161620] hover:bg-[#1e1e2c] border-[#292938] text-white text-xs font-semibold rounded-xl"
              onClick={() => handleTriggerUpload()}
              isLoading={isUploading}
              disabled={isUploading || photos.length >= 6}
            >
              <ImageIcon className="w-4 h-4 text-[#ff1475]" />
              <span>{isUploading ? "Uploading..." : "Upload from Phone Gallery / Camera"}</span>
            </Button>

            {/* Optional Fallback URL input */}
            {photos.length < 6 && (
              <div className="mt-3 pt-3 border-t border-[#1e1e28]">
                <div className="flex gap-2">
                  <Input
                    placeholder="Or paste public photo URL..."
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddPhoto}
                    className="shrink-0 text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              isLoading={isLoading || isUploading}
              disabled={photos.length === 0}
              onClick={handleSubmit}
            >
              Complete Profile ({photos.length}/6)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
