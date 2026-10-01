'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PhoneLogin } from '@/components/auth/PhoneLogin';
import { SocialLogin } from '@/components/auth/SocialLogin';
import { Sparkles, Zap, Shield } from 'lucide-react';

export default function LoginPage() {
  const [loggingInDemo, setLoggingInDemo] = useState<string | null>(null);

  const handleInstantDemoLogin = async (role: string) => {
    setLoggingInDemo(role);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success && data.redirect) {
        window.location.href = data.redirect;
      }
    } catch (err) {
      console.error(err);
      setLoggingInDemo(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4 py-8">
      {/* TMD Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#E91E63] to-[#FF6F61] text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xl shadow-[#E91E63]/25">
          tmd
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            The Match Date<span className="text-[#E91E63]">.</span>
          </h1>
          <p className="text-xs font-semibold text-[#888888] mt-1">
            Real dates, nightlife events & verified connections
          </p>
        </div>
      </div>

      {/* 1-Click Instant Demo Profiles */}
      <div className="w-full bg-[#141414] p-3.5 rounded-lg border border-[#242424] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#E91E63] flex items-center gap-1.5">
            <Zap size={13} className="text-[#E91E63]" /> Instant 1-Click Test Access
          </span>
          <span className="text-[10px] text-[#666666]">No typing needed</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleInstantDemoLogin('pro_499')}
            disabled={loggingInDemo !== null}
            className="p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#E91E63] rounded-lg text-left transition-all flex flex-col gap-1 active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Ananya</span>
              <span className="text-[9px] bg-[#E91E63] text-white px-1.5 py-0.2 rounded font-black">PRO</span>
            </div>
            <span className="text-[10px] text-[#888888]">Events + Swipes</span>
          </button>

          <button
            onClick={() => handleInstantDemoLogin('kabir')}
            disabled={loggingInDemo !== null}
            className="p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#E91E63] rounded-lg text-left transition-all flex flex-col gap-1 active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Kabir</span>
              <span className="text-[9px] bg-[#2A2A2A] text-white px-1.5 py-0.2 rounded font-bold">MEMBER</span>
            </div>
            <span className="text-[10px] text-[#888888]">Event Host + Chat</span>
          </button>
        </div>

        <button
          onClick={() => handleInstantDemoLogin('admin')}
          disabled={loggingInDemo !== null}
          className="w-full py-2 px-3 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#4CAF50] rounded-lg text-left transition-all flex items-center justify-between text-xs cursor-pointer"
        >
          <span className="font-semibold text-[#A0A0A0] flex items-center gap-1.5">
            <Shield size={14} className="text-[#4CAF50]" /> Enter TMD Admin Dashboard
          </span>
          <span className="text-[10px] text-[#4CAF50] font-bold">SUPER ADMIN →</span>
        </button>
      </div>

      {/* Divider */}
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-px bg-[#242424]" />
        <span className="text-[#666666] text-[10px] uppercase font-bold tracking-widest">or sign in with</span>
        <div className="flex-1 h-px bg-[#242424]" />
      </div>

      {/* Social Login (Google & Apple) */}
      <div className="w-full">
        <SocialLogin />
      </div>

      {/* Phone Login Form */}
      <div className="w-full bg-[#141414] p-4 rounded-lg border border-[#242424]">
        <PhoneLogin />
      </div>

      {/* Legal Disclaimers */}
      <div className="text-[#666666] text-[11px] text-center leading-relaxed space-y-1">
        <p>By signing in, you confirm you are 18+ and agree to TMD's</p>
        <p className="flex items-center justify-center gap-1.5">
          <Link href="/terms" className="text-[#9E9E9E] hover:text-[#E91E63] underline">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="text-[#9E9E9E] hover:text-[#E91E63] underline">Privacy Policy</Link>
          <span>•</span>
          <Link href="/guidelines" className="text-[#9E9E9E] hover:text-[#E91E63] underline">Guidelines</Link>
        </p>
      </div>
    </div>
  );
}
