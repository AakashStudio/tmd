'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PhoneLogin } from '@/components/auth/PhoneLogin';
import { SocialLogin } from '@/components/auth/SocialLogin';
import { Zap, Shield, Flame } from 'lucide-react';

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
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4 py-8 select-none">
      {/* TMD Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF1493] to-[#FF4D6D] text-white flex items-center justify-center mx-auto shadow-xl shadow-[#FF1493]/30">
          <Flame size={28} className="fill-white text-white" />
        </div>
        <div>
          <h1 className="tmd-h1 text-white tracking-tight">
            The Match Date<span className="text-[#FF1493]">.</span>
          </h1>
          <p className="tmd-body-small text-[#A1A1AA] mt-1">
            Real dates, nightlife events & verified connections
          </p>
        </div>
      </div>

      {/* 1-Click Instant Demo Profiles */}
      <div className="w-full bg-[#121216] p-3.5 rounded-[8px] border border-[#1E1E26] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="tmd-metadata text-[#FF1493] flex items-center gap-1.5">
            <Zap size={13} className="text-[#FF1493]" /> Instant Demo Access
          </span>
          <span className="text-[10px] text-[#71717A]">1-Click login</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleInstantDemoLogin('pro_499')}
            disabled={loggingInDemo !== null}
            className="p-2.5 bg-[#1A1A22] border border-[#2D2D38] hover:border-[#FF1493] rounded-[6px] text-left transition-all flex flex-col gap-1 active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Ananya</span>
              <span className="text-[9px] bg-[#FF1493] text-white px-1.5 py-0.2 rounded font-black">PRO</span>
            </div>
            <span className="text-[10px] text-[#A1A1AA]">Events + Swipes</span>
          </button>

          <button
            type="button"
            onClick={() => handleInstantDemoLogin('kabir')}
            disabled={loggingInDemo !== null}
            className="p-2.5 bg-[#1A1A22] border border-[#2D2D38] hover:border-[#FF1493] rounded-[6px] text-left transition-all flex flex-col gap-1 active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Kabir</span>
              <span className="text-[9px] bg-[#2D2D38] text-white px-1.5 py-0.2 rounded font-bold">MEMBER</span>
            </div>
            <span className="text-[10px] text-[#A1A1AA]">Host + Chat</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleInstantDemoLogin('admin')}
          disabled={loggingInDemo !== null}
          className="w-full py-2 px-3 bg-[#1A1A22] border border-[#2D2D38] hover:border-[#10B981] rounded-[6px] text-left transition-all flex items-center justify-between text-xs cursor-pointer"
        >
          <span className="font-semibold text-[#A1A1AA] flex items-center gap-1.5">
            <Shield size={14} className="text-[#10B981]" /> Enter Admin Dashboard
          </span>
          <span className="text-[10px] text-[#10B981] font-bold">SUPER ADMIN →</span>
        </button>
      </div>

      {/* Divider */}
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-px bg-[#1E1E26]" />
        <span className="text-[#71717A] text-[10px] uppercase font-bold tracking-widest">or sign in with</span>
        <div className="flex-1 h-px bg-[#1E1E26]" />
      </div>

      {/* Social Login (Google & Apple) */}
      <div className="w-full">
        <SocialLogin />
      </div>

      {/* Phone Login Form */}
      <div className="w-full bg-[#121216] p-4 rounded-[8px] border border-[#1E1E26]">
        <PhoneLogin />
      </div>

      {/* Legal Disclaimers */}
      <div className="text-[#71717A] text-[11px] text-center leading-relaxed space-y-1">
        <p>By signing in, you confirm you are 18+ and agree to TMD's</p>
        <p className="flex items-center justify-center gap-1.5">
          <Link href="/terms" className="text-[#A1A1AA] hover:text-[#FF1493] underline">Terms</Link>
          <span>•</span>
          <Link href="/privacy" className="text-[#A1A1AA] hover:text-[#FF1493] underline">Privacy</Link>
          <span>•</span>
          <Link href="/guidelines" className="text-[#A1A1AA] hover:text-[#FF1493] underline">Guidelines</Link>
        </p>
      </div>
    </div>
  );
}
