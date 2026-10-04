'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, User, ShieldCheck, Bell, CreditCard,
  FileText, LogOut, Trash2, SlidersHorizontal, Edit3, Shield, UserX, ExternalLink, HelpCircle
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

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
      <div className="flex-1 flex items-center justify-center text-xs text-[#71717A] bg-[#08080A]">
        Loading settings...
      </div>
    );
  }

  const primaryPhoto = userData?.profile?.photos?.[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

  return (
    <div className="flex-1 p-4 space-y-5 select-none bg-[#08080A]">
      {/* User Identity Banner */}
      <div className="bg-[#121216] p-4 rounded-[8px] border border-[#1E1E26] flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Avatar
            src={primaryPhoto}
            alt={userData?.profile?.name || 'TMD Member'}
            size="lg"
            verified={userData?.user.isVerified}
          />

          <div>
            <h2 className="tmd-h3 text-white">{userData?.profile?.name || 'TMD Member'}</h2>
            <p className="text-xs text-[#A1A1AA]">{userData?.profile?.city || 'Mumbai'}</p>
            <span className="tmd-metadata text-[#FF4D6D] mt-0.5 inline-block">
              {userData?.subscription.planName || 'Free Plan'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push('/app/settings/profile')}
          className="h-8 px-3 bg-[#1A1A22] border border-[#2D2D38] hover:border-[#FF1493] text-white text-xs font-bold rounded-[6px] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Edit3 size={13} className="text-[#FF1493]" />
          <span>Edit</span>
        </button>
      </div>

      {/* Structured Clean Settings Hierarchy */}
      <div className="space-y-4">
        {/* SECTION: ACCOUNT */}
        <div className="space-y-1">
          <span className="tmd-metadata text-[#71717A] px-1">Account</span>
          <div className="bg-[#121216] rounded-[8px] border border-[#1E1E26] divide-y divide-[#1E1E26] overflow-hidden">
            <button
              type="button"
              onClick={() => router.push('/app/settings/profile')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#1A1A22] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <User size={16} className="text-[#FF1493]" />
                <span>Profile & Photos</span>
              </div>
              <ChevronRight size={14} className="text-[#71717A]" />
            </button>

            <button
              type="button"
              onClick={() => router.push('/app/settings/verification')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#1A1A22] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-[#FF1493]" />
                <span>Face Verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#FF4D6D]">
                  {userData?.user.isVerified ? 'VERIFIED' : 'REQUEST'}
                </span>
                <ChevronRight size={14} className="text-[#71717A]" />
              </div>
            </button>
          </div>
        </div>

        {/* SECTION: DISCOVERY */}
        <div className="space-y-1">
          <span className="tmd-metadata text-[#71717A] px-1">Discovery</span>
          <div className="bg-[#121216] rounded-[8px] border border-[#1E1E26] divide-y divide-[#1E1E26] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPreferences(true)}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#1A1A22] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal size={16} className="text-[#FF4D6D]" />
                <span>Age & Distance Filters</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#A1A1AA]">
                <span>{prefs.minAge}-{prefs.maxAge} yrs</span>
                <ChevronRight size={14} />
              </div>
            </button>
          </div>
        </div>

        {/* SECTION: NOTIFICATIONS */}
        <div className="space-y-1">
          <span className="tmd-metadata text-[#71717A] px-1">Notifications</span>
          <div className="bg-[#121216] rounded-[8px] border border-[#1E1E26] divide-y divide-[#1E1E26] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#1A1A22] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Bell size={16} className="text-[#FF4D6D]" />
                <span>Push & In-App Alerts</span>
              </div>
              <ChevronRight size={14} className="text-[#71717A]" />
            </button>
          </div>
        </div>

        {/* SECTION: PRIVACY & SAFETY */}
        <div className="space-y-1">
          <span className="tmd-metadata text-[#71717A] px-1">Privacy & Safety</span>
          <div className="bg-[#121216] rounded-[8px] border border-[#1E1E26] divide-y divide-[#1E1E26] overflow-hidden">
            <button
              type="button"
              onClick={() => router.push('/app/settings/blocked')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#1A1A22] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <UserX size={16} className="text-[#EF4444]" />
                <span>Blocked Accounts</span>
              </div>
              <ChevronRight size={14} className="text-[#71717A]" />
            </button>

            <button
              type="button"
              onClick={() => router.push('/app/settings/report')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#1A1A22] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Shield size={16} className="text-[#FF4D6D]" />
                <span>Safety Center & Report</span>
              </div>
              <ChevronRight size={14} className="text-[#71717A]" />
            </button>
          </div>
        </div>

        {/* SECTION: SUBSCRIPTION */}
        <div className="space-y-1">
          <span className="tmd-metadata text-[#71717A] px-1">Subscription</span>
          <div className="bg-[#121216] rounded-[8px] border border-[#1E1E26] divide-y divide-[#1E1E26] overflow-hidden">
            <button
              type="button"
              onClick={() => router.push('/app/plan')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#1A1A22] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard size={16} className="text-[#FF1493]" />
                <span>Manage Plans & Upgrade</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#FF1493]">
                  {userData?.subscription.planName || 'Free'}
                </span>
                <ChevronRight size={14} className="text-[#71717A]" />
              </div>
            </button>
          </div>
        </div>

        {/* SECTION: LEGAL */}
        <div className="space-y-1">
          <span className="tmd-metadata text-[#71717A] px-1">Legal</span>
          <div className="bg-[#121216] rounded-[8px] border border-[#1E1E26] divide-y divide-[#1E1E26] overflow-hidden">
            <a
              href="/terms"
              target="_blank"
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#1A1A22] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-[#71717A]" />
                <span>Terms of Service</span>
              </div>
              <ExternalLink size={13} className="text-[#71717A]" />
            </a>

            <a
              href="/privacy"
              target="_blank"
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#1A1A22] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-[#71717A]" />
                <span>Privacy Policy</span>
              </div>
              <ExternalLink size={13} className="text-[#71717A]" />
            </a>

            <a
              href="/guidelines"
              target="_blank"
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-white hover:bg-[#1A1A22] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle size={16} className="text-[#71717A]" />
                <span>Community Guidelines</span>
              </div>
              <ExternalLink size={13} className="text-[#71717A]" />
            </a>
          </div>
        </div>

        {/* SECTION: ACCOUNT ACTIONS */}
        <div className="space-y-1 pt-2">
          <span className="tmd-metadata text-[#71717A] px-1">Actions</span>
          <div className="bg-[#121216] rounded-[8px] border border-[#1E1E26] divide-y divide-[#1E1E26] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowLogout(true)}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-[#A1A1AA] hover:text-white hover:bg-[#1A1A22] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LogOut size={16} />
                <span>Log Out</span>
              </div>
              <ChevronRight size={14} className="text-[#71717A]" />
            </button>

            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 size={16} />
                <span>Delete Account</span>
              </div>
              <ChevronRight size={14} className="text-[#EF4444]/60" />
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Bottom Sheet */}
      <BottomSheet isOpen={showPreferences} onClose={() => setShowPreferences(false)} title="Discovery Filters">
        <div className="space-y-3.5 pb-4">
          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Min Age"
              type="number"
              value={prefs.minAge}
              onChange={(e) => setPrefs({ ...prefs, minAge: parseInt(e.target.value) || 18 })}
              min={18}
              max={100}
            />
            <Input
              label="Max Age"
              type="number"
              value={prefs.maxAge}
              onChange={(e) => setPrefs({ ...prefs, maxAge: parseInt(e.target.value) || 35 })}
              min={18}
              max={100}
            />
          </div>

          <Input
            label="Preferred City"
            placeholder="e.g. Mumbai, Delhi, Bengaluru"
            value={prefs.preferredCity}
            onChange={(e) => setPrefs({ ...prefs, preferredCity: e.target.value })}
          />

          <Button onClick={handleSavePreferences} fullWidth size="lg">
            Save Preferences
          </Button>
        </div>
      </BottomSheet>

      {/* Notifications Bottom Sheet */}
      <BottomSheet isOpen={showNotifications} onClose={() => setShowNotifications(false)} title="Notification Settings">
        <div className="space-y-3 pb-4">
          {[
            { key: 'matches', label: 'New Matches', desc: 'When someone likes you back' },
            { key: 'messages', label: 'Chat Messages', desc: 'Realtime direct messages' },
            { key: 'likes', label: 'Admirers', desc: 'When someone likes your profile' },
            { key: 'events', label: 'Nightlife Events', desc: 'Event invites and updates' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-2.5 bg-[#1A1A22] rounded-[8px] border border-[#2D2D38]">
              <div>
                <span className="text-xs font-bold text-white block">{item.label}</span>
                <span className="text-[10px] text-[#A1A1AA]">{item.desc}</span>
              </div>
              <input
                type="checkbox"
                checked={(notifs as any)[item.key]}
                onChange={(e) => setNotifs({ ...notifs, [item.key]: e.target.checked })}
                className="w-4 h-4 rounded-[4px] accent-[#FF1493] cursor-pointer"
              />
            </div>
          ))}

          <Button onClick={handleSaveNotifications} fullWidth size="lg">
            Save Notification Alerts
          </Button>
        </div>
      </BottomSheet>

      {/* Logout Confirmation Dialog */}
      <Dialog
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        title="Log Out of TMD?"
        description="You will need your phone number or OTP to log back into your profile."
        confirmText="Log Out"
        cancelText="Cancel"
        confirmVariant="secondary"
        onConfirm={handleLogout}
      />

      {/* Delete Account Dialog */}
      <Dialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Your Account Permanently?"
        description="This action is irreversible. All your matches, messages, photos, and subscription benefits will be permanently wiped."
        confirmText="Delete Account"
        cancelText="Keep Account"
        confirmVariant="danger"
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
