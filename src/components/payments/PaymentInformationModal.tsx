"use client";

import React, { useState } from "react";
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
  Loader2,
  Clock,
  CheckCircle2,
  MessageCircle,
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
  const [modalView, setModalView] = useState<"SUMMARY" | "UPI_PAY" | "SUBMITTED">("SUMMARY");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("gpay");
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; label: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [upiDetails, setUpiDetails] = useState<any>(null);

  // UTR submission state
  const [utrInput, setUtrInput] = useState<string>("");
  const [isSubmittingUtr, setIsSubmittingUtr] = useState<boolean>(false);
  const [utrError, setUtrError] = useState<string | null>(null);
  const [submittedUtr, setSubmittedUtr] = useState<string | null>(null);
  const [isCopiedVpa, setIsCopiedVpa] = useState<boolean>(false);

  // Pricing calculations
  const baseOriginal = plan.priceInRupees || 149;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPayable = Math.max(1, baseOriginal - discount);

  // 18% GST breakup like Astrotalk: Total = Base + 18% GST
  const rechargeAmount = Math.round(finalPayable / 1.18);
  const gstAmount = finalPayable - rechargeAmount;
  const billingState = userProfile?.state || "Maharashtra";

  // Coupon handling
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

  // Create order & enter Native UPI flow
  const handleProceedToUpi = async (methodOverride?: PaymentMethodType) => {
    const methodToUse = methodOverride || selectedMethod;
    setSelectedMethod(methodToUse);

    try {
      setIsProcessing(true);

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
        throw new Error(err.error || "Failed to initialize payment order");
      }

      const orderData = await orderRes.json();
      setOrderId(orderData.orderId);
      setUpiDetails(orderData.upiDetails);
      setModalView("UPI_PAY");

      // Auto-trigger UPI intent on mobile devices if an app was clicked
      if (typeof window !== "undefined" && orderData.upiDetails) {
        let launchUrl = orderData.upiDetails.upiIntentUrl;
        if (methodToUse === "gpay" && orderData.upiDetails.gpayUrl) launchUrl = orderData.upiDetails.gpayUrl;
        if (methodToUse === "phonepe" && orderData.upiDetails.phonepeUrl) launchUrl = orderData.upiDetails.phonepeUrl;
        if (methodToUse === "paytm" && orderData.upiDetails.paytmUrl) launchUrl = orderData.upiDetails.paytmUrl;

        // Only redirect directly on mobile / touch devices
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          window.location.href = launchUrl;
        }
      }
    } catch (err: any) {
      alert(err.message || "Could not proceed to payment");
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit UTR for Admin Verification
  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setUtrError(null);

    const cleanUtr = utrInput.trim();
    if (!cleanUtr) {
      setUtrError("Please enter your 12-digit UPI Reference / UTR Number.");
      return;
    }

    if (cleanUtr.length < 8 || cleanUtr.length > 20) {
      setUtrError("UPI Reference / UTR Number is usually 12 digits. Please recheck.");
      return;
    }

    if (!orderId) {
      setUtrError("Order reference missing. Please refresh and try again.");
      return;
    }

    try {
      setIsSubmittingUtr(true);
      const res = await fetch("/api/payments/submit-utr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          utr: cleanUtr,
          planCode: plan.code,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit UTR for verification.");
      }

      setSubmittedUtr(cleanUtr);
      setModalView("SUBMITTED");
    } catch (err: any) {
      setUtrError(err.message || "Failed to submit UTR. Please try again.");
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const copyVpaToClipboard = () => {
    const vpa = upiDetails?.payeeVpa || "8817958002@ybl";
    navigator.clipboard.writeText(vpa);
    setIsCopiedVpa(true);
    setTimeout(() => setIsCopiedVpa(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 select-none animate-in fade-in">
      <div className="w-full sm:max-w-md h-[92vh] sm:h-auto sm:max-h-[92vh] bg-[#F7F8FA] text-zinc-900 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl relative border border-zinc-200">
        
        {/* ================= VIEW 1: ORDER SUMMARY & PAYMENT METHOD SELECTION ================= */}
        {modalView === "SUMMARY" && (
          <>
            {/* Header */}
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

            {/* Scrollable Body */}
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
                  <span>100% Safe and Secure Direct UPI</span>
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

              {/* Section 3: Pay via UPI Apps */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider px-1">
                  Pay via UPI
                </h3>

                <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-sm space-y-4">
                  {/* 4 App Cards Grid */}
                  <div className="grid grid-cols-4 gap-2.5">
                    {/* GPay */}
                    <button
                      type="button"
                      onClick={() => handleProceedToUpi("gpay")}
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

                    {/* PhonePe */}
                    <button
                      type="button"
                      onClick={() => handleProceedToUpi("phonepe")}
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
                      <div className="w-9 h-9 rounded-xl bg-[#5f259f] flex items-center justify-center text-white font-black text-lg mb-1 shadow-sm">
                        पे
                      </div>
                      <span className="text-[11px] font-extrabold text-zinc-900">PhonePe</span>
                    </button>

                    {/* Paytm */}
                    <button
                      type="button"
                      onClick={() => handleProceedToUpi("paytm")}
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
                      <div className="w-9 h-9 flex items-center justify-center mb-1">
                        <span className="text-[#002e6e] font-black text-sm italic tracking-tighter">
                          Pay<span className="text-[#00baf2]">tm</span>
                        </span>
                      </div>
                      <span className="text-[11px] font-extrabold text-zinc-900">Paytm</span>
                    </button>

                    {/* CRED */}
                    <button
                      type="button"
                      onClick={() => handleProceedToUpi("cred")}
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
                      <span className="text-[8px] font-black text-emerald-700 bg-emerald-100/80 px-1 py-0.5 rounded leading-none mb-1">
                        FAST UPI
                      </span>
                      <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center text-[10px] font-black mb-0.5">
                        C
                      </div>
                      <span className="text-[10px] font-extrabold text-zinc-900">CRED UPI</span>
                    </button>
                  </div>

                  {/* Pay with UPI QR Code */}
                  <button
                    type="button"
                    onClick={() => handleProceedToUpi("upi_qr")}
                    className="w-full py-3 px-3.5 rounded-xl border border-amber-300 bg-amber-50/60 hover:bg-amber-100/60 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 text-xs font-bold text-amber-950">
                      <div className="w-7 h-7 rounded-lg bg-amber-200/80 text-amber-800 flex items-center justify-center">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <span>Instant QR Code (Any UPI App)</span>
                        <span className="block text-[10px] font-normal text-amber-800/80">Scan with GPay, PhonePe, Paytm, BHIM</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-700" />
                  </button>
                </div>
              </div>

              {/* Cards / Net Banking note */}
              <div className="p-3 bg-zinc-100 rounded-xl text-[11px] text-zinc-500 flex items-center justify-between">
                <span>Looking for Cards or Net Banking?</span>
                <span className="font-semibold text-zinc-700">UPI is 100% Free & Fast</span>
              </div>
            </div>

            {/* Bottom Proceed Button */}
            <div className="p-4 bg-white border-t border-zinc-200/90 shrink-0 shadow-lg">
              <button
                type="button"
                onClick={() => handleProceedToUpi()}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-[#F5D020] hover:bg-[#F2C70E] active:scale-[0.99] text-black font-extrabold text-sm tracking-tight transition shadow-md shadow-yellow-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Generating UPI Payment...</span>
                  </>
                ) : (
                  <span>Proceed to Pay (₹{finalPayable})</span>
                )}
              </button>
            </div>
          </>
        )}

        {/* ================= VIEW 2: NATIVE TMD UPI PAYMENT & UTR SUBMISSION ================= */}
        {modalView === "UPI_PAY" && (
          <>
            {/* Header with Back to Summary */}
            <div className="px-5 py-4 bg-white flex items-center justify-between border-b border-zinc-200/80 sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalView("SUMMARY")}
                  className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-zinc-800" />
                </button>
                <div>
                  <h2 className="text-sm font-black text-zinc-900 tracking-tight">Scan & Pay via UPI</h2>
                  <p className="text-[10px] text-zinc-500">Zero Gateway Fees • Direct UPI</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-600 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
              {/* QR Code Container */}
              <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 text-amber-900 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Amount to Pay: ₹{finalPayable}</span>
                </div>

                {/* QR Code Image */}
                <div className="w-52 h-52 mx-auto rounded-2xl bg-white p-2 border-2 border-dashed border-amber-300 shadow-inner flex items-center justify-center">
                  {upiDetails?.upiIntentUrl ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                        upiDetails.upiIntentUrl
                      )}`}
                      alt="TMD UPI QR Code"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  )}
                </div>

                {/* UPI VPA Copy Section */}
                <div className="pt-1">
                  <span className="text-[11px] text-zinc-500 block mb-1">Payee UPI ID:</span>
                  <div className="inline-flex items-center gap-2 bg-zinc-100 px-3.5 py-1.5 rounded-xl border border-zinc-200 font-mono text-xs font-bold text-zinc-800">
                    <span>{upiDetails?.payeeVpa || "8817958002@ybl"}</span>
                    <button
                      type="button"
                      onClick={copyVpaToClipboard}
                      className="text-amber-700 hover:text-amber-800 transition p-1"
                      title="Copy UPI ID"
                    >
                      {isCopiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {isCopiedVpa && (
                    <span className="block text-[10px] text-emerald-600 font-bold mt-1">UPI ID Copied!</span>
                  )}
                </div>

                {/* Mobile Quick App Links */}
                {upiDetails && (
                  <div className="pt-2 border-t border-zinc-100">
                    <span className="text-[11px] text-zinc-500 block mb-2 font-medium">
                      Or tap to open your UPI app:
                    </span>
                    <div className="flex justify-center gap-2">
                      <a
                        href={upiDetails.gpayUrl}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-extrabold flex items-center gap-1 active:scale-95"
                      >
                        GPay
                      </a>
                      <a
                        href={upiDetails.phonepeUrl}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-extrabold flex items-center gap-1 active:scale-95"
                      >
                        PhonePe
                      </a>
                      <a
                        href={upiDetails.paytmUrl}
                        className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-extrabold flex items-center gap-1 active:scale-95"
                      >
                        Paytm
                      </a>
                      <a
                        href={upiDetails.upiIntentUrl}
                        className="px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-300 text-zinc-800 text-xs font-extrabold flex items-center gap-1 active:scale-95"
                      >
                        Any UPI
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: UTR Reference Submission Form */}
              <form onSubmit={handleSubmitUtr} className="bg-white rounded-3xl p-4 border border-zinc-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center font-black text-xs">
                    2
                  </div>
                  <h3 className="text-xs font-black text-zinc-900 uppercase tracking-tight">
                    Submit 12-Digit UPI Reference / UTR
                  </h3>
                </div>

                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  After completing the payment in your app, copy the 12-digit <b>UTR / UPI Ref Number</b> from transaction details and paste it below to activate PRO:
                </p>

                <div className="space-y-1">
                  <input
                    type="text"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value.replace(/[^0-9a-zA-Z]/g, ""))}
                    placeholder="Enter 12-digit UPI UTR No."
                    maxLength={16}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-sm font-mono font-bold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                  {utrError && (
                    <p className="text-[11px] font-medium text-red-500 flex items-center gap-1 pt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{utrError}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingUtr || !utrInput.trim()}
                  className="w-full py-3 rounded-xl bg-[#F5D020] hover:bg-[#F2C70E] active:scale-[0.99] text-black font-extrabold text-xs uppercase tracking-wider transition shadow-md shadow-yellow-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingUtr ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Submitting UTR...</span>
                    </>
                  ) : (
                    <span>Submit UTR for Verification</span>
                  )}
                </button>
              </form>
            </div>
          </>
        )}

        {/* ================= VIEW 3: UTR SUBMITTED FOR VERIFICATION ================= */}
        {modalView === "SUBMITTED" && (
          <div className="p-6 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center mx-auto shadow-md">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-700 border border-amber-500/30 uppercase tracking-widest inline-block">
                Queued for Verification
              </span>
              <h3 className="text-lg font-black text-zinc-900">
                Payment Submitted! ⏳
              </h3>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed max-w-xs mx-auto">
              Your 12-digit UPI UTR (<span className="font-mono font-bold text-zinc-900">{submittedUtr}</span>) has been submitted.
              Our team will verify the transaction and activate your <span className="font-bold text-zinc-900">{plan.name}</span> access shortly (usually within 5-10 minutes).
            </p>

            <div className="p-3 bg-zinc-100 rounded-2xl text-left text-xs space-y-1">
              <div className="flex justify-between text-zinc-500">
                <span>Plan:</span>
                <span className="font-bold text-zinc-800">{plan.name}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Amount:</span>
                <span className="font-bold text-emerald-600">₹{finalPayable}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>UTR / Ref No:</span>
                <span className="font-mono font-bold text-zinc-800">{submittedUtr}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <a
                href={`https://wa.me/918817958002?text=${encodeURIComponent(
                  `Hi TMD Support, I have paid ₹${finalPayable} for ${plan.name} with UTR: ${submittedUtr}. Please activate my PRO.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition"
              >
                <MessageCircle className="w-4 h-4" /> Message Support on WhatsApp
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-extrabold text-xs uppercase tracking-wider transition"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
