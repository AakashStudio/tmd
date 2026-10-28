"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/navigation/BottomNav";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import {
  ArrowLeft,
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

const PLAN_RANKS: Record<string, number> = {
  FREE: 0,
  TIER_49: 1,
  TIER_149: 2,
  PRO_499: 3,
};

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
          const userSub = data.subscription || null;
          setSubscription(userSub);
          const activeCode = userSub?.planCode || data.activePlanCode || "FREE";
          const activeRank = PLAN_RANKS[activeCode] || 0;
          if (activeRank === 1) {
            setSelectedPlanCode("TIER_149");
          } else if (activeRank >= 2) {
            setSelectedPlanCode("PRO_499");
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
      badge: "Starter",
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

  const currentActiveCode = subscription?.planCode || "FREE";
  const currentRank = PLAN_RANKS[currentActiveCode] || 0;
  const selectedRank = PLAN_RANKS[selectedPlanCode] || 0;

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

  const PLAN_DETAILS: Record<
    string,
    {
      headline: string;
      pillTitle: string;
      features: { title: string; desc: string | null }[];
    }
  > = {
    TIER_49: {
      headline: "Unlimited Likes & see who liked you with 15 Days Starter.",
      pillTitle: "Included with 15 Days Starter",
      features: [
        {
          title: "Unlimited Likes",
          desc: "Swipe right on as many profiles as you want with no daily limits.",
        },
        {
          title: "See Who Likes You (First 10)",
          desc: "Reveal your first 10 admirers and match with them instantly.",
        },
        {
          title: "Local Singles Discovery",
          desc: "Connect with genuine, verified profiles in your city.",
        },
        {
          title: "15 Days Active Access",
          desc: "Full 15-day membership with zero recurring charges or hidden fees.",
        },
      ],
    },
    TIER_149: {
      headline: "See Who Likes You and match with them instantly with TMD Gold™.",
      pillTitle: "Included with TMD Gold",
      features: [
        {
          title: "Unlimited Likes",
          desc: "Swipe right on as many profiles as you want with no daily limits.",
        },
        {
          title: "See Who Likes You (Unlimited)",
          desc: "Reveal everyone who liked you and match with them instantly.",
        },
        {
          title: "Unlimited Rewinds",
          desc: "Take back your last swipe if you passed by accident.",
        },
        {
          title: "Passport™ City Selection",
          desc: "Match and chat with verified singles in any city across India.",
        },
        {
          title: "Hide Ads",
          desc: "Enjoy a completely ad-free premium dating experience.",
        },
        {
          title: "15 Days Full Gold Access",
          desc: "Full 15-day premium membership with all Gold perks unlocked.",
        },
      ],
    },
    PRO_499: {
      headline: "Host & Join Exclusive Singles Events with TMD VIP PRO.",
      pillTitle: "Included with TMD VIP PRO",
      features: [
        {
          title: "Everything in TMD Gold",
          desc: "Unlimited likes, see who likes you, unlimited rewinds, passport mode & zero ads.",
        },
        {
          title: "Singles Events Map Access",
          desc: "Explore and RSVP to live singles meetups and date events nearby.",
        },
        {
          title: "Host Your Own Events",
          desc: "Create and publish real-world singles events with attendee approval.",
        },
        {
          title: "VIP PRO & Host Verification Badge",
          desc: "Stand out on discovery with the prestigious Gold VIP verification badge.",
        },
        {
          title: "Priority Name & DOB Corrections",
          desc: "Fast-track administrative review for name changes and DOB updates.",
        },
        {
          title: "10 Days VIP Access",
          desc: "Exclusive VIP privileges and event organizer tools for 10 days.",
        },
      ],
    },
  };

  const activePlanDetails =
    PLAN_DETAILS[selectedPlanCode] || PLAN_DETAILS["TIER_149"];

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col items-center justify-start py-4 sm:py-8 px-3 sm:px-4 w-full box-border overflow-x-hidden">
      <div className="w-full max-w-md bg-[#0c0c10] text-white rounded-3xl border border-white/[0.08] shadow-2xl pb-52 relative box-border overflow-x-hidden select-none">
        {/* 1. TOP HEADER */}
        <div className="sticky top-0 inset-x-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md px-5 py-3.5 flex items-center justify-between border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-400/50 flex items-center justify-center text-amber-400 transition active:scale-95 shadow-sm"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">Membership Plans</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-[#D4AF37] to-[#FFC629] text-black uppercase shadow-sm">
                  GOLD
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Unlock all TMD VIP dating features</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#FFC629] text-[10px] font-black uppercase tracking-wider">
            Premium
          </span>
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

        {/* 2. MAIN HEADLINE (Dynamic based on selected plan) */}
        <div className="space-y-1">
          <h1 className="text-[26px] font-black leading-tight text-white tracking-tight">
            {activePlanDetails.headline}
          </h1>
        </div>

        {/* 3. SELECT A PLAN SECTION */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Select a plan
          </h2>

          {/* Plan Cards Row */}
          <div className="grid grid-cols-3 gap-2.5">
            {planPackages.map((pkg) => {
              const pkgRank = PLAN_RANKS[pkg.code] || 0;
              const isSelected = selectedPlanCode === pkg.code;
              const isCurrentPlan = currentRank > 0 && pkgRank === currentRank;
              const isAlreadyIncluded = currentRank > 0 && pkgRank < currentRank;
              const isUpgrade = pkgRank > currentRank;

              return (
                <div
                  key={pkg.code}
                  onClick={() => setSelectedPlanCode(pkg.code)}
                  className={`relative p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between min-h-[145px] ${
                    isSelected
                      ? "border-2 border-[#d4af37] bg-[#1a1815] shadow-xl shadow-amber-950/30"
                      : isCurrentPlan
                      ? "border border-emerald-500/50 bg-[#121c15]"
                      : isAlreadyIncluded
                      ? "border border-zinc-800/60 bg-[#111116] opacity-75"
                      : "border border-zinc-800 bg-[#14141a] hover:border-zinc-700"
                  }`}
                >
                  {/* Top Badge & Checkmark */}
                  <div className="flex items-start justify-between min-h-[18px]">
                    {isCurrentPlan ? (
                      <span className="text-[10px] font-extrabold text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Current
                      </span>
                    ) : isAlreadyIncluded ? (
                      <span className="text-[10px] font-bold text-zinc-500">
                        Included
                      </span>
                    ) : isUpgrade ? (
                      <span className="text-[11px] font-extrabold text-[#d4af37]">
                        {pkg.badge || "Upgrade"}
                      </span>
                    ) : (
                      <span className="text-[11px] font-extrabold text-[#d4af37]">
                        {pkg.badge}
                      </span>
                    )}

                    {isCurrentPlan ? (
                      <div className="text-emerald-400">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : isSelected ? (
                      <div className="text-[#d4af37]">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : null}
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
                      {isCurrentPlan ? "Active" : isAlreadyIncluded ? "Unlocked" : pkg.subtitle}
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

        {/* 4. INCLUDED FEATURES CARD (Dynamic based on selected plan) */}
        <div className="relative pt-3">
          {/* Card Container */}
          <div className="relative rounded-3xl bg-[#14141c] border border-zinc-800/90 p-5 pt-7 space-y-4 shadow-xl">
            {/* Pill Header attached to top of card */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#1e1e28] border border-zinc-700 text-amber-300 text-xs font-extrabold shadow whitespace-nowrap">
              {activePlanDetails.pillTitle}
            </div>

            {/* Feature Checklist matching decided plan */}
            <div className="space-y-4">
              {activePlanDetails.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="text-[#FFC629] shrink-0 mt-0.5">
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

      {/* 5. BOTTOM BAR / ACTIVE VIP STATUS CARD */}
      {currentRank >= 3 ? (
        <div className="fixed bottom-16 inset-x-0 z-40 bg-[#0d0d12]/95 backdrop-blur-md max-w-md mx-auto px-5 py-3 border-t border-amber-500/30">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1a1714] via-[#261f14] to-[#1a1714] border border-amber-500/40 flex items-center justify-between shadow-xl shadow-amber-950/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#FFC629] flex items-center justify-center text-black font-black shadow-md">
                <Crown className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-[#FFC629]">VIP PRO Member</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Active</span>
                </div>
                <p className="text-[11px] text-zinc-400">All exclusive privileges & events unlocked</p>
              </div>
            </div>
            {subscription?.daysRemaining !== undefined && (
              <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                {subscription.daysRemaining}d left
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="fixed bottom-16 inset-x-0 z-40 bg-gradient-to-t from-black via-[#0d0d12]/95 to-[#0d0d12]/90 backdrop-blur-md max-w-md mx-auto px-5 pt-2 pb-2.5 border-t border-zinc-900/80 space-y-2">
          {/* Fine Print Legal Text */}
          <p className="text-[10px] text-zinc-400 leading-tight">
            One-time payment for {selectedPlanCode === "PRO_499" ? "10" : "15"} days. No hidden charges or auto-renewals. By tapping Continue, you agree to our{" "}
            <span className="underline font-semibold text-zinc-300 cursor-pointer">Terms</span>.
          </p>

          {/* Continue / Upgrade / Active Button */}
          {selectedRank <= currentRank ? (
            <div className="w-full py-3.5 rounded-full bg-zinc-800 text-zinc-300 font-bold text-sm text-center border border-zinc-700 flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span>
                {selectedRank === currentRank ? "Current Plan Active" : "Already Included in Current Plan"}
                {subscription?.daysRemaining ? ` (${subscription.daysRemaining}d left)` : ""}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleExecutePayment}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] hover:brightness-105 text-black font-black text-sm tracking-tight transition active:scale-[0.98] shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>
                  {currentRank > 0 ? "Upgrade to " : "Continue - "}
                  {currentSelectedPkg.title} · ₹{currentSelectedPkg.totalPrice}.00
                </span>
              )}
            </button>
          )}
        </div>
      )}

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
