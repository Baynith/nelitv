import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Cast,
  Tv,
  Wifi,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Copy,
  Check,
  Smartphone,
  Monitor
} from 'lucide-react';

interface CastModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoElement?: HTMLVideoElement | null;
  channelName?: string;
  streamUrl?: string;
}

export const CastModal: React.FC<CastModalProps> = ({
  isOpen,
  onClose,
  videoElement,
  channelName = 'NeliTv web Live TV',
  streamUrl,
}) => {
  const [castStatus, setCastStatus] = useState<'idle' | 'searching' | 'connected' | 'unsupported'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleTriggerCast = async () => {
    setCastStatus('searching');
    setStatusMessage('Inatafuta Smart TV kwenye mtandao wako wa Wi-Fi...');

    const activeVideo = videoElement || (typeof document !== 'undefined' ? document.querySelector('video') : null);

    // 1. Try Apple AirPlay Target Picker (iOS / Safari / iPad)
    if (activeVideo && (activeVideo as any).webkitShowPlaybackTargetPicker) {
      try {
        (activeVideo as any).webkitShowPlaybackTargetPicker();
        setCastStatus('connected');
        setStatusMessage('Dirisha la AirPlay limefunguliwa. Chagua Apple TV au Smart TV yako.');
        return;
      } catch (err) {
        console.warn('AirPlay prompt error:', err);
      }
    }

    // 2. Try W3C Remote Playback API (Chrome Android / PC)
    if (activeVideo && (activeVideo as any).remote && typeof (activeVideo as any).remote.prompt === 'function') {
      try {
        await (activeVideo as any).remote.prompt();
        setCastStatus('connected');
        setStatusMessage('TV yako imeunganishwa kupitia mtandao wa Wi-Fi!');
        return;
      } catch (err: any) {
        console.warn('Remote playback prompt cancelled or failed:', err);
        if (err.name === 'NotFoundError') {
          setStatusMessage('Hakuna Smart TV iliyopatikana. Hakikisha TV na simu vimeunganishwa kwenye mtandao wa Wi-Fi MOJA.');
          setCastStatus('idle');
          return;
        }
      }
    }

    // 3. Try Presentation API (Chromecast / Google TV / Wireless Display)
    if (typeof window !== 'undefined' && 'PresentationRequest' in window) {
      try {
        const targetUrl = streamUrl || window.location.href;
        const request = new (window as any).PresentationRequest([targetUrl]);
        const connection = await request.start();
        if (connection) {
          setCastStatus('connected');
          setStatusMessage('Umeunganishwa kwenye skrini ya Smart TV!');
          return;
        }
      } catch (err: any) {
        console.warn('Presentation API error:', err);
      }
    }

    // Fallback: Instructions
    setStatusMessage('Ili kurusha: Hakikisha TV na simu viko kwenye Wi-Fi MOJA. Chagua TV yako kwenye orodha ya vifaa au fungua link moja kwa moja kwenye browser ya TV yako.');
    setCastStatus('idle');
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://nelitv.app';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cast className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white leading-tight">Rusha Kwenye Smart TV</h3>
              <p className="text-[10px] text-slate-400">Chromecast, AirPlay &amp; Wireless TV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition"
            aria-label="Funga"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wi-Fi Requirement Notice */}
        <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 p-3.5 rounded-2xl border border-cyan-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <Wifi className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Sharti la Wi-Fi Moja (Same Wi-Fi)</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Kurusha kwenye TV inategemea <strong className="text-white">Wi-Fi sawa</strong>. Hakikisha simu au kompyuta yako imeunganishwa kwenye mtandao mmoja wa Wi-Fi na Smart TV yako (Samsung, LG, Android TV, Hisense au Apple TV).
          </p>
        </div>

        {/* Status Message if any */}
        {statusMessage && (
          <div className="bg-cyan-950/50 border border-cyan-500/40 text-cyan-200 text-xs p-3 rounded-xl flex items-start gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleTriggerCast}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3 rounded-xl shadow-lg transition active:scale-95 text-xs sm:text-sm"
        >
          <Cast className="w-4 h-4" />
          <span>Tafuta Smart TV Sasa (Cast)</span>
        </button>

        {/* Quick TV Browser Alternative with QR */}
        <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 space-y-2 text-center">
          <div className="flex items-center justify-center gap-1.5 text-slate-300 font-semibold">
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span>Au fungua moja kwa moja kwenye TV:</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-900 py-2 px-3 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-400 truncate select-all text-left">
              {currentUrl}
            </div>
            <button
              onClick={handleCopy}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition"
              title="Nakili Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowQr(!showQr)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl border border-slate-800 transition"
              title="Onyesha QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>

          {showQr && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center space-y-2 animate-fade-in">
              <div className="p-2 bg-white rounded-xl shadow-md">
                <QRCodeSVG value={currentUrl} size={110} level="M" />
              </div>
              <span className="text-[10px] text-slate-400">
                Scan na simu au TV camera kufungua moja kwa moja
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

