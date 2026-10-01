'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, User, ShieldCheck, Bell, CreditCard,
  FileText, LogOut, Trash2, CheckCircle2, Sparkles, SlidersHorizontal, Edit3, Shield, UserX, ExternalLink, HelpCircle
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface UserData {
  user: { id: string; phone: string; email: string; role: string; status: string; isVerified: boolean };
  profile: { name: string; dob: string; gender: string; interestedIn: string; bio: string; profession: string; city: string; isComplete: boolean; photos?: any[] } | null;
  subscription: { planSlug: string; planName: string; expiresAt: string | null };
}

export default function SettingsPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [prefs, setPrefs] = useState({ minAge: 18, maxAge: 35, maxDistanceKm: '', preferredCity: '' });
  const [notifs, setNotifs] = useState({ matches: true, messages: true, likes: true, events: true, plans: true });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userRes, settingsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/settings'),
      ]);
      const uData = await userRes.json();
      const sData = await settingsRes.json();

      if (uData.success) setUserData(uData.data);
      if (sData.success) {
        const p = sData.data.preferences;
        const n = sData.data.notifications;
        setPrefs({
          minAge: p?.min_age || 18,
          maxAge: p?.max_age || 35,
          maxDistanceKm: p?.max_distance_km || '',
          preferredCity: p?.preferred_city || '',
        });
        setNotifs(n || { matches: true, messages: true, likes: true, events: true, plans: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleDeleteAccount = async () => {
    const res = await fetch('/api/account/delete', { method: 'POST' });
    if (res.ok) window.location.href = '/login';
  };

  const handleSavePreferences = async () => {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferences: {
          minAge: prefs.minAge,
          maxAge: prefs.maxAge,
          maxDistanceKm: prefs.maxDistanceKm ? parseInt(prefs.maxDistanceKm as string) : null,
          preferredCity: prefs.preferredCity || null,
        },
      }),
    });
    setShowPreferences(false);
  };

  const handleSaveNotifications = async () => {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications: notifs }),
    });
    setShowNotifications(false);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center text-xs text-[#888888]">
        Loading settings...
      </div>
    );
  }

  const primaryPhoto = userData?.profile?.photos?.[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

  return (
    <div className="min-h-[calc(100dvh-4rem)] px-4 py-4 space-y-5 select-none">
      {/* User Identity Banner */}
      <div className="bg-[#121212] p-4 rounded-[8px] border border-[#222222] flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-[8px] overflow-hidden bg-[#1E1E1E] border border-[#2A2A2A]">
              <img src={primaryPhoto} alt="" className="w-full h-full object-cover" />
            </div>
            {userData?.user.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-[4px] bg-[#E91E63] text-white flex items-center justify-center text-[9px] font-bold">
                ✓
              </div>
            )}
          </div>

          <div>
            <h2 className="text-base font-black text-white">{userData?.profile?.name || 'TMD Member'}</h2>
            <p className="text-xs text-[#888888]">{userData?.profile?.city || 'Mumbai'}</p>
            <span className="text-[10px] font-bold uppercase text-[#FF6F61] tracking-wider mt-0.5 inline-block">
              {userData?.subscription.planName || 'Free Plan'}
            </span>
          </div>
        </div>

        <button
          onClick={() => router.push('/app/settings/profile')}
          className="h-8 px-3 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#E91E63] text-white text-xs font-bold rounded-[6px] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Edit3 size={13} className="text-[#E91E63]" />
          <span>Edit</span>
        </button>
      </div>

      {/* Structured Clean Settings Hierarchy (Whitespace & Dividers) */}
      <div className="space-y-4">
        {/* SECTION: ACCOUNT */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider px-1">Account</span>
          <div className="bg-[#121212] rounded-[8px] border border-[#1E1E1E] divide-y divide-[#1A1A1A] overflow-hidden">
            <button
              onClick={() => router.push('/app/settings/profile')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#161616] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <User size={16} className="text-[#E91E63]" />
                <span>Profile & Photos</span>
              </div>
              <ChevronRight size={14} className="text-[#555555]" />
            </button>

            <button
              onClick={() => router.push('/app/settings/verification')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#161616] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-[#E91E63]" />
                <span>Face Verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#FF6F61]">
                  {userData?.user.isVerified ? 'VERIFIED' : 'REQUEST'}
                </span>
                <ChevronRight size={14} className="text-[#555555]" />
              </div>
            </button>
          </div>
        </div>

        {/* SECTION: DISCOVERY */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider px-1">Discovery</span>
          <div className="bg-[#121212] rounded-[8px] border border-[#1E1E1E] divide-y divide-[#1A1A1A] overflow-hidden">
            <button
              onClick={() => setShowPreferences(true)}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#161616] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal size={16} className="text-[#FF6F61]" />
                <span>Age & Distance Filters</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#777777]">
                <span>{prefs.minAge}-{prefs.maxAge} yrs</span>
                <ChevronRight size={14} />
              </div>
            </button>
          </div>
        </div>

        {/* SECTION: NOTIFICATIONS */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider px-1">Notifications</span>
          <div className="bg-[#121212] rounded-[8px] border border-[#1E1E1E] divide-y divide-[#1A1A1A] overflow-hidden">
            <button
              onClick={() => setShowNotifications(true)}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#161616] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Bell size={16} className="text-[#FF6F61]" />
                <span>Push & In-App Alerts</span>
              </div>
              <ChevronRight size={14} className="text-[#555555]" />
            </button>
          </div>
        </div>

        {/* SECTION: PRIVACY & SAFETY */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider px-1">Privacy & Safety</span>
          <div className="bg-[#121212] rounded-[8px] border border-[#1E1E1E] divide-y divide-[#1A1A1A] overflow-hidden">
            <button
              onClick={() => router.push('/app/settings/blocked')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#161616] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <UserX size={16} className="text-[#EF4444]" />
                <span>Blocked Accounts</span>
              </div>
              <ChevronRight size={14} className="text-[#555555]" />
            </button>

            <button
              onClick={() => router.push('/app/settings/report')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#161616] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Shield size={16} className="text-[#FF6F61]" />
                <span>Safety Center & Report</span>
              </div>
              <ChevronRight size={14} className="text-[#555555]" />
            </button>
          </div>
        </div>

        {/* SECTION: SUBSCRIPTION */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider px-1">Subscription</span>
          <div className="bg-[#121212] rounded-[8px] border border-[#1E1E1E] divide-y divide-[#1A1A1A] overflow-hidden">
            <button
              onClick={() => router.push('/app/plan')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#161616] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard size={16} className="text-[#E91E63]" />
                <span>Manage Plans & Upgrade</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#E91E63]">
                  {userData?.subscription.planName || 'Free'}
                </span>
                <ChevronRight size={14} className="text-[#555555]" />
              </div>
            </button>
          </div>
        </div>

        {/* SECTION: LEGAL */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider px-1">Legal</span>
          <div className="bg-[#121212] rounded-[8px] border border-[#1E1E1E] divide-y divide-[#1A1A1A] overflow-hidden">
            <a
              href="/terms"
              target="_blank"
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#161616] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-[#888888]" />
                <span>Terms of Service</span>
              </div>
              <ExternalLink size={13} className="text-[#555555]" />
            </a>

            <a
              href="/privacy"
              target="_blank"
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#161616] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-[#888888]" />
                <span>Privacy Policy</span>
              </div>
              <ExternalLink size={13} className="text-[#555555]" />
            </a>

            <a
              href="/guidelines"
              target="_blank"
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#161616] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle size={16} className="text-[#888888]" />
                <span>Community Guidelines</span>
              </div>
              <ExternalLink size={13} className="text-[#555555]" />
            </a>
          </div>
        </div>

        {/* SECTION: ACCOUNT ACTIONS */}
        <div className="space-y-1 pt-2">
          <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider px-1">Account Actions</span>
          <div className="bg-[#121212] rounded-[8px] border border-[#1E1E1E] divide-y divide-[#1A1A1A] overflow-hidden">
            <button
              onClick={() => setShowLogout(true)}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-bold text-[#FF6F61] hover:bg-[#161616] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LogOut size={16} />
                <span>Log Out</span>
              </div>
            </button>

            <button
              onClick={() => setShowDelete(true)}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-bold text-[#EF4444] hover:bg-[#161616] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 size={16} />
                <span>Delete Account</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Discovery Preferences Sheet */}
      {showPreferences && (
        <BottomSheet isOpen={showPreferences} onClose={() => setShowPreferences(false)} title="Discovery Filters">
          <div className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Min Age"
                type="number"
                value={prefs.minAge}
                onChange={(e) => setPrefs({ ...prefs, minAge: parseInt(e.target.value) || 18 })}
                min="18"
                max="99"
              />
              <Input
                label="Max Age"
                type="number"
                value={prefs.maxAge}
                onChange={(e) => setPrefs({ ...prefs, maxAge: parseInt(e.target.value) || 50 })}
                min="18"
                max="99"
              />
            </div>

            <Input
              label="Preferred City"
              placeholder="e.g. Mumbai, Delhi, Bangalore"
              value={prefs.preferredCity}
              onChange={(e) => setPrefs({ ...prefs, preferredCity: e.target.value })}
            />

            <Button onClick={handleSavePreferences} fullWidth size="lg">
              Save Filters
            </Button>
          </div>
        </BottomSheet>
      )}

      {/* Notifications Sheet */}
      {showNotifications && (
        <BottomSheet isOpen={showNotifications} onClose={() => setShowNotifications(false)} title="Notification Alerts">
          <div className="space-y-3 pb-4">
            {Object.entries(notifs).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between p-3 bg-[#141414] border border-[#222222] rounded-[8px] cursor-pointer">
                <span className="text-xs font-semibold text-white capitalize">{key} Alerts</span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotifs({ ...notifs, [key]: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#E91E63]"
                />
              </label>
            ))}

            <Button onClick={handleSaveNotifications} fullWidth size="lg" className="mt-2">
              Save Alerts
            </Button>
          </div>
        </BottomSheet>
      )}

      {/* Logout Dialog */}
      <Dialog
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        title="Log Out of TMD"
        description="Are you sure you want to log out of your session on this device?"
        confirmText="Log Out"
        confirmVariant="secondary"
        onConfirm={handleLogout}
      />

      {/* Delete Account Dialog */}
      <Dialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Your Account"
        description="This action is permanent. All your matches, messages, photos, and subscription entitlements will be permanently erased."
        confirmText="Permanently Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
