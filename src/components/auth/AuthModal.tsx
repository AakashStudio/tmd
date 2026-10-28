"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronDown, Sparkles, ShieldCheck } from "lucide-react";

interface AuthModalProps {
  onSuccess: (hasProfile: boolean) => void;
  onCancel?: () => void;
  initialProvider?: "PHONE_OTP" | "EMAIL_OTP";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { sendOtp, verifyOtp } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"REQUEST_OTP" | "VERIFY_OTP">("REQUEST_OTP");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  // Focus phone input on mount
  useEffect(() => {
    if (step === "REQUEST_OTP") {
      phoneInputRef.current?.focus();
    } else {
      otpInputRefs.current[0]?.focus();
    }
  }, [step]);

  // Resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const cleanDigits = phoneNumber.replace(/\D/g, "");
  const isPhoneValid = cleanDigits.length === 10;
  const otpString = otp.join("");
  const isOtpValid = otpString.length === 6;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(raw);
    if (error) setError(null);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isPhoneValid) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await sendOtp("PHONE_OTP", cleanDigits);
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      setStep("VERIFY_OTP");
      setResendTimer(30);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (error) setError(null);

    // Auto-advance to next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits entered
    const fullCode = newOtp.join("");
    if (fullCode.length === 6) {
      executeVerify(fullCode);
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    const targetIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[targetIdx]?.focus();

    if (pasted.length === 6) {
      executeVerify(pasted);
    }
  };

  const executeVerify = async (codeToVerify: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await verifyOtp("PHONE_OTP", cleanDigits, codeToVerify);
      onSuccess(res.hasProfile);
    } catch (err: any) {
      setError(err.message || "Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpValid) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    executeVerify(otpString);
  };

  const autoFillDevOtp = (code: string) => {
    const digits = code.split("").slice(0, 6);
    setOtp(digits);
    executeVerify(code);
  };

  const formatDisplayPhone = (digits: string) => {
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-x-hidden overflow-y-auto">
      <div className="w-full max-w-md bg-[#0d0d12] text-white flex flex-col justify-between h-[100dvh] sm:h-auto sm:min-h-[720px] sm:max-h-[92vh] sm:rounded-3xl sm:border sm:border-white/[0.08] sm:shadow-2xl px-5 sm:px-6 py-6 overflow-x-hidden overflow-y-auto relative box-border animate-in fade-in duration-200">
        {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={step === "VERIFY_OTP" ? () => { setStep("REQUEST_OTP"); setError(null); } : onCancel}
          className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition shadow-sm"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* TMD Tiny Brand Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] font-bold text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFC629]" />
          <span>TMD SECURE</span>
        </div>
      </div>

      {/* Main Form Content Area */}
      <div className="flex-1 flex flex-col justify-center py-6">
        {step === "REQUEST_OTP" ? (
          /* ================= STEP 1: PHONE NUMBER INPUT ================= */
          <div className="space-y-6">
            {/* Catchy, distinctive TMD Heading */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-[34px] font-black text-white tracking-tight leading-tight">
                What&apos;s your<br />number?
              </h1>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                We&apos;ll send a 6-digit code to verify your account &amp; keep TMD safe for real dates.
              </p>
            </div>

            {/* Premium Underlined Phone Input with IN Country Pill */}
            <div className="pt-4">
              <div className="flex items-center gap-3 pb-3 border-b-2 border-zinc-700 focus-within:border-[#FFC629] transition-colors">
                {/* Country Code Pill */}
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-200 select-none shrink-0 shadow-sm">
                  <span>🇮🇳 IN</span>
                  <span className="text-white font-extrabold">+91</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </div>

                {/* Number Input */}
                <input
                  ref={phoneInputRef}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="00000 00000"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-2xl font-black tracking-wider text-white placeholder-zinc-700 focus:outline-none"
                />
              </div>

              {/* Quick Test Helper for Instant Demo Testing */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">Enter 10-digit mobile number</span>
                <button
                  type="button"
                  onClick={() => setPhoneNumber("7566548512")}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2 transition"
                >
                  <Sparkles className="w-3 h-3" /> Fill 7566548512
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium">
                {error}
              </div>
            )}

            {/* TMD Legal Disclaimer */}
            <div className="pt-2 text-xs text-zinc-400 leading-relaxed space-y-2">
              <p>
                By entering your number and tapping &ldquo;Next&rdquo;, you agree to receive verification codes and secure login alerts from TMD. Consent is not required to browse.
              </p>
              <p className="text-[11px] text-zinc-500">
                Opt out at any time in account settings. We never share your phone number with matches or third parties.
              </p>
            </div>
          </div>
        ) : (
          /* ================= STEP 2: 6-DIGIT OTP INPUT ================= */
          <div className="space-y-6">
            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-[34px] font-black text-white tracking-tight leading-tight">
                Enter your<br />code
              </h1>
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                <span>
                  Sent to <strong className="text-white font-bold">+91 {formatDisplayPhone(cleanDigits)}</strong>
                </span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("REQUEST_OTP");
                    setOtp(["", "", "", "", "", ""]);
                    setError(null);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold underline underline-offset-2 transition"
                >
                  Edit number
                </button>
              </div>
            </div>

            {/* 6 Individual Digit Boxes */}
            <div className="pt-2">
              <div className="flex justify-between items-center gap-1.5 sm:gap-2 max-w-sm mx-auto w-full">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[index] || ""}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onPaste={handleOtpPaste}
                    disabled={isLoading}
                    className={`w-11 sm:w-12 h-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-xl border transition-all ${
                      otp[index]
                        ? "border-[#FFC629] bg-amber-400/10 text-white shadow-[0_0_15px_rgba(255,198,41,0.35)]"
                        : "border-zinc-800 bg-zinc-900/90 text-white focus:border-[#FFC629] focus:bg-zinc-900"
                    } outline-none`}
                  />
                ))}
              </div>
            </div>

            {/* Dev OTP Quick One-Tap Banner */}
            {devOtpHint && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    Developer OTP (Demo Mode)
                  </span>
                  <span className="font-mono text-base font-black text-white tracking-widest">
                    {devOtpHint}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => autoFillDevOtp(devOtpHint)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black transition active:scale-95 shadow"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium">
                {error}
              </div>
            )}

            {/* Resend Countdown */}
            <div className="text-center pt-2">
              {resendTimer > 0 ? (
                <p className="text-xs text-zinc-500 font-medium">
                  Resend code in <strong className="text-zinc-300 font-bold">{resendTimer}s</strong>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isLoading}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold underline underline-offset-4 transition"
                >
                  Didn&apos;t get a code? Resend
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Button */}
      <div className="pb-4 pt-2">
        {step === "REQUEST_OTP" ? (
          <button
            type="button"
            onClick={() => handleSendOtp()}
            disabled={!isPhoneValid || isLoading}
            className={`w-full py-4 px-6 rounded-full font-black text-sm tracking-wide transition-all shadow-xl active:scale-[0.98] ${
              isPhoneValid && !isLoading
                ? "bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] text-black font-extrabold shadow-amber-500/35 hover:brightness-105 cursor-pointer"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {isLoading ? "Sending code..." : "Next"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={!isOtpValid || isLoading}
            className={`w-full py-4 px-6 rounded-full font-black text-sm tracking-wide transition-all shadow-xl active:scale-[0.98] ${
              isOtpValid && !isLoading
                ? "bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] text-black font-extrabold shadow-amber-500/35 hover:brightness-105 cursor-pointer"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {isLoading ? "Verifying..." : "Verify & Continue"}
          </button>
        )}
      </div>
    </div>
  </div>
);
};
