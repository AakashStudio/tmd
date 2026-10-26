"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/navigation/BottomNav";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import {
  X,
  Check,
  Flame,
  Crown,
  Sparkles,
  ShieldCheck,
  Zap,
  Star,
  Globe,
  Eye,
  Sliders,
  VolumeX,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

interface PlanItem {
  id: string;
  code: string;
  name: string;
  priceInRupees: number;
  durationDays: number;
  isPro: boolean;
  features: string[];
  isActive: boolean;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
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

export default function PlansPage() {
  const router = useRouter();
  const { profile, entitlements, refreshProfile } = useProfile();
  const { user, refreshUser } = useAuth();

  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>("TIER_149");
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await fetch("/api/plans");
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans || []);
          setSubscription(data.subscription || null);
          // Default selection: if user has an active plan, or popular TIER_149
          if (data.activePlanCode && data.activePlanCode !== "FREE") {
            setSelectedPlanCode(data.activePlanCode);
          } else {
            setSelectedPlanCode("TIER_149");
          }
        }
      } catch (err) {
        console.error("Failed to fetch plans:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPlans();
  }, []);

  const getPkgPrice = (code: string, fallback: number) => {
    const found = plans.find((p) => p.code === code);
    return found ? Math.round(found.priceInRupees) : fallback;
  };

  const tier49Price = getPkgPrice("TIER_49", 49);
  const tier149Price = getPkgPrice("TIER_149", 149);
  const pro499Price = getPkgPrice("PRO_499", 499);

  const planPackages = [
    {
      code: "TIER_49",
      badge: null,
      title: "15 Days",
      subtitle: `₹${tier49Price} total`,
      price: tier49Price,
      totalPrice: tier49Price,
      isPopular: false,
    },
    {
      code: "TIER_149",
      badge: "Popular",
      title: "15 Days Gold",
      subtitle: `₹${tier149Price} total`,
      price: tier149Price,
      totalPrice: tier149Price,
      isPopular: true,
    },
    {
      code: "PRO_499",
      badge: "VIP PRO",
      title: "VIP Events",
      subtitle: `₹${pro499Price} total`,
      price: pro499Price,
      totalPrice: pro499Price,
      isPopular: false,
    },
  ];

  const currentSelectedPkg =
    planPackages.find((p) => p.code === selectedPlanCode) || planPackages[0];

  const verifyAndActivate = async (
    orderId: string,
    paymentId: string,
    signature: string
  ) => {
    const verifyRes = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        paymentId,
        signature,
        planCode: selectedPlanCode,
      }),
    });

    if (!verifyRes.ok) {
      const verifyErr = await verifyRes.json().catch(() => ({}));
      throw new Error(verifyErr.error || "Payment verification failed");
    }

    await refreshProfile();
    await refreshUser();

    setSuccessMessage(
      `Success! You are now upgraded to ${currentSelectedPkg.title} TMD Gold. All features are active! 🎉`
    );

    // Reload plans
    const plansRes = await fetch("/api/plans");
    if (plansRes.ok) {
      const pData = await plansRes.json();
      setPlans(pData.plans || []);
      setSubscription(pData.subscription || null);
    }
  };

  const handleExecutePayment = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create order on server
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode: selectedPlanCode }),
      });

      if (!orderRes.ok) {
        if (orderRes.status === 401) {
          setShowAuthModal(true);
          throw new Error("Please log in to complete purchase.");
        }
        const err = await orderRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create order");
      }

      const orderData = await orderRes.json();

      // Check if Razorpay keys are configured (not placeholder)
      const isPlaceholderKey =
        !orderData.keyId || orderData.keyId.includes("placeholder");

      if (isPlaceholderKey) {
        // Fallback for dev / unconfigured test environment
        await verifyAndActivate(
          orderData.orderId,
          `pay_dev_${Date.now()}`,
          "dev_signature"
        );
        setIsProcessing(false);
        return;
      }

      // Load official Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error(
          "Failed to load Razorpay checkout SDK. Please check your internet connection."
        );
      }

      // Standard Razorpay Checkout Modal
      const options = {
        key:
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          orderData.key_id ||
          orderData.keyId,
        amount: orderData.amount || orderData.amountInPaise,
        currency: orderData.currency || "INR",
        name: "TMD — The Match Date",
        description: `${orderData.plan?.name || "Premium"} Plan Subscription`,
        order_id: orderData.order_id || orderData.orderId,
        prefill: {
          name: profile?.name || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#FFC629", // Aura Gold accent
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
        handler: async function (response: any) {
          try {
            await verifyAndActivate(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
          } catch (vErr: any) {
            alert(vErr.message || "Payment verification failed.");
          } finally {
            setIsProcessing(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setIsProcessing(false);
        alert(
          `Payment failed: ${response.error?.description || "Transaction declined"}`
        );
      });
      rzp.open();
    } catch (err: any) {
      alert(err.message || "Payment could not be completed.");
      setIsProcessing(false);
    }
  };

  const goldFeatures = [
    {
      title: "Unlimited Likes",
      desc: null,
    },
    {
      title: "See Who Likes You",
      desc: null,
    },
    {
      title: "Unlimited Rewinds",
      desc: null,
    },
    {
      title: "1 Free Boost per month",
      desc: "Free monthly Boost only available for 1 month or longer subscriptions.",
    },
    {
      title: "2 Free Super Likes per week",
      desc: null,
    },
    {
      title: "Unlimited Passport™ Mode*",
      desc: "Match and chat with people anywhere in the world. *Restrictions apply. Learn more",
    },
    {
      title: "Control Your Profile",
      desc: "Only show what you want them to know.",
    },
    {
      title: "Control Who Sees You",
      desc: "Manage who you're seen by.",
    },
    {
      title: "Hide Ads",
      desc: null,
    },
  ];

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col items-center justify-start sm:py-6 sm:px-4 w-full overflow-x-hidden">
      <div className="min-h-screen sm:min-h-[844px] sm:max-h-[92vh] bg-[#0d0d12] text-white pb-52 max-w-md w-full mx-auto relative select-none sm:rounded-3xl sm:border sm:border-white/[0.08] sm:shadow-2xl overflow-x-hidden box-border">
        {/* 1. TOP HEADER */}
      <div className="sticky top-0 inset-x-0 z-40 bg-[#0d0d12]/90 backdrop-blur-md px-5 py-4 flex items-center justify-center border-b border-white/[0.06]">
        {/* Center Logo Branding: TMD GOLD */}
        <div className="flex items-center gap-2">
          <span className="font-black text-xl tracking-wider text-white">TMD</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-[#D4AF37] to-[#FFC629] text-black uppercase shadow-sm">
            GOLD
          </span>
        </div>
      </div>

      <div className="px-5 pt-3 space-y-6">
        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Active Subscription Banner */}
        {subscription && subscription.planCode !== "FREE" && (
          <div className="p-3 rounded-2xl bg-[#171720] border border-amber-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-300 font-semibold">
                Active Plan: <span className="text-amber-300">{subscription.planName}</span>
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-medium">
              {subscription.daysRemaining} days left
            </span>
          </div>
        )}

        {/* 2. MAIN HEADLINE (Exact Screenshot Copy) */}
        <div className="space-y-1">
          <h1 className="text-[26px] font-black leading-tight text-white tracking-tight">
            See Who Likes You and match with them instantly with TMD Gold™.
          </h1>
        </div>

        {/* 3. SELECT A PLAN SECTION */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Select a plan
          </h2>

          {/* Plan Cards Row */}
          <div className="grid grid-cols-3 gap-2.5">
            {planPackages.map((pkg, idx) => {
              const isSelected = selectedPlanCode === pkg.code;

              return (
                <div
                  key={pkg.code}
                  onClick={() => setSelectedPlanCode(pkg.code)}
                  className={`relative p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between min-h-[145px] ${
                    isSelected
                      ? "border-2 border-[#d4af37] bg-[#1a1815] shadow-xl shadow-amber-950/30"
                      : "border border-zinc-800 bg-[#14141a] hover:border-zinc-700"
                  }`}
                >
                  {/* Top Badge & Checkmark */}
                  <div className="flex items-start justify-between min-h-[18px]">
                    {pkg.badge ? (
                      <span className="text-[11px] font-extrabold text-[#d4af37]">
                        {pkg.badge}
                      </span>
                    ) : (
                      <span />
                    )}

                    {isSelected && (
                      <div className="text-[#d4af37]">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="py-2">
                    <h3 className="text-lg font-black text-white tracking-tight leading-none">
                      {pkg.title}
                    </h3>
                  </div>

                  {/* Subtitle / Price rate */}
                  <div>
                    <span className="text-xs font-bold text-zinc-300">
                      {pkg.subtitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Indicator (Matches Screenshot) */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {planPackages.map((pkg) => (
              <div
                key={pkg.code}
                onClick={() => setSelectedPlanCode(pkg.code)}
                className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all ${
                  selectedPlanCode === pkg.code ? "bg-white w-2" : "bg-zinc-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* 4. INCLUDED WITH TINDER GOLD CARD (Matches Screenshot 1 & 2) */}
        <div className="relative pt-3">
          {/* Card Container */}
          <div className="relative rounded-3xl bg-[#14141c] border border-zinc-800/90 p-5 pt-7 space-y-4 shadow-xl">
            {/* Pill Header attached to top of card */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#1e1e28] border border-zinc-700 text-zinc-200 text-xs font-extrabold shadow whitespace-nowrap">
              Included with TMD Gold
            </div>

            {/* Feature Checklist matching screenshots */}
            <div className="space-y-4">
              {goldFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="text-white shrink-0 mt-0.5">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {feat.title}
                    </h4>
                    {feat.desc && (
                      <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                        {feat.desc}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. FIXED PURCHASE BAR (Above BottomNav) */}
      <div className="fixed bottom-16 inset-x-0 z-40 bg-gradient-to-t from-black via-[#0d0d12]/95 to-[#0d0d12]/90 backdrop-blur-md max-w-md mx-auto px-5 pt-2 pb-2.5 border-t border-zinc-900/80 space-y-2">
        {/* Fine Print Legal Text */}
        <p className="text-[10px] text-zinc-400 leading-tight">
          Recurring billing. Cancel anytime. By tapping Continue, you agree to our{" "}
          <span className="underline font-semibold text-zinc-300 cursor-pointer">Terms</span>.
        </p>

        {/* Continue Button */}
        <button
          type="button"
          onClick={handleExecutePayment}
          disabled={isProcessing}
          className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] hover:brightness-105 text-black font-black text-sm tracking-tight transition active:scale-[0.98] shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>Continue - ₹{currentSelectedPkg.totalPrice}.00 total</span>
          )}
        </button>
      </div>

      {/* 6. ALWAYS VISIBLE BOTTOM NAVIGATION */}
      <BottomNav />

      {/* Auth Modal if unauthenticated */}
      {showAuthModal && (
        <AuthModal
          onSuccess={async () => {
            setShowAuthModal(false);
            await refreshUser();
            await refreshProfile();
            handleExecutePayment();
          }}
          onCancel={() => setShowAuthModal(false)}
        />
      )}
      </div>
    </div>
  );
}
