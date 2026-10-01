'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, X, Lock, CheckCircle2, Camera, ShieldCheck, Sparkles,
  MapPin, Briefcase, GraduationCap, Heart, Check, Eye, Edit3, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';

interface ProfilePhoto {
  id: string;
  url: string;
  position: number;
  isPrimary: boolean;
  moderationStatus: string;
}

const INTENTIONS = [
  { value: 'long_term', label: 'Long-term relationship' },
  { value: 'short_term', label: 'Short-term / casual' },
  { value: 'friendship', label: 'Friendship' },
  { value: 'not_sure', label: 'Not sure yet' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planSlug, setPlanSlug] = useState('free');
  const [isVerified, setIsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0);

  const [showDobModal, setShowDobModal] = useState(false);
  const [requestedDob, setRequestedDob] = useState('');
  const [dobReason, setDobReason] = useState('');
  const [submittingDob, setSubmittingDob] = useState(false);

  const [form, setForm] = useState({
    name: '',
    dob: '',
    age: 0,
    gender: '',
    interestedIn: '',
    city: '',
    bio: '',
    profession: '',
    education: '',
    heightCm: '',
    relationshipIntention: '',
  });

  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [profileRes, meRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/auth/me'),
      ]);
      const pData = await profileRes.json();
      const meData = await meRes.json();

      if (meData.success && meData.data) {
        if (meData.data.subscription) {
          setPlanSlug(meData.data.subscription.planSlug || 'free');
        }
        if (meData.data.user) {
          setIsVerified(meData.data.user.isVerified || false);
        }
      }

      if (pData.success && pData.data) {
        const p = pData.data;
        setForm({
          name: p.name || '',
          dob: p.dob ? p.dob.split('T')[0] : '',
          age: p.age || 0,
          gender: p.gender || '',
          interestedIn: p.interested_in || '',
          city: p.city || '',
          bio: p.bio || '',
          profession: p.profession || '',
          education: p.education || '',
          heightCm: p.height_cm ? p.height_cm.toString() : '',
          relationshipIntention: p.relationship_intention || '',
        });
        setPhotos(p.photos || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (photos.length + files.length > 6) {
      showToast('Maximum 6 photos allowed', 'error');
      return;
    }

    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));

    try {
      const res = await fetch('/api/profile/photos', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showToast('Photo added', 'success');
        loadProfile();
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      showToast('Upload failed', 'error');
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    if (photos.length <= 1) {
      showToast('You must maintain at least 1 photo', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/profile/photos?id=${photoId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Photo removed', 'success');
        loadProfile();
      } else {
        showToast(data.error || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        city: form.city.trim(),
        bio: form.bio.trim() || null,
        profession: form.profession.trim() || null,
        education: form.education.trim() || null,
        heightCm: form.heightCm ? parseInt(form.heightCm) : null,
        relationshipIntention: form.relationshipIntention || null,
      };

      if (planSlug === 'pro_499') {
        payload.name = form.name.trim();
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Dating profile updated', 'success');
      } else {
        showToast(data.error || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDobCorrectionSubmit = async () => {
    if (!requestedDob) {
      showToast('Please pick a date of birth', 'error');
      return;
    }
    setSubmittingDob(true);
    try {
      const res = await fetch('/api/profile/dob-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedDob, reason: dobReason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('DOB correction request submitted', 'success');
        setShowDobModal(false);
        setRequestedDob('');
        setDobReason('');
      } else {
        showToast(data.error || 'Submission failed', 'error');
      }
    } catch (err) {
      showToast('Submission failed', 'error');
    } finally {
      setSubmittingDob(false);
    }
  };

  const isPro = planSlug === 'pro_499';

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center text-xs text-[#888888]">
        Loading dating profile...
      </div>
    );
  }

  const primaryPhoto = photos[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="min-h-[calc(100dvh-4rem)] px-4 py-4 space-y-4 select-none pb-24 bg-[#0A0A0A]">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push('/app/settings')}
            className="w-8 h-8 rounded-[6px] bg-[#141414] border border-[#242424] flex items-center justify-center text-[#9E9E9E] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Dating Profile</h1>
            <p className="text-[11px] text-[#888888]">Your public persona</p>
          </div>
        </div>

        {/* View Switcher: Edit vs Preview */}
        <div className="flex bg-[#141414] p-0.5 rounded-[6px] border border-[#242424]">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-2.5 py-1 rounded-[4px] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'edit' ? 'bg-[#E91E63] text-white shadow-sm' : 'text-[#888888] hover:text-white'
            }`}
          >
            <Edit3 size={12} /> Edit
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-2.5 py-1 rounded-[4px] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'preview' ? 'bg-[#E91E63] text-white shadow-sm' : 'text-[#888888] hover:text-white'
            }`}
          >
            <Eye size={12} /> Preview
          </button>
        </div>
      </div>

      {/* MODE 1: LIVE PROFILE CARD PREVIEW (What others see on Discovery) */}
      {activeTab === 'preview' && (
        <div className="space-y-3 animate-fade-in">
          <div className="relative aspect-[3/4] w-full rounded-[8px] overflow-hidden bg-[#141414] border border-[#242424] shadow-2xl">
            <img
              src={photos[previewPhotoIndex]?.url || primaryPhoto}
              alt=""
              className="w-full h-full object-cover object-top"
            />

            {/* Story Bars */}
            {photos.length > 1 && (
              <div className="absolute top-2.5 left-0 right-0 flex justify-center gap-1.5 px-3 z-30">
                {photos.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 max-w-12 rounded-[2px] transition-all ${
                      i === previewPhotoIndex ? 'bg-white shadow-sm' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Tap zones for photo preview */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-0 top-0 w-1/2 h-3/4 z-20 opacity-0 cursor-pointer"
                  onClick={() => setPreviewPhotoIndex(Math.max(0, previewPhotoIndex - 1))}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 w-1/2 h-3/4 z-20 opacity-0 cursor-pointer"
                  onClick={() => setPreviewPhotoIndex(Math.min(photos.length - 1, previewPhotoIndex + 1))}
                />
              </>
            )}

            {/* Scrim Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/50 to-transparent pointer-events-none" />

            {/* Information Layer Over Photo */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20 space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                  {form.name}, <span className="font-normal">{form.age}</span>
                </h2>
                {isVerified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-black bg-[#E91E63] text-white px-1.5 py-0.5 rounded-[4px]">
                    <Check size={10} strokeWidth={3} /> VERIFIED
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-xs text-white/90">
                <span className="flex items-center gap-1 font-semibold">
                  <MapPin size={13} className="text-[#FF6F61]" /> {form.city || 'Location'}
                </span>
                {form.profession && (
                  <>
                    <span className="text-white/40">•</span>
                    <span className="flex items-center gap-1 truncate text-white/85">
                      <Briefcase size={13} className="text-[#A0A0A0]" /> {form.profession}
                    </span>
                  </>
                )}
              </div>

              {form.bio && (
                <p className="text-xs text-white/90 font-normal leading-relaxed line-clamp-3 pt-1 border-t border-white/10">
                  {form.bio}
                </p>
              )}

              {form.relationshipIntention && (
                <div className="pt-1">
                  <span className="text-[11px] font-semibold bg-white/15 backdrop-blur-md text-white px-2.5 py-0.5 rounded-[6px] inline-block">
                    {INTENTIONS.find((i) => i.value === form.relationshipIntention)?.label || form.relationshipIntention}
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-[#666666] text-center">
            Tap left/right to view your photos exactly as other members see them.
          </p>
        </div>
      )}

      {/* MODE 2: EDIT DATING IDENTITY FORM */}
      {activeTab === 'edit' && (
        <div className="space-y-5 animate-fade-in">
          {/* Photos Showcase (Hero 1st slot + 5 secondary slots) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#888888] uppercase tracking-wider">
                Photo Gallery ({photos.length}/6)
              </span>
              <span className="text-[10px] text-[#FF6F61] font-semibold">Slot 1 is your cover photo</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className={`rounded-[8px] overflow-hidden relative bg-[#141414] border border-[#242424] ${
                    idx === 0 ? 'col-span-2 row-span-2 aspect-[3/4]' : 'aspect-square'
                  }`}
                >
                  <img src={photo.url} alt="" className="w-full h-full object-cover object-top" />
                  <button
                    onClick={() => handlePhotoDelete(photo.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/80 rounded-[4px] flex items-center justify-center text-white hover:bg-[#EF4444] transition-colors cursor-pointer"
                    aria-label="Remove photo"
                  >
                    <X size={13} />
                  </button>
                  {photo.isPrimary && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-black bg-[#E91E63] px-2 py-0.5 rounded-[4px] text-white tracking-wider">
                      PRIMARY COVER
                    </span>
                  )}
                </div>
              ))}

              {photos.length < 6 && (
                <label className="aspect-square rounded-[8px] border-2 border-dashed border-[#262626] hover:border-[#E91E63] flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#121212]">
                  <Plus size={20} className="text-[#666666]" />
                  <span className="text-[10px] text-[#666666] mt-1 font-semibold">Add Photo</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
          </div>

          {/* Verification Badge Status */}
          <div className="bg-[#121212] p-3 rounded-[8px] border border-[#202020] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={20} className={isVerified ? 'text-[#10B981]' : 'text-[#E91E63]'} />
              <div>
                <span className="text-xs font-bold text-white block">
                  {isVerified ? 'Verified Profile Active' : 'Get Verified Badge'}
                </span>
                <span className="text-[10px] text-[#888888]">
                  {isVerified ? 'Your identity is authenticated' : 'Verified profiles get 3x more matches'}
                </span>
              </div>
            </div>

            {!isVerified && (
              <button
                onClick={() => router.push('/app/settings/verification')}
                className="text-xs font-bold text-[#E91E63] hover:underline"
              >
                Verify →
              </button>
            )}
          </div>

          {/* Core Identity Section */}
          <div className="bg-[#121212] p-4 rounded-[8px] border border-[#202020] space-y-3.5">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Core Identity</h3>

            {/* Display Name */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#888888]">Display Name</label>
                {!isPro && (
                  <span className="text-[10px] text-[#FF6F61] flex items-center gap-1 font-bold">
                    <Lock size={11} /> Pro Tier Required
                  </span>
                )}
              </div>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={!isPro}
                placeholder="First Name"
              />
            </div>

            {/* Date of Birth & Age (Locked per spec) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#888888]">Date of Birth (Age {form.age})</label>
                <button
                  onClick={() => setShowDobModal(true)}
                  className="text-[11px] text-[#E91E63] font-bold hover:underline"
                >
                  Correction Request
                </button>
              </div>
              <div className="relative">
                <Input value={form.dob} disabled className="opacity-75" />
                <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666]" />
              </div>
            </div>

            {/* City */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#888888]">Current City</label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Mumbai, Delhi, Bengaluru"
              />
            </div>
          </div>

          {/* About Me / Bio Section */}
          <div className="bg-[#121212] p-4 rounded-[8px] border border-[#202020] space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">About You</h3>
              <span className="text-[10px] text-[#555555]">{form.bio.length}/500</span>
            </div>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              maxLength={500}
              placeholder="What makes you laugh? What's your ideal Friday night in the city?"
              className="w-full px-3 py-2 bg-[#141414] border border-[#242424] rounded-[8px] text-white text-xs placeholder-[#555555] focus:outline-none focus:border-[#E91E63] resize-none"
            />
          </div>

          {/* Profession & Lifestyle */}
          <div className="bg-[#121212] p-4 rounded-[8px] border border-[#202020] space-y-3">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Career & Education</h3>

            <div className="grid grid-cols-2 gap-2.5">
              <Input
                label="Profession"
                value={form.profession}
                onChange={(e) => setForm({ ...form, profession: e.target.value })}
                placeholder="e.g. Architect"
              />
              <Input
                label="Education"
                value={form.education}
                onChange={(e) => setForm({ ...form, education: e.target.value })}
                placeholder="e.g. DU, IIT"
              />
            </div>

            <Input
              label="Height (cm)"
              type="number"
              value={form.heightCm}
              onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
              placeholder="175"
              min="100"
              max="250"
            />
          </div>

          {/* Relationship Intention */}
          <div className="bg-[#121212] p-4 rounded-[8px] border border-[#202020] space-y-2.5">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Looking For</h3>
            <div className="grid grid-cols-2 gap-2">
              {INTENTIONS.map((opt) => {
                const isSelected = form.relationshipIntention === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, relationshipIntention: opt.value })}
                    className={`p-2.5 rounded-[8px] border text-left text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#E91E63]/15 border-[#E91E63] text-white shadow-sm'
                        : 'bg-[#141414] border-[#242424] text-[#888888] hover:border-[#333333]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-3 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-[#1C1C1C] z-30">
        <Button onClick={handleSave} loading={saving} fullWidth size="lg" className="shadow-xl shadow-[#E91E63]/25">
          Save Dating Profile
        </Button>
      </div>

      {/* DOB Correction Request Bottom Sheet */}
      {showDobModal && (
        <BottomSheet isOpen={showDobModal} onClose={() => setShowDobModal(false)} title="DOB Correction Request">
          <div className="space-y-4 pb-4">
            <p className="text-xs text-[#888888] leading-relaxed">
              Date of birth is strictly locked per TMD's 18+ policy. Corrections require admin review.
            </p>

            <Input
              label="Correct Date of Birth"
              type="date"
              value={requestedDob}
              onChange={(e) => setRequestedDob(e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
            />

            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">Reason for Correction</label>
              <textarea
                value={dobReason}
                onChange={(e) => setDobReason(e.target.value)}
                placeholder="e.g. Typo during mobile signup"
                rows={3}
                className="w-full px-3 py-2 bg-[#141414] border border-[#242424] rounded-[8px] text-white text-xs placeholder-[#555555] focus:outline-none focus:border-[#E91E63] resize-none"
              />
            </div>

            <Button onClick={handleDobCorrectionSubmit} loading={submittingDob} fullWidth size="lg">
              Submit to Support
            </Button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
