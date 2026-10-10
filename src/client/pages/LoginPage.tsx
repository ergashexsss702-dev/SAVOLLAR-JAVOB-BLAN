import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  ExternalLink,
  Key,
  Lock,
  Phone,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface LoginPageProps {
  onOpenAdminDirectly?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const { loginStepA, loginStepB, adminLogin } = useAuth();
  const { t } = useLanguage();

  const [step, setStep] = useState<'A' | 'B' | 'ADMIN'>('A');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [adminKey, setAdminKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStepASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMsg('Iltimos, to‘liq ism-familiyangizni kiriting (kamida 3 ta harf).');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Iltimos, telefon raqamingizni kiriting.');
      return;
    }

    setLoading(true);
    const res = await loginStepA(fullName, phone);
    setLoading(false);

    if (res.success) {
      if (res.normalizedPhone) {
        setPhone(res.normalizedPhone);
      }
      setStep('B');
    } else {
      setErrorMsg(res.message || 'Ma\'lumotlarni tasdiqlashda xatolik yuz berdi.');
    }
  };

  const handleStepBSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!accessCode.trim()) {
      setErrorMsg('Iltimos, kirish kodini kiriting.');
      return;
    }

    setLoading(true);
    const res = await loginStepB(fullName, phone, accessCode.trim());
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Kiritilgan kirish kodi noto‘g‘ri.');
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!adminKey.trim()) {
      setErrorMsg('Administrator parolini kiriting.');
      return;
    }

    setLoading(true);
    const res = await adminLogin(adminKey.trim());
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Administrator paroli noto‘g‘ri.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand Hero */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-xl shadow-indigo-500/25 mb-2">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Savollarni javobi bilan
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            {t('tagline')}
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-700/80 shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden text-slate-100">
          {/* Subtle glow border effect */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Error notice */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="font-bold text-rose-400">✕</span>
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* STEP A: User info */}
          {step === 'A' && (
            <form onSubmit={handleStepASubmit} className="space-y-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold block mb-1">
                  1-qadam
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {t('stepA_title')}
                </h3>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700 text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              {/* Phone number */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                />
                <span className="text-[11px] text-slate-400 block">
                  O‘zbekiston telefon raqamlari qabul qilinadi
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Tekshirilmoqda...' : t('continueBtn')}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 text-center border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setStep('ADMIN');
                  }}
                  className="text-xs text-slate-400 hover:text-indigo-300 transition flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Shield className="w-3.5 h-3.5" />
                  {t('adminLoginLink')}
                </button>
              </div>
            </form>
          )}

          {/* STEP B: Access code */}
          {step === 'B' && (
            <form onSubmit={handleStepBSubmit} className="space-y-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold block mb-1">
                  2-qadam
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {t('stepB_title')}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Xush kelibsiz, <strong className="text-white">{fullName}</strong> ({phone})
                </p>
              </div>

              {/* Price Callout */}
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-indigo-300 uppercase tracking-wider block font-semibold">
                    Obuna narxi
                  </span>
                  <span className="text-base font-bold text-white">70 000 so‘m</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                  To‘liq kirish
                </span>
              </div>

              {/* Telegram button */}
              <a
                href="https://t.me/ergashexsss7o2"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-semibold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t('getCodeTelegram')}
              </a>

              {/* Access code input */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  {t('enterCodePrompt')}
                </label>
                <input
                  type="text"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="07080717"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700 text-white placeholder-slate-600 text-center font-mono text-lg tracking-widest focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Sinov (demo) kodi: <code className="text-indigo-400 font-mono font-bold">07080717</code></span>
                  <button
                    type="button"
                    onClick={() => setAccessCode('07080717')}
                    className="text-indigo-400 hover:underline"
                  >
                    Kiritish
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setStep('A');
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Orqaga
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition active:scale-[0.98] disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {loading ? 'Tekshirilmoqda...' : t('verifyBtn')}
                </button>
              </div>
            </form>
          )}

          {/* ADMIN LOGIN */}
          {step === 'ADMIN' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-violet-400 font-semibold block mb-1">
                    Himoyalangan tizim
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {t('adminLoginLink')}
                  </h3>
                </div>
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                  <Lock className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-violet-400" />
                  {t('adminKeyLabel')}
                </label>
                <input
                  type="password"
                  required
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder={t('adminKeyPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none transition"
                />
                <span className="text-[11px] text-slate-400 block">
                  Rivojlanish paroli: <code className="text-violet-400 font-mono">admin_savollar_2026</code>
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setStep('A');
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  {t('studentLoginLink')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Kirilmoqda...' : t('adminLoginBtn')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Telegram payment notice card */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center text-xs text-slate-400">
          <p>
            Kirish kodi va to‘lov haqida savollar bo‘yicha rasmiy administrator:{' '}
            <a
              href="https://t.me/ergashexsss7o2"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline font-medium"
            >
              @ergashexsss7o2
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
