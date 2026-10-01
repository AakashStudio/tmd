import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white px-4 py-8 max-w-2xl mx-auto">
      <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#9E9E9E] hover:text-white mb-6">
        <ArrowLeft size={18} /> Back
      </Link>
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-xs text-[#616161] mb-6">Last updated: October 2026</p>

      <div className="space-y-6 text-sm text-[#9E9E9E] leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-white mb-2">1. Information We Collect</h2>
          <p>
            We collect the information you provide directly during registration, including your phone number, date of birth, gender, interested-in preferences, name, city, and uploaded profile photos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">2. Location Data & Address Privacy</h2>
          <p>
            Your exact residential home address is never made public on TMD. Profiles only display your general city. Location-based matching and distance approximations are reserved exclusively for authorized subscription tiers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">3. View Once Photos</h2>
          <p>
            View Once photos exchanged in chat are encrypted and granted single-view ephemeral access. They are restricted from permanent public caching and expire automatically.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">4. Account Deletion & Retention</h2>
          <p>
            When you delete your account through settings, your profile and photos are immediately removed from discovery, matches are invalidated, and active chats are closed. Only minimal transactional data required for legal, fraud prevention, and audit compliance is retained.
          </p>
        </section>
      </div>
    </div>
  );
}
