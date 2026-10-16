import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Download,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Tv,
  QrCode,
  Copy,
  Check,
  Send,
  X,
  Zap,
  Monitor,
  CheckCircle2,
  Globe,
  Sparkles,
  Layers,
  ArrowRight,
  Play
} from 'lucide-react';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [latestVersion, setLatestVersion] = useState<string>('v2.0.0');
  const [downloadUrl, setDownloadUrl] = useState<string>(
    'https://github.com/baynith1/Nelitv/releases/download/v2.0.0/Nelitv.apk'
  );
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isInstallingPwa, setIsInstallingPwa] = useState<boolean>(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState<boolean>(false);

  useEffect(() => {
    // Fetch latest GitHub release dynamically
    fetch('https://api.github.com/repos/baynith1/Nelitv/releases/latest')
      .then((res) => res.json())
      .then((data) => {
        if (data?.tag_name) {
          setLatestVersion(data.tag_name);
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

  const handlePwaInstall = async () => {
    setIsInstallingPwa(true);
    try {
      const outcome = await install();
      if (!outcome) {
        setShowDesktopGuide(true);
      }
    } catch (err) {
      console.warn('PWA install error', err);
      setShowDesktopGuide(true);
    } finally {
      setIsInstallingPwa(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(downloadUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0a0f1d] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Blue Black Branding */}
        <div className="p-4 sm:p-5 border-b border-[#1e293b] flex items-center justify-between bg-[#080d1a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white font-black flex items-center justify-center p-1.5 shadow-lg shadow-blue-900/40">
              <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                Pakua NeliTV Live App
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan QR Code kwenye simu au pakua moja kwa moja ({latestVersion})
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

        {/* Modal Body: Adaptive Responsive Layout */}
        <div className="p-5 sm:p-6 space-y-6 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: QR Code Scan Section */}
            <div className="flex flex-col items-center justify-center p-5 bg-[#050811] rounded-2xl border border-[#1e293b] text-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-xl">
                <QRCodeSVG
                  value={downloadUrl}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-white">
                  <QrCode className="w-4 h-4 text-[#3B82F6]" />
                  <span>Scan Kwenye Simu Kupakua</span>
                </div>
                <p className="text-[11px] text-slate-400 max-w-[200px]">
                  Elekeza kamera ya simu yako kwenye QR code hii ili kupakua moja kwa moja.
                </p>
              </div>

              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#0a0f1d] border border-[#1e293b] text-slate-300 font-mono">
                Release: {latestVersion}
              </span>
            </div>

            {/* Right: Direct Download & PWA Software Options */}
            <div className="space-y-4 flex flex-col justify-between">
              {/* Option 1: Direct APK Download */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">
                  Pakua Faili la Android (APK):
                </span>
                <a
                  href={downloadUrl}
                  download="Nelitv.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black py-3 px-4 rounded-xl shadow-xl shadow-blue-900/40 transition active:scale-95 text-xs sm:text-sm cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Pakua APK ya Moja kwa Moja</span>
                </a>
              </div>

              {/* Option 2: Copy Download Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 bg-[#050811] hover:bg-[#131d36] text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs border border-[#1e293b] transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-[#3B82F6]" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedLink ? 'Link Imenakiliwa!' : 'Nakili Link ya APK'}</span>
              </button>

              {/* Option 3: PC Standalone App / PWA */}
              <div className="p-3.5 bg-[#050811] rounded-2xl border border-[#1e293b] space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Monitor className="w-4 h-4 text-[#3B82F6]" />
                  <span>Sakinisha kama Programu ya Kompyuta (PC)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Inafunguka kwenye dirisha lake bila URL bar na kuwa na icon kwenye Desktop na Start Menu.
                </p>

                {isInstalled ? (
                  <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold pt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Programu imeshasakinishwa kwenye kifaa hiki!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handlePwaInstall}
                      disabled={isInstallingPwa}
                      className="w-full flex items-center justify-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2 px-3 rounded-lg border border-blue-500/40 transition cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-white" />
                      <span>{isInstallingPwa ? 'Inasakinisha...' : 'Sakinisha Kwenye Kompyuta (PC)'}</span>
                    </button>

                    {showDesktopGuide && (
                      <div className="p-2.5 rounded-lg bg-[#080d1a] border border-blue-500/40 text-[11px] text-slate-300 space-y-1.5 animate-fade-in">
                        <p className="font-bold text-blue-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#3B82F6]" />
                          <span>Jinsi ya kusakinisha kwenye kivinjari chako:</span>
                        </p>
                        <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                          <li>Kwenye Chrome au Edge, bofya icon ya Kompyuta [⊕] kwenye upande wa kulia wa <strong>Address Bar</strong> (juu).</li>
                          <li>Au bofya menu ya nukta tatu (⋮) &rarr; chagua <strong>&quot;Sakinisha NeliTV...&quot; (Install App)</strong>.</li>
                          <li>Bofya <strong>&quot;Sakinisha&quot;</strong> na icon itaongezwa moja kwa moja kwenye Desktop ya PC yako!</li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Android Smart TV notice strip */}
          <div className="p-3 rounded-xl bg-[#080d1a] border border-[#1e293b] flex items-center gap-2.5 text-xs text-slate-300">
            <Tv className="w-4 h-4 text-[#3B82F6] shrink-0" />
            <span>
              <strong>Smart TV &amp; Android TV:</strong> Unaweza kupakua APK hii kupitia kivinjari cha TV yako au kuhamisha kupitia Flash drive.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#050811] border-t border-[#1e293b] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Imethibitishwa na Google Play Protect</span>
          </div>
          <span className="font-mono">{latestVersion} (Android 5.0+)</span>
        </div>
      </div>
    </div>
  );
};
