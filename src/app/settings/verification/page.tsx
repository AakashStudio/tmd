"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, ShieldCheck, Calendar, CheckCircle2, AlertCircle, Lock } from "lucide-react";

export default function VerificationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, entitlements, submitFaceVerification, submitDobCorrection } = useProfile();

  // Face Verification State
  const [selfieUrl, setSelfieUrl] = useState("");
  const [isSubmittingFace, setIsSubmittingFace] = useState(false);
  const [faceSuccess, setFaceSuccess] = useState<string | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);

  // DOB Correction State
  const [requestedDob, setRequestedDob] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [dobNotes, setDobNotes] = useState("");
  const [isSubmittingDob, setIsSubmittingDob] = useState(false);
  const [dobSuccess, setDobSuccess] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);

  const handleFaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfieUrl.trim()) return;
    try {
      setIsSubmittingFace(true);
      setFaceError(null);
      const res = await submitFaceVerification(selfieUrl.trim());
      setFaceSuccess(res.message);
      setSelfieUrl("");
    } catch (err: any) {
      setFaceError(err.message || "Failed to submit face verification");
    } finally {
      setIsSubmittingFace(false);
    }
  };

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
    <div className="min-h-screen bg-[#0a0a0c] text-white max-w-md mx-auto px-5 py-4 pb-20">
      <div className="flex items-center gap-3 mb-5 border-b border-[#1e1e26] pb-3">
        <button onClick={() => router.back()} className="p-1 hover:text-[#ff1475]">
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
            Verify your identity to get the official TMD Verified Badge on your discovery profile and build trust with your matches.
          </p>

          {faceSuccess && (
            <div className="p-3 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 text-xs text-[#10b981] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{faceSuccess}</span>
            </div>
          )}

          {faceError && (
            <div className="p-3 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 text-xs text-[#ef4444] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{faceError}</span>
            </div>
          )}

          {!user?.isVerified && !faceSuccess && (
            <form onSubmit={handleFaceSubmit} className="space-y-3 pt-1">
              <Input
                label="Verification Selfie / Image URL"
                placeholder="https://example.com/selfie.jpg"
                value={selfieUrl}
                onChange={(e) => setSelfieUrl(e.target.value)}
                disabled={isSubmittingFace}
              />
              <Button type="submit" variant="primary" className="w-full text-xs" isLoading={isSubmittingFace}>
                Submit for Verification
              </Button>
            </form>
          )}
        </Card>

        {/* SECTION 2: Request DOB Correction */}
        <Card id="dob" className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#ff1475]" />
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
              <Lock className="w-4 h-4 text-[#ff1475] shrink-0 mt-0.5" />
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
                      className="w-full px-3 py-2 rounded-lg bg-[#14141a] border border-[#24242e] text-white text-xs focus:border-[#ff1475] focus:outline-none"
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
                      className="w-full px-3 py-2 rounded-lg bg-[#14141a] border border-[#24242e] text-white text-xs focus:border-[#ff1475] focus:outline-none"
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
  );
}
