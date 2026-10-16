import React from 'react';
import { ArrowRight, ShieldCheck, Tv, Play } from 'lucide-react';

interface TanzaniaNoticeBannerProps {
  onContinue: () => void;
}

export const TanzaniaNoticeBanner: React.FC<TanzaniaNoticeBannerProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
        {/* Top Logo */}
        <div className="w-14 h-14 rounded-2xl bg-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-900/40">
          <Play className="w-7 h-7 fill-white text-white translate-x-0.5" />
        </div>

        {/* Flag Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#050811] border border-[#1e293b] text-xs text-slate-200">
          <span className="text-sm">🇹🇿</span>
          <span className="font-bold tracking-wide">Kwa Watanzania Tu • Tanzania Only</span>
        </div>

        {/* Headings in Swahili & English */}
        <div className="space-y-1.5">
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
            Ilani Maalum / Important Notice
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
            Hii platform inafanya kazi kwa watanzania tu kutazama chaneli za live mubashara.
          </p>
          <p className="text-[11px] text-slate-400 leading-normal max-w-sm">
            This platform is exclusively optimized for users in Tanzania to stream live channels.
          </p>
        </div>

        {/* Features Checklist */}
        <div className="w-full bg-[#050811] border border-[#1e293b] rounded-xl p-3 text-left text-xs space-y-1.5 text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3B82F6] shrink-0" />
            <span>Matangazo ya Azam Sports, NBC Premier League &amp; CAF</span>
          </div>
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Chaneli za Sinema Zetu, Michezo &amp; TV mubashara</span>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black py-3 px-5 rounded-xl shadow-xl shadow-blue-900/40 transition transform active:scale-95 cursor-pointer text-xs sm:text-sm"
        >
          <span>Endelea / Continue</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>

        <p className="text-[10px] text-slate-500 font-mono">
          NeliTV Live • voidtv.online
        </p>
      </div>
    </div>
  );
};
