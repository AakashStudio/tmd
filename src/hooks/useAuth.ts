"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthenticatedUser } from "@/lib/session";

export function useAuth() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasProfile, setHasProfile] = useState<boolean>(false);

  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setHasProfile(data.hasProfile);
      } else {
        setUser(null);
        setHasProfile(false);
      }
    } catch {
      setUser(null);
      setHasProfile(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const sendOtp = async (provider: "PHONE_OTP" | "EMAIL_OTP", identifier: string) => {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, identifier }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to send OTP");
    }
    return data;
  };

  const verifyOtp = async (
    provider: "PHONE_OTP" | "EMAIL_OTP",
    identifier: string,
    otp: string
  ) => {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, identifier, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to verify OTP");
    }
    await fetchSession();
    return data;
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setHasProfile(false);
    }
  };

  return {
    user,
    isLoading,
    hasProfile,
    sendOtp,
    verifyOtp,
    logout,
    refreshUser: fetchSession,
  };
}
