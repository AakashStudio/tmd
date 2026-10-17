"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

interface AuthModalProps {
  onSuccess: (hasProfile: boolean) => void;
  onCancel?: () => void;
  initialProvider?: "PHONE_OTP" | "EMAIL_OTP";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onSuccess,
  onCancel,
  initialProvider = "PHONE_OTP",
}) => {
  const { sendOtp, verifyOtp } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"REQUEST_OTP" | "VERIFY_OTP">("REQUEST_OTP");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your mobile number");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await sendOtp("PHONE_OTP", identifier.trim());
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      setStep("VERIFY_OTP");
      setResendTimer(30);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await verifyOtp("PHONE_OTP", identifier.trim(), otp.trim());
      onSuccess(res.hasProfile);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-5 rounded-lg bg-[#14141a] border border-[#24242e] shadow-2xl">
      <div className="text-center mb-5 space-y-1">
        <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-gradient-to-tr from-[#ff1475] to-[#ff6b8b] flex items-center justify-center font-black text-xl text-white shadow-lg shadow-[#ff1475]/30">
          TMD
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">
          {step === "REQUEST_OTP" ? "Welcome to The Match Date" : "Verify Your Account"}
        </h2>
        <p className="text-xs text-[#9e9ea8]">
          {step === "REQUEST_OTP"
            ? "Enter your mobile number to sign up or log in"
            : `Enter the 6-digit code sent to ${identifier}`}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-xs text-[#ef4444] font-medium text-left">
          {error}
        </div>
      )}

      {step === "REQUEST_OTP" ? (
        <form onSubmit={handleSendOtp} className="space-y-3.5">
          <Input
            label="Mobile Number"
            placeholder="+91 9876543210"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={isLoading}
            autoFocus
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Send Verification Code
          </Button>

          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} className="w-full text-xs">
              Cancel
            </Button>
          )}
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {devOtpHint && (
            <div className="p-2.5 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 text-left">
              <span className="text-[11px] font-semibold text-[#10b981] block">Development OTP:</span>
              <span className="font-mono text-sm tracking-widest font-bold text-white">{devOtpHint}</span>
            </div>
          )}

          <Input
            label="6-Digit OTP"
            placeholder="• • • • • •"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            disabled={isLoading}
            className="text-center font-mono text-lg tracking-widest"
            autoFocus
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Verify & Continue
          </Button>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              disabled={resendTimer > 0 || isLoading}
              onClick={handleSendOtp}
              className="text-[#9e9ea8] hover:text-white disabled:text-[#5e5e6e]"
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("REQUEST_OTP");
                setOtp("");
                setError(null);
              }}
              className="text-[#ff6b8b] hover:underline"
            >
              Change Number
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
