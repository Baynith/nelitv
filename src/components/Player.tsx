import React, { useEffect, useRef, useState } from 'react';
import shaka from 'shaka-player/dist/shaka-player.ui.js';
import 'shaka-player/dist/controls.css';
import Hls from 'hls.js';
import { Channel } from '../data/channels';

// Guarantee Shaka polyfills are active before any component mounts
if (typeof window !== 'undefined' && shaka && shaka.polyfill) {
  try {
    shaka.polyfill.installAll();
  } catch (e) {
    console.warn('Shaka polyfill install:', e);
  }
}
import { UserProfile, isUserSubscribed } from '../services/firebase';
import {
  getInstantToken,
  getLivePlayableConfig,
  channelFallbackStreams,
} from '../services/streamService';
import {
  getUserTrialSecondsLeft,
  isUserTrialExpired,
  decrementUserTrialSeconds,
  markUserTrialExpired,
} from '../services/trialService';
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Radio,
  Lock,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Clock,
  Languages,
  SlidersHorizontal,
  Check,
  Keyboard,
  X,
  ArrowLeft,
  Tv,
  Play
} from 'lucide-react';

interface PlayerProps {
  channel: Channel;
  user: UserProfile | null;
  onPayRequired: () => void;
  onBack?: () => void;
  onShare?: () => void;
  onCast?: () => void;
  isMobileFull?: boolean;
}

export const Player: React.FC<PlayerProps> = ({
  channel,
  user,
  onPayRequired,
  onBack,
  onShare,
  onCast,
  isMobileFull = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<any>(null);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0);

  // Audio Language: Swahili primary, English secondary
  const [audioLang, setAudioLang] = useState<'sw' | 'en'>('sw');

  // Video Quality: Auto / 720p / 480p / 360p
  const [qualityMode, setQualityMode] = useState<string>('Auto');
  const [activeResolution, setActiveResolution] = useState<string>('');
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Central HUD & Feedback
  const [hud, setHud] = useState<{
    id: number;
    icon: 'volume' | 'muted' | 'fullscreen' | 'exitFullscreen' | 'lang' | 'live';
    text: string;
  } | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const hudTimeoutRef = useRef<any>(null);

  const triggerHud = (
    icon: 'volume' | 'muted' | 'fullscreen' | 'exitFullscreen' | 'lang' | 'live',
    text: string
  ) => {
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    setHud({ id: Date.now(), icon, text });
    hudTimeoutRef.current = setTimeout(() => {
      setHud(null);
    }, 850);
  };

  const isSubscribed = isUserSubscribed(user);

  // Global persistent 60s free trial for registered accounts
  const [trialTimeLeft, setTrialTimeLeft] = useState<number>(() => {
    if (isSubscribed) return 60;
    return getUserTrialSecondsLeft(user);
  });
  const [trialExpired, setTrialExpired] = useState<boolean>(() => {
    if (isSubscribed) return false;
    return isUserTrialExpired(user);
  });


  // Sync trial on user change
  useEffect(() => {
    if (isSubscribed) {
      setTrialExpired(false);
      setTrialTimeLeft(60);
      return;
    }
    const expired = isUserTrialExpired(user);
    setTrialExpired(expired);
    setTrialTimeLeft(getUserTrialSecondsLeft(user));
  }, [user, isSubscribed]);

  // Global 1-Minute Countdown & Subscription Audio/Video Lock
  useEffect(() => {
    if (isSubscribed) {
      setTrialExpired(false);
      return;
    }

    if (isUserTrialExpired(user)) {
      setTrialExpired(true);
      setTrialTimeLeft(0);
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.muted = true;
          videoRef.current.volume = 0;
        } catch {}
      }
      if (hlsRef.current) {
        try { hlsRef.current.stopLoad(); } catch {}
      }
      return;
    }

    const timer = setInterval(() => {
      const remaining = decrementUserTrialSeconds(user);
      setTrialTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        markUserTrialExpired(user);
        setTrialExpired(true);
        if (videoRef.current) {
          try {
            videoRef.current.pause();
            videoRef.current.muted = true;
            videoRef.current.volume = 0;
          } catch {}
        }
        if (hlsRef.current) {
          try {
            hlsRef.current.stopLoad();
            hlsRef.current.destroy();
            hlsRef.current = null;
          } catch {}
        }
        if (playerRef.current) {
          try {
            playerRef.current.unload();
          } catch {}
        }
        if (sessionStorage.getItem('nelitv_pay_prompted') !== 'true') {
          sessionStorage.setItem('nelitv_pay_prompted', 'true');
          onPayRequired();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubscribed, user, onPayRequired]);

  // Strict Silence Effect: Mute and pause ONLY when not subscribed AND trial expired
  useEffect(() => {
    if (!isSubscribed && trialExpired) {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.muted = true;
          videoRef.current.volume = 0;
        } catch {}
      }
      if (hlsRef.current) {
        try {
          hlsRef.current.stopLoad();
        } catch {}
      }
      if (playerRef.current) {
        try {
          playerRef.current.unload();
        } catch {}
      }
    }
  }, [isSubscribed, trialExpired]);

  // Helper to completely clean up video and active stream engines
  const teardownActiveEngines = async (videoEl: HTMLVideoElement | null) => {
    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }
    if (playerRef.current) {
      try {
        await playerRef.current.destroy();
      } catch {}
      playerRef.current = null;
    }
    if (videoEl) {
      try {
        videoEl.pause();
        // Detach any MediaKeys attached by Shaka/EME so subsequent streams don't hang or crash
        if ('setMediaKeys' in videoEl && typeof (videoEl as any).setMediaKeys === 'function') {
          await (videoEl as any).setMediaKeys(null).catch(() => {});
        }
        videoEl.removeAttribute('src');
        videoEl.load();
      } catch {}
    }
  };

  // Main stream loader with guaranteed cleanup so switching channels never breaks
  useEffect(() => {
    let isCancelled = false;
    const video = videoRef.current;
    if (!video) return;

    if (!isSubscribed && trialExpired) {
      try {
        video.pause();
        video.muted = true;
        video.volume = 0;
      } catch {}
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    async function initStream() {
      const targetVideo = videoRef.current;
      if (!targetVideo) return;

      // Always tear down previous engine cleanly so no old errored state remains
      await teardownActiveEngines(targetVideo);
      if (isCancelled) return;

      try {
        const token = getInstantToken();
        const config = getLivePlayableConfig(channel, token);
        if (isCancelled) return;

        // Accurate stream engine selection
        const isDashStream = config.url.includes('.mpd') || channel.streamFormat === 'dash';
        const isHlsStream = !isDashStream && (config.url.includes('.m3u8') || channel.streamFormat === 'hls');
        const isMp4Stream = !isDashStream && !isHlsStream && (config.url.includes('.mp4') || channel.streamFormat === 'mp4');

        // ================= ENGINE 0: DIRECT HTML5 FOR MP4 STREAMS =================
        if (isMp4Stream) {
          targetVideo.src = config.url;
          targetVideo.onloadedmetadata = () => {
            if (isCancelled) return;
            setIsLoading(false);
          };
          targetVideo.play().catch(() => {
            targetVideo.muted = true;
            setIsMuted(true);
            targetVideo.play().catch(() => {});
          });
          setIsLoading(false);
          return;
        }

        // ================= ENGINE 1: HLS.JS FOR PURE M3U8 STREAMS =================
        if (isHlsStream) {
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 10,
              maxBufferLength: 4,
              maxMaxBufferLength: 8,
              liveSyncDurationCount: 1,
              liveMaxLatencyDurationCount: 3,
              startLevel: -1,
              testBandwidth: false,
              capLevelToPlayerSize: true,
              autoStartLoad: true,
            });
            hlsRef.current = hls;

            hls.attachMedia(targetVideo);

            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
              if (!isCancelled) hls.loadSource(config.url);
            });

            hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
              if (isCancelled) return;
              setIsLoading(false);
              if (data.levels && data.levels.length > 0) {
                const currentLvl = data.levels[0];
                if (currentLvl?.height) {
                  setActiveResolution(`${currentLvl.height}p`);
                }
              }
              targetVideo.muted = false;
              targetVideo.volume = 1;
              setIsMuted(false);
              targetVideo.play().catch(() => {
                targetVideo.muted = true;
                setIsMuted(true);
                targetVideo.play().catch(() => {});
              });
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
              if (hls.levels[data.level]?.height) {
                setActiveResolution(`${hls.levels[data.level].height}p`);
              }
            });

            let fallbackAttempted = 0;
            const fallbacks = channelFallbackStreams[channel.id] || [];

            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (isCancelled) return;
              console.warn('HLS stream error:', data);
              if (data.fatal) {
                if (fallbackAttempted < fallbacks.length) {
                  const fallbackUrl = fallbacks[fallbackAttempted++];
                  console.log(`[Player Failover] Trying fallback for ${channel.name}: ${fallbackUrl}`);
                  hls.loadSource(fallbackUrl);
                  return;
                }
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    hls.destroy();
                    hlsRef.current = null;
                    setIsLoading(false);
                    setErrorMsg(`Kituo hiki (${channel.name}) hakipatikani kwa sasa.`);
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                  default:
                    hls.destroy();
                    hlsRef.current = null;
                    setIsLoading(false);
                    setErrorMsg(`Kituo hiki (${channel.name}) hakipatikani kwa sasa.`);
                    break;
                }
              }
            });

            return;
          } else if (targetVideo.canPlayType('application/vnd.apple.mpegurl')) {
            targetVideo.src = config.url;
            targetVideo.addEventListener(
              'loadedmetadata',
              () => {
                if (isCancelled) return;
                setIsLoading(false);
                targetVideo.play().catch(() => {
                  targetVideo.muted = true;
                  setIsMuted(true);
                  targetVideo.play().catch(() => {});
                });
              },
              { once: true }
            );
            return;
          }
        }

        // ================= ENGINE 2: SHAKA PLAYER FOR AZAM DASH =================
        const player = new shaka.Player(targetVideo);
        playerRef.current = player;

        const drmConfig: any = {};
        if (config.clearKeys) {
          drmConfig.clearKeys = config.clearKeys;
        }

        player.configure({
          drm: drmConfig,
          streaming: {
            lowLatencyMode: false,
            safeSeekOffset: 8,
            bufferingGoal: 8.0,
            rebufferingGoal: 3.5,
            bufferBehind: 15,
            gapDetectionThreshold: 0.8,
            stallEnabled: true,
            stallThreshold: 2.5,
            stallSkip: 0.8,
            inaccurateManifestTolerance: 2,
            retryParameters: {
              maxAttempts: 4,
              baseDelay: 300,
              backoffFactor: 1.5,
              timeout: 6000,
            },
          },
          manifest: {
            dash: {
              autoCorrectDrift: true,
              ignoreMinBufferTime: false,
            },
            hls: {
              ignoreManifestProgramDateTime: true,
            },
            retryParameters: {
              maxAttempts: 4,
              timeout: 6000,
            },
          },
          abr: {
            enabled: qualityMode === 'Auto',
            defaultBandwidthEstimate: 1200000,
            switchInterval: 10,
            bandwidthUpgradeTarget: 0.7,
            bandwidthDowngradeTarget: 0.85,
          },
        });

        // Request filter ensuring token is attached to any relative media segments
        player.getNetworkingEngine()?.registerRequestFilter((type, request) => {
          if (request.uris && request.uris[0] && request.uris[0].includes('azamtvltd.co.tz')) {
            if (!request.uris[0].includes('tok_') && !request.uris[0].includes('cdntoken=')) {
              if (request.uris[0].includes('/live/eds/')) {
                request.uris[0] = request.uris[0].replace(
                  'azamtvltd.co.tz/live/eds/',
                  `azamtvltd.co.tz/tok_${token}/live/eds/`
                );
              } else {
                request.uris[0] += (request.uris[0].includes('?') ? '&' : '?') + `cdntoken=${token}`;
              }
            }
          }
        });

        player.addEventListener('error', async (event: any) => {
          if (isCancelled) return;
          const err = event.detail;
          // Ignore recoverable warnings (severity 1): Shaka recovers automatically from minor track/codec warnings
          if (err && err.severity === 1) {
            console.info('[Shaka Recoverable Warning]:', err.code, err.message);
            return;
          }
          console.warn('[Shaka Critical Stream Error]:', channel.name, err);
          setIsLoading(false);
          setErrorMsg(`Kituo hiki (${channel.name}) hakirushi matangazo kwa sasa. Tafadhali chagua kituo kingine pembeni.`);
        });

        player.addEventListener('adaptation', () => {
          try {
            const tracks = player.getVariantTracks();
            const current = tracks.find((t: any) => t.active);
            if (current?.height) {
              setActiveResolution(`${current.height}p`);
            }
          } catch {}
        });

        // Load stream with isolated error handling and original URL fallback
        try {
          await player.load(config.url);
        } catch (initialLoadErr) {
          console.warn('[Shaka Initial Load Failed, trying fallback streamUrl]:', initialLoadErr);
          if (channel.streamUrl && channel.streamUrl !== config.url) {
            await player.load(channel.streamUrl);
          } else {
            throw initialLoadErr;
          }
        }

        if (isCancelled) return;
        setIsLoading(false);

        // Check if stream has multiple audio languages and select Swahili if present
        try {
          const tracks = player.getVariantTracks();
          const hasSw = tracks.some((t: any) => t.language?.toLowerCase().startsWith('sw'));
          if (hasSw) {
            player.configure({ preferredAudioLanguage: 'sw' });
          }
        } catch {}

        // Play with sound enabled
        const currentVideo = videoRef.current;
        if (currentVideo) {
          currentVideo.muted = false;
          currentVideo.volume = 1;
          setIsMuted(false);
          setVolume(1);

          currentVideo.play().catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().catch(() => {});
            }
          });
        }
      } catch (err: any) {
        if (isCancelled) return;
        console.warn(`[Player Load Error] ${channel.name}:`, err);
        // Clean up faulted player immediately so next channel doesn't inherit a corrupted instance
        await teardownActiveEngines(targetVideo);
        setIsLoading(false);
        setErrorMsg(`Kituo hiki (${channel.name}) hakirushi matangazo kwa sasa. Tafadhali chagua kituo kingine pembeni.`);
      }
    }

    initStream();

    return () => {
      isCancelled = true;
      teardownActiveEngines(video);
    };
  }, [channel.id, isSubscribed, trialExpired, retryKey]);

  // Clean teardown on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, []);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let waitingTimeout: any = null;

    const onWaiting = () => {
      // Debounce loading indicator so momentary micro-buffering doesn't flash the loader
      if (waitingTimeout) clearTimeout(waitingTimeout);
      waitingTimeout = setTimeout(() => {
        setIsLoading(true);
      }, 450);
    };

    const onPlaying = () => {
      if (waitingTimeout) {
        clearTimeout(waitingTimeout);
        waitingTimeout = null;
      }
      setIsLoading(false);
      setIsPaused(false);
    };

    const onTimeUpdate = () => {
      if (waitingTimeout) {
        clearTimeout(waitingTimeout);
        waitingTimeout = null;
      }
      setIsLoading(false);
    };

    const onPause = () => setIsPaused(true);
    const onPlay = () => {
      if (waitingTimeout) {
        clearTimeout(waitingTimeout);
        waitingTimeout = null;
      }
      setIsPaused(false);
    };
    const onVolumeChange = () => {
      setIsMuted(video.muted || video.volume === 0);
      setVolume(video.volume);
    };

    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('pause', onPause);
    video.addEventListener('play', onPlay);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      if (waitingTimeout) clearTimeout(waitingTimeout);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

  // Toggle Language between Swahili and English
  const toggleLanguage = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    const nextLang = audioLang === 'sw' ? 'en' : 'sw';
    setAudioLang(nextLang);
    triggerHud('lang', nextLang === 'sw' ? 'Lugha: Kiswahili (SW)' : 'Language: English (ENG)');
    revealControls();

    const player = playerRef.current;
    if (player) {
      try {
        const tracks = player.getVariantTracks();
        const matched = tracks.find((t: any) => t.language?.toLowerCase().startsWith(nextLang));
        if (matched) {
          player.configure({ preferredAudioLanguage: nextLang });
          player.selectVariantTrack(matched, true);
        }
      } catch (e) {
        console.warn('Could not switch audio track', e);
      }
    }

    if (hlsRef.current) {
      try {
        const audioTracks = hlsRef.current.audioTracks;
        if (audioTracks && audioTracks.length > 0) {
          const matchedIdx = audioTracks.findIndex((t: any) =>
            t.lang?.toLowerCase().startsWith(nextLang) || t.name?.toLowerCase().includes(nextLang)
          );
          if (matchedIdx !== -1) {
            hlsRef.current.audioTrack = matchedIdx;
          }
        }
      } catch {}
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    const video = videoRef.current;
    if (video) {
      video.volume = newVol;
      video.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
    revealControls();
  };

  const handleSelectQuality = (mode: string) => {
    setQualityMode(mode);
    setShowQualityMenu(false);
    triggerHud('live', `Ubora: ${mode}`);

    const player = playerRef.current;
    if (!player) return;

    if (mode === 'Auto') {
      player.configure({
        abr: {
          enabled: true,
          switchInterval: 15,
          bandwidthUpgradeTarget: 0.55,
          bandwidthDowngradeTarget: 0.85,
        },
      });
      try {
        const tracks = player.getVariantTracks();
        const current = tracks.find((t: any) => t.active);
        if (current?.height) {
          setActiveResolution(`${current.height}p`);
        }
      } catch {}
    } else {
      player.configure({ abr: { enabled: false } });
      const tracks = player.getVariantTracks();
      if (tracks && tracks.length > 0) {
        let targetHeight = 720;
        if (mode === '1080p') targetHeight = 1080;
        if (mode === '720p') targetHeight = 720;
        if (mode === '480p') targetHeight = 480;
        if (mode === '360p') targetHeight = 360;

        const matchedTrack = tracks.reduce((prev, curr) => {
          if (!curr.height) return prev;
          if (!prev.height) return curr;
          return Math.abs(curr.height - targetHeight) < Math.abs(prev.height - targetHeight) ? curr : prev;
        }, tracks[0]);

        if (matchedTrack) {
          player.selectVariantTrack(matchedTrack, true);
          setActiveResolution(mode);
        }
      }
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !video.muted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted && video.volume === 0) {
      video.volume = 1;
      setVolume(1);
    }
    triggerHud(newMuted ? 'muted' : 'volume', newMuted ? 'Imezimwa (Muted)' : `${Math.round((video.volume || 1) * 100)}%`);
  };

  const syncToLiveTimeline = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.seekable && video.seekable.length > 0) {
        const liveEnd = video.seekable.end(video.seekable.length - 1);
        if (liveEnd > 0 && liveEnd - video.currentTime > 25) {
          video.currentTime = Math.max(0, liveEnd - 15);
        }
      }
      if (video.paused && (!trialExpired || isSubscribed)) {
        video.play().catch(() => {});
      }
      triggerHud('live', 'MUBASHARA • Moja kwa Moja');
    } catch (e) {
      console.warn('Live sync error', e);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const revealControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      setShowQualityMenu(false);
    }, 6000);
  };

  const handlePlayerTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setShowControls((prev) => !prev);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  };

  const handleRetry = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      localStorage.removeItem('nelistream_cdn_token');
      localStorage.removeItem('nelistream_token_exp');
    } catch {}
    setRetryKey((k) => k + 1);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={revealControls}
      onDoubleClick={toggleFullscreen}
      className={`bg-black overflow-hidden select-none group relative ${
        isMobileFull || isFullscreen
          ? 'fixed inset-0 z-50 flex items-center justify-center'
          : 'relative w-full aspect-video rounded-2xl shadow-2xl border border-[#1e293b]'
      }`}
    >
      {/* Video Element with clean instance isolation */}
      <video
        key={channel.id}
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain pointer-events-none"
      />

      {/* Transparent Click/Tap Area covering the entire player */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label="Toggle Player Controls"
        onClick={handlePlayerTap}
        onTouchEnd={handlePlayerTap}
      />

      {/* Central Big Play Button if video is paused */}
      {isPaused && !isLoading && (isSubscribed || !trialExpired) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none animate-fade-in">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) {
                videoRef.current.play().catch(() => {});
                setIsPaused(false);
              }
            }}
            className="pointer-events-auto flex flex-col items-center gap-2 transform hover:scale-105 active:scale-95 transition cursor-pointer"
            aria-label="Play Stream"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#2563EB] flex items-center justify-center shadow-2xl shadow-blue-900/50 border-2 border-white/80 animate-pulse">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white translate-x-0.5" />
            </div>
            <span className="text-xs sm:text-sm font-black text-white bg-black/85 px-4 py-1.5 rounded-full border border-blue-500/60 shadow-lg">
              Bofya Kucheza Mubashara ▶️
            </span>
          </button>
        </div>
      )}

      {/* 1. LOCK OVERLAY IF UNPAID AND TRIAL EXPIRED - Blue Black Theme */}
      {!isSubscribed && trialExpired && (
        <div className="absolute inset-0 z-35 bg-[#050811]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in pointer-events-auto border border-blue-900/30">
          <div className="w-16 h-16 rounded-full bg-[#2563EB]/20 border-2 border-[#2563EB] flex items-center justify-center mb-3 shadow-lg shadow-blue-900/40">
            <Lock className="w-8 h-8 text-[#2563EB]" />
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white mb-1.5">
            Muda wa Majaribio Umekwisha — Lipia Kifurushi
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-5 leading-relaxed">
            Ili kuendelea kutazama <strong className="text-[#3B82F6]">{channel.name}</strong> na chaneli zote mubashara, lipia kwa simu yako kupitia HarakaPay USSD.
          </p>

          <button
            onClick={onPayRequired}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black px-7 py-3.5 rounded-xl shadow-xl shadow-blue-900/50 transition transform hover:scale-105 active:scale-95 text-xs sm:text-sm cursor-pointer"
            tabIndex={0}
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Lipia Sasa kwa USSD (Tsh 1,000)</span>
          </button>
        </div>
      )}

      {/* 2. LOADING SPINNER - Blue Accent */}
      {isLoading && (isSubscribed || !trialExpired) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 pointer-events-none">
          <div className="w-10 h-10 border-4 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin"></div>
          <p className="mt-2.5 text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#3B82F6] animate-pulse" />
            Inapakia {channel.name}...
          </p>
        </div>
      )}

      {/* 3. ERROR & RETRY */}
      {errorMsg && !trialExpired && (
        <div className="absolute inset-0 z-25 bg-[#050811]/90 flex flex-col items-center justify-center p-6 text-center pointer-events-auto">
          <p className="text-xs sm:text-sm font-bold text-amber-300 mb-3 max-w-sm">{errorMsg}</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2 rounded-xl text-xs transition active:scale-95 shadow-md shadow-blue-900/30 cursor-pointer"
            tabIndex={0}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Jaribu Tena</span>
          </button>
        </div>
      )}

      {/* 4. TRIAL COUNTDOWN TIMER BADGE FOR GUEST */}
      {!isSubscribed && !trialExpired && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-[#050811]/90 border border-blue-500/40 text-blue-200 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-sm pointer-events-none">
          <Clock className="w-3 h-3 text-[#3B82F6]" />
          <span>Majaribio ya Bure: {trialTimeLeft}s</span>
        </div>
      )}

      {/* 5. TOP INFO BAR */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className={`absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-[#020408]/90 via-[#050811]/50 to-transparent transition-opacity duration-300 z-30 flex items-center justify-between ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              className="flex items-center gap-1 bg-[#0a0f1d]/80 hover:bg-[#131d36] text-white font-bold px-2.5 py-1.5 rounded-lg text-xs border border-[#1e293b] transition cursor-pointer"
              title="Rudi"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
              <span>Rudi</span>
            </button>
          )}
          <span className="bg-[#2563EB] text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 shadow-md shadow-blue-900/40">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            MUBASHARA
          </span>
          <span className="text-white font-bold text-xs sm:text-sm drop-shadow truncate max-w-[180px] sm:max-w-none">{channel.name}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-300 bg-[#0a0f1d]/80 px-2 py-0.5 rounded border border-[#1e293b]">
          <ShieldCheck className="w-3 h-3 text-[#3B82F6]" />
          <span>HD Real-Time Live</span>
        </div>
      </div>

      {/* 6. BOTTOM CONTROLS - Blue Black Theme */}
      {(!trialExpired || isSubscribed) && (
        <div
          onClick={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className={`absolute bottom-0 left-0 right-0 p-2.5 sm:p-3.5 bg-gradient-to-t from-[#020408] via-[#050811]/90 to-transparent transition-opacity duration-300 z-30 flex flex-col gap-1.5 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Blue Live Edge Bar */}
          <div className="w-full flex items-center gap-2 px-1">
            <div className="flex-1 h-1 bg-[#1e293b] rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 right-0 bg-[#2563EB] rounded-full" />
            </div>
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping shrink-0" />
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Left Controls: Play/Pause, Live Edge button, Volume */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) {
                    if (videoRef.current.paused) {
                      videoRef.current.play().catch(() => {});
                      setIsPaused(false);
                    } else {
                      videoRef.current.pause();
                      setIsPaused(true);
                    }
                  }
                  revealControls();
                }}
                className="text-white hover:text-[#3B82F6] transition p-1 cursor-pointer"
                title={isPaused ? "Play" : "Pause"}
              >
                {isPaused ? <Play className="w-5 h-5 fill-white text-white" /> : <div className="w-5 h-5 flex items-center justify-center font-black text-sm">❚❚</div>}
              </button>

              {/* Live Status Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  syncToLiveTimeline();
                  revealControls();
                }}
                className="flex items-center gap-1.5 bg-[#2563EB]/20 hover:bg-[#2563EB]/30 border border-[#2563EB]/60 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded transition active:scale-95 shadow cursor-pointer"
                title="Bofya kusawazisha na Mubashara"
              >
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></span>
                <span>MUBASHARA • LIVE</span>
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                    revealControls();
                  }}
                  className="text-slate-300 hover:text-white p-1 cursor-pointer"
                  title={isMuted ? 'Washa Sauti' : 'Zima Sauti'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-12 sm:w-20 h-1 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                />
              </div>
            </div>

            {/* Right Controls: Audio Language, Quality, Fullscreen */}
            <div className="flex items-center gap-2 sm:gap-2.5 relative">
              {/* Audio Language */}
              <button
                onClick={(e) => toggleLanguage(e)}
                className="flex items-center gap-1 bg-[#0a0f1d] hover:bg-[#131d36] border border-[#1e293b] text-slate-200 hover:text-white px-2 sm:px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer"
                title="Badilisha Lugha ya Sauti"
              >
                <Languages className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>{audioLang === 'sw' ? 'SW' : 'ENG'}</span>
              </button>

              {/* Quality Selector */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQualityMenu(!showQualityMenu);
                    revealControls();
                  }}
                  className="flex items-center gap-1 bg-[#0a0f1d] hover:bg-[#131d36] border border-[#1e293b] text-slate-200 hover:text-white px-2 sm:px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer"
                  title="Ubora wa Video"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
                  <span>{qualityMode === 'Auto' ? (activeResolution ? `Auto (${activeResolution})` : 'HD') : qualityMode}</span>
                </button>

                {/* Quality Menu Popup */}
                {showQualityMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-10 right-0 bg-[#0a0f1d] border border-[#1e293b] rounded-xl p-1.5 shadow-2xl space-y-1 w-36 z-50 text-xs animate-fade-in"
                  >
                    {['Auto', '1080p', '720p', '480p', '360p'].map((mode) => (
                      <button
                        key={mode}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectQuality(mode);
                          revealControls();
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                          qualityMode === mode
                            ? 'bg-[#2563EB] text-white font-bold'
                            : 'text-slate-300 hover:bg-[#131d36]'
                        }`}
                      >
                        <span>{mode === 'Auto' ? 'Auto (HD)' : mode}</span>
                        {qualityMode === mode && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="p-1 text-slate-300 hover:text-white rounded transition cursor-pointer"
                aria-label="Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
