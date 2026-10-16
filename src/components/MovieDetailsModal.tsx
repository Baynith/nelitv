import React, { useEffect, useState } from 'react';
import { Movie, CastMember } from '../types/content';
import { fetchCast } from '../services/tmdb';
import {
  X,
  Play,
  Download,
  Share2,
  Star,
  Clock,
  Calendar,
  Sparkles,
  Users,
  Check,
  CheckCircle2
} from 'lucide-react';

interface MovieDetailsModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  isOpen,
  onClose,
  onPlay,
}) => {
  const [cast, setCast] = useState<CastMember[]>([]);
  const [isLoadingCast, setIsLoadingCast] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (movie?.tmdbId) {
      setIsLoadingCast(true);
      fetchCast(movie.tmdbId, false)
        .then((data) => setCast(data))
        .catch(() => setCast([]))
        .finally(() => setIsLoadingCast(false));
    } else {
      setCast([]);
    }
  }, [movie]);

  if (!isOpen || !movie) return null;

  const isNarrated = movie.narrated === true || (movie.narrationLanguage && movie.narrationLanguage.toLowerCase().includes('swahili'));
  const downloadEnabled = movie.downloadEnabled !== false;

  const handleShare = () => {
    const text = `Tazama filamu ya "${movie.title}" bure kabisa kwenye NeliTv web!`;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: movie.title, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownload = () => {
    if (!movie.streamUrl) return;
    const a = document.createElement('a');
    a.href = movie.streamUrl;
    a.download = `${movie.title}.mp4`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop Banner Header */}
        <div className="relative w-full h-52 sm:h-64 bg-slate-950 overflow-hidden shrink-0">
          {movie.backdropPath || movie.posterPath ? (
            <img
              src={movie.backdropPath || movie.posterPath}
              alt={movie.title}
              className="w-full h-full object-cover brightness-75 scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Floating Narrated Badge */}
          {isNarrated && (
            <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-[11px] px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>Swahili Narrated (DJ Voiceover) 🇹🇿</span>
            </div>
          )}

          {/* Free Badge */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>BURE BILA KULIPIA</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {movie.title}
            </h1>
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className="text-xs text-slate-400 italic mt-0.5">
                {movie.originalTitle}
              </p>
            )}

            {/* Quick Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2.5">
              {movie.rating && (
                <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{movie.rating.toFixed(1)}</span>
                </span>
              )}
              {movie.year && (
                <span className="flex items-center gap-1 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{movie.year}</span>
                </span>
              )}
              {movie.runtime && (
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{movie.runtime} dakika</span>
                </span>
              )}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {movie.genres.map((g) => (
                    <span
                      key={g}
                      className="bg-slate-800 text-cyan-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-700"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => {
                onPlay(movie);
                onClose();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black px-6 py-3 rounded-xl shadow-lg transition transform hover:scale-105 active:scale-95 text-xs sm:text-sm"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Cheza Sasa (Bure)</span>
            </button>

            {downloadEnabled && (
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold px-4 py-3 rounded-xl transition text-xs sm:text-sm"
                title="Pakua filamu hii kwenye kifaa chako"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Pakua Filamu</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold px-4 py-3 rounded-xl transition text-xs sm:text-sm"
              title="Shiriki filamu hii"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
              <span>{copiedLink ? 'Imenakiliwa!' : 'Shiriki'}</span>
            </button>
          </div>

          {/* Overview / Story Synopsis */}
          {movie.overview && (
            <div className="space-y-1.5 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Kuhusu Filamu Hii
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                {movie.overview}
              </p>
            </div>
          )}

          {/* Cast Members from TMDB */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Waigizaji Wakuu (Cast Members)</span>
            </h3>

            {isLoadingCast ? (
              <div className="text-xs text-slate-500 italic py-2">Inapakia waigizaji...</div>
            ) : cast.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {cast.slice(0, 8).map((c) => (
                  <div
                    key={c.id}
                    className="p-2 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-2.5"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0">
                      {c.profilePath ? (
                        <img
                          src={c.profilePath}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                          {c.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {c.name}
                      </div>
                      {c.character && (
                        <div className="text-[10px] text-slate-400 truncate">
                          {c.character}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-1">Taarifa za waigizaji hazijapatikana.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
