import React, { useState, useEffect } from 'react';
import { CHANNELS, Channel, PRICING_PLANS } from './data/channels';
import { Player } from './components/Player';
import { PaymentModal } from './components/PaymentModal';
import { AuthModal } from './components/AuthModal';
import { AccountPage } from './components/AccountPage';
import { AppDownloadModal } from './components/AppDownloadModal';
import { ShareModal } from './components/ShareModal';
import { MobileAppGate } from './components/MobileAppGate';
import { ChannelLogo } from './components/ChannelLogo';
import { TanzaniaNoticeBanner } from './components/TanzaniaNoticeBanner';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useTVRemote } from './hooks/useTVRemote';
import {
  UserProfile,
  getCachedUserProfile,
  isUserSubscribed,
  initAutoLogin,
  listenToUserProfileRealtime,
  activateSubscriptionForUser,
} from './services/firebase';
import { SplashScreen } from './components/SplashScreen';
import { setupSecurityGuards } from './utils/security';
import {
  Play,
  ShieldCheck,
  User,
  ArrowLeft,
  Sparkles,
  Search,
  CheckCircle2,
  Crown,
  ChevronRight,
  Share2,
  Tv,
  Smartphone,
  X,
  Lock
} from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'watch' | 'account' | 'plans'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.toLowerCase();
        if (hash.startsWith('#watch')) return 'watch';
        if (hash === '#plans') return 'plans';
        if (hash === '#account') return 'account';
      }
    } catch {}
    return 'home';
  });

  const [selectedChannel, setSelectedChannel] = useState<Channel>(CHANNELS[0]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Responsive mobile breakpoint (<768px): Smartphones see the dedicated APK download page
  // Tablets (>=768px) and desktop see the full streaming website
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileScreen = windowWidth < 768;

  // First-time visit banner for desktop / PC / tablets
  const [showTanzaniaNotice, setShowTanzaniaNotice] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      if (window.innerWidth < 768) return false;
      const seen = localStorage.getItem('nelitv_tz_notice_accepted');
      return seen !== 'true';
    } catch {
      return false;
    }
  });

  // PWA Install Hook for Desktop
  const { isInstallable, isInstalled } = usePWAInstall();

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<'freemium' | 'standard' | 'premium'>('freemium');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [shareTargetChannel, setShareTargetChannel] = useState<Channel | null>(null);
  const [isAppDownloadOpen, setIsAppDownloadOpen] = useState<boolean>(false);
  const [sharedToast, setSharedToast] = useState<string | null>(null);
  const [securityToast, setSecurityToast] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [recoveryToast, setRecoveryToast] = useState<string | null>(null);

  // User & Auth
  const [user, setUser] = useState<UserProfile | null>(() => getCachedUserProfile());
  const isSubscribed = isUserSubscribed(user);

  // 1. Digital Rights Management & Stream Protection
  useEffect(() => {
    const cleanupSecurity = setupSecurityGuards((msg) => {
      setSecurityToast(msg);
      setTimeout(() => setSecurityToast(null), 3500);
    });
    return cleanupSecurity;
  }, []);

  // 2. Auto-recovery for interrupted payments
  useEffect(() => {
    const checkInterruptedPayment = async () => {
      try {
        const rawPending = localStorage.getItem('nelitv_pending_payment');
        if (!rawPending) return;
        const pending = JSON.parse(rawPending);
        if (!pending?.orderId) return;

        const ageHours = (Date.now() - (pending.createdAt || 0)) / (1000 * 60 * 60);
        if (ageHours > 48) {
          localStorage.removeItem('nelitv_pending_payment');
          return;
        }

        const res = await fetch(`/api/payment/status/${pending.orderId}`);
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          const statusStr = (data.status || data.payment?.status || '').toLowerCase().trim();
          if (
            data.success &&
            ['completed', 'confirmed', 'success', 'successful', 'paid', 'complete'].includes(statusStr)
          ) {
            const currentProfile: UserProfile = user || {
              uid: 'tz_phone_' + pending.phone,
              displayName: `Mteja (${pending.phone})`,
              phone: pending.phone,
              role: 'user',
              isAnonymous: true,
              subscription: { status: 'inactive' },
            };
            const updated = await activateSubscriptionForUser(
              currentProfile,
              pending.planId || 'freemium',
              pending.amount || 1000,
              pending.orderId,
              pending.phone
            );
            setUser(updated);
            localStorage.removeItem('nelitv_pending_payment');
            setRecoveryToast(`🎉 Malipo ya namba ${pending.phone} yamethibitishwa na chaneli zote zimefunguliwa!`);
            setTimeout(() => setRecoveryToast(null), 8000);
          }
        }
      } catch {}
    };

    checkInterruptedPayment();
    window.addEventListener('online', checkInterruptedPayment);
    return () => window.removeEventListener('online', checkInterruptedPayment);
  }, [user]);

  // Global Backspace Key protection
  useEffect(() => {
    const handleGlobalBackspace = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.keyCode === 8) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        const isEditable =
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          target?.isContentEditable ||
          (target as any)?.getAttribute?.('contenteditable') === 'true';

        if (!isEditable) {
          e.preventDefault();
        } else {
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalBackspace, true);
    return () => window.removeEventListener('keydown', handleGlobalBackspace, true);
  }, []);

  // Auto-login persistence
  useEffect(() => {
    const unsubscribeAuth = initAutoLogin((loggedInUser) => {
      setUser(loggedInUser);
    });
    return unsubscribeAuth;
  }, []);

  // Real-time Firebase listener
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribeRealtime = listenToUserProfileRealtime(user.uid, (updatedProfile) => {
      setUser(updatedProfile);
    });
    return unsubscribeRealtime;
  }, [user?.uid]);

  // Routing with URL Hash
  useEffect(() => {
    const handleHash = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isShared = urlParams.get('shared') === '1' || urlParams.get('share') === '1';
      const sharedChannelId = urlParams.get('channel');

      if (isShared && sharedChannelId) {
        const ch = CHANNELS.find((c) => c.id === sharedChannelId);
        if (ch) {
          setSelectedChannel(ch);
          setCurrentPage('watch');
          setSharedToast(`Umeunganishwa kwenye ${ch.name} LIVE!`);
          setTimeout(() => setSharedToast(null), 6000);
          return;
        }
      }

      const hash = window.location.hash.toLowerCase();
      if (hash.startsWith('#watch')) {
        setCurrentPage('watch');
        const channelParam = new URLSearchParams(hash.split('?')[1] || '').get('channel');
        if (channelParam) {
          const ch = CHANNELS.find((c) => c.id === channelParam);
          if (ch) setSelectedChannel(ch);
        }
      } else if (hash === '#plans') {
        setCurrentPage('plans');
      } else if (hash === '#account') {
        setCurrentPage('account');
      } else {
        setCurrentPage('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (page: 'home' | 'watch' | 'account' | 'plans') => {
    setCurrentPage(page);
    window.location.hash = page === 'home' ? '' : `#${page}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoClick = () => {
    setActiveCategory('all');
    setSearchQuery('');
    navigateTo('home');
  };

  const handlePlayChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    navigateTo('watch');
  };

  // Smart TV Remote
  useTVRemote({
    currentPage: currentPage,
    selectedChannel,
    onSelectChannel: (ch) => handlePlayChannel(ch),
    onGoHome: () => navigateTo('home'),
    isModalOpen: isPaymentOpen || isAuthOpen || isShareOpen || isAppDownloadOpen || showTanzaniaNotice,
    onCloseModal: () => {
      setIsPaymentOpen(false);
      setIsAuthOpen(false);
      setIsShareOpen(false);
      setIsAppDownloadOpen(false);
      setShowTanzaniaNotice(false);
    },
  });

  // Filter channels based on search and category
  const filteredChannels = CHANNELS.filter((ch) => {
    const matchesSearch =
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeCategory === 'all') return true;
    if (activeCategory === 'sports') return ch.category === 'sports';
    if (activeCategory === 'entertainment') return ch.category === 'entertainment';
    if (activeCategory === 'movies') return ch.category === 'movies';
    return true;
  });

  // ================= 4. MOBILE LAYOUT BREAKPOINT (<768px) =================
  // When opened on a mobile smartphone, display the beautiful, clean APK download landing page
  if (isMobileScreen) {
    return (
      <div className="bg-[#050811] text-white min-h-screen">
        <MobileAppGate channelName={selectedChannel?.name} />
      </div>
    );
  }

  // ================= DESKTOP & TABLET EXPERIENCE (>=768px) =================
  return (
    <div className="min-h-screen bg-[#050811] text-white flex flex-col font-sans select-none antialiased">
      {/* 1. Security Warning Toast */}
      {securityToast && (
        <div className="fixed top-4 right-4 z-50 bg-[#0a0f1d] border border-[#2563EB] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-slide-in">
          <Lock className="w-4 h-4 text-[#3B82F6] shrink-0" />
          <span>{securityToast}</span>
        </div>
      )}

      {/* 2. Shared Channel Toast */}
      {sharedToast && (
        <div className="bg-[#2563EB] text-white py-2 px-4 text-center text-xs font-bold flex items-center justify-between max-w-7xl mx-auto animate-fade-in shadow-md">
          <div className="flex items-center gap-2 mx-auto">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>{sharedToast}</span>
          </div>
          <button
            onClick={() => setSharedToast(null)}
            className="text-white font-bold text-base px-2 leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* 3. Recovery Toast Notification */}
      {recoveryToast && (
        <div className="bg-[#0a0f1d] border-b border-[#1e293b] py-2.5 px-4 text-center text-xs font-semibold text-white flex items-center justify-between max-w-7xl mx-auto animate-fade-in shadow-lg">
          <div className="flex items-center gap-2 mx-auto">
            <CheckCircle2 className="w-4 h-4 text-[#3B82F6] shrink-0" />
            <span>{recoveryToast}</span>
          </div>
          <button
            onClick={() => setRecoveryToast(null)}
            className="text-slate-400 hover:text-white font-bold text-base px-2 leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* ================= 2. DESKTOP WEBSITE HEADER ================= */}
      {/* Kept ONLY these 5 elements in exact order: 1. Logo, 2. Search, 3. Vifurushi, 4. Pakua App, 5. Account */}
      <header className="sticky top-0 z-40 bg-[#050811]/95 backdrop-blur-md border-b border-[#1e293b] shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Element 1: NeliTV Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 group text-left shrink-0 cursor-pointer"
            title="Mwanzo - NeliTV"
          >
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center group-hover:scale-105 transition shadow-lg shadow-blue-900/40">
              <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white">
                NELI<span className="text-[#3B82F6]">TV</span>
              </span>
              <span className="bg-[#2563EB] text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono shadow-sm">
                LIVE
              </span>
            </div>
          </button>

          {/* Element 2: Search */}
          <div className="flex flex-1 max-w-md mx-2 sm:mx-6">
            <div className="relative w-full flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tafuta chaneli (Azam Sports, Sinema, Habari)..."
                className="w-full bg-[#0a0f1d] border border-[#1e293b] focus:border-[#2563EB] rounded-full pl-4 pr-10 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition shadow-inner"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
              )}
            </div>
          </div>

          {/* Right Header Navigation Group (Elements 3, 4, 5 in exact order) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Element 3: Vifurushi */}
            <button
              onClick={() => navigateTo('plans')}
              className={`flex items-center gap-1.5 text-xs sm:text-sm px-4 py-2 rounded-full transition active:scale-95 cursor-pointer ${
                currentPage === 'plans'
                  ? 'bg-white text-[#050811] font-bold shadow-md'
                  : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold shadow-lg shadow-blue-900/40'
              }`}
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Vifurushi</span>
            </button>

            {/* Element 4: Pakua App */}
            <button
              onClick={() => setIsAppDownloadOpen(true)}
              className="flex items-center gap-1.5 text-xs sm:text-sm px-4 py-2 rounded-full border border-[#1e293b] bg-[#0a0f1d] hover:bg-[#131d36] text-white font-bold transition active:scale-95 cursor-pointer shadow-sm"
              title="Pakua au Sakinisha App"
            >
              <Smartphone className="w-4 h-4 text-[#3B82F6]" />
              <span>{isInstalled ? 'App (PWA)' : 'Pakua App'}</span>
            </button>

            {/* Element 5: Account */}
            {user ? (
              <button
                onClick={() => navigateTo('account')}
                className={`flex items-center gap-2 text-xs sm:text-sm pl-2.5 pr-3.5 py-1.5 rounded-full border transition active:scale-95 cursor-pointer ${
                  isSubscribed
                    ? 'bg-[#2563EB] text-white font-bold border-[#2563EB] shadow-md shadow-blue-900/40'
                    : 'bg-[#0a0f1d] border-[#1e293b] text-white hover:bg-[#131d36]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                    isSubscribed ? 'bg-black text-[#3B82F6]' : 'bg-white text-black'
                  }`}
                >
                  {isSubscribed ? <Crown className="w-3.5 h-3.5 text-amber-300" /> : user.displayName.charAt(0)}
                </div>
                <span className="font-semibold max-w-[120px] truncate">{user.displayName}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 bg-[#0a0f1d] hover:bg-[#131d36] text-white font-bold border border-[#1e293b] px-4 py-2 rounded-full text-xs sm:text-sm transition active:scale-95 cursor-pointer"
              >
                <User className="w-4 h-4 text-[#3B82F6]" />
                <span>Account</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16">
        {/* ================= PAGE 1: WATCH LIVE CHANNEL PLAYER ================= */}
        {currentPage === 'watch' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT / MAIN COLUMN: PLAYER + METADATA */}
              <div className="lg:col-span-8 space-y-4">
                <div className="w-full bg-black shadow-2xl rounded-2xl overflow-hidden aspect-video border border-[#1e293b] relative">
                  <Player
                    channel={selectedChannel}
                    user={user}
                    onPayRequired={() => {
                      setSelectedPlanForPayment('freemium');
                      setIsPaymentOpen(true);
                    }}
                    onBack={() => navigateTo('home')}
                    onShare={() => {
                      setShareTargetChannel(selectedChannel);
                      setIsShareOpen(true);
                    }}
                  />
                </div>

                {/* Video Title */}
                <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">
                  {selectedChannel.name} — Mubashara HD
                </h1>

                {/* Action Bar Below Player */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#0a0f1d] border border-[#1e293b] p-1.5 flex items-center justify-center shrink-0 shadow">
                      <ChannelLogo
                        src={selectedChannel.thumbnailUrl}
                        name={selectedChannel.name}
                        category={selectedChannel.categoryLabel}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-white text-base">
                          {selectedChannel.name}
                        </span>
                        <span
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#2563EB] text-white text-[9px] font-black shrink-0 shadow-sm"
                          title="Verified Channel"
                        >
                          ✓
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {selectedChannel.categoryLabel} • <span className="text-[#3B82F6] font-bold">Mubashara</span>
                      </p>
                    </div>

                    {!isSubscribed && (
                      <button
                        onClick={() => {
                          setSelectedPlanForPayment('freemium');
                          setIsPaymentOpen(true);
                        }}
                        className="ml-2 flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black px-4 py-2 rounded-full text-xs shadow-lg shadow-blue-900/40 transition active:scale-95 cursor-pointer shrink-0"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Jiunge / Lipia</span>
                      </button>
                    )}
                  </div>

                  {/* Actions: Back, Share */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => navigateTo('home')}
                      className="flex items-center gap-1.5 bg-[#0a0f1d] hover:bg-[#131d36] text-slate-200 px-4 py-2 rounded-full text-xs font-bold border border-[#1e293b] transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>Chaneli Zote</span>
                    </button>

                    <button
                      onClick={() => {
                        setShareTargetChannel(selectedChannel);
                        setIsShareOpen(true);
                      }}
                      className="flex items-center gap-1.5 bg-[#0a0f1d] hover:bg-[#131d36] text-slate-200 px-4 py-2 rounded-full text-xs font-bold border border-[#1e293b] transition cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-white" />
                      <span>Shiriki</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT / SIDEBAR COLUMN: SIDE CHANNELS */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-ping"></span>
                    <span>Chaneli Zingine Mubashara</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {CHANNELS.length} LIVE
                  </span>
                </div>

                {/* Vertical list of side channels */}
                <div className="space-y-2.5 max-h-[78vh] overflow-y-auto pr-1 no-scrollbar">
                  {CHANNELS.map((ch) => {
                    const isCurrent = ch.id === selectedChannel.id;
                    return (
                      <div
                        key={ch.id}
                        onClick={() => handlePlayChannel(ch)}
                        className={`group flex items-center gap-3 p-2.5 rounded-xl transition cursor-pointer border ${
                          isCurrent
                            ? 'bg-[#0f172a] border-[#2563EB] shadow-lg shadow-blue-950/50'
                            : 'bg-[#0a0f1d] border-[#1e293b] hover:border-slate-500 hover:bg-[#131d36]'
                        }`}
                      >
                        <div className="relative w-28 sm:w-32 aspect-video bg-black rounded-lg overflow-hidden border border-[#1e293b] shrink-0 flex items-center justify-center p-1.5">
                          <ChannelLogo
                            src={ch.thumbnailUrl}
                            name={ch.name}
                            category={ch.categoryLabel}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                          />
                          <div className="absolute bottom-1 right-1 bg-[#2563EB] text-white text-[8px] font-black uppercase px-1.5 py-0.2 rounded shadow">
                            LIVE
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <h4
                              className={`text-xs sm:text-sm font-bold truncate ${
                                isCurrent ? 'text-[#3B82F6]' : 'text-white group-hover:text-[#3B82F6]'
                              }`}
                            >
                              {ch.name}
                            </h4>
                            <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-[#2563EB] text-white text-[7px] font-black shrink-0">
                              ✓
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {ch.categoryLabel.split('(')[0].trim()}
                          </p>
                          <p className="text-[10px] text-blue-400 font-semibold mt-0.5 flex items-center gap-1">
                            <span>●</span>
                            <span>Mubashara</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PAGE 2: HOMEPAGE (BLUE BLACK THEME, NO BANNER) ================= */}
        {currentPage === 'home' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-6 animate-fade-in">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'Chaneli Zote Live' },
                { id: 'sports', label: 'Michezo (Azam Sports)' },
                { id: 'movies', label: 'Sinema Zetu & Bongo' },
                { id: 'entertainment', label: 'Burudani & Habari' },
              ].map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm transition active:scale-95 cursor-pointer ${
                      isActive
                        ? 'bg-[#2563EB] text-white font-black shadow-lg shadow-blue-900/40'
                        : 'bg-[#0a0f1d] hover:bg-[#131d36] text-slate-300 border border-[#1e293b]'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Channels Grid */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-ping"></span>
                  <span>Vituo Vilivyo Hewani Moja kwa Moja (Live TV)</span>
                </h2>
                <span className="text-xs text-slate-400 font-medium">
                  {filteredChannels.length} Chaneli Zinazoruka
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredChannels.map((channel) => (
                  <div
                    key={channel.id}
                    onClick={() => handlePlayChannel(channel)}
                    className="group flex flex-col space-y-2.5 cursor-pointer"
                  >
                    {/* 16:9 Thumbnail Card */}
                    <div className="relative aspect-video bg-[#0a0f1d] border border-[#1e293b] group-hover:border-[#2563EB] rounded-2xl overflow-hidden shadow-xl transition-all duration-300 group-hover:scale-[1.03] flex items-center justify-center p-3">
                      <ChannelLogo
                        src={channel.thumbnailUrl}
                        name={channel.name}
                        category={channel.categoryLabel}
                        className="max-h-full max-w-full object-contain transition duration-300"
                      />

                      {/* Blue Live Pill Badge */}
                      <div className="absolute bottom-2 right-2 bg-[#2563EB] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 shadow-md shadow-blue-900/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        <span>LIVE</span>
                      </div>

                      {/* Category Badge */}
                      <div className="absolute top-2 left-2 bg-[#050811]/90 backdrop-blur-sm text-slate-300 text-[9px] font-semibold px-2 py-0.5 rounded border border-white/10">
                        {channel.category === 'sports' ? 'Michezo' : channel.category === 'movies' ? 'Sinema' : 'TV Live'}
                      </div>
                    </div>

                    {/* Channel Metadata Row */}
                    <div className="flex items-start gap-2.5 px-0.5">
                      <div className="w-7 h-7 rounded-full bg-[#0a0f1d] border border-[#1e293b] p-1 flex items-center justify-center shrink-0 shadow">
                        <ChannelLogo
                          src={channel.thumbnailUrl}
                          name={channel.name}
                          category={channel.categoryLabel}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 leading-tight">
                          <h3 className="font-bold text-white text-xs sm:text-sm group-hover:text-[#3B82F6] transition truncate">
                            {channel.name}
                          </h3>
                          <span
                            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#2563EB] text-white text-[8px] font-black shrink-0 shadow-sm"
                            title="Verified Channel"
                          >
                            ✓
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {channel.categoryLabel.split('(')[0].trim()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================= PAGE 3: VIFURUSHI (PLANS) PAGE ================= */}
        {currentPage === 'plans' && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateTo('home')}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#3B82F6]" />
                <span>Rudi Mwanzo</span>
              </button>
            </div>

            <div className="text-center space-y-2">
              <span className="text-xs uppercase font-bold tracking-wider text-white bg-[#2563EB] px-3.5 py-1 rounded-full shadow-md shadow-blue-900/40">
                Lipa kwa Simu (M-Pesa, Tigo Pesa, Airtel Money, Halopesa)
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white">
                Vifurushi vya NeliTV Live
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Lipia kwa urahisi kwa USSD Push kwenye simu yako na uanze kutazama mechi zote papo hapo bila kikomo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
              {PRICING_PLANS.map((plan) => {
                const isHighlight = plan.id === 'standard';
                return (
                  <div
                    key={plan.id}
                    className={`bg-[#0a0f1d] border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative shadow-xl ${
                      isHighlight
                        ? 'border-[#2563EB] ring-2 ring-[#2563EB]/40 scale-102'
                        : 'border-[#1e293b] hover:border-slate-500'
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white font-black text-[10px] uppercase px-3 py-0.5 rounded-full shadow-lg shadow-blue-900/40">
                        {plan.badge}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white">{plan.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{plan.description}</p>
                      </div>

                      <div className="py-2 border-y border-[#1e293b]">
                        <div className="text-2xl sm:text-3xl font-black text-white">
                          {plan.priceFormatted}
                        </div>
                        <span className="text-xs text-slate-400">{plan.durationLabel}</span>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-300">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPlanForPayment(plan.id);
                        setIsPaymentOpen(true);
                      }}
                      className={`w-full mt-6 py-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer ${
                        isHighlight
                          ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-blue-900/40'
                          : 'bg-[#131d36] hover:bg-[#1a2748] text-white border border-[#1e293b]'
                      }`}
                    >
                      <span>Lipa kwa Simu ({plan.priceFormatted})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================= PAGE 4: ACCOUNT PAGE ================= */}
        {currentPage === 'account' && (
          <AccountPage
            user={user}
            onBack={() => navigateTo('home')}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenPayment={() => {
              setSelectedPlanForPayment('freemium');
              setIsPaymentOpen(true);
            }}
            onUserLogout={() => setUser(null)}
          />
        )}
      </main>

      {/* First-time visit banner for desktop / PC / tablets */}
      {showTanzaniaNotice && (
        <TanzaniaNoticeBanner
          onContinue={() => {
            setShowTanzaniaNotice(false);
            try {
              localStorage.setItem('nelitv_tz_notice_accepted', 'true');
            } catch {}
          }}
        />
      )}

      {/* Splash Screen */}
      {showSplash && (
        <SplashScreen
          onFinish={() => setShowSplash(false)}
          duration={2000}
        />
      )}

      {/* HarakaPay Payment Modal */}
      {isPaymentOpen && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          user={user}
          channelName={selectedChannel?.name}
          initialPlanId={selectedPlanForPayment}
          onPaymentSuccess={(updated) => {
            setUser(updated);
          }}
        />
      )}

      {/* Authentication Modal */}
      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setShowSplash(true);
          }}
        />
      )}

      {/* Share Modal */}
      {isShareOpen && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          channel={shareTargetChannel || selectedChannel}
        />
      )}

      {/* NeliTV App Download Modal */}
      {isAppDownloadOpen && (
        <AppDownloadModal
          isOpen={isAppDownloadOpen}
          onClose={() => setIsAppDownloadOpen(false)}
        />
      )}
    </div>
  );
}
