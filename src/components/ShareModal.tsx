import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Channel } from '../data/channels';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Send,
  Monitor,
  Tv,
  Smartphone,
  Sparkles,
  QrCode,
  Download
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  channel,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Generate public sharing URL pointing directly to this channel
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://neliplay.web.app';
  const channelParam = channel ? `?channel=${channel.id}` : '';
  const shareUrl = `${origin}/${channelParam}`;

  const channelName = channel ? channel.name : 'NeliTV';
  const shareTitle = `Tazama ${channelName} Mubashara kwenye NeliTV`;
  const shareText = `Tazama ${channelName} ya moja kwa moja kwenye NeliTV Web (inacheza kwenye Laptop, PC na Smart TV bila malipo au buffer): ${shareUrl}`;

  const smsBody = `${shareTitle} - ${shareText}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const handleOpenWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(smsBody)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Tazama ${channelName} LIVE kwenye PC au Smart TV:`)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div
        className="relative w-full max-w-lg bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-[#0f172a] hover:bg-[#1e293b] p-2 rounded-full transition cursor-pointer border border-[#1e293b]"
          title="Funga"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-900/40">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base sm:text-lg font-black text-white">Shiriki Kiungo cha Video</h2>
              <span className="bg-[#2563EB] text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {channel ? `Shiriki "${channel.name}" kwa marafiki au itume kwenye TV/PC yako.` : 'Shiriki chaneli za TV kwa marafiki au kwenye kompyuta yako.'}
            </p>
          </div>
        </div>

        {/* Device Rule Notice */}
        <div className="bg-[#050811] border border-[#1e293b] rounded-xl p-3 space-y-1 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-bold text-white">
            <Monitor className="w-4 h-4 text-[#3B82F6] shrink-0" />
            <span>Kinafunguka kwenye PC, Laptop na Smart TV</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Kwenye simu za mkononi, link hii itamuongoza mtazamaji kupakua rasmi <strong>NeliTV APK</strong> kwa uchezaji usio na kikomo.
          </p>
        </div>

        {/* Copy Link Input Bar */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Kiungo cha Chaneli (URL):</label>
          <div className="flex items-center gap-2 bg-[#050811] border border-[#1e293b] rounded-xl p-1.5">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-xs text-slate-300 px-2 py-1.5 flex-1 focus:outline-none font-mono truncate select-all"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-black px-4 py-2 rounded-lg transition active:scale-95 shrink-0 shadow-md shadow-blue-900/30 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Imenakiliwa!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Nakili</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-semibold text-slate-300">Tuma Moja kwa Moja:</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* WhatsApp */}
            <button
              onClick={handleOpenWhatsApp}
              className="flex items-center justify-center gap-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] font-bold py-2.5 px-3 rounded-xl transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              onClick={handleOpenTelegram}
              className="flex items-center justify-center gap-2 bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/40 text-[#229ED9] font-bold py-2.5 px-3 rounded-xl transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Telegram</span>
            </button>
          </div>

          {/* Native Web Share API if supported */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 bg-[#050811] hover:bg-[#131d36] text-white font-bold py-2.5 px-3 rounded-xl border border-[#1e293b] text-xs transition cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#3B82F6]" />
              <span>Chaguzi Zaidi za Kushiriki (Apps Zote)</span>
            </button>
          )}
        </div>

        {/* QR Code Toggle for TV / PC Transfer */}
        <div className="border-t border-[#1e293b] pt-3">
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white py-1 cursor-pointer font-bold"
          >
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#3B82F6]" />
              <span>{showQR ? 'Ficha QR Code' : 'Onyesha QR Code ya Kufungua kwenye Kifaa Kingine'}</span>
            </div>
            <span className="text-slate-500">{showQR ? '▲' : '▼'}</span>
          </button>

          {showQR && (
            <div className="mt-3 flex flex-col items-center justify-center p-4 bg-[#050811] rounded-xl border border-[#1e293b] space-y-2 animate-fade-in">
              <div className="p-3 bg-white rounded-xl shadow-lg">
                <QRCodeSVG
                  value={shareUrl}
                  size={140}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center max-w-[240px]">
                Elekeza kamera ya simu au kifaa chako hapa ili kufungua video hii moja kwa moja.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-500 pt-1">
          NeliTV Streaming Tanzania • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};
