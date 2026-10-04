'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const REPORT_REASONS = [
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'ai_image', label: 'AI-generated image' },
  { value: 'others_photo', label: "Someone else's photo" },
  { value: 'harassment', label: 'Harassment or hate speech' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'inappropriate_photo', label: 'Inappropriate or explicit photo' },
  { value: 'underage', label: 'Underage concern (under 18)' },
  { value: 'other', label: 'Other violation' },
];

export default function ReportPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [reportType, setReportType] = useState('profile');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      showToast('Please select a reason', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          reason,
          description: description.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Report submitted for moderation', 'success');
        router.back();
      } else {
        showToast(data.error || 'Submission failed', 'error');
      }
    } catch (err) {
      showToast('Submission error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-4 select-none bg-[#08080A]">
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-8 h-8 rounded-[6px] bg-[#121216] border border-[#1E1E26] flex items-center justify-center text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="tmd-h3 text-white">Submit a Report</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-2">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {(['profile', 'chat', 'photo', 'event', 'organizer'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setReportType(type)}
                className={`py-2 px-2.5 rounded-[6px] border text-xs capitalize transition-colors cursor-pointer ${
                  reportType === type
                    ? 'border-[#FF1493] bg-[#FF1493]/15 text-white font-bold'
                    : 'border-[#1E1E26] bg-[#121216] text-[#A1A1AA] hover:border-[#2D2D38]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-2">Reason</label>
          <div className="space-y-1.5">
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-center gap-2.5 p-3 rounded-[8px] border cursor-pointer transition-colors ${
                  reason === r.value
                    ? 'border-[#FF1493] bg-[#FF1493]/10 text-white'
                    : 'border-[#1E1E26] bg-[#121216] text-[#A1A1AA] hover:border-[#2D2D38]'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={(e) => setReason(e.target.value)}
                  className="accent-[#FF1493]"
                />
                <span className="text-xs font-medium">{r.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-1.5">Details (Optional)</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context to help our moderation team..."
            className="w-full p-3 bg-[#121216] border border-[#1E1E26] rounded-[8px] text-white text-xs placeholder-[#71717A] focus:outline-none focus:border-[#FF1493] resize-none"
          />
        </div>

        <Button onClick={handleSubmit} loading={submitting} fullWidth size="lg">
          Submit Report
        </Button>
      </div>
    </div>
  );
}
