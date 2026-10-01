import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white px-4 py-8 max-w-2xl mx-auto">
      <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#9E9E9E] hover:text-white mb-6">
        <ArrowLeft size={18} /> Back
      </Link>
      <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
      <p className="text-xs text-[#616161] mb-6">Last updated: October 2026</p>

      <div className="space-y-6 text-sm text-[#9E9E9E] leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-white mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using TMD (The Match Date), you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must not use our service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">2. Eligibility & 18+ Rule</h2>
          <p>
            You must be at least 18 years of age to create an account or use TMD. By creating an account and providing your date of birth, you represent and warrant that you are 18 or older. TMD strictly verifies dates of birth and automatically prevents registration of minors.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">3. Subscriptions & Payments</h2>
          <p>
            TMD offers non-renewing subscription plans purchased manually. When you upgrade your subscription, any remaining time from your previous plan is immediately replaced. When a paid plan reaches its expiration date, your account automatically reverts to the Free plan. All payments are processed securely via Razorpay.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">4. Profile Rules & AI Content Prohibition</h2>
          <p>
            You must provide authentic profile photos of yourself. AI-generated profile photos, celebrity impersonations, explicit or violent imagery, and deepfakes are strictly prohibited on TMD. Violations result in immediate removal and potential account ban.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">5. Events & Safety</h2>
          <p>
            Pro users may host and discover in-person events. Organizers are solely responsible for compliance with local regulations and event permissions. Users must never publicly broadcast private residential addresses or personal location information.
          </p>
        </section>
      </div>
    </div>
  );
}
