'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface OnboardingData {
  dob: string;
  ageConfirmed: boolean;
  gender: string;
  interestedIn: string;
  name: string;
  photos: File[];
  city: string;
  bio: string;
  profession: string;
  education: string;
  heightCm: string;
  relationshipIntention: string;
  termsAccepted: boolean;
}

const STEPS = ['dob', 'gender', 'interestedIn', 'name', 'photos', 'city', 'details', 'intention', 'terms'] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<OnboardingData>({
    dob: '',
    ageConfirmed: false,
    gender: '',
    interestedIn: '',
    name: '',
    photos: [],
    city: '',
    bio: '',
    profession: '',
    education: '',
    heightCm: '',
    relationshipIntention: '',
    termsAccepted: false,
  });

  const currentStep = STEPS[step];
  const totalSteps = STEPS.length;

  const calculateAge = (dob: string) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'dob': return !!data.dob && calculateAge(data.dob) >= 18 && data.ageConfirmed;
      case 'gender': return !!data.gender;
      case 'interestedIn': return !!data.interestedIn;
      case 'name': return data.name.trim().length >= 2;
      case 'photos': return data.photos.length >= 1;
      case 'city': return data.city.trim().length >= 2;
      case 'details': return true;
      case 'intention': return true;
      case 'terms': return data.termsAccepted;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      data.photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const photoRes = await fetch('/api/profile/photos', { method: 'POST', body: formData });
      if (!photoRes.ok) throw new Error('Failed to upload photos');

      const profileRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          dob: data.dob,
          gender: data.gender,
          interestedIn: data.interestedIn,
          city: data.city.trim(),
          bio: data.bio.trim() || null,
          profession: data.profession.trim() || null,
          education: data.education.trim() || null,
          heightCm: data.heightCm ? parseInt(data.heightCm) : null,
          relationshipIntention: data.relationshipIntention || null,
        }),
      });

      if (!profileRes.ok) {
        const errData = await profileRes.json();
        throw new Error(errData.error || 'Failed to create profile');
      }

      window.location.href = '/app';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (data.photos.length + files.length > 6) {
      setError('Maximum 6 photos allowed');
      return;
    }
    setData({ ...data, photos: [...data.photos, ...files] });
  };

  const handlePhotoRemove = (index: number) => {
    setData({ ...data, photos: data.photos.filter((_, i) => i !== index) });
  };

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'other', label: 'Other' },
  ];

  const interestedInOptions = [
    { value: 'men', label: 'Men' },
    { value: 'women', label: 'Women' },
    { value: 'everyone', label: 'Everyone' },
  ];

  const intentionOptions = [
    { value: 'long_term', label: 'Long-term relationship' },
    { value: 'short_term', label: 'Short-term / casual' },
    { value: 'friendship', label: 'Friendship' },
    { value: 'not_sure', label: 'Not sure yet' },
  ];

  return (
    <div className="min-h-dvh flex flex-col justify-between px-4 py-8 max-w-md mx-auto select-none bg-[#08080A]">
      {/* Progress Bars */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-[2px] transition-colors ${
              i <= step ? 'bg-[#FF1493]' : 'bg-[#1E1E26]'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col justify-center">
        {currentStep === 'dob' && (
          <div className="space-y-6">
            <div>
              <h2 className="tmd-h1 text-white">When's your birthday?</h2>
              <p className="tmd-body-small text-[#A1A1AA] mt-1">You must be at least 18 to use TMD</p>
            </div>
            <Input
              type="date"
              value={data.dob}
              onChange={(e) => setData({ ...data, dob: e.target.value })}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
            />
            {data.dob && calculateAge(data.dob) < 18 && (
              <p className="text-[#EF4444] text-xs font-semibold">You must be at least 18 years old to join</p>
            )}
            {data.dob && calculateAge(data.dob) >= 18 && (
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#121216] rounded-[8px] border border-[#1E1E26]">
                <input
                  type="checkbox"
                  checked={data.ageConfirmed}
                  onChange={(e) => setData({ ...data, ageConfirmed: e.target.checked })}
                  className="w-4 h-4 rounded-[4px] accent-[#FF1493]"
                />
                <span className="text-xs text-white font-medium">I confirm that I am 18 years of age or older</span>
              </label>
            )}
          </div>
        )}

        {currentStep === 'gender' && (
          <div className="space-y-6">
            <h2 className="tmd-h1 text-white">I am</h2>
            <div className="space-y-2.5">
              {genderOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setData({ ...data, gender: opt.value })}
                  className={`w-full p-4 rounded-[8px] border text-left text-sm font-semibold transition-colors cursor-pointer ${
                    data.gender === opt.value
                      ? 'border-[#FF1493] bg-[#FF1493]/15 text-white'
                      : 'border-[#1E1E26] bg-[#121216] text-[#A1A1AA] hover:border-[#2D2D38]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'interestedIn' && (
          <div className="space-y-6">
            <h2 className="tmd-h1 text-white">Interested in</h2>
            <div className="space-y-2.5">
              {interestedInOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setData({ ...data, interestedIn: opt.value })}
                  className={`w-full p-4 rounded-[8px] border text-left text-sm font-semibold transition-colors cursor-pointer ${
                    data.interestedIn === opt.value
                      ? 'border-[#FF1493] bg-[#FF1493]/15 text-white'
                      : 'border-[#1E1E26] bg-[#121216] text-[#A1A1AA] hover:border-[#2D2D38]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'name' && (
          <div className="space-y-6">
            <div>
              <h2 className="tmd-h1 text-white">What's your name?</h2>
              <p className="tmd-body-small text-[#A1A1AA] mt-1">This is how you'll appear on TMD</p>
            </div>
            <Input
              placeholder="Your first name"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              maxLength={50}
              autoFocus
            />
          </div>
        )}

        {currentStep === 'photos' && (
          <div className="space-y-6">
            <div>
              <h2 className="tmd-h1 text-white">Add your photos</h2>
              <p className="tmd-body-small text-[#A1A1AA] mt-1">Upload at least 1 photo (max 6). First is your cover.</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {data.photos.map((photo, i) => (
                <div key={i} className="aspect-[3/4] rounded-[8px] overflow-hidden relative bg-[#121216] border border-[#1E1E26]">
                  <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handlePhotoRemove(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/80 rounded-[4px] flex items-center justify-center text-white text-xs cursor-pointer"
                  >
                    ×
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-[#FF1493] px-1.5 py-0.5 rounded-[4px] text-white font-bold">
                      COVER
                    </span>
                  )}
                </div>
              ))}
              {data.photos.length < 6 && (
                <label className="aspect-[3/4] rounded-[8px] border-2 border-dashed border-[#2D2D38] hover:border-[#FF1493] flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#121216]">
                  <span className="text-2xl text-[#71717A]">+</span>
                  <span className="text-xs text-[#71717A] mt-1">Add photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoAdd} multiple />
                </label>
              )}
            </div>
          </div>
        )}

        {currentStep === 'city' && (
          <div className="space-y-6">
            <h2 className="tmd-h1 text-white">Where do you live?</h2>
            <Input
              placeholder="e.g. Mumbai, Delhi, Bengaluru"
              value={data.city}
              onChange={(e) => setData({ ...data, city: e.target.value })}
              autoFocus
            />
          </div>
        )}

        {currentStep === 'details' && (
          <div className="space-y-6">
            <div>
              <h2 className="tmd-h1 text-white">Tell us more</h2>
              <p className="tmd-body-small text-[#A1A1AA] mt-1">Optional details that help you get better matches</p>
            </div>
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-1.5">Bio</label>
                <textarea
                  value={data.bio}
                  onChange={(e) => setData({ ...data, bio: e.target.value })}
                  placeholder="A little about your vibe..."
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-[#121216] border border-[#1E1E26] rounded-[8px] text-white placeholder-[#71717A] text-xs focus:outline-none focus:border-[#FF1493] resize-none"
                />
              </div>
              <Input
                label="Profession"
                placeholder="What do you do?"
                value={data.profession}
                onChange={(e) => setData({ ...data, profession: e.target.value })}
              />
              <Input
                label="Education"
                placeholder="Where did you study?"
                value={data.education}
                onChange={(e) => setData({ ...data, education: e.target.value })}
              />
              <Input
                label="Height (cm)"
                type="number"
                placeholder="175"
                value={data.heightCm}
                onChange={(e) => setData({ ...data, heightCm: e.target.value })}
                min={100}
                max={250}
              />
            </div>
          </div>
        )}

        {currentStep === 'intention' && (
          <div className="space-y-6">
            <h2 className="tmd-h1 text-white">What are you looking for?</h2>
            <div className="space-y-2.5">
              {intentionOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setData({ ...data, relationshipIntention: data.relationshipIntention === opt.value ? '' : opt.value })}
                  className={`w-full p-4 rounded-[8px] border text-left text-sm font-semibold transition-colors cursor-pointer ${
                    data.relationshipIntention === opt.value
                      ? 'border-[#FF1493] bg-[#FF1493]/15 text-white'
                      : 'border-[#1E1E26] bg-[#121216] text-[#A1A1AA] hover:border-[#2D2D38]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'terms' && (
          <div className="space-y-6">
            <h2 className="tmd-h1 text-white">Almost there!</h2>
            <div className="space-y-3 text-xs text-[#A1A1AA] bg-[#121216] p-4 rounded-[8px] border border-[#1E1E26]">
              <p>By creating your TMD account, you agree to our policies:</p>
              <ul className="space-y-1.5">
                <li>• <a href="/terms" target="_blank" className="text-[#FF1493] hover:underline">Terms & Conditions</a></li>
                <li>• <a href="/privacy" target="_blank" className="text-[#FF1493] hover:underline">Privacy Policy</a></li>
                <li>• <a href="/guidelines" target="_blank" className="text-[#FF1493] hover:underline">Community Guidelines</a></li>
              </ul>
            </div>
            <label className="flex items-start gap-3 cursor-pointer p-3 bg-[#121216] rounded-[8px] border border-[#1E1E26]">
              <input
                type="checkbox"
                checked={data.termsAccepted}
                onChange={(e) => setData({ ...data, termsAccepted: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded-[4px] accent-[#FF1493]"
              />
              <span className="text-xs text-white">I agree to the Terms & Conditions and Privacy Policy</span>
            </label>
          </div>
        )}
      </div>

      {/* Error Notice */}
      {error && <p className="text-[#EF4444] text-xs font-semibold text-center my-4">{error}</p>}

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="secondary" onClick={handleBack}>
            Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          loading={loading}
          fullWidth
          size="lg"
        >
          {step === totalSteps - 1 ? 'Create Profile' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
