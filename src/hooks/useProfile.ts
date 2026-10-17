"use client";

import { useState, useEffect, useCallback } from "react";
import { UserEntitlements } from "@/lib/entitlements";

export interface ProfileData {
  id: string;
  name: string;
  dob: string;
  age: number;
  gender: string;
  interestedIn: string;
  city: string;
  bio: string | null;
  profession: string | null;
  education: string | null;
  height: number | null;
  relationshipIntention: string;
  isNameLocked: boolean;
  photos: Array<{
    id: string;
    url: string;
    order: number;
    isPrimary: boolean;
    status: string;
  }>;
  interests: Array<{ interest: { id: string; name: string; slug: string; icon: string | null } }>;
  languages: Array<{ language: { id: string; name: string; code: string } }>;
  promptQuestion?: string | null;
  promptAnswer?: string | null;
  anthemTitle?: string | null;
  anthemArtist?: string | null;
  anthemCoverUrl?: string | null;
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setEntitlements(data.entitlements);
      } else {
        setProfile(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onboard = async (payload: {
    name: string;
    dob: string;
    is18PlusConfirmed: boolean;
    gender: string;
    interestedIn: string;
    city: string;
    bio?: string;
    profession?: string;
    education?: string;
    height?: number;
    relationshipIntention?: string;
    interestIds?: string[];
    languageIds?: string[];
    photoUrls: string[];
  }) => {
    const res = await fetch("/api/profile/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Onboarding failed");
    }
    await fetchProfile();
    return data;
  };

  const updateProfile = async (updates: Record<string, any>) => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Update failed");
    }
    await fetchProfile();
    return data;
  };

  const addPhoto = async (url: string) => {
    const res = await fetch("/api/profile/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to upload photo");
    }
    await fetchProfile();
    return data;
  };

  const deletePhoto = async (id: string) => {
    const res = await fetch(`/api/profile/photos/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to delete photo");
    }
    await fetchProfile();
    return data;
  };

  const reorderPhotos = async (photoIds: string[], primaryPhotoId?: string) => {
    const res = await fetch("/api/profile/photos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoIds, primaryPhotoId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to reorder photos");
    }
    await fetchProfile();
    return data;
  };

  const submitDobCorrection = async (payload: {
    requestedDob: string;
    documentUrl: string;
    notes?: string;
  }) => {
    const res = await fetch("/api/profile/dob-correction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to submit DOB correction request");
    }
    return data;
  };

  const submitFaceVerification = async (selfieUrl: string) => {
    const res = await fetch("/api/profile/face-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selfieUrl }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to submit face verification");
    }
    return data;
  };

  return {
    profile,
    entitlements,
    isLoading,
    error,
    refreshProfile: fetchProfile,
    onboard,
    updateProfile,
    addPhoto,
    deletePhoto,
    reorderPhotos,
    submitDobCorrection,
    submitFaceVerification,
  };
}
