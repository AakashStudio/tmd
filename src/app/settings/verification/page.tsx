"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, ShieldCheck, Calendar, CheckCircle2, AlertCircle, Lock, Video } from "lucide-react";
import { FaceRecorder } from "@/components/verification/FaceRecorder";

export default function VerificationPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { profile, entitlements, submitDobCorrection, refreshProfile } = useProfile();

  // Face Verification State
  const [showRecorder, setShowRecorder] = useState<boolean>(false);
  const [faceSuccess, setFaceSuccess] = useState<string | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);

  // DOB Correction State
  const [requestedDob, setRequestedDob] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [dobNotes, setDobNotes] = useState("");
  const [isSubmittingDob, setIsSubmittingDob] = useState(false);
  const [dobSuccess, setDobSuccess] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);

  const handleDobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedDob || !docUrl.trim()) return;
    try {
      setIsSubmittingDob(true);
      setDobError(null);
      const res = await submitDobCorrection({
        requestedDob: new Date(requestedDob).toISOString(),
        documentUrl: docUrl.trim(),
        notes: dobNotes.trim() || undefined,
      });
      setDobSuccess(res.message);
    } catch (err: any) {
      setDobError(err.message || "Failed to submit DOB correction");
    } finally {
      setIsSubmittingDob(false);
    }
  };

  const isPro = entitlements?.canRequestDobCorrection ?? false;

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col items-center justify-start sm:py-6 sm:px-4 w-full overflow-x-hidden">
      <div className="min-h-screen sm:min-h-[780px] bg-[#0a0a0c] text-white max-w-md w-full px-5 py-4 pb-20 sm:rounded-3xl sm:border sm:border-white/[0.08] sm:shadow-2xl relative overflow-x-hidden box-border">
        <div className="flex items-center gap-3 mb-5 border-b border-[#1e1e26] pb-3">
        <button onClick={() => router.back()} className="p-1 hover:text-amber-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-white tracking-tight">Trust & Verification</h1>
      </div>

      <div className="space-y-4">
        {/* SECTION 1: Face Verification */}
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#10b981]" />
              <h2 className="text-sm font-bold">Face Verification</h2>
            </div>
            {user?.isVerified ? (
              <Badge variant="verified">✓ Verified</Badge>
            ) : (
              <Badge variant="neutral">Pending Verification</Badge>
            )}
          </div>

          <p className="text-xs text-[#9e9ea8] leading-relaxed">
            Record a 3-second live face scan to verify your identity and get the official TMD Verified Badge on your profile.
          </p>

          {faceSuccess && (
            <div className="p-3 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 text-xs text-[#10b981] flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{faceSuccess}</span>
            </div>
          )}

          {faceError && (
            <div className="p-3 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 text-xs text-[#ef4444] flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{faceError}</span>
            </div>
          )}

          {/* Already verified card with optional re-record option */}
          {user?.isVerified && !showRecorder && (
            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Identity Verified</h3>
                  <p className="text-[11px] text-zinc-400">
                    Your official TMD Verified Badge is active and visible on discovery and chat.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full text-xs flex items-center justify-center gap-2"
                onClick={() => setShowRecorder(true)}
              >
                <Video className="w-3.5 h-3.5 text-[#FFC629]" />
                <span>Re-record 3-Sec Face Scan</span>
              </Button>
            </div>
          )}

          {/* Active 3-Second Face Recording Component */}
          {(!user?.isVerified || showRecorder) && (
            <div className="pt-1">
              <FaceRecorder
                onSuccess={(msg) => {
                  setFaceSuccess(msg);
                  setShowRecorder(false);
                  refreshUser();
                  refreshProfile();
                }}
                onError={(err) => setFaceError(err)}
              />
            </div>
          )}
        </Card>

        {/* SECTION 2: Request DOB Correction */}
        <Card id="dob" className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#FFC629]" />
              <h2 className="text-sm font-bold">Request DOB Correction</h2>
            </div>
            <Badge variant={isPro ? "pro" : "neutral"}>
              {isPro ? "PRO Feature" : "PRO Plan Required"}
            </Badge>
          </div>

          <p className="text-xs text-[#9e9ea8] leading-relaxed">
            Current DOB:{" "}
            <span className="font-semibold text-white">
              {profile?.dob ? new Date(profile.dob).toLocaleDateString() : "—"} ({profile?.age} yrs)
            </span>
            . To correct an erroneous DOB, submit a government ID for staff review.
          </p>

          {!isPro ? (
            <div className="p-3.5 rounded-lg bg-[#1e1e26] border border-[#2a2a38] flex items-start gap-3">
              <Lock className="w-4 h-4 text-[#FFC629] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-white block">Exclusive to ₹499 PRO Subscribers</span>
                <span className="text-[11px] text-[#9e9ea8] block mt-0.5">
                  Upgrade to TMD PRO to unlock DOB Correction requests and Name changes.
                </span>
              </div>
            </div>
          ) : (
            <>
              {dobSuccess && (
                <div className="p-3 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 text-xs text-[#10b981] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{dobSuccess}</span>
                </div>
              )}

              {dobError && (
                <div className="p-3 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 text-xs text-[#ef4444] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{dobError}</span>
                </div>
              )}

              {!dobSuccess && (
                <form onSubmit={handleDobSubmit} className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider block mb-1">
                      Correct Date of Birth
                    </label>
                    <input
                      type="date"
                      value={requestedDob}
                      onChange={(e) => setRequestedDob(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-[#14141a] border border-[#24242e] text-white text-xs focus:border-[#FFC629] focus:outline-none"
                    />
                  </div>

                  <Input
                    label="Government ID / Document Proof URL"
                    placeholder="https://example.com/id_proof.jpg"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    required
                  />

                  <div>
                    <label className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider block mb-1">
                      Reason / Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={dobNotes}
                      onChange={(e) => setDobNotes(e.target.value)}
                      placeholder="Why does this need to be updated?"
                      className="w-full px-3 py-2 rounded-lg bg-[#14141a] border border-[#24242e] text-white text-xs focus:border-[#FFC629] focus:outline-none"
                    />
                  </div>

                  <Button type="submit" variant="primary" className="w-full text-xs" isLoading={isSubmittingDob}>
                    Submit DOB Correction Request
                  </Button>
                </form>
              )}
            </>
          )}
        </Card>
      </div>
      </div>
    </div>
  );
}
