import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { PRICING_PLANS } from '../data/channels';
import { UserProfile, activateSubscriptionForUser, restoreSubscriptionByPhone } from '../services/firebase';
import {
  collectPayment,
  checkPaymentStatus,
  formatTanzaniaPhone,
  getApiBaseUrl,
  setApiBaseUrl,
} from '../services/paymentService';
import {
  X,
  CreditCard,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
  Smartphone,
  Info
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  channelName?: string;
  initialPlanId?: 'freemium' | 'standard' | 'premium';
  onPaymentSuccess: (user: UserProfile) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  user,
  channelName,
  initialPlanId = 'freemium',
  onPaymentSuccess,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<'freemium' | 'standard' | 'premium'>(initialPlanId);
  const [phone, setPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [step, setStep] = useState<'pay' | 'waiting' | 'success' | 'restore'>('pay');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [backendUrl, setBackendUrl] = useState(getApiBaseUrl());
  const [showBackendConfig, setShowBackendConfig] = useState(false);
  const [backendSaveMsg, setBackendSaveMsg] = useState<string | null>(null);

  const pollingTimerRef = useRef<any>(null);

  const selectedPlan = PRICING_PLANS.find((p) => p.id === selectedPlanId) || PRICING_PLANS[0];

  const handleSaveBackendUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBaseUrl(backendUrl.trim());
    setBackendSaveMsg('Seva ya Backend imehifadhiwa!');
    setErrorMsg(null);
    setTimeout(() => setBackendSaveMsg(null), 3000);
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setInfoMsg(null);
      setStep('pay');
      setSelectedPlanId(initialPlanId);
      setOrderId(null);
    } else {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    }
  }, [isOpen, initialPlanId]);

  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, []);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#3B82F6', '#60A5FA', '#FFFFFF'],
      });
    } catch {}
  };

  const detectCarrier = (p: string) => {
    try {
      const clean = formatTanzaniaPhone(p);
      if (clean.startsWith('074') || clean.startsWith('075') || clean.startsWith('076')) {
        return { name: 'Vodacom M-Pesa', color: 'bg-blue-950/80 text-blue-200 border-blue-600/50' };
      }
      if (clean.startsWith('071') || clean.startsWith('065') || clean.startsWith('067') || clean.startsWith('077')) {
        return { name: 'Tigo Pesa', color: 'bg-blue-950/80 text-blue-200 border-blue-600/50' };
      }
      if (clean.startsWith('078') || clean.startsWith('068') || clean.startsWith('069')) {
        return { name: 'Airtel Money', color: 'bg-blue-950/60 text-slate-200 border-blue-500/40' };
      }
      if (clean.startsWith('062')) {
        return { name: 'Halotel Halopesa', color: 'bg-blue-950/80 text-blue-200 border-blue-500/50' };
      }
      return { name: 'M-Pesa / Tigo / Airtel / Halotel', color: 'bg-[#0f172a] text-slate-400 border-[#1e293b]' };
    } catch {
      return { name: 'M-Pesa / Tigo / Airtel / Halotel', color: 'bg-[#0f172a] text-slate-400 border-[#1e293b]' };
    }
  };

  // 1. Submit payment via Mobile Money USSD Push
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = formatTanzaniaPhone(phone);

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Weka namba sahihi ya simu ya Tanzania (mfano: 0712345678).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const data = await collectPayment({
        phone: cleanPhone,
        amount: selectedPlan.priceTsh,
        planId: selectedPlan.id,
        description: `NeliTV Live - ${selectedPlan.title}`,
      });

      if (data && data.success && data.order_id) {
        setOrderId(data.order_id);
        setStep('waiting');
        setInfoMsg('Ombi la malipo (USSD Push) limetumwa kwenye simu yako! Weka PIN yako sasa.');
        startAutoStatusPolling(data.order_id, cleanPhone);
      } else {
        setErrorMsg(
          data?.message ||
          'Ombi la USSD halikufanikiwa. Hakikisha namba yako haina kikao cha USSD kinachoendelea na ina salio.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu ya mtandao kuwasiliana na huduma ya malipo. Tafadhali jaribu tena.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Automatic Polling in Background every 2.5 seconds
  const startAutoStatusPolling = (currentOrderId: string, payingPhone: string) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    const checkNow = async () => {
      try {
        const data = await checkPaymentStatus(currentOrderId);
        const statusStr = (data.status || data.payment?.status || '').toLowerCase().trim();

        if (
          data.success &&
          ['completed', 'confirmed', 'success', 'successful', 'paid', 'complete'].includes(statusStr)
        ) {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          completeSuccess(currentOrderId, payingPhone);
          return true;
        } else if (['cancelled', 'expired'].includes(statusStr)) {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          setErrorMsg('Ombi la malipo limekatishwa (cancelled/expired). Bofya "Tuma Upya USSD" kujaribu tena.');
          return false;
        } else if (statusStr === 'failed') {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          setErrorMsg(data.message || 'Malipo hayakufanikiwa. Hakikisha salio linatosha kisha bofya "Tuma Upya USSD".');
          return false;
        }
      } catch {}
      return false;
    };

    setTimeout(checkNow, 1500);
    pollingTimerRef.current = setInterval(checkNow, 2500);
  };

  // 3. Complete Activation
  const completeSuccess = async (completedOrderId: string, payingPhone: string) => {
    try {
      const currentProfile: UserProfile = user || {
        uid: 'tz_phone_' + payingPhone,
        displayName: `Mteja (${payingPhone})`,
        phone: payingPhone,
        role: 'user',
        isAnonymous: true,
        subscription: { status: 'inactive' },
      };

      const updated = await activateSubscriptionForUser(
        currentProfile,
        selectedPlan.id as any,
        selectedPlan.priceTsh,
        completedOrderId,
        payingPhone
      );

      try {
        localStorage.removeItem('nelitv_trial_expired');
      } catch {}

      setStep('success');
      triggerCelebration();
      onPaymentSuccess(updated);
    } catch (e: any) {
      console.warn('Subscription activation warning:', e);
      setStep('success');
      triggerCelebration();
    }
  };

  // 4. Manual Check ("Nimekwisha Weka PIN")
  const handleManualCheck = async () => {
    if (!orderId) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const data = await checkPaymentStatus(orderId);
      const statusStr = (data.status || data.payment?.status || '').toLowerCase().trim();

      if (['completed', 'confirmed', 'success', 'successful', 'paid', 'complete'].includes(statusStr)) {
        if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
        const cleanPhone = formatTanzaniaPhone(phone);
        await completeSuccess(orderId, cleanPhone);
      } else if (statusStr === 'failed') {
        setErrorMsg('Muamala haukufanikiwa au umekataliwa. Bofya "Tuma Upya USSD" kujaribu tena.');
      } else {
        setErrorMsg('⚠️ Bado haujalipia au haujaweka PIN kwenye simu yako! Tafadhali weka PIN ya siri kwenye simu yako kuthibitisha malipo, kisha bofya hapa tena.');
      }
    } catch {
      setErrorMsg('Hitilafu ya kuwasiliana na mfumo wa malipo. Tafadhali jaribu tena baada ya sekunde chache.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Restore subscription by phone
  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = formatTanzaniaPhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Weka namba uliyolipia (mfano: 0712345678).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const restored = await restoreSubscriptionByPhone(cleanPhone);
      if (restored) {
        onPaymentSuccess(restored);
        triggerCelebration();
        setStep('success');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Hakuna malipo yanayofanya kazi yaliyopatikana kwa namba hii.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const carrier = detectCarrier(phone);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0a0f1d] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Blue Black Accent */}
        <div className="p-4 sm:p-5 border-b border-[#1e293b] flex items-center justify-between bg-[#050811]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white font-black flex items-center justify-center shadow-lg shadow-blue-900/40">
              <span className="text-base tracking-tighter">TV</span>
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                {step === 'restore'
                  ? 'Rejesha Malipo ya Kifurushi'
                  : step === 'waiting'
                  ? 'Thibitisha Malipo (USSD PIN)'
                  : step === 'success'
                  ? 'Uthibitisho wa Malipo'
                  : 'Lipia Kifurushi (NeliTV Live)'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === 'waiting'
                  ? 'Ingiza PIN kwenye skrini ya simu yako'
                  : 'Vodacom M-Pesa, Tigo Pesa, Airtel Money & Halopesa'}
              </p>
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* STEP: SUCCESS */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-[#2563EB] text-white flex items-center justify-center mx-auto shadow-2xl shadow-blue-900/50">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-white">Malipo Yamethibitishwa!</h4>
                <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
                  Hongera! Chaneli zote za Azam Sports na burudani zimefunguliwa kikamilifu. Unaweza kuanza kutazama sasa!
                </p>
              </div>

              <div className="bg-[#050811] border border-[#1e293b] p-4 rounded-xl max-w-xs mx-auto text-xs space-y-2 text-left">
                <div className="flex justify-between text-slate-400">
                  <span>Kifurushi:</span>
                  <span className="font-bold text-[#3B82F6]">{selectedPlan.title}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Kiasi:</span>
                  <span className="font-bold text-white">{selectedPlan.priceFormatted}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Muda:</span>
                  <span className="font-bold text-white">{selectedPlan.durationLabel}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black py-3.5 px-6 rounded-xl shadow-xl shadow-blue-900/40 transition transform active:scale-95 cursor-pointer text-sm"
              >
                Anza Kutazama Sasa
              </button>
            </div>
          )}

          {/* STEP: WAITING FOR PIN CONFIRMATION */}
          {step === 'waiting' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#050811] border border-[#1e293b] rounded-xl p-5 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#2563EB] text-white flex items-center justify-center mx-auto animate-pulse shadow-lg shadow-blue-900/40">
                  <Smartphone className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                    Ombi Limetumwa Kwenye Simu Yako
                  </h4>
                  <p className="text-xs text-slate-300">
                    Tafadhali ingiza <strong>PIN yako ya siri</strong> kwenye skrini ya simu <strong>{phone}</strong> ili kuthibitisha malipo ya <strong className="text-[#3B82F6]">{selectedPlan.priceFormatted}</strong>.
                  </p>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Ukishamaliza kuweka PIN kwenye simu, bofya kitufe cha chini ili kuthibitisha na kuingia:
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-red-950/70 border border-red-500 rounded-xl text-xs text-red-200 flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {infoMsg && !errorMsg && (
                <div className="p-3 bg-[#050811] border border-[#1e293b] rounded-xl text-xs text-slate-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black py-3.5 px-3 rounded-xl transition text-xs shadow-lg shadow-blue-900/40 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Check className="w-4 h-4 text-white" />
                  )}
                  <span>Nimekwisha Weka PIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('pay')}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-slate-200 font-bold py-3.5 px-3 rounded-xl transition text-xs border border-[#1e293b] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                  <span>Tuma Upya USSD</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP: PAY FORM */}
          {step === 'pay' && (
            <div className="space-y-4 animate-fade-in">
              {/* Plan Switcher Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Chagua Kifurushi:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRICING_PLANS.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id as any)}
                        className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-between ${
                          isSelected
                            ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-lg shadow-blue-900/40 font-black'
                            : 'bg-[#050811] border-[#1e293b] text-slate-300 hover:border-slate-500 hover:bg-[#0f172a]'
                        }`}
                      >
                        <span className="text-xs truncate">{plan.title}</span>
                        <span className="text-sm font-black mt-1">{plan.priceFormatted}</span>
                        <span className="text-[10px] opacity-80 mt-0.5">{plan.durationLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Form */}
              <form onSubmit={handlePay} className="space-y-3.5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      Namba ya Simu ya Malipo:
                    </label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${carrier.color}`}>
                      {carrier.name}
                    </span>
                  </div>

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
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hakikisha simu iko karibu na ina salio la <strong className="text-white">{selectedPlan.priceFormatted}</strong>.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-950/70 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black py-3.5 px-4 rounded-xl shadow-xl shadow-blue-900/40 transition transform active:scale-95 disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Inatuma Ombi la USSD...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Lipa Sasa ({selectedPlan.priceFormatted})</span>
                    </>
                  )}
                </button>
              </form>

              {/* Restore button */}
              <div className="pt-2 border-t border-[#1e293b] text-center">
                <button
                  type="button"
                  onClick={() => setStep('restore')}
                  className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Ulipia tayari kwa simu nyingine? <strong className="text-[#3B82F6]">Rejesha Kifurushi</strong>
                </button>
              </div>

              {/* Backend API Configuration for Firebase Hosting */}
              <div className="pt-2 border-t border-[#1e293b]/60">
                <button
                  type="button"
                  onClick={() => setShowBackendConfig(!showBackendConfig)}
                  className="w-full text-left flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 transition py-1 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>Deploy kwenye Firebase Hosting? (Backend Setup)</span>
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono">
                    {showBackendConfig ? 'Funga ▲' : 'Fungua ▼'}
                  </span>
                </button>

                {showBackendConfig && (
                  <form onSubmit={handleSaveBackendUrl} className="mt-2 p-3 rounded-xl bg-[#080d1a] border border-[#1e293b] space-y-2 text-xs animate-fade-in">
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Firebase Hosting inahifadhi tovuti pekee (static). Ili USSD push ya HarakaPay ifanye kazi mtandaoni, weka link ya seva yako ya bure (mfano kutoka <strong>Render.com</strong> au <strong>Railway</strong>):
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://nelitv-backend.onrender.com"
                        value={backendUrl}
                        onChange={(e) => setBackendUrl(e.target.value)}
                        className="flex-1 bg-[#050811] border border-[#1e293b] focus:border-[#2563EB] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer shrink-0"
                      >
                        Hifadhi
                      </button>
                    </div>
                    {backendSaveMsg && (
                      <p className="text-[11px] text-emerald-400 font-semibold">{backendSaveMsg}</p>
                    )}
                  </form>
                )}
              </div>
            </div>
          )}

          {/* STEP: RESTORE */}
          {step === 'restore' && (
            <form onSubmit={handleRestore} className="space-y-3.5 animate-fade-in">
              <div className="text-center space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base text-white">
                  Rejesha Kifurushi Chako
                </h4>
                <p className="text-xs text-slate-400">
                  Weka namba ya simu uliyotumia kulipia awali ili kurudisha kifurushi chako kutoka Supabase/Server.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Namba Uliyolipia:
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

              {errorMsg && (
                <div className="p-3 bg-red-950/70 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-3 px-3 rounded-xl transition text-xs shadow-md shadow-blue-900/40 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Thibitisha Namba</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('pay')}
                  className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 font-semibold py-3 px-3 rounded-xl transition text-xs border border-[#1e293b] cursor-pointer"
                >
                  Rudi Kulipa
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
