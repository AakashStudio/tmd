"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  ChevronRight,
  CreditCard,
  Building2,
  Wallet,
  QrCode,
  Sparkles,
  X,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface PaymentInformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    code: string;
    name: string;
    priceInRupees: number;
    durationDays: number;
    isPro: boolean;
  };
  userProfile?: {
    name?: string;
    state?: string;
    phone?: string;
  };
  onPaymentSuccess: (planCode: string) => void;
}

type PaymentMethodType =
  | "gpay"
  | "phonepe"
  | "paytm"
  | "cred"
  | "other_upi"
  | "cards"
  | "upi_manual"
  | "upi_qr"
  | "net_banking"
  | "wallets";

const VALID_COUPONS: Record<string, { discountPercent?: number; discountFlat?: number; label: string }> = {
  TMD50: { discountPercent: 50, label: "50% Flat Discount Applied!" },
  LOVE20: { discountPercent: 20, label: "20% Love Discount Applied!" },
  FIRST50: { discountFlat: 50, label: "₹50 Welcome Bonus Applied!" },
  STARTER: { discountPercent: 30, label: "30% Starter Off Applied!" },
};

export const PaymentInformationModal: React.FC<PaymentInformationModalProps> = ({
  isOpen,
  onClose,
  plan,
  userProfile,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("gpay");
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; label: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [launchingAppMessage, setLaunchingAppMessage] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [upiDetails, setUpiDetails] = useState<any | null>(null);

  // QR Modal for Desktop or explicit QR selection
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);

  // Success Celebration State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate pricing & GST
  const baseOriginal = plan.priceInRupees || 149;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPayable = Math.max(1, baseOriginal - discount);

  // 18% GST breakup like Astrotalk: Total = Base + 18% GST
  const rechargeAmount = Math.round(finalPayable / 1.18);
  const gstAmount = finalPayable - rechargeAmount;

  const billingState = userProfile?.state || "Maharashtra";

  // Check if device is mobile
  const isMobile = () => {
    if (typeof window === "undefined") return false;
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  };

  // Handle Coupon Apply
  const handleApplyCoupon = () => {
    setCouponError(null);
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    const found = VALID_COUPONS[clean];
    if (found) {
      let discountAmt = 0;
      if (found.discountPercent) {
        discountAmt = Math.round((baseOriginal * found.discountPercent) / 100);
      } else if (found.discountFlat) {
        discountAmt = found.discountFlat;
      }
      setAppliedCoupon({
        code: clean,
        discountAmount: Math.min(discountAmt, baseOriginal - 1),
        label: found.label,
      });
      setCouponError(null);
    } else {
      setCouponError("Invalid coupon code. Try TMD50 or LOVE20");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };

  // Auto-verify helper
  const triggerAutoVerification = async (orderId: string) => {
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentId: `pay_upi_${Date.now()}`,
          signature: "upi_direct_verified",
          planCode: plan.code,
        }),
      });

      if (res.ok) {
        if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
        setShowQrModal(false);
        setIsProcessing(false);
        setLaunchingAppMessage(null);
        setIsSuccessModalOpen(true);
        onPaymentSuccess(plan.code);
        return true;
      }
    } catch (err) {
      // Continue polling silently
    }
    return false;
  };

  // Automated background polling for payment completion
  useEffect(() => {
    if (!activeOrderId) return;

    let isSubscribed = true;
    pollingTimerRef.current = setInterval(async () => {
      if (!isSubscribed) return;
      await triggerAutoVerification(activeOrderId);
    }, 2500);

    // Also check immediately when user switches tab or app back to TMD
    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === "visible" && activeOrderId && isSubscribed) {
        await triggerAutoVerification(activeOrderId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      isSubscribed = false;
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [activeOrderId]);

  // Main payment execution: directly launches app
  const executePayment = async (methodOverride?: PaymentMethodType) => {
    const methodToUse = methodOverride || selectedMethod;
    setSelectedMethod(methodToUse);

    try {
      setIsProcessing(true);
      const appName =
        methodToUse === "gpay"
          ? "Google Pay"
          : methodToUse === "phonepe"
          ? "PhonePe"
          : methodToUse === "paytm"
          ? "Paytm"
          : methodToUse === "cred"
          ? "CRED"
          : "UPI App";

      setLaunchingAppMessage(`Opening ${appName}...`);

      // 1. Create order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: plan.code,
          customAmountInRupees: finalPayable,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to initialize payment");
      }

      const orderData = await orderRes.json();
      setActiveOrderId(orderData.orderId);
      setUpiDetails(orderData.upiDetails);

      const upi = orderData.upiDetails;

      // If user is on Desktop / Laptop, mobile apps cannot be opened, show QR Code directly
      if (!isMobile() || methodToUse === "upi_qr") {
        setShowQrModal(true);
        setIsProcessing(false);
        setLaunchingAppMessage(null);
        return;
      }

      // 2. Select intent URL
      let intentUrl = upi?.upiIntentUrl;
      if (methodToUse === "gpay" && upi?.gpayUrl) {
        intentUrl = upi.gpayUrl;
      } else if (methodToUse === "phonepe" && upi?.phonepeUrl) {
        intentUrl = upi.phonepeUrl;
      } else if (methodToUse === "paytm" && upi?.paytmUrl) {
        intentUrl = upi.paytmUrl;
      } else if (methodToUse === "cred" && upi?.credUrl) {
        intentUrl = upi.credUrl;
      } else if (methodToUse === "other_upi") {
        intentUrl = upi?.upiIntentUrl;
      }

      if (intentUrl) {
        // Direct launch into the user's UPI app! No extra modal!
        const anchor = document.createElement("a");
        anchor.href = intentUrl;
        anchor.target = "_self";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        // Keep a non-intrusive status pill active
        setTimeout(() => {
          setIsProcessing(false);
          setLaunchingAppMessage("Waiting for UPI payment confirmation...");
        }, 1500);
      } else {
        setShowQrModal(true);
        setIsProcessing(false);
        setLaunchingAppMessage(null);
      }
    } catch (err: any) {
      alert(err.message || "Could not proceed to payment");
      setIsProcessing(false);
      setLaunchingAppMessage(null);
    }
  };

  // Copy VPA helper
  const handleCopyVpa = (vpa: string) => {
    navigator.clipboard?.writeText(vpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 select-none animate-in fade-in">
      {/* Astrotalk Screen Container */}
      <div className="w-full sm:max-w-md h-[92vh] sm:h-auto sm:max-h-[92vh] bg-[#F7F8FA] text-zinc-900 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl relative border border-zinc-200">
        {/* 1. Header with Back button */}
        <div className="px-5 py-4 bg-white flex items-center justify-between border-b border-zinc-200/80 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-800" />
            </button>
            <h2 className="text-base font-extrabold text-zinc-900 tracking-tight">Payment Information</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-600 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status banner when returning from UPI app */}
        {launchingAppMessage && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-b border-amber-500/30 text-amber-900 text-xs font-bold flex items-center justify-between animate-pulse shrink-0">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
              <span>{launchingAppMessage}</span>
            </div>
            {activeOrderId && (
              <button
                type="button"
                onClick={() => triggerAutoVerification(activeOrderId)}
                className="text-[11px] underline font-black text-amber-900 hover:text-black cursor-pointer"
              >
                I have paid
              </button>
            )}
          </div>
        )}

        {/* 2. Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-thin">
          {/* Card 1: Order Summary */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-sm space-y-2.5">
            <div className="flex justify-between items-center text-xs text-zinc-700">
              <span className="font-medium">Recharge Amount</span>
              <span className="font-bold text-zinc-900 font-mono">₹ {rechargeAmount}</span>
            </div>

            <div className="flex justify-between items-center text-xs text-zinc-700">
              <span className="font-medium">GST(18%)</span>
              <span className="font-bold text-zinc-900 font-mono">₹ {gstAmount}</span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between items-center text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>- ₹ {appliedCoupon.discountAmount}</span>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-100 flex justify-between items-center text-sm font-extrabold text-zinc-900">
              <span>Total Recharge Amount</span>
              <span className="font-mono text-base font-black text-zinc-900">₹ {finalPayable}</span>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-baseline justify-between text-[11px] text-zinc-500">
              <span>
                Billing State:{" "}
                <span className="font-semibold text-zinc-700 underline decoration-dotted underline-offset-2">
                  {billingState}
                </span>
              </span>
            </div>

            <p className="text-[10px] text-zinc-400 leading-tight">
              By continuing, I warrant that this location information is accurate.
            </p>

            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Safe and Secure</span>
            </div>
          </div>

          {/* Card 2: Apply Coupon */}
          <div className="bg-white rounded-2xl p-3.5 border border-emerald-500/30 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Apply Coupon</span>
              </span>
              {appliedCoupon && (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-[11px] font-bold text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter Coupon Code (e.g. TMD50)"
                disabled={!!appliedCoupon}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 uppercase"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={!!appliedCoupon || !couponCode.trim()}
                className="px-4 py-2.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 disabled:opacity-50 text-zinc-800 text-xs font-extrabold uppercase transition"
              >
                APPLY
              </button>
            </div>

            {appliedCoupon && (
              <p className="text-[11px] font-semibold text-emerald-600">
                ✓ {appliedCoupon.label}
              </p>
            )}
            {couponError && (
              <p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{couponError}</span>
              </p>
            )}
          </div>

          {/* Section 3: Pay via UPI (Primary Grid - 1-Click Launch) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider px-1">
              Pay via UPI
            </h3>

            <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-sm space-y-4">
              {/* 4 App Cards Grid */}
              <div className="grid grid-cols-4 gap-2.5">
                {/* 1. GPay */}
                <button
                  type="button"
                  onClick={() => executePayment("gpay")}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border transition active:scale-95 cursor-pointer ${
                    selectedMethod === "gpay"
                      ? "border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-500"
                      : "border-zinc-200 hover:border-zinc-300 bg-white"
                  }`}
                >
                  {selectedMethod === "gpay" && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  {/* Google GPay SVG */}
                  <div className="w-9 h-9 flex items-center justify-center mb-1">
                    <svg viewBox="0 0 48 48" className="w-8 h-8">
                      <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  </div>
                  <span className="text-[11px] font-extrabold text-zinc-900">GPay</span>
                </button>

                {/* 2. PhonePe */}
                <button
                  type="button"
                  onClick={() => executePayment("phonepe")}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border transition active:scale-95 cursor-pointer ${
                    selectedMethod === "phonepe"
                      ? "border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-500"
                      : "border-zinc-200 hover:border-zinc-300 bg-white"
                  }`}
                >
                  {selectedMethod === "phonepe" && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  {/* PhonePe Purple Icon */}
                  <div className="w-9 h-9 rounded-xl bg-[#5f259f] flex items-center justify-center text-white font-black text-lg mb-1 shadow-sm">
                    पे
                  </div>
                  <span className="text-[11px] font-extrabold text-zinc-900">PhonePe</span>
                </button>

                {/* 3. Paytm */}
                <button
                  type="button"
                  onClick={() => executePayment("paytm")}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border transition active:scale-95 cursor-pointer ${
                    selectedMethod === "paytm"
                      ? "border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-500"
                      : "border-zinc-200 hover:border-zinc-300 bg-white"
                  }`}
                >
                  {selectedMethod === "paytm" && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  {/* Paytm Icon */}
                  <div className="w-9 h-9 flex items-center justify-center mb-1">
                    <span className="text-[#002e6e] font-black text-sm italic tracking-tighter">
                      Pay<span className="text-[#00baf2]">tm</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold text-zinc-900">Paytm</span>
                </button>

                {/* 4. CRED UPI */}
                <button
                  type="button"
                  onClick={() => executePayment("cred")}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-2xl border transition active:scale-95 cursor-pointer overflow-hidden ${
                    selectedMethod === "cred"
                      ? "border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-500"
                      : "border-zinc-200 hover:border-zinc-300 bg-white"
                  }`}
                >
                  {selectedMethod === "cred" && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm z-10">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  {/* CRED Tag */}
                  <span className="text-[8px] font-black text-emerald-700 bg-emerald-100/80 px-1 py-0.5 rounded leading-none mb-1">
                    UPTO ₹200 CASHBACK
                  </span>
                  {/* CRED Shield Icon */}
                  <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center text-[10px] font-black mb-0.5">
                    C
                  </div>
                  <span className="text-[10px] font-extrabold text-zinc-900">CRED UPI</span>
                </button>
              </div>

              {/* Pay with other UPI apps option */}
              <button
                type="button"
                onClick={() => executePayment("other_upi")}
                className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                  selectedMethod === "other_upi"
                    ? "bg-blue-50/50 border-blue-400 text-blue-900 font-bold"
                    : "bg-zinc-50/60 border-zinc-200/80 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <div className="w-5 h-5 rounded-md bg-zinc-200 text-zinc-800 flex items-center justify-center text-[11px] font-bold">
                    Δ
                  </div>
                  <span>Pay with other UPI apps (BHIM, Navi, Super.money)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>

          {/* Section 4: Cards */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider px-1">
              Cards
            </h3>
            <div
              onClick={() => setSelectedMethod("cards")}
              className={`bg-white rounded-2xl p-4 border transition cursor-pointer flex items-center justify-between shadow-sm ${
                selectedMethod === "cards" ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/20" : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-900">Credit/Debit Card</span>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedMethod === "cards" ? "border-blue-600 bg-blue-600" : "border-zinc-300 bg-white"
                }`}
              >
                {selectedMethod === "cards" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          </div>

          {/* Section 5: Others */}
          <div className="space-y-2 pb-6">
            <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider px-1">
              Others
            </h3>

            <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm divide-y divide-zinc-100">
              {/* Option: UPI QR Code */}
              <div
                onClick={() => executePayment("upi_qr")}
                className={`p-3.5 flex items-center justify-between transition cursor-pointer first:rounded-t-2xl ${
                  selectedMethod === "upi_qr" ? "bg-blue-50/30" : "hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block">UPI QR Code</span>
                    <span className="text-[10px] text-zinc-400">Scan from any phone or app</span>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedMethod === "upi_qr" ? "border-blue-600 bg-blue-600" : "border-zinc-300 bg-white"
                  }`}
                >
                  {selectedMethod === "upi_qr" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Option: Net Banking */}
              <div
                onClick={() => setSelectedMethod("net_banking")}
                className={`p-3.5 flex items-center justify-between transition cursor-pointer ${
                  selectedMethod === "net_banking" ? "bg-blue-50/30" : "hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-zinc-900">Net Banking</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedMethod === "net_banking" ? "border-blue-600 bg-blue-600" : "border-zinc-300 bg-white"
                  }`}
                >
                  {selectedMethod === "net_banking" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Option: Other Wallets */}
              <div
                onClick={() => setSelectedMethod("wallets")}
                className={`p-3.5 flex items-center justify-between transition cursor-pointer last:rounded-b-2xl ${
                  selectedMethod === "wallets" ? "bg-blue-50/30" : "hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block">Other Wallets</span>
                    <span className="text-[10px] text-zinc-400">Ola Money, Freecharge, Payzapp & more</span>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedMethod === "wallets" ? "border-blue-600 bg-blue-600" : "border-zinc-300 bg-white"
                  }`}
                >
                  {selectedMethod === "wallets" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Sticky Yellow Bottom "Proceed to pay" Button (Exact Astrotalk Style) */}
        <div className="p-4 bg-white border-t border-zinc-200/90 shrink-0 shadow-lg">
          <button
            type="button"
            onClick={() => executePayment()}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-[#F5D020] hover:bg-[#F2C70E] active:scale-[0.99] text-black font-extrabold text-sm tracking-tight transition shadow-md shadow-yellow-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Opening UPI App...</span>
              </>
            ) : (
              <span>Proceed to pay (₹{finalPayable})</span>
            )}
          </button>
        </div>
      </div>

      {/* ================= MODAL: SCAN & PAY QR (Used on Desktop or explicit QR) ================= */}
      {showQrModal && upiDetails && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-zinc-900 shadow-2xl relative text-center">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-zinc-900">Scan & Pay via any UPI App</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Open GPay, PhonePe, Paytm or CRED on your phone and scan:
            </p>

            {/* Dynamic QR Display */}
            <div className="my-5 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  upiDetails.upiIntentUrl
                )}`}
                alt="UPI QR Code"
                className="w-48 h-48 rounded-lg shadow-sm"
              />
              <span className="text-base font-black text-zinc-900 mt-3 font-mono">
                Amount: ₹{finalPayable}
              </span>
            </div>

            {/* UPI ID copy */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-100 text-xs mb-4">
              <span className="font-mono text-zinc-600 truncate text-[11px]">{upiDetails.payeeVpa}</span>
              <button
                type="button"
                onClick={() => handleCopyVpa(upiDetails.payeeVpa)}
                className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-800 font-bold text-[11px] flex items-center gap-1 active:scale-95"
              >
                {copiedVpa ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedVpa ? "Copied" : "Copy VPA"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (activeOrderId) triggerAutoVerification(activeOrderId);
              }}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition active:scale-95 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              I Have Completed Payment
            </button>
          </div>
        </div>
      )}

      {/* ================= CELEBRATION SUCCESS MODAL ================= */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/90 p-4 animate-in zoom-in-95">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#181820] to-[#0c0c10] border border-amber-500/40 rounded-3xl p-6 text-white text-center shadow-2xl relative overflow-hidden">
            {/* Glow backdrop */}
            <div className="absolute -top-16 inset-x-0 h-32 bg-amber-500/20 blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#FFC629] to-[#F59E0B] text-black flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30 animate-bounce">
              <Check className="w-9 h-9 stroke-[3]" />
            </div>

            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-400/10 text-amber-300 border border-amber-400/30 uppercase tracking-widest inline-block mb-2">
              Payment Successful
            </span>

            <h3 className="text-xl font-black text-white tracking-tight">
              {plan.name} Activated! 🎉
            </h3>

            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Congratulations! Your payment has been confirmed. All exclusive VIP perks, unlimited likes, and voice prompts are now live on your account.
            </p>

            <div className="my-5 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-left space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Plan:</span>
                <span className="font-bold text-white">{plan.name}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Validity:</span>
                <span className="font-bold text-amber-400">{plan.durationDays} Days Full Access</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-400">₹{finalPayable}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSuccessModalOpen(false);
                onClose();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#FFC629] to-[#D4AF37] text-black font-black text-xs uppercase tracking-wider transition hover:brightness-110 active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Start Enjoying VIP Dating ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
