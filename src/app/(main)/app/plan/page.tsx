'use client';

import { useState, useEffect } from 'react';
import { Check, Crown, Sparkles, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface SubData {
  planSlug: string;
  planName: string;
  priceInr: number;
  expiresAt: string | null;
  features?: any;
}

interface PaymentRecord {
  id: string;
  planName: string;
  amount: number;
  status: string;
  createdAt: string;
}

const PLANS = [
  {
    slug: 'pro_499',
    name: 'Pro VIP',
    price: 499,
    duration: '10 Days',
    tagline: 'Events Map, Unlimited Swipes & Host Access',
    badge: 'ALL ACCESS',
    isHero: true,
    highlights: [
      'Full TMD Events Map access (Join & Host parties, mixers, gigs)',
      'Unlimited Swipes with no 12-hour window limits',
      'Global Location Matching (Travel Mode to any city)',
      'See EVERYONE who liked you with instant matching',
      'Rewind accidental passes anytime',
      'Pro Name Change & DOB correction rights',
    ],
  },
  {
    slug: 'plus_149',
    name: 'Plus',
    price: 149,
    duration: '15 Days',
    tagline: 'Travel Mode & Full Admirers',
    isHero: false,
    highlights: [
      'Unlimited Swipes with no cooldown timers',
      'See EVERYONE who liked you with instant matches',
      'Location matching & custom city travel',
      'Rewind accidental passes',
      'Zero advertising',
    ],
  },
  {
    slug: 'basic_49',
    name: 'Basic',
    price: 49,
    duration: '15 Days',
    tagline: 'Unlimited Discovery & Admirer Preview',
    isHero: false,
    highlights: [
      'Unlimited Swipes with no 12h cooldown timer',
      'Preview first 10 admirers who liked you',
      'Direct chat with all mutual matches',
      'Current city discovery',
    ],
  },
  {
    slug: 'free',
    name: 'Free',
    price: 0,
    duration: 'Forever',
    tagline: 'Standard Discovery',
    isHero: false,
    highlights: [
      '10 swipes per fixed 12-hour window',
      'Mutual matching & text chat',
      'Ephemeral View Once photos in chat',
      'Current city discovery',
    ],
  },
];

const COMPARISON_ROWS = [
  { label: 'Swipes per window', free: '10 / 12h', basic: 'Unlimited', plus: 'Unlimited', pro: 'Unlimited' },
  { label: 'See who liked you', free: '—', basic: '10 Admirers', plus: 'Unlimited', pro: 'Unlimited' },
  { label: 'Rewind passes', free: '—', basic: '—', plus: '✓', pro: '✓' },
  { label: 'Location matching', free: '—', basic: '—', plus: '✓', pro: '✓' },
  { label: 'Events Map access', free: '—', basic: '—', plus: '—', pro: '✓' },
  { label: 'Host nightlife events', free: '—', basic: '—', plus: '—', pro: '✓' },
  { label: 'Name change privilege', free: '—', basic: '—', plus: '—', pro: '✓' },
];

export default function PlanPage() {
  const [currentSub, setCurrentSub] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState('pro_499');
  const [purchasing, setPurchasing] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<any | null>(null);
  const [upiId, setUpiId] = useState('user@okhdfcbank');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const res = await fetch('/api/subscription');
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentSub(data.data.subscription);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCheckout = (plan: any) => {
    if (plan.slug === 'free') return;
    setCheckoutPlan(plan);
    setPaymentSuccess(false);
  };

  const handleProcessPayment = async () => {
    if (!checkoutPlan) return;
    setPurchasing(true);
    try {
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug: checkoutPlan.slug }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error || 'Order creation failed');

      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.data.orderId,
          paymentId: `pay_sim_${Date.now()}`,
          signature: 'simulated_sig_ok',
          planSlug: checkoutPlan.slug,
        }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        setPaymentSuccess(true);
        loadSubscription();
        setTimeout(() => {
          setCheckoutPlan(null);
          setPaymentSuccess(false);
        }, 1500);
      }
    } catch (err: any) {
      alert(err.message || 'Payment simulation failed');
    } finally {
      setPurchasing(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/payments/history');
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
        setShowHistory(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedPlan = PLANS.find((p) => p.slug === selectedPlanSlug) || PLANS[0];
  const isSelectedActive = currentSub?.planSlug === selectedPlan.slug || (selectedPlan.slug === 'free' && (!currentSub || currentSub.planSlug === 'free'));

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 select-none bg-[#08080A]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="tmd-h2 text-white">Upgrade TMD</h1>
          <p className="tmd-body-small text-[#A1A1AA]">Unlock full discovery & events map</p>
        </div>

        <button
          type="button"
          onClick={loadHistory}
          className="text-xs font-semibold text-[#A1A1AA] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2.5 bg-[#121216] border border-[#1E1E26] rounded-[6px]"
        >
          <Receipt size={13} className="text-[#FF4D6D]" />
          <span>Receipts</span>
        </button>
      </div>

      {/* Current Membership Banner */}
      <div className="bg-[#121216] p-3 rounded-[8px] border border-[#1E1E26] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1A1A22] border border-[#2D2D38] flex items-center justify-center text-[#FF1493]">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="tmd-metadata text-[#71717A] block">Current Plan</span>
            <span className="text-xs font-bold text-white">{currentSub?.planName || 'Free Member'}</span>
          </div>
        </div>
        {currentSub?.expiresAt && (
          <span className="text-[10px] text-[#A1A1AA] bg-[#1A1A22] px-2 py-0.5 rounded-[4px] border border-[#2D2D38]">
            Valid until {new Date(currentSub.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Plan Selector Grid */}
      <div className="grid grid-cols-4 gap-1.5 bg-[#121216] p-1 rounded-[8px] border border-[#1E1E26]">
        {PLANS.map((plan) => {
          const isSelected = selectedPlanSlug === plan.slug;
          return (
            <button
              key={plan.slug}
              type="button"
              onClick={() => setSelectedPlanSlug(plan.slug)}
              className={`py-2 px-1 rounded-[6px] text-center transition-all cursor-pointer ${
                isSelected
                  ? plan.isHero
                    ? 'bg-gradient-to-r from-[#FF1493] to-[#FF4D6D] text-white font-black shadow-md'
                    : 'bg-[#1A1A22] text-white font-bold border border-[#2D2D38]'
                  : 'text-[#71717A] hover:text-white'
              }`}
            >
              <span className="text-xs block leading-tight">{plan.name}</span>
              <span className="text-[10px] opacity-80 block">{plan.price === 0 ? 'Free' : `₹${plan.price}`}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Plan Details Card */}
      <div
        className={`rounded-[8px] p-4.5 border transition-all shadow-xl space-y-4 ${
          selectedPlan.isHero
            ? 'bg-gradient-to-b from-[#1F0E17] via-[#121216] to-[#0E0E12] border-[#FF1493]/70'
            : 'bg-[#121216] border-[#1E1E26]'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            {selectedPlan.badge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FF1493] text-white text-[9px] font-black tracking-wider uppercase rounded-[4px] mb-1.5 shadow-sm">
                <Crown size={11} /> {selectedPlan.badge}
              </span>
            )}
            <h2 className="tmd-h1 text-white">{selectedPlan.name}</h2>
            <p className="text-xs font-bold text-[#FF4D6D] mt-0.5">{selectedPlan.tagline}</p>
          </div>

          <div className="text-right">
            <span className="text-3xl font-black text-white tracking-tight">
              {selectedPlan.price === 0 ? 'Free' : `₹${selectedPlan.price}`}
            </span>
            <span className="text-[10px] text-[#A1A1AA] block">/ {selectedPlan.duration}</span>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
          {selectedPlan.highlights.map((feat, i) => (
            <div key={i} className="flex items-start gap-2.5 text-white/90">
              <div className="w-4 h-4 rounded-full bg-[#FF1493]/20 flex items-center justify-center text-[#FF1493] flex-shrink-0 mt-0.5">
                <Check size={11} strokeWidth={3} />
              </div>
              <span className="leading-snug">{feat}</span>
            </div>
          ))}
        </div>

        {/* Action Button inside Card */}
        <div className="pt-2">
          <Button
            onClick={() => handleStartCheckout(selectedPlan)}
            disabled={isSelectedActive || selectedPlan.slug === 'free'}
            fullWidth
            size="lg"
            variant={selectedPlan.isHero ? 'primary' : 'secondary'}
          >
            {isSelectedActive
              ? 'Current Active Plan'
              : selectedPlan.slug === 'free'
              ? 'Free Tier'
              : `Subscribe to ${selectedPlan.name} — ₹${selectedPlan.price}`}
          </Button>
        </div>
      </div>

      {/* Plan Comparison Table */}
      <div className="bg-[#121216] rounded-[8px] border border-[#1E1E26] overflow-hidden shadow-lg">
        <div className="px-3.5 py-2.5 border-b border-[#1E1E26] bg-[#16161C]">
          <h3 className="tmd-metadata text-[#71717A]">Plan Matrix</h3>
        </div>

        <div className="divide-y divide-[#1E1E26] text-[11px]">
          {COMPARISON_ROWS.map((row, idx) => (
            <div key={idx} className="grid grid-cols-5 p-2.5 items-center">
              <span className="col-span-2 text-[#A1A1AA] font-medium pr-1">{row.label}</span>
              <span className="text-center text-[#71717A]">{row.free}</span>
              <span className="text-center text-[#A1A1AA]">{row.plus}</span>
              <span className="text-center font-bold text-[#FF1493]">{row.pro}</span>
            </div>
          ))}
        </div>
      </div>

      {/* UPI Checkout Bottom Sheet */}
      {checkoutPlan && (
        <BottomSheet isOpen={!!checkoutPlan} onClose={() => setCheckoutPlan(null)} title="Instant UPI Checkout">
          <div className="space-y-4 pb-4">
            <div className="bg-[#1A1A22] p-3.5 rounded-[8px] border border-[#2D2D38] flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white">{checkoutPlan.name} Membership</span>
                <span className="text-xs text-[#A1A1AA] block">{checkoutPlan.duration} Access</span>
              </div>
              <span className="text-2xl font-black text-[#FF1493]">₹{checkoutPlan.price}</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A1A1AA]">UPI ID / VPA</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full h-11 px-3 bg-[#121216] border border-[#1E1E26] rounded-[8px] text-white text-xs font-mono focus:outline-none focus:border-[#FF1493]"
                placeholder="username@upi"
              />
            </div>

            {paymentSuccess ? (
              <div className="p-3 bg-[#10B981]/15 border border-[#10B981]/30 rounded-[8px] text-center text-xs font-bold text-[#10B981] flex items-center justify-center gap-2">
                <Check size={16} /> Subscription Activated Successfully!
              </div>
            ) : (
              <Button
                onClick={handleProcessPayment}
                loading={purchasing}
                fullWidth
                size="lg"
              >
                Pay ₹{checkoutPlan.price} with UPI
              </Button>
            )}

            <p className="text-[11px] text-[#71717A] text-center">
              Razorpay sandbox test mode. Activates real database entitlements instantly.
            </p>
          </div>
        </BottomSheet>
      )}

      {/* Invoices Bottom Sheet */}
      {showHistory && (
        <BottomSheet isOpen={showHistory} onClose={() => setShowHistory(false)} title="Payment Invoices">
          <div className="space-y-2 pb-4 max-h-[60vh] overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#71717A]">No payments recorded yet.</p>
            ) : (
              history.map((h) => (
                <div key={h.id} className="p-3 bg-[#121216] border border-[#1E1E26] rounded-[8px] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{h.planName}</span>
                    <span className="text-[10px] text-[#71717A] font-mono">{new Date(h.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white">₹{h.amount}</span>
                    <span className="text-[10px] text-[#10B981] font-semibold block capitalize">{h.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
