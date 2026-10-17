"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { BottomNav } from "@/components/navigation/BottomNav";
import {
  User,
  Camera,
  ShieldCheck,
  Calendar,
  LogOut,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { profile, entitlements, isLoading: profileLoading } = useProfile();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
        <p className="text-sm text-[#9e9ea8]">Loading settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-6 text-white text-center">
        <h2 className="text-xl font-bold mb-2">Sign in to view Settings</h2>
        <p className="text-xs text-[#9e9ea8] mb-4">Please log in to manage your TMD profile and preferences.</p>
        <Link href="/">
          <Button variant="primary">Go to Login</Button>
        </Link>
      </div>
    );
  }

  const primaryPhoto = profile?.photos?.find((p) => p.isPrimary) || profile?.photos?.[0];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white pb-24 max-w-md mx-auto">
      {/* Header */}
      <header className="px-5 py-4 border-b border-[#1e1e26] flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight text-white">Settings</h1>
        <Badge variant={entitlements?.isPro ? "pro" : entitlements?.isPaid ? "primary" : "neutral"}>
          {entitlements?.planName || "Free Plan"}
        </Badge>
      </header>

      <div className="px-5 py-4 space-y-4">
        {/* Profile Card Summary */}
        <Card className="flex items-center gap-3.5 p-3.5">
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#ff1475] bg-[#1e1e26] shrink-0">
            {primaryPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primaryPhoto.url} alt={profile?.name || "User"} className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 m-auto text-[#7a7a88] mt-3" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold truncate">{profile?.name || "Incomplete Profile"}</h2>
              {user.isVerified && <Badge variant="verified">✓ Verified</Badge>}
            </div>
            <p className="text-xs text-[#9e9ea8]">
              {profile ? `${profile.age} yrs • ${profile.city}` : "Complete profile onboarding"}
            </p>
            <p className="text-[11px] text-[#5e5e6e] mt-0.5 truncate">
              {user.phone || user.email}
            </p>
          </div>
        </Card>

        {/* Account Menu */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-[#7a7a88] uppercase tracking-wider px-1">
            Account Management
          </span>

          <Link href="/settings/edit-profile" className="block">
            <Card className="h-12 flex items-center justify-between px-3.5 hover:bg-[#181822] transition-colors">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-[#ff1475] shrink-0" />
                <span className="text-xs font-medium">Edit Profile & Details</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#5e5e6e] shrink-0" />
            </Card>
          </Link>

          <Link href="/settings/photos" className="block">
            <Card className="h-12 flex items-center justify-between px-3.5 hover:bg-[#181822] transition-colors">
              <div className="flex items-center gap-3">
                <Camera className="w-4 h-4 text-[#ff6b8b] shrink-0" />
                <span className="text-xs font-medium">Manage Photos</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{profile?.photos?.length || 0}/6</Badge>
                <ChevronRight className="w-4 h-4 text-[#5e5e6e] shrink-0" />
              </div>
            </Card>
          </Link>

          <Link href="/settings/verification" className="block">
            <Card className="h-12 flex items-center justify-between px-3.5 hover:bg-[#181822] transition-colors">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-[#10b981] shrink-0" />
                <span className="text-xs font-medium">Face Verification</span>
              </div>
              <div className="flex items-center gap-2">
                {user.isVerified ? (
                  <Badge variant="verified">Verified</Badge>
                ) : (
                  <Badge variant="neutral">Unverified</Badge>
                )}
                <ChevronRight className="w-4 h-4 text-[#5e5e6e] shrink-0" />
              </div>
            </Card>
          </Link>

          {entitlements?.canRequestDobCorrection && (
            <Link href="/settings/verification#dob" className="block">
              <Card className="h-12 flex items-center justify-between px-3.5 hover:bg-[#181822] transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[#ff1475] shrink-0" />
                  <span className="text-xs font-medium">Request DOB Correction</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="pro">PRO Feature</Badge>
                  <ChevronRight className="w-4 h-4 text-[#5e5e6e] shrink-0" />
                </div>
              </Card>
            </Link>
          )}
        </div>

        {/* Safety & Inactivity Policy */}
        <Card className="bg-[#101016] border-[#1e1e26] space-y-2 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9e9ea8]">
            <Info className="w-4 h-4 text-[#ff1475]" />
            <span>Account Visibility Policy</span>
          </div>
          <p className="text-xs text-[#7a7a88] leading-relaxed">
            If you are inactive for more than 7 days, your profile is automatically hidden from Discovery to preserve candidate freshness. Logging in restores your full active discovery visibility.
          </p>
        </Card>

        {/* Logout */}
        <div className="pt-2">
          <Button variant="outline" className="w-full text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444]/10" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Log Out
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
