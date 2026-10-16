import React from 'react';
import { UserProfile, isUserSubscribed, signOutUser } from '../services/firebase';
import {
  User,
  ShieldCheck,
  CreditCard,
  LogOut,
  ArrowLeft,
  Crown,
  Sparkles,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Tv,
  Zap,
  Play
} from 'lucide-react';

interface AccountPageProps {
  user: UserProfile | null;
  onBack: () => void;
  onOpenPayment: () => void;
  onOpenAuth: () => void;
  onUserLogout: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  user,
  onBack,
  onOpenPayment,
  onOpenAuth,
  onUserLogout,
}) => {
  const isSubscribed = isUserSubscribed(user);

  const formatExpiryDate = (ms?: number) => {
    if (!ms) return 'Hakuna';
    const date = new Date(ms);
    return date.toLocaleDateString('sw-TZ', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRemainingDays = (ms?: number) => {
    if (!ms) return 0;
    const diff = ms - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in space-y-6">
      {/* Top Navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-[#2563EB]" />
        <span>Rudi Kwenye Chaneli za Live TV</span>
      </button>

      {/* Main Account Card - Blue Black Theme */}
      <div className="bg-[#0a0f1d] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl">
        {/* Profile Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#0a0f1d] via-[#050811] to-[#0a0f1d] border-b border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#2563EB] p-0.5 shadow-xl shadow-blue-900/40 flex items-center justify-center">
                <div className="w-full h-full bg-[#050811] rounded-[14px] flex items-center justify-center text-white font-black text-2xl">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-8 h-8 text-slate-400" />}
                </div>
              </div>
              {isSubscribed && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-lg border border-black" title="Mwanachama wa VIP">
                  <Crown className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {user?.displayName || 'Mtumiaji wa NeliTV'}
                </h1>
                {isSubscribed && (
                  <span className="bg-[#2563EB] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                    VIP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                {user?.phone ? (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-[#3B82F6]" />
                    {user.phone}
                  </span>
                ) : user?.email ? (
                  <span className="flex items-center gap-1 font-mono">
                    <Mail className="w-3.5 h-3.5 text-[#3B82F6]" />
                    {user.email}
                  </span>
                ) : (
                  <span>Akaunti ya Wageni (Guest Mode)</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={async () => {
                  await signOutUser();
                  onUserLogout();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#050811] hover:bg-[#131d36] text-slate-300 hover:text-white border border-[#1e293b] text-xs font-bold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ondoka</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-lg shadow-blue-900/40 transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Ingia Kwenye Akaunti</span>
              </button>
            )}
          </div>
        </div>

        {/* Subscription Status Details Section */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#3B82F6]" />
                <span>Uanachama na Kifurushi Chako</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Taarifa za vifurushi vya kutazama chaneli za live bila kikomo
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isSubscribed
                  ? 'bg-[#2563EB]/20 text-[#3B82F6] border border-[#2563EB]/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isSubscribed ? 'Kifurushi Kinafanya Kazi' : 'Hakuna Kifurushi'}
            </span>
          </div>

          {/* Plan Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#050811] border border-[#1e293b] space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Aina ya Kifurushi</span>
              <p className="text-sm font-black text-white flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-[#3B82F6]" />
                <span>{user?.subscription?.planName || (isSubscribed ? 'VIP Stream Pass' : 'Bure (Majaribio)')}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#050811] border border-[#1e293b] space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Muda wa Kumalizika</span>
              <p className="text-sm font-black text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{formatExpiryDate(user?.subscription?.expiresAt)}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#050811] border border-[#1e293b] space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Siku Zilizobaki</span>
              <p className="text-sm font-black text-[#3B82F6] flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>
                  {isSubscribed
                    ? user?.subscription?.status === 'lifetime'
                      ? 'Bila Kikomo (Lifetime)'
                      : `${getRemainingDays(user?.subscription?.expiresAt)} siku`
                    : 'Zimekwisha (0 siku)'}
                </span>
              </p>
            </div>
          </div>

          {/* Action Button: Upgrade / Renew */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#080d1a] border border-[#1e293b]">
            <div className="space-y-0.5 text-center sm:text-left">
              <h3 className="text-xs sm:text-sm font-extrabold text-white">
                {isSubscribed ? 'Ongeza Muda wa Kifurushi au Badilisha' : 'Jiunge na Vifurushi Vya NeliTV VIP'}
              </h3>
              <p className="text-xs text-slate-400">
                Lipa kwa HarakaPay kupitia Tigo Pesa, M-Pesa, Airtel Money au HaloPesa kwa urahisi.
              </p>
            </div>

            <button
              onClick={onOpenPayment}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black px-6 py-3 rounded-xl shadow-xl shadow-blue-900/40 text-xs sm:text-sm transition active:scale-95 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>{isSubscribed ? 'Ongeza Muda wa Kifurushi' : 'Nunua Kifurushi Sasa (Tsh 1,000)'}</span>
            </button>
          </div>

          {/* Devices info strip */}
          <div className="p-4 rounded-xl bg-[#050811] border border-[#1e293b] flex items-start gap-3 text-xs text-slate-300">
            <Tv className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-white">Uwezo wa Kutazama kwenye Vifaa Vingi:</h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Kifurushi chako kinakuruhusu kutazama chaneli zote mubashara kwenye Simu ya Android (kupitia NeliTV APK), Kompyuta (PC/Laptop kupitia Chrome/Edge/Firefox), na Smart TV yako bila malipo ya ziada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
