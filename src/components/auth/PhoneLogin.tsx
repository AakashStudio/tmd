'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles, PhoneCall, Check } from 'lucide-react';

export function PhoneLogin() {
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSendOtp = async () => {
    setError('');
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const formatted = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`;
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setStep('otp');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      } else {
        setDevOtp('123456');
      }
      startResendCooldown();
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    setError('');
    const finalOtp = codeToVerify || otp;
    if (!finalOtp || finalOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const formatted = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`;
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formatted,
          otp: finalOtp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');

      window.location.href = data.data?.needsOnboarding ? '/onboarding' : '/app';
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAutoFillAndVerify = () => {
    if (devOtp) {
      setOtp(devOtp);
      handleVerifyOtp(devOtp);
    }
  };

  return (
    <div className="w-full space-y-4">
      {step === 'phone' ? (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#9E9E9E]">Mobile Number</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white font-medium text-sm flex items-center gap-1.5">
                <span className="text-[#9E9E9E]">🇮🇳</span> +91
              </span>
              <Input
                type="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="pl-20 font-medium tracking-wide text-white text-base"
                maxLength={10}
                autoFocus
              />
            </div>
          </div>

          <Button onClick={handleSendOtp} loading={loading} fullWidth size="lg" className="shadow-lg shadow-[#E91E63]/20">
            Get Verification Code
          </Button>
        </>
      ) : (
        <>
          <div className="text-center space-y-1">
            <p className="text-white text-sm font-medium">Verify your mobile</p>
            <p className="text-[#9E9E9E] text-xs">
              Code sent to <span className="text-white font-mono font-semibold">+91 {phone}</span>
            </p>
          </div>

          {/* Dev OTP Auto-Fill Helper */}
          {devOtp && (
            <div
              onClick={handleAutoFillAndVerify}
              className="p-3 bg-[#E91E63]/10 border border-[#E91E63]/30 rounded-lg flex items-center justify-between cursor-pointer hover:bg-[#E91E63]/15 transition-all text-xs"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#E91E63]" />
                <span className="text-white">Dev Code: <strong className="text-[#E91E63] font-mono tracking-widest text-sm">{devOtp}</strong></span>
              </div>
              <span className="text-[10px] bg-[#E91E63] text-white px-2 py-0.5 rounded font-semibold">
                Tap to Auto-fill
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Input
              type="text"
              placeholder="• • • • • •"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center tracking-[0.5em] text-xl font-mono font-bold h-12"
              autoFocus
            />
          </div>

          <Button onClick={() => handleVerifyOtp()} loading={loading} fullWidth size="lg" className="shadow-lg shadow-[#E91E63]/20">
            Verify & Enter
          </Button>

          <div className="flex justify-between items-center pt-1 text-xs">
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="text-[#9E9E9E] hover:text-white transition-colors"
            >
              Edit number
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={resendCooldown > 0 || loading}
              className="text-[#E91E63] font-medium disabled:text-[#616161] transition-colors"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="p-2.5 bg-[#F44336]/10 border border-[#F44336]/30 rounded-lg text-xs text-[#F44336] text-center">
          {error}
        </div>
      )}
    </div>
  );
}
