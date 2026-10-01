'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Flag } from 'lucide-react';
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
    <div className="min-h-[calc(100dvh-5rem)] px-4 py-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-[#9E9E9E] hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Submit a Report</h1>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#9E9E9E] mb-2">What are you reporting?</label>
          <div className="grid grid-cols-3 gap-2">
            {(['profile', 'chat', 'photo', 'event', 'organizer'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`py-2 px-3 rounded-lg border text-xs capitalize transition-colors ${
                  reportType === type
                    ? 'border-[#E91E63] bg-[#E91E63]/10 text-white font-semibold'
                    : 'border-[#2E2E2E] bg-[#1A1A1A] text-[#9E9E9E]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#9E9E9E] mb-2">Reason</label>
          <div className="space-y-2">
            {REPORT_REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                className={`w-full p-3 rounded-lg border text-left text-sm transition-colors ${
                  reason === r.value
                    ? 'border-[#E91E63] bg-[#E91E63]/10 text-white font-medium'
                    : 'border-[#2E2E2E] bg-[#1A1A1A] text-[#9E9E9E] hover:border-[#3A3A3A]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#9E9E9E] mb-1.5">
            Additional details (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Help our safety team understand what happened..."
            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg text-white text-sm focus:outline-none focus:border-[#E91E63] resize-none"
          />
        </div>

        <Button onClick={handleSubmit} loading={submitting} disabled={!reason} fullWidth variant="danger">
          Submit Report
        </Button>
      </div>
    </div>
  );
}
