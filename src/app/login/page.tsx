'use client';

import { useState } from 'react';
import { Boxes, Lock, User, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/assets/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.requireMfa) {
          setMfaToken(data.mfaToken);
          setStep('mfa');
          setMfaCode('');
        } else {
          window.location.href = '/assets';
        }
      } else {
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/assets/api/auth/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, code: mfaCode }),
      });

      const data = await res.json();
      if (data.success) {
        window.location.href = '/assets';
      } else {
        setError(data.error || 'รหัสยืนยันไม่ถูกต้อง');
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep('credentials');
    setMfaCode('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl space-y-6 border border-slate-200 text-slate-900 transition-all">
        {step === 'credentials' ? (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3.5 bg-indigo-600 text-white rounded-2xl shadow-lg mb-2">
                <Boxes className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">ระบบคุมครุภัณฑ์</h1>
              <p className="text-sm font-medium text-slate-600">กรุณาเข้าสู่ระบบเพื่อใช้งานระบบบริหารจัดการพัสดุ</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl font-bold">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  ชื่อผู้ใช้งาน (Username)
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-3.5 text-indigo-600" />
                  <input
                    type="text"
                    required
                    placeholder="ป้อนชื่อผู้ใช้งาน"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-base font-bold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-indigo-600" />
                  <input
                    type="password"
                    required
                    placeholder="ป้อนรหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-base font-bold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-base font-black shadow-lg hover:shadow-indigo-500/30 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* MFA Verification Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg mb-2">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">ยืนยันตัวตน 2 ขั้นตอน</h1>
              <p className="text-xs font-medium text-slate-600">
                เปิดแอป <span className="font-bold text-indigo-600">Google Authenticator</span> แล้วกรอกรหัส 6 หลักสำหรับบัญชี <span className="font-bold text-slate-900">@{username}</span>
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl font-bold">
                {error}
              </div>
            )}

            {/* MFA Form */}
            <form onSubmit={handleVerifyMfa} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 text-center">
                  รหัสยืนยัน 6 หลัก (OTP Code)
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3.5 top-3.5 text-emerald-600" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    maxLength={6}
                    placeholder="••••••"
                    value={mfaCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setMfaCode(val);
                    }}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-2xl font-mono font-black text-center tracking-[0.4em] placeholder:text-slate-300 placeholder:tracking-normal focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || mfaCode.length !== 6}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-base font-black shadow-lg hover:shadow-emerald-500/30 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'กำลังตรวจสอบรหัส...' : 'ยืนยันรหัสเข้าสู่ระบบ'}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full py-2.5 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                ย้อนกลับไปหน้ากรอกชื่อผู้ใช้งาน
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
