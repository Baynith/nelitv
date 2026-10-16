import React, { useEffect, useState } from 'react';
import { Series, Episode, CastMember } from '../types/content';
import { getEpisodesForSeries } from '../services/contentService';
import { fetchCast } from '../services/tmdb';
import {
  X,
  Play,
  Download,
  Share2,
  Star,
  Calendar,
  Sparkles,
  Users,
  Check,
  CheckCircle2,
  Layers,
  Film
} from 'lucide-react';

interface SeriesDetailsModalProps {
  series: Series | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayEpisode: (series: Series, episodes: Episode[], selectedEpisode: Episode) => void;
}

export const SeriesDetailsModal: React.FC<SeriesDetailsModalProps> = ({
  series,
  isOpen,
  onClose,
  onPlayEpisode,
}) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [isLoadingCast, setIsLoadingCast] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (series?.id) {
      setIsLoadingEpisodes(true);
      getEpisodesForSeries(series.id)
        .then((eps) => {
          setEpisodes(eps);
          if (eps.length > 0) {
            setSelectedSeason(eps[0].seasonNumber || 1);
          }
        })
        .finally(() => setIsLoadingEpisodes(false));
    } else {
      setEpisodes([]);
    }

    if (series?.tmdbId) {
      setIsLoadingCast(true);
      fetchCast(series.tmdbId, true)
        .then((data) => setCast(data))
        .catch(() => setCast([]))
        .finally(() => setIsLoadingCast(false));
    } else {
      setCast([]);
    }
  }, [series]);

  if (!isOpen || !series) return null;

  // Extract available seasons
  const seasonNumbers = Array.from(new Set(episodes.map((e) => e.seasonNumber || 1))).sort((a, b) => a - b);
  const filteredEpisodes = episodes.filter((e) => (e.seasonNumber || 1) === selectedSeason);

  const handleShare = () => {
    const text = `Tazama series ya "${series.title || series.name}" bure kabisa kwenye NeliTv web!`;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: series.title || series.name, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadEpisode = (ep: Episode) => {
    if (!ep.streamUrl) return;
    const a = document.createElement('a');
    a.href = ep.streamUrl;
    a.download = `${series.title || series.name} - S${ep.seasonNumber}E${ep.episodeNumber}.mp4`;
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
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Header */}
        <div className="relative w-full h-52 sm:h-64 bg-slate-950 overflow-hidden shrink-0">
          {series.backdropPath || series.posterPath ? (
            <img
              src={series.backdropPath || series.posterPath}
              alt={series.title || series.name}
              className="w-full h-full object-cover brightness-75 scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Free Badge */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SERIES YA BURE</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {series.title || series.name}
            </h1>

            {/* Quick Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2.5">
              {series.rating && (
                <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{series.rating.toFixed(1)}</span>
                </span>
              )}
              {series.year && (
                <span className="flex items-center gap-1 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{series.year}</span>
                </span>
              )}
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>{seasonNumbers.length || 1} Msimu ({episodes.length} Episodes)</span>
              </span>
              {series.genres && series.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {series.genres.map((g) => (
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

          {/* Share Button & Start First Episode */}
          <div className="flex items-center gap-3">
            {episodes.length > 0 && (
              <button
                onClick={() => {
                  onPlayEpisode(series, episodes, episodes[0]);
                  onClose();
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg transition text-xs sm:text-sm"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Anza Episode ya 1</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold px-4 py-2.5 rounded-xl transition text-xs sm:text-sm"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
              <span>{copiedLink ? 'Imenakiliwa!' : 'Shiriki'}</span>
            </button>
          </div>

          {/* Overview */}
          {series.overview && (
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
              {series.overview}
            </p>
          )}

          {/* Episodes Section Grouped By Season */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-cyan-400" />
                <span>Episodes ({episodes.length})</span>
              </h3>

              {/* Season Tabs Selector */}
              {seasonNumbers.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {seasonNumbers.map((sNum) => (
                    <button
                      key={sNum}
                      onClick={() => setSelectedSeason(sNum)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        selectedSeason === sNum
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Msimu {sNum}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoadingEpisodes ? (
              <div className="text-xs text-slate-500 italic py-4">Inapakia episodes...</div>
            ) : filteredEpisodes.length > 0 ? (
              <div className="space-y-2">
                {filteredEpisodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="p-3 bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center">
                        {ep.stillPath || ep.thumbnail ? (
                          <img
                            src={ep.stillPath || ep.thumbnail}
                            alt={ep.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Film className="w-6 h-6 text-slate-600" />
                        )}
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-bold text-white px-1 rounded">
                          E{ep.episodeNumber}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          Episode {ep.episodeNumber}: {ep.title}
                        </div>
                        {ep.runtime && (
                          <span className="text-[10px] text-slate-400 block">
                            Muda: {ep.runtime} min
                          </span>
                        )}
                        {ep.overview && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {ep.overview}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => {
                          onPlayEpisode(series, episodes, ep);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition shadow-md"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Cheza</span>
                      </button>

                      {ep.downloadEnabled !== false && (
                        <button
                          onClick={() => handleDownloadEpisode(ep)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                          title="Pakua episode hii"
                        >
                          <Download className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-3">Hakuna episodes zilizopatikana kwa msimu huu.</div>
            )}
          </div>

          {/* TMDB Cast */}
          {cast.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Waigizaji Wakuu</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {cast.slice(0, 8).map((c) => (
                  <div
                    key={c.id}
                    className="p-2 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden shrink-0">
                      {c.profilePath ? (
                        <img src={c.profilePath} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                          {c.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{c.name}</div>
                      {c.character && <div className="text-[10px] text-slate-400 truncate">{c.character}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
