import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Tv,
  Star,
  Sparkles,
  Play
} from 'lucide-react';

interface MobileAppGateProps {
  channelName?: string;
}

export const MobileAppGate: React.FC<MobileAppGateProps> = () => {
  const [latestVersion, setLatestVersion] = useState<string>('v2.0.0');
  const [downloadUrl, setDownloadUrl] = useState<string>(
    'https://github.com/baynith1/Nelitv/releases/download/v2.0.0/Nelitv.apk'
  );
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    // Fetch latest GitHub release dynamically while keeping existing fallback
    fetch('https://api.github.com/repos/baynith1/Nelitv/releases/latest')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.tag_name) {
          setLatestVersion(data.tag_name);
          const apkAsset = data.assets?.find(
            (a: any) => a.name && typeof a.name === 'string' && a.name.endsWith('.apk')
          );
          if (apkAsset && apkAsset.browser_download_url) {
            setDownloadUrl(apkAsset.browser_download_url);
          } else {
            setDownloadUrl(
              `https://github.com/baynith1/Nelitv/releases/download/${data.tag_name}/Nelitv.apk`
            );
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch GitHub latest release', err);
      });
  }, []);

  const handleDownloadClick = () => {
    setIsDownloading(true);
    setTimeout(() => setIsDownloading(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#050811] text-white flex flex-col items-center justify-between font-sans select-none px-4 py-8 antialiased">
      {/* Top Header / Subtle badge */}
      <div className="w-full max-w-sm flex items-center justify-between text-xs text-slate-400 pb-4">
        <span className="flex items-center gap-1.5 text-blue-400 font-bold bg-[#0a0f1d] border border-[#1e293b] px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping" />
          Android App Rasmi
        </span>
        <span className="text-slate-500 font-mono text-[11px]">{latestVersion}</span>
      </div>

      {/* Main Center Content Container */}
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 my-auto animate-fade-in">
        {/* 1. Official NeliTV Logo at the top with Blue-Black glow */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#2563EB]/30 to-[#3B82F6]/20 rounded-3xl blur-2xl animate-pulse" />
          <div className="relative w-28 h-28 rounded-3xl bg-[#0a0f1d] border-2 border-[#1e293b] p-3 shadow-2xl flex items-center justify-center">
            <img
              src="/logo.svg"
              alt="NeliTV Logo"
              className="w-full h-full object-contain drop-shadow-[0_8px_20px_rgba(37,99,235,0.4)]"
            />
          </div>
        </div>

        {/* 2. Application Name: NeliTV */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              NELI<span className="text-[#3B82F6]">TV</span>
            </h1>
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-black shadow-md shadow-blue-900/40"
              title="Verified Application"
            >
              ✓
            </span>
          </div>

          {/* 3. Short Welcome Message */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed px-2">
            Karibu NeliTV! Ili kupata uzoefu bora na wa haraka bila buffer kwenye simu yako, tafadhali tumia <strong>NeliTV Android Application</strong> kutazama Azam Sports, mechi zote za NBC Premier League na sinema zote mubashara.
          </p>
        </div>

        {/* Quick App Highlights Strip */}
        <div className="w-full grid grid-cols-3 gap-2 bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-3 text-center shadow-lg">
          <div>
            <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-black">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>4.9</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Ukaguzi</div>
          </div>
          <div className="border-x border-[#1e293b]">
            <div className="text-xs font-black text-white">~18 MB</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Ukubwa</div>
          </div>
          <div>
            <div className="text-xs font-black text-[#3B82F6]">100% Bure</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Gharama</div>
          </div>
        </div>

        {/* 4. Large, Attractive "Download NeliTV APK" Button */}
        <div className="w-full pt-1">
          <a
            href={downloadUrl}
            download="Nelitv.apk"
            onClick={handleDownloadClick}
            className="group w-full flex items-center justify-center gap-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black py-4 px-6 rounded-2xl shadow-2xl shadow-blue-900/50 active:scale-95 transition-all duration-200 cursor-pointer text-base tracking-wide"
          >
            <Download className="w-6 h-6 animate-bounce" />
            <span>Download NeliTV APK</span>
          </a>

          <p className="text-[11px] text-slate-400 mt-2.5">
            Faili rasmi la APK: <strong className="text-white">Nelitv.apk</strong> ({latestVersion})
          </p>
        </div>

        {/* Security and Trust Badges */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 pt-1">
          <span className="flex items-center gap-1 text-[#3B82F6] font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
            <span>Salama 100%</span>
          </span>
          <span className="text-slate-600">•</span>
          <span>Google Play Protect Verified</span>
        </div>
      </div>

      {/* Footer info */}
      <footer className="w-full max-w-sm text-center pt-6 text-[11px] text-slate-500">
        <p>NeliTV Live Streaming &copy; {new Date().getFullYear()}</p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          Inapatikana pia kwenye kompyuta na Smart TV kupitia Web
        </p>
      </footer>
    </div>
  );
};
