'use client';

import { useState, useEffect } from 'react';
import { Check, Crown, Zap, Sparkles, ChevronRight, ArrowRight, ShieldCheck, Heart, MapPin, RotateCcw, Compass, Calendar, Receipt, X } from 'lucide-react';
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
    tagline: 'Dating + Events + Map',
    badge: 'MOST POPULAR',
    isHero: true,
    highlights: [
      'Full TMD Events Map access (Join & Host parties, mixers, gigs)',
      'Unlimited Swipes with zero 12h cooldown timer',
      'Global Location Matching (Travel Mode to any city)',
      'See EVERYONE who liked you with instant matching',
      'Verified Organizer badge & VIP priority delivery in discovery',
      'Pro Name change & verified support',
    ],
  },
  {
    slug: 'plus_149',
    name: 'Plus',
    price: 149,
    duration: '15 Days',
    tagline: 'Travel Mode & Admirers',
    isHero: false,
    highlights: [
      'Unlimited Swipes with no timers',
      'See EVERYONE who liked you',
      'Location matching & custom city travel',
      'Rewind accidental passes',
    ],
  },
  {
    slug: 'basic_49',
    name: 'Basic',
    price: 49,
    duration: '15 Days',
    tagline: 'Unlimited Swiping',
    isHero: false,
    highlights: [
      'Unlimited Swipes with no timers',
      'Preview 10 admirers who liked you',
      'Direct chat with all matches',
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
      '10 swipes per 12-hour window',
      'Mutual matching & text chat',
      'Ephemeral View Once photos in chat',
      'Current city matching',
    ],
  },
];

const COMPARISON_ROWS = [
  { label: 'Swipes per day', free: '10 / 12h', basic: 'Unlimited', plus: 'Unlimited', pro: 'Unlimited' },
  { label: 'See who liked you', free: '—', basic: '10 Admirers', plus: 'Unlimited', pro: 'Unlimited' },
  { label: 'Location matching', free: '—', basic: '—', plus: '✓', pro: '✓' },
  { label: 'Rewind passes', free: '—', basic: '—', plus: '✓', pro: '✓' },
  { label: 'Events Map Access', free: '—', basic: '—', plus: '—', pro: '✓' },
  { label: 'Host nightlife events', free: '—', basic: '—', plus: '—', pro: '✓' },
  { label: 'Organizer Badge', free: '—', basic: '—', plus: '—', pro: '✓' },
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
        }, 1600);
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
    <div className="min-h-[calc(100dvh-4rem)] px-4 py-4 space-y-4 select-none pb-24 bg-[#0A0A0A]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Upgrade TMD</h1>
          <p className="text-xs text-[#888888]">Elevate dates, events & discovery</p>
        </div>

        <button
          onClick={loadHistory}
          className="text-xs font-semibold text-[#888888] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2.5 bg-[#141414] border border-[#242424] rounded-[6px]"
        >
          <Receipt size={13} className="text-[#FF6F61]" />
          <span>Receipts</span>
        </button>
      </div>

      {/* Active Membership Banner */}
      <div className="bg-[#121212] p-3 rounded-[8px] border border-[#222222] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[6px] bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#E91E63]">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-[#666666] tracking-wider block">Current Membership</span>
            <span className="text-xs font-black text-white">{currentSub?.planName || 'Free Member'}</span>
          </div>
        </div>
        {currentSub?.expiresAt && (
          <span className="text-[10px] text-[#A0A0A0] bg-[#1A1A1A] px-2 py-0.5 rounded-[4px] border border-[#282828]">
            Valid until {new Date(currentSub.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Interactive Plan Selector Tabs */}
      <div className="grid grid-cols-4 gap-1.5 bg-[#121212] p-1 rounded-[8px] border border-[#1E1E1E]">
        {PLANS.map((plan) => {
          const isSelected = selectedPlanSlug === plan.slug;
          return (
            <button
              key={plan.slug}
              onClick={() => setSelectedPlanSlug(plan.slug)}
              className={`py-2 px-1 rounded-[6px] text-center transition-all cursor-pointer ${
                isSelected
                  ? plan.isHero
                    ? 'bg-gradient-to-r from-[#E91E63] to-[#FF6F61] text-white font-black shadow-md'
                    : 'bg-[#222222] text-white font-bold border border-[#333333]'
                  : 'text-[#777777] hover:text-white'
              }`}
            >
              <span className="text-xs block leading-tight">{plan.name}</span>
              <span className="text-[10px] opacity-80 block">{plan.price === 0 ? 'Free' : `₹${plan.price}`}</span>
            </button>
          );
        })}
      </div>

      {/* Focused Selected Plan Hero Showcase */}
      <div
        className={`rounded-[8px] p-4.5 border transition-all shadow-xl space-y-4 ${
          selectedPlan.isHero
            ? 'bg-gradient-to-b from-[#1C1117] via-[#141414] to-[#111111] border-[#E91E63]/70'
            : 'bg-[#121212] border-[#242424]'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            {selectedPlan.badge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E91E63] text-white text-[9px] font-black tracking-wider uppercase rounded-[4px] mb-1.5 shadow-sm">
                <Crown size={11} /> {selectedPlan.badge}
              </span>
            )}
            <h2 className="text-2xl font-black text-white tracking-tight">{selectedPlan.name}</h2>
            <p className="text-xs font-bold text-[#FF6F61] mt-0.5">{selectedPlan.tagline}</p>
          </div>

          <div className="text-right">
            <span className="text-3xl font-black text-white tracking-tight">
              {selectedPlan.price === 0 ? 'Free' : `₹${selectedPlan.price}`}
            </span>
            <span className="text-[10px] text-[#888888] block">/ {selectedPlan.duration}</span>
          </div>
        </div>

        {/* Feature Highlights Checklist */}
        <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
          {selectedPlan.highlights.map((feat, i) => (
            <div key={i} className="flex items-start gap-2.5 text-white/90">
              <div className="w-4 h-4 rounded-[3px] bg-[#E91E63]/20 flex items-center justify-center text-[#E91E63] flex-shrink-0 mt-0.5">
                <Check size={12} strokeWidth={3} />
              </div>
              <span className="leading-snug">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-[#121212] rounded-[8px] border border-[#202020] overflow-hidden shadow-lg">
        <div className="px-3.5 py-2.5 border-b border-[#1E1E1E] bg-[#141414]">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Plan Comparison</h3>
        </div>

        <div className="divide-y divide-[#1A1A1A] text-[11px]">
          {COMPARISON_ROWS.map((row, idx) => (
            <div key={idx} className="grid grid-cols-5 p-2.5 items-center">
              <span className="col-span-2 text-[#9E9E9E] font-medium pr-1">{row.label}</span>
              <span className="text-center text-[#666666]">{row.free}</span>
              <span className="text-center text-[#9E9E9E]">{row.plus}</span>
              <span className="text-center font-bold text-[#E91E63]">{row.pro}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Ergonomic Checkout Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-3 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-[#1C1C1C] z-30">
        <Button
          onClick={() => handleStartCheckout(selectedPlan)}
          disabled={isSelectedActive || selectedPlan.slug === 'free'}
          fullWidth
          size="lg"
          className="shadow-xl shadow-[#E91E63]/25"
        >
          {isSelectedActive
            ? 'Current Active Plan'
            : selectedPlan.slug === 'free'
            ? 'Free Membership'
            : `Subscribe to ${selectedPlan.name} — ₹${selectedPlan.price}`}
        </Button>
      </div>

      {/* Simulated Razorpay Checkout Bottom Sheet */}
      {checkoutPlan && (
        <BottomSheet isOpen={!!checkoutPlan} onClose={() => setCheckoutPlan(null)} title="Instant Checkout">
          <div className="space-y-4 pb-4">
            <div className="bg-[#141414] p-3.5 rounded-[8px] border border-[#242424] flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-white">{checkoutPlan.name} Membership</span>
                <span className="text-xs text-[#888888] block">{checkoutPlan.duration} Access</span>
              </div>
              <span className="text-2xl font-black text-[#E91E63]">₹{checkoutPlan.price}</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#888888]">UPI ID / VPA</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full h-11 px-3 bg-[#141414] border border-[#242424] rounded-[8px] text-white text-xs font-mono focus:outline-none focus:border-[#E91E63]"
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
                className="shadow-xl shadow-[#E91E63]/25"
              >
                Pay ₹{checkoutPlan.price} with UPI Intent
              </Button>
            )}

            <p className="text-[11px] text-[#666666] text-center">
              Razorpay sandbox test mode. Activates real database entitlements instantly.
            </p>
          </div>
        </BottomSheet>
      )}

      {/* Payment History Bottom Sheet */}
      {showHistory && (
        <BottomSheet isOpen={showHistory} onClose={() => setShowHistory(false)} title="Payment Invoices">
          <div className="space-y-2 pb-4 max-h-[60vh] overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#888888]">No payments recorded yet.</p>
            ) : (
              history.map((h) => (
                <div key={h.id} className="p-3 bg-[#141414] border border-[#222222] rounded-[8px] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{h.planName}</span>
                    <span className="text-[10px] text-[#666666] font-mono">{new Date(h.createdAt).toLocaleDateString()}</span>
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
