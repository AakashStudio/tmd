"use client";

import React, { useState, useEffect } from "react";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Crown, Check, Sparkles, ShieldCheck, Zap, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";

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

export default function PlansPage() {
  const { entitlements, refreshProfile } = useProfile();
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
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
        }
      } catch (err) {
        console.error("Failed to fetch plans:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPlans();
  }, []);

  const handleInitiatePurchase = (plan: PlanItem) => {
    if (plan.isActive) return;
    setSelectedPlan(plan);
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowCheckoutModal(true);
  };

  const handleExecutePayment = async () => {
    if (!selectedPlan) return;
    if (!user) {
      setShowCheckoutModal(false);
      setShowAuthModal(true);
      return;
    }
    setIsProcessing(true);

    try {
      // 1. Create Order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode: selectedPlan.code }),
      });

      if (!orderRes.ok) {
        if (orderRes.status === 401) {
          setShowCheckoutModal(false);
          setShowAuthModal(true);
          throw new Error("Please log in with your phone number to complete purchase.");
        }
        const err = await orderRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create order");
      }

      const orderData = await orderRes.json();

      // 2. Complete Payment Verification (Development mock simulation or Razorpay client handler)
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentId: `pay_${Date.now()}`,
          signature: "dev_signature",
          planCode: selectedPlan.code,
        }),
      });

      if (!verifyRes.ok) {
        const verifyErr = await verifyRes.json().catch(() => ({}));
        throw new Error(verifyErr.error || "Payment verification failed");
      }

      const verifyData = await verifyRes.json();

      // Refresh entitlements
      await refreshProfile();
      await refreshUser();

      setShowCheckoutModal(false);
      setSuccessMessage(`Success! Upgraded to ${selectedPlan.name}. All features are now unlocked!`);

      // Reload plans state
      const plansRes = await fetch("/api/plans");
      if (plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData.plans || []);
        setSubscription(pData.subscription || null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to complete payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white pb-28 max-w-md mx-auto px-5 py-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center pt-1 pb-1 space-y-1">
          <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-white mb-1.5 shadow-md shadow-rose-500/20">
            <Crown className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-black tracking-tight">TMD Memberships</h1>
          <p className="text-xs text-zinc-400">
            Real dates, genuine connections, and local events
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Unauthenticated Login Prompt Banner */}
        {!user && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-purple-500/10 border border-rose-500/30 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-zinc-300">Sign in to activate plans & unlock features</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="px-3 py-1 rounded-md bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs hover:opacity-95 shadow-md shadow-rose-600/20 shrink-0"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Active Subscription Countdown Status */}
        {subscription && (
          <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Current Subscription</span>
              <Badge variant="verified">Active</Badge>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-extrabold text-sm text-white">{subscription.planName}</span>
              <span className="text-xs font-semibold text-rose-400">
                {subscription.daysRemaining} days left
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Valid until {new Date(subscription.endDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        )}

        {/* Plans List */}
        <div className="space-y-3.5">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            plans.map((p) => {
              const isCurrent = p.isActive;

              return (
                <Card
                  key={p.code}
                  className={`relative p-4 rounded-lg transition-all ${
                    p.isPro
                      ? "border-rose-500/80 bg-gradient-to-b from-rose-950/20 via-zinc-950 to-zinc-900 shadow-xl shadow-rose-950/40"
                      : isCurrent
                      ? "border-emerald-500/60 bg-zinc-950"
                      : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                  }`}
                >
                  {p.isPro && (
                    <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-extrabold tracking-wide uppercase shadow">
                      ⭐ Best Value • Events Differentiator
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-extrabold text-base text-white">{p.name}</h3>
                      <span className="text-xs text-zinc-400">
                        {p.durationDays > 0 ? `${p.durationDays} Days Access` : "Free Tier"}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-white">
                        {p.priceInRupees === 0 ? "Free" : `₹${p.priceInRupees}`}
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {p.durationDays > 0 ? "one-time payment" : "standard"}
                      </span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-1.5 py-2.5 border-t border-zinc-800/80 text-xs">
                    {(Array.isArray(p.features) ? p.features : []).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    {isCurrent ? (
                      <div className="w-full py-2 rounded-lg bg-zinc-900 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-center">
                        ✓ Current Active Plan
                      </div>
                    ) : p.priceInRupees > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleInitiatePurchase(p)}
                        className={`w-full py-2.5 rounded-lg font-bold text-xs text-white transition active:scale-[0.98] ${
                          p.isPro
                            ? "bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:opacity-95 shadow-lg shadow-rose-600/30"
                            : "bg-zinc-800 hover:bg-zinc-700"
                        }`}
                      >
                        Upgrade to {p.name} (₹{p.priceInRupees})
                      </button>
                    ) : null}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Immediate Replacement Note */}
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex items-start gap-2.5 text-[11px] text-zinc-400">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p leading-relaxed>
            <span className="text-zinc-200 font-medium">Immediate Replacement Policy:</span> Upgrading to a new plan takes effect immediately and supersedes any existing subscription. No recurring auto-charges.
          </p>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-rose-500/40 p-6 space-y-5 shadow-2xl relative">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2">
                <Zap className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Upgrade to {selectedPlan.name}</h2>
              <p className="text-xs text-zinc-400">
                Secure one-time payment via Razorpay • No auto-renewal
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Plan Duration</span>
                <span className="font-semibold text-white">{selectedPlan.durationDays} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Amount to Pay</span>
                <span className="font-extrabold text-white text-sm">₹{selectedPlan.priceInRupees}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleExecutePayment}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 transition shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isProcessing ? "Processing Payment..." : `Pay ₹${selectedPlan.priceInRupees} & Activate Instantly`}
              </button>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm">
            <AuthModal
              onSuccess={async () => {
                setShowAuthModal(false);
                await refreshUser();
                await refreshProfile();
                if (selectedPlan) {
                  setShowCheckoutModal(true);
                }
              }}
              onCancel={() => setShowAuthModal(false)}
            />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
