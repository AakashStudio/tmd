"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { calculateAge } from "@/lib/validation";
import { Camera, Image as ImageIcon, Plus, Trash2, Loader2 } from "lucide-react";

interface OnboardingWizardProps {
  onCompleted: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onCompleted }) => {
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
