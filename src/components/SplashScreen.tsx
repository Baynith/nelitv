import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  duration = 2000,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, Math.max(800, duration - 400));

    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-99999 flex flex-col justify-between items-center bg-[#050811] select-none transition-opacity duration-400 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
      style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 45%, rgba(37, 99, 235, 0.22) 0%, rgba(5, 8, 17, 1) 75%)',
      }}
    >
      {/* Top spacer */}
      <div className="w-full pt-8" />

      {/* Center Blue-Black Branding Block */}
      <div className="flex flex-col items-center justify-center text-center px-4 -mt-6 animate-fade-in">
        {/* Glow effect wrapper */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute -inset-6 bg-[#2563EB]/30 rounded-full blur-3xl animate-pulse" />
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-[#0a0f1d] border border-[#1e293b] p-4 shadow-2xl flex items-center justify-center">
            <img
              src="/logo.svg"
              alt="NeliTV"
              className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(37,99,235,0.6)] transform transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>

        {/* Brand Name directly below logo */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter flex items-center justify-center gap-1">
            <span>NELI</span>
            <span className="text-[#3B82F6]">TV</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-300 tracking-widest uppercase">
            Mubashara & Sinema HD
          </p>
        </div>

        {/* Minimal loading bar */}
        <div className="w-36 h-1 bg-[#1e293b] rounded-full mt-7 overflow-hidden relative">
          <div className="h-full bg-[#2563EB] rounded-full animate-pulse w-3/4" />
        </div>
      </div>

      {/* Footer Branding */}
      <div className="w-full text-center pb-8 px-4 text-[11px] text-slate-400 font-medium">
        <p>Toleo Rasmi &bull; {currentYear} NeliTV Tanzania</p>
        <p className="text-[10px] text-slate-500 mt-0.5">Azam Sports &bull; NBC Premier League &bull; Sinema Zetu</p>
      </div>
    </div>
  );
};
