import React, { useState, useEffect } from 'react';
import { BannerNotification } from '../services/notificationService';
import { Play, Clock, Sparkles, ChevronRight, Tv, Flame } from 'lucide-react';

interface DerbyMatchBannerProps {
  notification: BannerNotification;
  onSelectChannel: (channelId: string) => void;
}

export const DerbyMatchBanner: React.FC<DerbyMatchBannerProps> = ({
  notification,
  onSelectChannel,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(notification.eventDate).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [notification.eventDate]);

  const handleClick = () => {
    if (notification.targetChannelId) {
      onSelectChannel(notification.targetChannelId);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-black p-4 sm:p-6 shadow-2xl transition hover:border-amber-400/80 cursor-pointer"
    >
      {/* Background Ambient Glow */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl group-hover:bg-amber-500/25 transition"></div>
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl group-hover:bg-cyan-500/25 transition"></div>

      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full animate-pulse shadow">
            <Flame className="w-3 h-3 fill-current" />
            MECHI KALI YA DERBY
          </span>
          <span className="text-xs sm:text-sm font-bold text-amber-300">
            Kesho Tarehe 10/10/2026 • Saa 1:00 Usiku (19:00 EAT)
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-xl text-xs text-slate-300">
          <Tv className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold">{notification.targetChannelName || 'Azam Sport 1'}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Teams Matchup (Col 1-7) */}
        <div className="md:col-span-7 flex items-center justify-around sm:justify-start sm:gap-6">
          {/* Team 1 */}
          <div className="flex flex-col items-center text-center gap-1.5 max-w-[120px] sm:max-w-[140px]">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950/90 border border-amber-500/30 p-2 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
              {notification.team1Logo ? (
                <img
                  src={notification.team1Logo}
                  alt={notification.team1Name || 'Team 1'}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.svg';
                  }}
                />
              ) : (
                <span className="font-black text-amber-400 text-lg sm:text-xl">YANGA</span>
              )}
            </div>
            <span className="font-black text-white text-xs sm:text-sm tracking-wide">
              {notification.team1Name || 'Yanga SC'}
            </span>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center justify-center px-2">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center shadow-lg shadow-amber-500/30">
              VS
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mt-1 font-bold">
              DERBY
            </span>
          </div>

          {/* Team 2 */}
          <div className="flex flex-col items-center text-center gap-1.5 max-w-[120px] sm:max-w-[140px]">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950/90 border border-red-500/30 p-2 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
              {notification.team2Logo ? (
                <img
                  src={notification.team2Logo}
                  alt={notification.team2Name || 'Team 2'}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.svg';
                  }}
                />
              ) : (
                <span className="font-black text-red-400 text-lg sm:text-xl">SIMBA</span>
              )}
            </div>
            <span className="font-black text-white text-xs sm:text-sm tracking-wide">
              {notification.team2Name || 'Simba SC'}
            </span>
          </div>
        </div>

        {/* Countdown Timer & Action Button (Col 8-12) */}
        <div className="md:col-span-5 flex flex-col items-center md:items-end gap-3">
          {/* Countdown Blocks */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-center min-w-[50px] shadow">
              <span className="block text-base sm:text-xl font-black text-amber-400 font-mono">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Siku</span>
            </div>
            <span className="text-amber-400 font-bold">:</span>
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-center min-w-[50px] shadow">
              <span className="block text-base sm:text-xl font-black text-amber-400 font-mono">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Masaa</span>
            </div>
            <span className="text-amber-400 font-bold">:</span>
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-center min-w-[50px] shadow">
              <span className="block text-base sm:text-xl font-black text-amber-400 font-mono">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Dk</span>
            </div>
            <span className="text-amber-400 font-bold">:</span>
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-center min-w-[50px] shadow">
              <span className="block text-base sm:text-xl font-black text-cyan-400 font-mono">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Sek</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition active:scale-95 group-hover:scale-105"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Tazama Mubashara Kwenye Azam Sport 1</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
