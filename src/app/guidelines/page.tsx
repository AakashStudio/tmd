import Link from 'next/link';
import { ArrowLeft, Shield, AlertTriangle, Eye, HeartHandshake } from 'lucide-react';

export default function GuidelinesPage() {
  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white px-4 py-8 max-w-2xl mx-auto">
      <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#9E9E9E] hover:text-white mb-6">
        <ArrowLeft size={18} /> Back
      </Link>
      <h1 className="text-3xl font-bold mb-2">Community & Safety Guidelines</h1>
      <p className="text-xs text-[#616161] mb-6">Standards for a safe, authentic dating environment</p>

      <div className="space-y-6 text-sm text-[#9E9E9E] leading-relaxed">
        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-[#2E2E2E] flex gap-3">
          <Shield className="text-[#E91E63] flex-shrink-0" size={24} />
          <div>
            <h3 className="font-semibold text-white mb-1">Strict 18+ Platform</h3>
            <p>Underage access is blocked without exception. Any attempt to falsify date of birth will lead to an immediate ban.</p>
          </div>
        </div>

        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-[#2E2E2E] flex gap-3">
          <Eye className="text-[#4CAF50] flex-shrink-0" size={24} />
          <div>
            <h3 className="font-semibold text-white mb-1">Zero Tolerance for AI / Fake Photos</h3>
            <p>Every profile must represent a real person. AI-generated avatars, stolen images, or face swaps will be removed by moderation.</p>
          </div>
        </div>

        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-[#2E2E2E] flex gap-3">
          <AlertTriangle className="text-[#FF9800] flex-shrink-0" size={24} />
          <div>
            <h3 className="font-semibold text-white mb-1">Harassment & Unsolicited Content</h3>
            <p>Respect boundaries. Hate speech, solicitation, blackmail, or abusive messaging results in suspension or permanent removal.</p>
          </div>
        </div>

        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-[#2E2E2E] flex gap-3">
          <HeartHandshake className="text-[#2196F3] flex-shrink-0" size={24} />
          <div>
            <h3 className="font-semibold text-white mb-1">In-Person & Event Safety</h3>
            <p>Always meet in well-lit public venues for first encounters. If joining TMD Events, adhere to venue rules and respect fellow attendees.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
