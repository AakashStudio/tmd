'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ShieldCheck, Clock, XCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
    return <div className="p-6 text-center text-[#9E9E9E]">Loading status...</div>;
  }

  return (
    <div className="min-h-[calc(100dvh-5rem)] px-4 py-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/app/settings')} className="text-[#9E9E9E] hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Face Verification</h1>
      </div>

      {isVerified ? (
        <div className="bg-[#1A1A1A] rounded-[8px] p-6 border border-[#2E2E2E] text-center space-y-4">
          <div className="w-16 h-16 rounded-[8px] bg-[#4CAF50]/15 text-[#4CAF50] flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-lg font-bold">You're Verified</h2>
          <p className="text-sm text-[#9E9E9E]">
            Your profile has received the Verified badge. Other members can see that you completed official TMD verification.
          </p>
        </div>
      ) : latestRequest?.status === 'pending' ? (
        <div className="bg-[#1A1A1A] rounded-[8px] p-6 border border-[#2E2E2E] text-center space-y-4">
          <div className="w-16 h-16 rounded-[8px] bg-[#FF9800]/15 text-[#FF9800] flex items-center justify-center mx-auto">
            <Clock size={36} />
          </div>
          <h2 className="text-lg font-bold">Verification Pending</h2>
          <p className="text-sm text-[#9E9E9E]">
            Your selfie is currently being reviewed by our moderation team. You'll be notified once review completes.
          </p>
          <Badge variant="warning">Under Review</Badge>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#1A1A1A] rounded-[8px] p-5 border border-[#2E2E2E] space-y-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-[#E91E63]" size={28} />
              <div>
                <h3 className="font-semibold text-sm">Get the Verified Badge</h3>
                <p className="text-xs text-[#9E9E9E]">Build trust and get up to 3x more matches</p>
              </div>
            </div>
            {latestRequest?.status === 'rejected' && (
              <div className="p-3 bg-[#F44336]/10 border border-[#F44336]/30 rounded-[8px] flex items-center gap-2 text-xs text-[#F44336]">
                <XCircle size={16} className="flex-shrink-0" />
                <span>Previous submission was rejected: {latestRequest.notes || 'Please provide a clearer front-facing selfie.'}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#9E9E9E]">Selfie Photo</label>
            {previewUrl ? (
              <div className="aspect-[3/4] max-w-xs mx-auto rounded-[8px] overflow-hidden border border-[#2E2E2E] relative bg-[#1A1A1A]">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setPreviewUrl(null); setSelfieFile(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-[4px] text-white hover:bg-black"
                >
                  <XCircle size={18} />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#2E2E2E] rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#E91E63] transition-colors bg-[#1A1A1A]">
                <Camera size={36} className="text-[#616161]" />
                <span className="text-sm font-medium">Take or Upload Selfie</span>
                <span className="text-xs text-[#616161]">Make sure your face is clearly visible with good lighting</span>
                <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          <Button onClick={handleSubmit} loading={submitting} disabled={!selfieFile} fullWidth>
            Submit for Verification
          </Button>
        </div>
      )}
    </div>
  );
}
