import React, { useEffect, useRef, useState } from 'react';
import { Movie, Series, Episode } from '../types/media';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  SkipForward,
  SkipBack,
  Download,
  ListVideo,
  Languages,
  Sparkles,
  X,
  Clock,
  Film,
  Tv
} from 'lucide-react';

interface MediaPlayerProps {
  movie?: Movie;
  series?: Series;
  episode?: Episode;
  allEpisodes?: Episode[];
  onClose: () => void;
  onSelectEpisode?: (ep: Episode) => void;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  movie,
  series,
  episode,
  allEpisodes = [],
  onClose,
  onSelectEpisode,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSidePanel, setShowSidePanel] = useState<boolean>(false);
  const [skippedNotice, setSkippedNotice] = useState<boolean>(false);
  const controlsTimeoutRef = useRef<any>(null);

  const isMovie = Boolean(movie);
  const isSeries = Boolean(series && episode);

  const streamUrl = movie?.streamUrl || episode?.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const title = movie?.title || episode?.name || 'Inacheza';
  const subtitle = isSeries ? `${series?.name} - S${episode?.seasonNumber} E${episode?.episodeNumber}` : movie?.originalTitle;

  // Find previous and next episode indices
  const currentEpIndex = allEpisodes.findIndex((e) => e.id === episode?.id);
  const prevEp = currentEpIndex > 0 ? allEpisodes[currentEpIndex - 1] : null;
  const nextEp = currentEpIndex >= 0 && currentEpIndex < allEpisodes.length - 1 ? allEpisodes[currentEpIndex + 1] : null;

  // ================= CRITICAL USER RULE =================
  // "kwa movie tu yenye swahili narated label kutakuwa na auto skip ya dakika 5 na sekunde 30 yaani movie za swahili narated zitaanza kwa 5 mins and 30 secs kuanzia sasa ila hatakama series na episode ni swahili narated usiziunganishe kwenye hii rules"
  const isSwahiliNarratedMovie = isMovie && Boolean(movie?.narrated || movie?.narrationLanguage === 'Swahili');

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);

    // Apply auto-skip ONLY for Swahili narrated movies!
    if (isSwahiliNarratedMovie) {
      // 5 mins and 30 secs = 330 seconds
      const skipTarget = 330;
      if (video.duration > skipTarget) {
        video.currentTime = skipTarget;
        setSkippedNotice(true);
        setTimeout(() => setSkippedNotice(false), 7000);
      }
    } else {
      video.currentTime = 0;
    }

    video.play().catch(() => {
      setIsPlaying(false);
    });
  };

  // Toggle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Volume
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  // Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const skipSeconds = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + sec));
    }
  };

  const jumpToStart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setSkippedNotice(false);
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Hide controls on idle
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  // Keyboard shortcuts (Space = Play/Pause, F = Fullscreen, Esc = Exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipSeconds(10);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipSeconds(-10);
      } else if (e.key === 'Escape' || e.key === 'GoBack') {
        if (!document.fullscreenElement) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex overflow-hidden select-none"
    >
      {/* Main Video Area */}
      <div className="relative flex-1 h-full bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          src={streamUrl}
          playsInline
          autoPlay
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
          onEnded={() => {
            setIsPlaying(false);
            if (isSeries && nextEp && onSelectEpisode) {
              onSelectEpisode(nextEp);
            }
          }}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* SWH-NARRATED AUTO-SKIP NOTIFICATION (User Rule: Movie with Swahili DJ Ads Auto-Skipped 5:30) */}
        {skippedNotice && isSwahiliNarratedMovie && (
          <div className="absolute top-16 left-6 z-30 max-w-sm bg-gradient-to-r from-amber-600/95 to-amber-700/95 text-white p-3.5 rounded-2xl shadow-2xl border border-amber-400/50 flex items-start gap-3 animate-fade-in backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-amber-900/60 flex items-center justify-center shrink-0 text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="flex-1 text-xs">
              <div className="font-bold text-amber-100 flex items-center gap-1.5">
                <span>⏩ Imerukwa Dakika 5:30 (Auto-Skip)</span>
              </div>
              <p className="text-amber-200/90 text-[11px] mt-0.5 leading-snug">
                Matangazo ya DJ mwanzo wa movie yamerukwa kiotomatiki ili uanze kutazama filamu mara moja!
              </p>
              <button
                onClick={jumpToStart}
                className="mt-2 text-[10px] bg-black/40 hover:bg-black/60 text-white font-bold px-2.5 py-1 rounded-lg border border-amber-300/40 transition"
              >
                Anzia Mwanzo (0:00)
              </button>
            </div>
            <button
              onClick={() => setSkippedNotice(false)}
              className="text-amber-200 hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header Overlay */}
        <div
          className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-20 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition active:scale-95"
              title="Rudi nyuma"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-bold text-sm sm:text-base line-clamp-1">{title}</h2>
                {(movie?.narrated || episode?.narrated) && (
                  <span className="text-[10px] bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                    Swahili Audio
                  </span>
                )}
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  BURE
                </span>
              </div>
              {subtitle && <p className="text-xs text-slate-300">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Button */}
            <a
              href={streamUrl}
              download={title}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md transition"
              title="Pakua (Download)"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Pakua</span>
            </a>

            {/* Toggle Series Episodes Side Panel */}
            {isSeries && allEpisodes.length > 0 && (
              <button
                onClick={() => setShowSidePanel(!showSidePanel)}
                className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md transition ${
                  showSidePanel ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Episodes List"
              >
                <ListVideo className="w-4 h-4" />
                <span className="hidden sm:inline">Episodes ({allEpisodes.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Center Play Button Overlay on Pause */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-2xl transition transform hover:scale-110 active:scale-95"
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
          </button>
        )}

        {/* Bottom Control Bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent space-y-2 transition-opacity duration-300 z-20 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Timeline Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-300 min-w-[42px] text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-white/20 hover:bg-white/30 rounded-lg appearance-none cursor-pointer accent-cyan-400 transition"
            />
            <span className="text-[11px] font-mono text-slate-400 min-w-[42px]">
              {formatTime(duration)}
            </span>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Previous Episode (Series only) */}
              {isSeries && (
                <button
                  onClick={() => prevEp && onSelectEpisode && onSelectEpisode(prevEp)}
                  disabled={!prevEp}
                  className="p-2 text-white hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-white transition"
                  title={prevEp ? `Episode iliyopita: ${prevEp.name}` : 'Hakuna episode iliyopita'}
                >
                  <SkipBack className="w-5 h-5" />
                </button>
              )}

              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              {/* Next Episode (Series only) */}
              {isSeries && (
                <button
                  onClick={() => nextEp && onSelectEpisode && onSelectEpisode(nextEp)}
                  disabled={!nextEp}
                  className="p-2 text-white hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-white transition"
                  title={nextEp ? `Episode inayofuata: ${nextEp.name}` : 'Hakuna episode inayofuata'}
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              )}

              {/* Skip 10s */}
              <button
                onClick={() => skipSeconds(-10)}
                className="p-2 text-slate-300 hover:text-white transition"
                title="Rudi nyuma sekunde 10"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => skipSeconds(10)}
                className="p-2 text-slate-300 hover:text-white transition"
                title="Mbele sekunde 10"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group">
                <button
                  onClick={toggleMute}
                  className="p-2 text-slate-300 hover:text-white transition"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Swahili narration indicator */}
              {(movie?.narrated || episode?.narrated) && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold">
                  <Languages className="w-3.5 h-3.5" />
                  <span>Kiswahili (DJ)</span>
                </div>
              )}

              {/* Toggle Side Panel on Mobile/Desktop */}
              {isSeries && (
                <button
                  onClick={() => setShowSidePanel(!showSidePanel)}
                  className={`p-2 rounded-lg transition ${showSidePanel ? 'text-cyan-400 bg-white/10' : 'text-slate-300 hover:text-white'}`}
                  title="Side panel ya episodes"
                >
                  <ListVideo className="w-5 h-5" />
                </button>
              )}

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-slate-300 hover:text-white transition"
                title="Skrini nzima"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SERIES EPISODES SIDE PANEL (Requested: 'pia kwa series kwenye side pannel ya player eka episodes') */}
      {isSeries && showSidePanel && (
        <div className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-30 animate-fade-in shadow-2xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div>
              <h3 className="text-white font-bold text-sm">Episodes za Tamthilia</h3>
              <p className="text-[11px] text-slate-400">{series?.name}</p>
            </div>
            <button
              onClick={() => setShowSidePanel(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {allEpisodes.map((ep) => {
              const isCurrent = ep.id === episode?.id;
              return (
                <div
                  key={ep.id}
                  onClick={() => onSelectEpisode && onSelectEpisode(ep)}
                  className={`p-2.5 rounded-xl cursor-pointer transition flex gap-3 ${
                    isCurrent
                      ? 'bg-cyan-500/15 border-2 border-cyan-400 text-white shadow-md'
                      : 'bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                    <img
                      src={ep.stillPath || series?.posterPath || 'https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WNzG1AgYT.jpg'}
                      alt={ep.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      {isCurrent ? (
                        <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-white bg-black/60 px-1 rounded">
                          E{ep.episodeNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate">
                        Ep {ep.episodeNumber}: {ep.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      {ep.runtime && <span>{ep.runtime} dk</span>}
                      {ep.narrated && <span className="text-cyan-400 font-semibold">• Swahili DJ</span>}
                    </div>
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
