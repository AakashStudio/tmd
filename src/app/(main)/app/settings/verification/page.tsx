'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ShieldCheck, Clock, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function VerificationPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [latestRequest, setLatestRequest] = useState<any>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/verification');
      const data = await res.json();
      if (data.success) {
        setIsVerified(data.data.isVerified);
        setLatestRequest(data.data.latestRequest);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selfieFile) {
      showToast('Please take or upload a selfie', 'error');
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append('selfie', selfieFile);

    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showToast('Verification submitted', 'success');
        setSelfieFile(null);
        setPreviewUrl(null);
        loadStatus();
      } else {
        showToast(data.error || 'Submission failed', 'error');
      }
    } catch (err) {
      showToast('Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-xs text-[#71717A]">Loading status...</div>;
  }

  return (
    <div className="flex-1 p-4 select-none bg-[#08080A]">
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => router.push('/app/settings')}
          className="w-8 h-8 rounded-[6px] bg-[#121216] border border-[#1E1E26] flex items-center justify-center text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="tmd-h3 text-white">Face Verification</h1>
      </div>

      {isVerified ? (
        <div className="bg-[#121216] rounded-[8px] p-6 border border-[#1E1E26] text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="tmd-h2 text-white">You're Verified</h2>
          <p className="tmd-body-small text-[#A1A1AA]">
            Your profile has received the Verified badge. Other members can see that you completed official TMD verification.
          </p>
        </div>
      ) : latestRequest?.status === 'pending' ? (
        <div className="bg-[#121216] rounded-[8px] p-6 border border-[#1E1E26] text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center mx-auto">
            <Clock size={36} />
          </div>
          <h2 className="tmd-h2 text-white">Verification in Review</h2>
          <p className="tmd-body-small text-[#A1A1AA]">
            Our moderation team is reviewing your selfie. This typically takes under 2 hours.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#121216] rounded-[8px] p-4 border border-[#1E1E26] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF1493]/15 text-[#FF1493] flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Get Verified Badge</h3>
                <p className="text-[11px] text-[#A1A1AA]">Prove you're real to receive 3x more matches</p>
              </div>
            </div>

            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Upload a clear selfie showing your face. Our system verifies that your photo matches your dating profile.
            </p>

            <label className="block aspect-video rounded-[8px] border-2 border-dashed border-[#2D2D38] hover:border-[#FF1493] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative bg-[#1A1A22] transition-colors">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-[#71717A]">
                  <Camera size={28} />
                  <span className="text-xs font-semibold mt-2">Take or Upload Selfie</span>
                </div>
              )}
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!selfieFile}
            fullWidth
            size="lg"
          >
            Submit for Verification
          </Button>
        </div>
      )}
    </div>
  );
}
