'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, ShieldAlert, KeyRound, Copy, Check, X, Smartphone, Lock, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

interface MfaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMfaStatusChange?: (enabled: boolean) => void;
}

export default function MfaModal({ isOpen, onClose, onMfaStatusChange }: MfaModalProps) {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [viewState, setViewState] = useState<'initial' | 'setup' | 'disable_confirm'>('initial');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [secret, setSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setVerifyCode('');
      setDisablePassword('');
      setViewState('initial');
      checkMfaStatus();
    }
  }, [isOpen]);

  const checkMfaStatus = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/assets/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setMfaEnabled(!!data.user.mfaEnabled);
      }
    } catch (err: any) {
      setError(err?.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSetup = async () => {
    setError(null);
    setSuccessMsg(null);
    setActionLoading(true);
    try {
      const res = await fetchWithAuth('/assets/api/auth/mfa/setup', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setSecret(data.secret);
        setOtpauthUrl(data.otpauthUrl);
        setViewState('setup');
      } else {
        setError(data.error || 'ไม่สามารถเริ่มต้นตั้งค่าได้');
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.length !== 6) {
      setError('กรุณากรอกรหัส 6 หลักให้ครบถ้วน');
      return;
    }

    setError(null);
    setActionLoading(true);
    try {
      const res = await fetchWithAuth('/assets/api/auth/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, code: verifyCode }),
      });
      const data = await res.json();
      if (data.success) {
        setMfaEnabled(true);
        setViewState('initial');
        setSuccessMsg('เปิดใช้งาน Google Authenticator (2FA) เรียบร้อยแล้ว!');
        if (onMfaStatusChange) onMfaStatusChange(true);
      } else {
        setError(data.error || 'รหัสยืนยันไม่ถูกต้อง');
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      setError('กรุณากรอกรหัสผ่านเพื่อยืนยัน');
      return;
    }

    setError(null);
    setActionLoading(true);
    try {
      const res = await fetchWithAuth('/assets/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (data.success) {
        setMfaEnabled(false);
        setViewState('initial');
        setDisablePassword('');
        setSuccessMsg('ปิดการใช้งานการยืนยันตัวตน 2 ขั้นตอนเรียบร้อยแล้ว');
        if (onMfaStatusChange) onMfaStatusChange(false);
      } else {
        setError(data.error || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${mfaEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {mfaEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">การยืนยันตัวตน 2 ขั้นตอน (2FA)</h3>
              <p className="text-xs font-semibold text-slate-500">Google Authenticator / TOTP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Messages */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm font-semibold">
              กำลังโหลดสถานะความปลอดภัย...
            </div>
          ) : viewState === 'initial' ? (
            <div className="space-y-6">
              {mfaEnabled ? (
                /* Active State */
                <div className="space-y-5">
                  <div className="p-5 bg-emerald-50/80 border-2 border-emerald-200 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h4 className="font-black text-emerald-900 text-sm">เปิดใช้งานเรียบร้อยแล้ว (Active)</h4>
                      </div>
                      <p className="text-xs font-medium text-emerald-800 mt-1">
                        บัญชีของคุณปลอดภัยด้วยรหัสยืนยันจาก Google Authenticator ทุกครั้งที่เข้าสู่ระบบ
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">คำแนะนำด้านความปลอดภัย</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      หากคุณเปลี่ยนโทรศัพท์ใหม่ หรือต้องการยกเลิกการยืนยันตัวตน คุณสามารถกดปิดการใช้งานด้านล่างนี้ได้
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccessMsg(null);
                        setViewState('disable_confirm');
                      }}
                      className="px-4 py-2.5 text-xs font-black text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer"
                    >
                      ปิดการใช้งาน 2FA
                    </button>
                  </div>
                </div>
              ) : (
                /* Disabled State */
                <div className="space-y-5">
                  <div className="p-5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md shrink-0">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-slate-900 text-sm">ยกระดับความปลอดภัยด้วย Google Authenticator</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        เมื่อเปิดใช้งาน ทุกครั้งที่เข้าสู่ระบบจะต้องกรอกรหัส 6 หลักจากแอปพลิเคชันบนสมาร์ทโฟนของคุณ ช่วยป้องกันไม่ให้ผู้อื่นเข้าถึงบัญชีแม้จะล่วงรู้รหัสผ่าน
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700">
                    <div className="font-black text-slate-900">สิ่งที่คุณต้องเตรียม:</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                      <li>สมาร์ทโฟนที่มีแอป <span className="font-bold text-indigo-600">Google Authenticator</span></li>
                      <li>พร้อมใช้งานทั้งบน iOS (App Store) และ Android (Play Store)</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartSetup}
                    disabled={actionLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black shadow-lg hover:shadow-indigo-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? 'กำลังสร้างคีย์ความปลอดภัย...' : '🚀 เริ่มตั้งค่า Google Authenticator'}
                  </button>
                </div>
              )}
            </div>
          ) : viewState === 'setup' ? (
            /* Setup Wizard Step */
            <form onSubmit={handleEnableMfa} className="space-y-6">
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900">สแกน QR Code ด้วย Google Authenticator</h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      เปิดแอป แล้วกดปุ่ม <strong>+</strong> เลือก <strong>สแกนโค้ด QR</strong>
                    </p>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  {otpauthUrl && (
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                      <QRCodeSVG value={otpauthUrl} size={170} level="M" />
                    </div>
                  )}

                  {/* Manual Secret Code */}
                  <div className="mt-4 w-full">
                    <div className="text-[11px] font-bold text-slate-500 text-center mb-1">
                      หรือไม่สามารถสแกนได้? ใช้คีย์นี้ป้อนในแอปด้วยตนเอง:
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
                      <code className="text-xs font-mono font-black text-indigo-700 flex-1 text-center tracking-wider break-all select-all">
                        {secret}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 pt-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h5 className="text-xs font-black text-slate-900">กรอกรหัส 6 หลักที่ปรากฏในแอป เพื่อยืนยัน</h5>
                    <div className="relative mt-2">
                      <KeyRound className="w-5 h-5 absolute left-3.5 top-3.5 text-indigo-600" />
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        autoFocus
                        required
                        maxLength={6}
                        placeholder="••••••"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-2xl font-mono font-black text-center tracking-[0.4em] placeholder:text-slate-300 placeholder:tracking-normal focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewState('initial');
                    setVerifyCode('');
                    setError(null);
                  }}
                  className="flex-1 py-3 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || verifyCode.length !== 6}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg hover:shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'กำลังตรวจสอบ...' : 'ยืนยันและเปิดใช้งาน'}
                </button>
              </div>
            </form>
          ) : (
            /* Disable Confirmation Step */
            <form onSubmit={handleDisableMfa} className="space-y-5">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900">
                  <span className="font-bold">คำเตือน:</span> เมื่อปิดการใช้งาน คุณจะไม่ต้องใช้รหัสจาก Google Authenticator อีกต่อไป ซึ่งจะทำให้ความปลอดภัยของบัญชีลดลง
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  กรุณากรอกรหัสผ่านบัญชีของคุณ เพื่อยืนยัน
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="รหัสผ่านปัจจุบัน"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-rose-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewState('initial');
                    setDisablePassword('');
                    setError(null);
                  }}
                  className="flex-1 py-3 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !disablePassword}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg hover:shadow-rose-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'กำลังดำเนินการ...' : 'ยืนยันการปิด 2FA'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
