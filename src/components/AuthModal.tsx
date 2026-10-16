import React, { useState, useEffect } from 'react';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithTanzaniaPhone,
  registerWithTanzaniaPhone,
  signInWithGoogle,
  UserProfile,
} from '../services/firebase';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  AlertCircle,
  KeyRound,
  Smartphone,
  Play
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  initialTab?: 'phone' | 'register_phone' | 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialTab = 'phone',
}) => {
  const [tab, setTab] = useState<'phone' | 'register_phone' | 'login' | 'register'>(initialTab);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setIsLoading(false);
      setTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'GoBack') {
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 1. Mobile Phone Number Login with 4-digit PIN
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanPhone = phone.trim().replace(/\s+/g, '').replace('+', '');
    if (cleanPhone.startsWith('255')) {
      cleanPhone = '0' + cleanPhone.substring(3);
    } else if (cleanPhone.length === 9 && (cleanPhone.startsWith('7') || cleanPhone.startsWith('6'))) {
      cleanPhone = '0' + cleanPhone;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Weka namba sahihi ya simu ya Tanzania (mfano: 0712345678).');
      return;
    }

    if (!pin || pin.trim().length !== 4) {
      setErrorMsg('Weka namba yako ya siri (PIN ya namba 4 kamili).');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const user = await loginWithTanzaniaPhone(cleanPhone, pin.trim());
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu ya kuingia. Hakikisha namba na PIN ni sahihi.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Mobile Phone Number Sign Up (Name, Phone, 4-digit PIN)
  const handlePhoneRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanPhone = phone.trim().replace(/\s+/g, '').replace('+', '');
    if (cleanPhone.startsWith('255')) {
      cleanPhone = '0' + cleanPhone.substring(3);
    } else if (cleanPhone.length === 9 && (cleanPhone.startsWith('7') || cleanPhone.startsWith('6'))) {
      cleanPhone = '0' + cleanPhone;
    }

    if (!name.trim()) {
      setErrorMsg('Tafadhali weka jina lako.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Weka namba sahihi ya simu ya Tanzania (mfano: 0712345678).');
      return;
    }

    if (!pin || pin.trim().length !== 4) {
      setErrorMsg('Weka namba ya siri yenye tarakimu 4 kamili (mfano: 1234).');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const user = await registerWithTanzaniaPhone(cleanPhone, pin.trim(), name.trim());
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu ya usajili. Tafadhali jaribu tena.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithEmail(email.trim(), password);
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Barua pepe au neno la siri si sahihi.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Email Register
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg('Neno la siri linapaswa kuwa na angalau herufi 6.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await registerWithEmail(name.trim(), email.trim(), password);
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu ya usajili. Tafadhali jaribu tena.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Google Firebase Sign-in
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User closed popup without sign-in
      } else {
        setErrorMsg(err.message || 'Hitilafu ya kuingia na Google. Tafadhali jaribu tena.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-[#0a0f1d] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Blue Black Branding */}
        <div className="p-4 sm:p-5 border-b border-[#1e293b] flex items-center justify-between bg-[#050811]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-black shadow-lg shadow-blue-900/40">
              <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
            </div>
            <div>
              <h3 className="text-white font-extrabold text-sm sm:text-base">
                {tab === 'phone'
                  ? 'Ingia kwa Simu (PIN)'
                  : tab === 'register_phone'
                  ? 'Jisajili kwa Simu'
                  : tab === 'login'
                  ? 'Ingia kwa Barua Pepe'
                  : 'Jisajili kwa Barua Pepe'}
              </h3>
              <p className="text-[11px] text-slate-400">NeliTV Tanzania • Simu, PC &amp; Smart TV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0f172a] hover:bg-[#1e293b] flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer border border-[#1e293b]"
            aria-label="Funga"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher - Blue Black Segmented Style */}
        <div className="grid grid-cols-2 p-1.5 bg-[#050811] border-b border-[#1e293b] text-xs gap-1">
          <button
            onClick={() => { setTab('phone'); setErrorMsg(null); }}
            className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'phone' || tab === 'register_phone'
                ? 'bg-[#2563EB] text-white font-black shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-[#0f172a]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Namba ya Simu</span>
          </button>
          <button
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'login' || tab === 'register'
                ? 'bg-[#2563EB] text-white font-black shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-[#0f172a]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Barua Pepe</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="bg-red-950/80 border border-red-500/50 text-red-200 text-xs p-3 rounded-xl flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick 1-Tap Google Sign-In with Firebase */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold py-2.5 px-3 rounded-xl border border-[#334155] shadow-sm transition disabled:opacity-50 text-xs sm:text-sm cursor-pointer active:scale-98"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Ingia Moja kwa Moja na Google</span>
          </button>

          <div className="flex items-center gap-2 text-slate-500 text-[11px] my-1">
            <div className="flex-1 h-px bg-[#1e293b]" />
            <span>au weka taarifa zako hapa chini</span>
            <div className="flex-1 h-px bg-[#1e293b]" />
          </div>

          {/* 1. TANZANIA PHONE LOGIN */}
          {tab === 'phone' && (
            <form onSubmit={handlePhoneLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Namba ya Simu ya Tanzania:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))}
                    placeholder="0712345678 au 0754000000"
                    className="w-full bg-[#050811] border border-[#1e293b] focus:border-[#2563EB] rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Namba ya Siri (PIN ya namba 4):
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-[#050811] border border-[#1e293b] focus:border-[#2563EB] rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white font-mono tracking-widest focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black py-3 rounded-xl shadow-lg shadow-blue-900/40 transition disabled:opacity-50 text-xs sm:text-sm cursor-pointer active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Inaingia...</span>
                  </>
                ) : (
                  <span>Ingia Kwenye Akaunti</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setTab('register_phone'); setErrorMsg(null); }}
                  className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Huna akaunti bado? <strong className="text-[#3B82F6]">Jisajili Hapa</strong>
                </button>
              </div>
            </form>
          )}

          {/* 2. TANZANIA PHONE REGISTER */}
          {tab === 'register_phone' && (
            <form onSubmit={handlePhoneRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jina Kamili:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mfano: Juma Ally"
                    className="w-full bg-[#050811] border border-[#1e293b] focus:border-[#2563EB] rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Namba ya Simu ya Tanzania:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))}
                    placeholder="0712345678"
                    className="w-full bg-[#050811] border border-[#1e293b] focus:border-[#2563EB] rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Weka PIN ya Siri (Tarakimu 4):
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-[#050811] border border-[#1e293b] focus:border-[#2563EB] rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white font-mono tracking-widest focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black py-3 rounded-xl shadow-lg shadow-blue-900/40 transition disabled:opacity-50 text-xs sm:text-sm cursor-pointer active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Inasajili...</span>
                  </>
                ) : (
                  <span>Kamilisha Usajili</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setTab('phone'); setErrorMsg(null); }}
                  className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Una akaunti tayari? <strong className="text-[#3B82F6]">Ingia Hapa</strong>
                </button>
              </div>
            </form>
          )}

          {/* 3. EMAIL LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Barua Pepe (Email):
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mfano@gmail.com"
                    className="w-full bg-[#050811] border border-[#1e293b] focus:border-[#2563EB] rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Neno la Siri (Password):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#050811] border border-[#1e293b] focus:border-[#2563EB] rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black py-3 rounded-xl shadow-lg shadow-blue-900/40 transition disabled:opacity-50 text-xs sm:text-sm cursor-pointer active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Inaingia...</span>
                  </>
                ) : (
                  <span>Ingia kwa Barua Pepe</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setTab('register'); setErrorMsg(null); }}
                  className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Huna akaunti? <strong className="text-[#3B82F6]">Jisajili Hapa</strong>
                </button>
              </div>
            </form>
          )}

          {/* 4. EMAIL REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleEmailRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jina Kamili:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jina lako"
                    className="w-full bg-[#050811] border border-[#1e293b] focus:border-[#2563EB] rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Barua Pepe (Email):
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mfano@gmail.com"
                    className="w-full bg-[#050811] border border-[#1e293b] focus:border-[#2563EB] rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Neno la Siri (Herufi 6 au zaidi):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#050811] border border-[#1e293b] focus:border-[#2563EB] rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black py-3 rounded-xl shadow-lg shadow-blue-900/40 transition disabled:opacity-50 text-xs sm:text-sm cursor-pointer active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Inasajili...</span>
                  </>
                ) : (
                  <span>Tengeneza Akaunti Mpya</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setTab('login'); setErrorMsg(null); }}
                  className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Una akaunti tayari? <strong className="text-[#3B82F6]">Ingia Hapa</strong>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
