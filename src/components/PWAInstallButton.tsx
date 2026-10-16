import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Tv, Smartphone, X, QrCode, ExternalLink, Check, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa'>('apk');

  const [version, setVersion] = useState('v2.0.0');
  const [downloadUrl, setDownloadUrl] = useState(
    'https://github.com/baynith1/Nelitv/releases/download/v2.0.0/Nelitv.apk'
  );

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Fetch latest version from GitHub release API
  useEffect(() => {
    fetch('https://api.github.com/repos/baynith1/Nelitv/releases/latest')
      .then((res) => res.json())
      .then((data) => {
        if (data.tag_name) {
          setVersion(data.tag_name);
          const apkAsset = data.assets?.find((a: any) => a.name?.endsWith('.apk'));
          if (apkAsset && apkAsset.browser_download_url) {
            setDownloadUrl(apkAsset.browser_download_url);
          } else {
            setDownloadUrl(`https://github.com/baynith1/Nelitv/releases/download/${data.tag_name}/Nelitv.apk`);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Close on Escape key (TV Remote Back button)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'GoBack') {
        if (showModal) {
          setShowModal(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowModal(false);
      }
    } else {
      alert('Kwenye Smart TV au PC, chagua "Install" au "Ongeza kwenye Skrini ya Nyumbani" (Add to Home Screen) kwenye orodha ya kivinjari chako.');
    }
  };

  return (
    <>
      {/* Header Button - Compact and never hiding logo */}
      <button
        onClick={() => setShowModal(true)}
        className="shrink-0 flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
        title="Pakua au Sakinisha App"
        tabIndex={0}
      >
        <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>Pakua App</span>
      </button>

      {/* Centered Modal Popup - Strictly positioned in center of screen */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-white space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with clear prominent X button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <div className="flex items-center gap-2.5">
                <img src="/logo.svg" alt="NeliTV" className="w-8 h-8 object-contain rounded-xl" />
                <div>
                  <h4 className="font-bold text-sm sm:text-base leading-tight">Pakua / Sakinisha NeliTV</h4>
                  <p className="text-[11px] text-slate-400">Toleo jipya ({version})</p>
                </div>
              </div>

              {/* Accessible Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-200 hover:text-white border border-slate-700 shadow-md transition focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                aria-label="Funga"
                tabIndex={0}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher: Android APK (with QR Code) vs Smart TV / PC PWA */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('apk')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'apk'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                tabIndex={0}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Simu (APK)</span>
              </button>

              <button
                onClick={() => setActiveTab('pwa')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'pwa'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                tabIndex={0}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Smart TV &amp; PC</span>
              </button>
            </div>

            {/* TAB 1: ANDROID APK WITH QR CODE */}
            {activeTab === 'apk' && (
              <div className="space-y-4 pt-1 animate-fade-in text-center">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center space-y-3">
                  {/* QR Code for Smart TV and PC screens */}
                  <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center">
                    <QRCodeSVG
                      value={downloadUrl}
                      size={160}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-800/50">
                      <QrCode className="w-3 h-3" />
                      <span>Scan kwa Simu ya Mkononi</span>
                    </div>
                    <p className="text-xs text-slate-300 max-w-xs">
                      Elekeza kamera ya simu yako hapa ili kupakua APK ya <strong>NeliTV ({version})</strong> moja kwa moja.
                    </p>
                  </div>
                </div>

                {/* Direct Download Button */}
                <div className="space-y-2">
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3 px-4 rounded-xl shadow-lg transition active:scale-95 text-xs sm:text-sm"
                    tabIndex={0}
                  >
                    <Download className="w-4 h-4" />
                    <span>Pakua APK Moja kwa Moja ({version})</span>
                  </a>

                  <a
                    href="https://github.com/baynith1/Nelitv/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 transition"
                  >
                    <span>Fungua Ukurasa wa GitHub Release</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* TAB 2: SMART TV & PC PWA INSTALL */}
            {activeTab === 'pwa' && (
              <div className="space-y-3 pt-1 animate-fade-in">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3 text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <Tv className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-white">App ya Smart TV &amp; Kompyuta</h5>
                      <p className="text-xs text-slate-400">Progressive Web App (PWA)</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sakinisha app hii kwenye Smart TV yako (Android TV, LG webOS, Samsung Tizen) au PC ili kufungua haraka na kutumia remote bila kufungua kivinjari.
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Inasaidia remote ya TV (D-Pad, Ok, Channel Up/Down)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Inafanya kazi bila kufungua tab ya kivinjari</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleInstallPWA}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-3 px-4 rounded-xl shadow-lg transition active:scale-95 text-xs sm:text-sm"
                  tabIndex={0}
                >
                  <Download className="w-4 h-4" />
                  <span>Sakinisha App ya TV &amp; PC (PWA)</span>
                </button>
              </div>
            )}

            <div className="text-[10px] text-slate-500 text-center pt-1">
              Bofya popote pembeni ili kufunga dirisha hili
            </div>
          </div>
        </div>
      )}
    </>
  );
};
