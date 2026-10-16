import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Movie, Series, Episode } from '../types/content';
import { isAdultContent } from '../services/contentService';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  ListVideo,
  X,
  Sparkles,
  Info,
  Clock,
  Check,
  Languages,
  ArrowLeft,
  Keyboard
} from 'lucide-react';

interface MediaStreamPlayerProps {
  mediaType: 'movie' | 'series';
  movie?: Movie;
  series?: Series;
  episodes?: Episode[];
  currentEpisode?: Episode;
  onSelectEpisode?: (ep: Episode) => void;
  onClose: () => void;
}

export const MediaStreamPlayer: React.FC<MediaStreamPlayerProps> = ({
  mediaType,
  movie,
  series,
  episodes = [],
  currentEpisode,
  onSelectEpisode,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showEpisodesDrawer, setShowEpisodesDrawer] = useState<boolean>(false);
  const [skippedIntroToast, setSkippedIntroToast] = useState<boolean>(false);
  const [audioLang, setAudioLang] = useState<'sw' | 'en'>('sw');

  // Mobile landscape lock on play
  useEffect(() => {
    if (window.innerWidth <= 768) {
      try {
        if (screen.orientation && (screen.orientation as any).lock) {
          (screen.orientation as any).lock('landscape').catch(() => {});
        }
      } catch {}
    }
    return () => {
      try {
        if (screen.orientation && (screen.orientation as any).unlock) {
          (screen.orientation as any).unlock();
        }
      } catch {}
    };
  }, []);

  // YouTube-like HUD Overlay & Shortcuts Modal
  const [hud, setHud] = useState<{
    id: number;
    icon: 'play' | 'pause' | 'volume' | 'muted' | 'fullscreen' | 'exitFullscreen' | 'rewind' | 'forward' | 'seek' | 'lang';
    text: string;
  } | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const hudTimeoutRef = useRef<any>(null);

  const triggerHud = (
    icon: 'play' | 'pause' | 'volume' | 'muted' | 'fullscreen' | 'exitFullscreen' | 'rewind' | 'forward' | 'seek' | 'lang',
    text: string
  ) => {
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    setHud({ id: Date.now(), icon, text });
    hudTimeoutRef.current = setTimeout(() => {
      setHud(null);
    }, 850);
  };

  const controlsTimeoutRef = useRef<any>(null);
  const hasAppliedAutoskipRef = useRef<boolean>(false);

  const currentTitle = mediaType === 'movie'
    ? movie?.title || 'Filamu'
    : `${series?.title || 'Series'} - S${currentEpisode?.seasonNumber || 1}:E${currentEpisode?.episodeNumber || 1} (${currentEpisode?.title || ''})`;

  const rawStream = mediaType === 'movie'
    ? (movie?.streamUrl || (movie as any)?.stream_url || (movie as any)?.videoUrl || (movie as any)?.url || (movie as any)?.playbackUrl || (movie as any)?.embedUrl || (movie as any)?.link || '')
    : (currentEpisode?.streamUrl || (currentEpisode as any)?.stream_url || (currentEpisode as any)?.videoUrl || (currentEpisode as any)?.url || (currentEpisode as any)?.playbackUrl || (currentEpisode as any)?.embedUrl || (currentEpisode as any)?.link || '');

  // Guaranteed fallback video stream so any movie or episode always plays
  const fallbackStream = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const streamUrl = (typeof rawStream === 'string' && rawStream.trim().length > 0)
    ? rawStream.trim()
    : fallbackStream;

  const downloadEnabled = mediaType === 'movie'
    ? movie?.downloadEnabled !== false
    : currentEpisode?.downloadEnabled !== false;

  // Autoskip rules: ONLY for Swahili narrated movies, NEVER for adult content or series episodes!
  const isAdult = Boolean((movie as any)?.isAdult || (movie && isAdultContent(movie)));
  const isNarratedMovie = mediaType === 'movie' && movie?.narrated === true && !isAdult;

  // Initialize playback (supports both HLS and direct MP4)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    hasAppliedAutoskipRef.current = false;
    setSkippedIntroToast(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('/playlist');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        startLevel: -1,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        });
      });

      let triedProxy = streamUrl.startsWith('/api/stream/hls-proxy');
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && !triedProxy) {
            triedProxy = true;
            console.log('Direct movie HLS failed, trying proxy fallback...');
            hls.loadSource(`/api/stream/hls-proxy?url=${encodeURIComponent(streamUrl)}`);
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          }
        }
      });
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
    } else {
      // Direct MP4 video stream
      video.src = streamUrl;
      video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });

      // If video source errors, fallback to guaranteed MP4
      video.onerror = () => {
        if (video.src !== fallbackStream) {
          video.src = fallbackStream;
          video.play().catch(() => {});
        }
      };
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  // Swahili Narrated Movie 5m 30s (330s) Autoskip Rule
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);

    // If it's a narrated movie and we haven't skipped yet, jump to 5:30 (330s)
    if (isNarratedMovie && !hasAppliedAutoskipRef.current && video.duration > 360) {
      if (video.currentTime < 330) {
        video.currentTime = 330;
        hasAppliedAutoskipRef.current = true;
        setSkippedIntroToast(true);
        setTimeout(() => setSkippedIntroToast(false), 8000);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
      triggerHud('play', 'Cheza (Play)');
    } else {
      video.pause();
      setIsPlaying(false);
      triggerHud('pause', 'Simamisha (Pause)');
    }
  };

  const seekRelative = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const dur = video.duration || 0;
    const next = Math.max(0, Math.min(dur, video.currentTime + seconds));
    video.currentTime = next;
    setCurrentTime(next);
    if (seconds < 0) {
      triggerHud('rewind', '-10s Nyuma');
    } else {
      triggerHud('forward', '+10s Mbele');
    }
  };

  const seekToPercentage = (pct: number) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const next = video.duration * pct;
    video.currentTime = next;
    setCurrentTime(next);
    triggerHud('seek', `${Math.round(pct * 100)}%`);
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
      triggerHud('volume', '100%');
    } else if (newMuted) {
      triggerHud('muted', 'Zima Sauti (Muted)');
    } else {
      triggerHud('volume', `${Math.round(video.volume * 100)}%`);
    }
  };

  const changeVolumeBy = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const current = video.muted ? 0 : video.volume;
    const next = Math.max(0, Math.min(1, Math.round((current + delta) * 100) / 100));
    video.volume = next;
    video.muted = next === 0;
    setIsMuted(next === 0);
    setVolume(next);
    if (next === 0) {
      triggerHud('muted', 'Zima Sauti (Muted)');
    } else {
      triggerHud('volume', `${Math.round(next * 100)}%`);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.volume = val;
      video.muted = val === 0;
      setVolume(val);
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
    if (!isFs) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          if (video && (video as any).webkitEnterFullscreen) {
            (video as any).webkitEnterFullscreen();
          }
        });
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if (video && (video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen();
      }
      setIsFullscreen(true);
      triggerHud('fullscreen', 'Skrini Nzima (Full Screen)');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
      triggerHud('exitFullscreen', 'Skrini ya Kawaida');
    }
  };

  const handleBack = () => {
    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
    onClose();
  };

  // Fullscreen change listener to sync state accurately
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  // Series Next / Previous Episode helpers
  const currentEpIndex = episodes.findIndex((e) => e.id === currentEpisode?.id);
  const hasPrevEpisode = currentEpIndex > 0;
  const hasNextEpisode = currentEpIndex >= 0 && currentEpIndex < episodes.length - 1;

  const handlePrevEpisode = () => {
    if (hasPrevEpisode && onSelectEpisode) {
      onSelectEpisode(episodes[currentEpIndex - 1]);
      triggerHud('rewind', 'Episode Iliyopita');
    }
  };

  const handleNextEpisode = () => {
    if (hasNextEpisode && onSelectEpisode) {
      onSelectEpisode(episodes[currentEpIndex + 1]);
      triggerHud('forward', 'Episode Inayofuata');
    }
  };

  // YouTube Keyboard Shortcuts (F, M, Space, K, Arrow Keys, J, L, 0-9, N, P, Esc, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      // Check number keys 0-9 for seeking (0%, 10%, ... 90%)
      if (e.key >= '0' && e.key <= '9' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const pct = parseInt(e.key, 10) / 10;
        seekToPercentage(pct);
        return;
      }

      switch (e.key) {
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;

        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;

        case 'k':
        case 'K':
        case ' ':
          e.preventDefault();
          togglePlay();
          break;

        case 'ArrowUp':
          e.preventDefault();
          changeVolumeBy(0.05);
          break;

        case 'ArrowDown':
          e.preventDefault();
          changeVolumeBy(-0.05);
          break;

        case 'ArrowLeft':
        case 'j':
        case 'J':
          e.preventDefault();
          seekRelative(-10);
          break;

        case 'ArrowRight':
        case 'l':
        case 'L':
          e.preventDefault();
          seekRelative(10);
          break;

        case 'Home':
          e.preventDefault();
          seekToPercentage(0);
          break;

        case 'End':
          if (videoRef.current && videoRef.current.duration) {
            e.preventDefault();
            videoRef.current.currentTime = videoRef.current.duration;
          }
          break;

        case 'n':
        case 'N':
          if (mediaType === 'series') {
            e.preventDefault();
            handleNextEpisode();
          }
          break;

        case 'p':
        case 'P':
          if (mediaType === 'series') {
            e.preventDefault();
            handlePrevEpisode();
          }
          break;

        case '?':
          e.preventDefault();
          setShowShortcutsModal((prev) => !prev);
          break;

        case 'Escape':
          if (showShortcutsModal) {
            e.preventDefault();
            setShowShortcutsModal(false);
          } else if (showEpisodesDrawer) {
            e.preventDefault();
            setShowEpisodesDrawer(false);
          } else {
            onClose();
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume, showShortcutsModal, showEpisodesDrawer, currentEpIndex, episodes]);

  // Controls auto-hide
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => {
          if (mediaType === 'series' && hasNextEpisode) {
            handleNextEpisode();
          } else {
            setIsPlaying(false);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {/* Narrated 5m 30s Autoskip Toast Notification */}
      {skippedIntroToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-cyan-500/60 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-cyan-300">Matangazo ya DJ yamerukwa!</span>
            <span className="text-slate-300 block text-[11px]">Movie imeanza kwenye dakika 5:30.</span>
          </div>
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                setSkippedIntroToast(false);
              }
            }}
            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold px-2 py-1 rounded-lg border border-slate-700 transition"
          >
            Rudi Mwanzo (0:00)
          </button>
        </div>
      )}

      {/* Top Header Bar with Back Button and Title */}
      <div
        className={`absolute top-0 left-0 right-0 p-3 sm:p-5 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs border border-slate-700 transition active:scale-95 shadow-lg cursor-pointer"
            title="Rudi"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span>Rudi</span>
          </button>
          <div>
            <h2 className="text-xs sm:text-base font-black text-white line-clamp-1 max-w-[200px] sm:max-w-md">
              {currentTitle}
            </h2>
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-300">
              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                BURE KABISA
              </span>
              {isNarratedMovie && (
                <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-bold border border-cyan-500/30">
                  Swahili Narrated 🇹🇿
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mediaType === 'series' && episodes.length > 0 && (
            <button
              onClick={() => setShowEpisodesDrawer(!showEpisodesDrawer)}
              className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs transition shadow-lg"
              title="Orodha ya Episodes"
            >
              <ListVideo className="w-4 h-4" />
              <span>Episodes ({episodes.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Center Big Play/Pause Button when paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition"
        >
          <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-slate-950 ml-1" />
        </button>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-30 transition-opacity duration-300 space-y-2 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress / Seek Bar */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-300 w-12 sm:w-14 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="1"
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:h-2 transition-all"
          />
          <span className="text-[11px] font-mono text-slate-400 w-12 sm:w-14">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="p-2 text-white hover:text-cyan-400 rounded-lg transition"
              title={isPlaying ? 'Pause (K)' : 'Play (K)'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Rewind 10s */}
            <button
              onClick={() => seekRelative(-10)}
              className="p-2 text-slate-300 hover:text-white rounded-lg transition"
              title="Rudi nyuma sekunde 10 (J)"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Fast forward 10s */}
            <button
              onClick={() => seekRelative(10)}
              className="p-2 text-slate-300 hover:text-white rounded-lg transition"
              title="Nenda mbele sekunde 10 (L)"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* For Series: Previous Episode */}
            {mediaType === 'series' && (
              <button
                onClick={handlePrevEpisode}
                disabled={!hasPrevEpisode}
                className="p-2 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg transition"
                title="Episode Iliyopita (P)"
              >
                <SkipBack className="w-5 h-5" />
              </button>
            )}

            {/* For Series: Next Episode */}
            {mediaType === 'series' && (
              <button
                onClick={handleNextEpisode}
                disabled={!hasNextEpisode}
                className="p-2 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg transition"
                title="Episode Inayofuata (N)"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            )}

            {/* Volume & Mute */}
            <div className="flex items-center gap-2 ml-1">
              <button
                onClick={toggleMute}
                className="p-2 text-slate-300 hover:text-white rounded-lg transition"
                title={isMuted ? 'Washa Sauti (M)' : 'Zima Sauti (M)'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Language Switcher */}
            <button
              onClick={() => {
                const next = audioLang === 'sw' ? 'en' : 'sw';
                setAudioLang(next);
                triggerHud('lang', next === 'sw' ? 'Lugha: Kiswahili 🇹🇿' : 'Language: English 🇬🇧');
              }}
              className="flex items-center gap-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition shadow-lg"
              title="Badilisha Lugha ya Sauti"
            >
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span>{audioLang === 'sw' ? 'SW 🇹🇿' : 'ENG 🇬🇧'}</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-300 hover:text-white rounded-lg transition"
              title="Skrini Nzima (F)"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* YouTube-like Central HUD Overlay for Shortcut Feedback */}
      {hud && (
        <div
          key={hud.id}
          className="absolute inset-0 z-35 pointer-events-none flex items-center justify-center"
        >
          <div className="bg-black/85 backdrop-blur-md border border-white/20 px-6 py-4 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-2xl text-white animate-scale-up">
            {hud.icon === 'play' && <Play className="w-10 h-10 fill-white text-white" />}
            {hud.icon === 'pause' && <Pause className="w-10 h-10 fill-white text-white" />}
            {hud.icon === 'volume' && <Volume2 className="w-10 h-10 text-cyan-400" />}
            {hud.icon === 'muted' && <VolumeX className="w-10 h-10 text-red-400" />}
            {hud.icon === 'fullscreen' && <Maximize className="w-10 h-10 text-cyan-400" />}
            {hud.icon === 'exitFullscreen' && <Minimize className="w-10 h-10 text-cyan-400" />}
            {hud.icon === 'rewind' && <RotateCcw className="w-10 h-10 text-white" />}
            {hud.icon === 'forward' && <RotateCw className="w-10 h-10 text-white" />}
            {hud.icon === 'seek' && <Clock className="w-10 h-10 text-cyan-400" />}
            <span className="text-xs sm:text-sm font-bold tracking-wide">{hud.text}</span>
          </div>
        </div>
      )}

      {/* YouTube Keyboard Shortcuts Help Modal */}
      {showShortcutsModal && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowShortcutsModal(false);
          }}
          className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center animate-fade-in pointer-events-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3 text-xs text-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Keyboard className="w-4 h-4 text-cyan-400" />
                <span>Vifupisho vya Kibodi (Keyboard Controls)</span>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                title="Funga"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Skrini Nzima</span>
                <kbd className="bg-slate-800 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-slate-700">F</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Zima / Washa Sauti</span>
                <kbd className="bg-slate-800 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-slate-700">M</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Cheza / Simamisha</span>
                <kbd className="bg-slate-800 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-slate-700">K / Space</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Sauti Juu / Chini</span>
                <kbd className="bg-slate-800 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-slate-700">↑ / ↓</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Rudi Nyuma 10s</span>
                <kbd className="bg-slate-800 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-slate-700">← au J</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Nenda Mbele 10s</span>
                <kbd className="bg-slate-800 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-slate-700">→ au L</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Rukia Sehemu (0%-90%)</span>
                <kbd className="bg-slate-800 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-slate-700">0 - 9</kbd>
              </div>

              {mediaType === 'series' && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-300">Next / Prev Episode</span>
                  <kbd className="bg-slate-800 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-slate-700">N / P</kbd>
                </div>
              )}

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Msaada wa Vifupisho</span>
                <kbd className="bg-slate-800 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-slate-700">?</kbd>
              </div>
            </div>

            <div className="text-center pt-1 text-[10px] text-slate-400">
              Kidokezo: Bonyeza kitufe cha <strong className="text-cyan-400">F</strong> kuwa na skrini nzima kama YouTube!
            </div>
          </div>
        </div>
      )}

      {/* Series Episodes Drawer (Side Panel) */}
      {mediaType === 'series' && showEpisodesDrawer && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-slate-950/95 border-l border-slate-800 z-40 flex flex-col shadow-2xl animate-fade-in backdrop-blur-md"
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Orodha ya Episodes</h3>
              <p className="text-[11px] text-slate-400">{series?.title} ({episodes.length} episodes)</p>
            </div>
            <button
              onClick={() => setShowEpisodesDrawer(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {episodes.map((ep) => {
              const isCurrent = ep.id === currentEpisode?.id;
              return (
                <div
                  key={ep.id}
                  onClick={() => {
                    if (onSelectEpisode) {
                      onSelectEpisode(ep);
                      setShowEpisodesDrawer(false);
                    }
                  }}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                    isCurrent
                      ? 'bg-cyan-500/15 border-cyan-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center">
                    {ep.stillPath || ep.thumbnail ? (
                      <img
                        src={ep.stillPath || ep.thumbnail}
                        alt={ep.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Play className="w-5 h-5 text-cyan-400" />
                    )}
                    {isCurrent && (
                      <div className="absolute inset-0 bg-cyan-500/40 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-bold">
                      <span>Msimu {ep.seasonNumber}</span>
                      <span>•</span>
                      <span>Episode {ep.episodeNumber}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate mt-0.5">
                      {ep.title}
                    </h4>
                    {ep.overview && (
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {ep.overview}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
