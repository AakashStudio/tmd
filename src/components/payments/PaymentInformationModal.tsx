"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  ChevronRight,
  QrCode,
  Sparkles,
  X,
  AlertCircle,
  Loader2,
  CreditCard,
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
    email?: string;
  };
  onPaymentSuccess: (planCode: string) => void;
}

type PaymentMethodType =
  | "gpay"
  | "phonepe"
  | "paytm"
  | "cred"
  | "upi_qr"
  | "cards";

const VALID_COUPONS: Record<
  string,
  { discountPercent?: number; discountFlat?: number; label: string }
> = {
  TMD50: { discountPercent: 50, label: "50% Flat Discount Applied!" },
  LOVE20: { discountPercent: 20, label: "20% Love Discount Applied!" },
  FIRST50: { discountFlat: 50, label: "₹50 Welcome Bonus Applied!" },
  STARTER: { discountPercent: 30, label: "30% Starter Off Applied!" },
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const PaymentInformationModal: React.FC<PaymentInformationModalProps> = ({
  isOpen,
  onClose,
  plan,
  userProfile,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("phonepe");
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    label: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [launchingAppMessage, setLaunchingAppMessage] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

  // Pricing calculations
  const baseOriginal = plan.priceInRupees || 149;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPayable = Math.max(1, baseOriginal - discount);

  // 18% GST breakup
  const rechargeAmount = Math.round(finalPayable / 1.18);
  const gstAmount = finalPayable - rechargeAmount;
  const billingState = userProfile?.state || "Madhya Pradesh";

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

  // Launch Razorpay Payment Gateway
  const executeRazorpayPayment = async (methodOverride?: PaymentMethodType) => {
    const methodToUse = methodOverride || selectedMethod;
    setSelectedMethod(methodToUse);

    try {
      setIsProcessing(true);
      const appNameMap: Record<string, string> = {
        phonepe: "PhonePe",
        gpay: "Google Pay",
        paytm: "Paytm",
        cred: "CRED",
        upi_qr: "Instant QR",
        cards: "Card / NetBanking",
      };
      setLaunchingAppMessage(`Opening Razorpay (${appNameMap[methodToUse] || "Gateway"})...`);

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error(
          "Unable to load secure Razorpay gateway. Please check your internet connection."
        );
      }

      // 1. Create verified order on server via official Razorpay REST API
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
        throw new Error(err.error || "Failed to initialize payment order with Razorpay.");
      }

      const orderData = await orderRes.json();

      const upiAppMap: Record<string, string> = {
        gpay: "google_pay",
        phonepe: "phonepe",
        paytm: "paytm",
        cred: "cred",
      };
      const targetApp = upiAppMap[methodToUse];

      // 2. Configure Razorpay Standard Checkout targeting the selected app directly
      const options: any = {
        key:
          orderData.keyId ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          "rzp_test_TsEClVNy3FvpRk",
        amount: orderData.amount,
        currency: "INR",
        name: "The Match Date",
        description: `${plan.name} (₹${finalPayable})`,
        order_id: orderData.orderId,
        prefill: {
          name: userProfile?.name || "Member",
          contact: userProfile?.phone || "",
          email: userProfile?.email || "user@tmd.dizitio.com",
          method: methodToUse === "cards" ? "card" : "upi",
          vpa: "success@razorpay", // Default test VPA for instant simulation
        },
        config: {
          display: {
            blocks: targetApp
              ? {
                  upi: {
                    name: `Pay via ${appNameMap[methodToUse]}`,
                    instruments: [
                      {
                        method: "upi",
                        flows: ["intent", "qr"],
                        apps: [targetApp],
                      },
                    ],
                  },
                }
              : {
                  all: {
                    name: "Payment Methods",
                    instruments: [
                      { method: "card" },
                      { method: "netbanking" },
                      { method: "wallet" },
                      { method: "upi" },
                    ],
                  },
                },
            sequence: targetApp ? ["block.upi"] : ["block.all"],
            preferences: {
              show_default_blocks: !targetApp,
            },
          },
        },
        theme: {
          color: "#F5D020",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setLaunchingAppMessage(null);
          },
        },
        handler: async (response: any) => {
          try {
            setIsProcessing(true);
            setLaunchingAppMessage("Verifying payment with Razorpay...");

            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planCode: plan.code,
              }),
            });

            if (!verifyRes.ok) {
              const verifyErr = await verifyRes.json().catch(() => ({}));
              throw new Error(
                verifyErr.error || "Payment verification failed with Razorpay."
              );
            }

            setIsProcessing(false);
            setLaunchingAppMessage(null);
            setIsSuccessModalOpen(true);
            onPaymentSuccess(plan.code);
          } catch (err: any) {
            alert(err.message || "Failed to verify transaction with bank.");
            setIsProcessing(false);
            setLaunchingAppMessage(null);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setIsProcessing(false);
        setLaunchingAppMessage(null);
        alert(
          `Payment failed: ${
            response.error?.description || "Transaction was declined by bank."
          }`
        );
      });

      setIsProcessing(false);
      setLaunchingAppMessage(null);
      rzp.open();
    } catch (err: any) {
      alert(err.message || "Could not proceed to payment");
      setIsProcessing(false);
      setLaunchingAppMessage(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 select-none animate-in fade-in">
      <div className="w-full sm:max-w-md h-[92vh] sm:h-auto sm:max-h-[92vh] bg-[#F7F8FA] text-zinc-900 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl relative border border-zinc-200">
        
        {/* Header */}
        <div className="px-5 py-4 bg-white flex items-center justify-between border-b border-zinc-200/80 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-800" />
            </button>
            <h2 className="text-base font-extrabold text-zinc-900 tracking-tight">
              Payment Information
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-600 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status banner when processing payment */}
        {launchingAppMessage && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-b border-amber-500/30 text-amber-900 text-xs font-bold flex items-center gap-2 animate-pulse shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
            <span>{launchingAppMessage}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-thin">
          {/* Card 1: Order Summary */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-sm space-y-2.5">
            <div className="flex justify-between items-center text-xs text-zinc-700">
              <span className="font-medium">GST(18%)</span>
              <span className="font-bold text-zinc-900 font-mono">₹ {gstAmount}</span>
            </div>

            <div className="flex justify-between items-center text-sm font-extrabold text-zinc-900">
              <span>Total Recharge Amount</span>
              <span className="font-mono text-base font-black text-zinc-900">
                ₹ {finalPayable}
              </span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between items-center text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>- ₹ {appliedCoupon.discountAmount}</span>
              </div>
            )}

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
              <span>100% Safe and Secure Razorpay Gateway</span>
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
                  className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer"
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
                placeholder="ENTER COUPON CODE (E.G. TMD)"
                disabled={!!appliedCoupon}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 uppercase"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={!!appliedCoupon || !couponCode.trim()}
                className="px-4 py-2.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 disabled:opacity-50 text-zinc-800 text-xs font-extrabold uppercase transition cursor-pointer"
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

          {/* Section 3: Pay via UPI Apps via Razorpay */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider px-1">
              PAY VIA UPI (RAZORPAY GATEWAY)
            </h3>

            <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-sm space-y-4">
              {/* 4 App Cards Grid */}
              <div className="grid grid-cols-4 gap-2.5">
                {/* GPay */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod("gpay");
                    executeRazorpayPayment("gpay");
                  }}
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
                      <path
                        fill="#4285F4"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#34A853"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#EA4335"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  </div>
                  <span className="text-[11px] font-extrabold text-zinc-900">
                    GPay
                  </span>
                </button>

                {/* PhonePe */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod("phonepe");
                    executeRazorpayPayment("phonepe");
                  }}
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
                  <span className="text-[11px] font-extrabold text-zinc-900">
                    PhonePe
                  </span>
                </button>

                {/* Paytm */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod("paytm");
                    executeRazorpayPayment("paytm");
                  }}
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
                  <span className="text-[11px] font-extrabold text-zinc-900">
                    Paytm
                  </span>
                </button>

                {/* CRED */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod("cred");
                    executeRazorpayPayment("cred");
                  }}
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
                  <span className="text-[10px] font-extrabold text-zinc-900">
                    CRED UPI
                  </span>
                </button>
              </div>

              {/* Instant QR Code Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedMethod("upi_qr");
                  executeRazorpayPayment("upi_qr");
                }}
                className={`w-full py-3 px-3.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                  selectedMethod === "upi_qr"
                    ? "border-amber-400 bg-amber-100/70 shadow-sm"
                    : "border-amber-300 bg-amber-50/60 hover:bg-amber-100/60"
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs font-bold text-amber-950">
                  <div className="w-7 h-7 rounded-lg bg-amber-200/80 text-amber-800 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span>Instant QR Code (Razorpay QR)</span>
                    <span className="block text-[10px] font-normal text-amber-800/80">
                      Scan via Razorpay Gateway
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-700" />
              </button>
            </div>
          </div>

          {/* Cards / Net Banking */}
          <button
            type="button"
            onClick={() => {
              setSelectedMethod("cards");
              executeRazorpayPayment("cards");
            }}
            className="w-full p-3 bg-zinc-100 hover:bg-zinc-200/80 rounded-xl text-[11px] text-zinc-600 flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
              <span>Looking for Cards or Net Banking?</span>
            </div>
            <span className="font-semibold text-zinc-800 underline">
              Pay with Card / NetBanking
            </span>
          </button>
        </div>

        {/* Bottom Proceed Button */}
        <div className="p-4 bg-white border-t border-zinc-200/90 shrink-0 shadow-lg">
          <button
            type="button"
            onClick={() => executeRazorpayPayment(selectedMethod)}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-[#F5D020] hover:bg-[#F2C70E] active:scale-[0.99] text-black font-extrabold text-sm tracking-tight transition shadow-md shadow-yellow-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Connecting to Razorpay...</span>
              </>
            ) : (
              <span>Proceed to Pay (₹{finalPayable}) via Razorpay</span>
            )}
          </button>
        </div>

      </div>

      {/* ================= CELEBRATION SUCCESS MODAL ================= */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/90 p-4 animate-in zoom-in-95">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-zinc-900 shadow-2xl relative text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-widest inline-block">
                ✓ Verified by Razorpay
              </span>
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                Payment Successful! 🎉
              </h3>
              <p className="text-xs text-zinc-500">Welcome to {plan.name}</p>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed max-w-xs mx-auto">
              Your payment of{" "}
              <span className="font-bold text-zinc-900 font-mono">
                ₹{finalPayable}
              </span>{" "}
              for <span className="font-bold text-zinc-900">{plan.name}</span> has
              been confirmed by Razorpay. All VIP features are unlocked!
            </p>

            <button
              type="button"
              onClick={() => {
                setIsSuccessModalOpen(false);
                onClose();
              }}
              className="w-full py-3.5 rounded-2xl bg-[#F5D020] hover:bg-[#F2C70E] text-black font-extrabold text-sm uppercase tracking-wider transition shadow-lg shadow-yellow-500/20 active:scale-95 cursor-pointer"
            >
              Start Exploring VIP Features ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
