import React, { useEffect, useState } from 'react';
import { Series, Episode, CastMember } from '../types/media';
import { getEpisodesForSeries } from '../services/mediaService';
import {
  Play,
  Download,
  Share2,
  Star,
  Clock,
  Calendar,
  Layers,
  ArrowLeft,
  Sparkles,
  Tv,
  Check,
  User,
  ListVideo
} from 'lucide-react';

interface SeriesDetailsPageProps {
  series: Series;
  allSeries: Series[];
  onBack: () => void;
  onWatchEpisode: (series: Series, episode: Episode, allEpisodes: Episode[]) => void;
  onSelectSeries: (series: Series) => void;
}

export const SeriesDetailsPage: React.FC<SeriesDetailsPageProps> = ({
  series,
  allSeries,
  onBack,
  onWatchEpisode,
  onSelectSeries,
}) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [series?.id]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingEpisodes(true);
    getEpisodesForSeries(series.id).then((eps) => {
      if (isMounted) {
        setEpisodes(eps);
        setIsLoadingEpisodes(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [series.id]);

  const seasonsList = series.seasons && series.seasons.length > 0
    ? series.seasons
    : [{ seasonNumber: 1, name: 'Season 1', episodeCount: episodes.length || 4 }];

  const filteredEpisodes = episodes.filter((ep) => ep.seasonNumber === selectedSeason);

  const recommendedSeries = allSeries
    .filter((s) => s.id !== series.id)
    .slice(0, 6);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: series.name,
        text: `Tazama tamthilia ya ${series.name} bure kwenye NeliTv web!`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pb-16 animate-fade-in">
      {/* Hero Backdrop Banner */}
      <div className="relative w-full h-[320px] sm:h-[440px] md:h-[500px] overflow-hidden">
        <img
          src={series.backdropPath || series.posterPath}
          alt={series.name}
          className="w-full h-full object-cover object-center filter brightness-60 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b14] via-transparent to-transparent" />

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white font-semibold backdrop-blur-md border border-slate-700 shadow-xl transition active:scale-95 text-xs sm:text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Rudi Nyuma</span>
          </button>
        </div>
      </div>

      {/* Main Details Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-36 sm:-mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
          {/* Series Poster */}
          <div className="w-44 sm:w-60 md:w-72 shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/60 bg-slate-900 mx-auto md:mx-0 group">
            <img
              src={series.posterPath}
              alt={series.name}
              className="w-full h-auto object-cover group-hover:scale-105 transition duration-500"
            />
          </div>

          {/* Meta & Synopsis */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {series.narrated && (
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md shadow-cyan-500/20 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Swahili Audio (DJ)</span>
                  </span>
                )}
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  BURE KABISA
                </span>
                <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-700">
                  {series.year}
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current text-amber-400" />
                  <span>{series.rating.toFixed(1)}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                {series.name}
              </h1>

              {series.originalName && series.originalName !== series.name && (
                <p className="text-sm text-slate-400 italic">
                  Jina Halisi: {series.originalName}
                </p>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {series.genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-1 rounded-lg"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {episodes.length > 0 && (
                <button
                  onClick={() => onWatchEpisode(series, episodes[0], episodes)}
                  className="flex items-center gap-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-cyan-500/25 transition active:scale-95 text-sm sm:text-base cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Anza Sehemu ya 1 (Ep 1)</span>
                </button>
              )}

              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium px-4 py-3.5 rounded-2xl transition text-sm"
              >
                {copiedLink ? <Check className="w-4 h-4 text-cyan-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Kimenakiliwa!' : 'Shiriki'}</span>
              </button>
            </div>

            {/* Overview */}
            <div className="space-y-1.5 pt-2">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Maelezo ya Tamthilia</h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                {series.overview}
              </p>
            </div>
          </div>
        </div>

        {/* EPISODES SECTION */}
        <div className="mt-12 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <ListVideo className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg sm:text-xl font-bold text-white">Vipindi / Episodes</h3>
            </div>

            {/* Season Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {seasonsList.map((s) => (
                <button
                  key={s.seasonNumber}
                  onClick={() => setSelectedSeason(s.seasonNumber)}
                  className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                    selectedSeason === s.seasonNumber
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {s.name || `Season ${s.seasonNumber}`}
                </button>
              ))}
            </div>
          </div>

          {/* Episodes List Grid */}
          {isLoadingEpisodes ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Inapakia orodha ya episodes...
            </div>
          ) : filteredEpisodes.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm bg-slate-900/50 rounded-2xl border border-slate-800">
              Hakuna episodes zilizopatikana kwa season hii.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEpisodes.map((ep) => (
                <div
                  key={ep.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-4 transition shadow-md group"
                >
                  {/* Thumbnail with Play Icon */}
                  <div
                    onClick={() => onWatchEpisode(series, ep, episodes)}
                    className="relative w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-slate-800 shrink-0 cursor-pointer"
                  >
                    <img
                      src={ep.stillPath || series.posterPath}
                      alt={ep.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/90 group-hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg transition transform group-hover:scale-110">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                    {ep.runtime && (
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-slate-200 text-[10px] font-mono px-1.5 py-0.5 rounded">
                        {ep.runtime} dk
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">
                          Ep {ep.episodeNumber}
                        </span>
                        {ep.narrated && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded">
                            DJ Swahili
                          </span>
                        )}
                      </div>

                      <h4
                        onClick={() => onWatchEpisode(series, ep, episodes)}
                        className="text-sm font-bold text-white group-hover:text-cyan-400 transition cursor-pointer line-clamp-1 mt-0.5"
                      >
                        {ep.name}
                      </h4>

                      {ep.overview && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {ep.overview}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2">
                      <button
                        onClick={() => onWatchEpisode(series, ep, episodes)}
                        className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Tazama Sasa</span>
                      </button>

                      {ep.downloadEnabled !== false && (
                        <a
                          href={ep.streamUrl}
                          download={`${series.name} - Ep ${ep.episodeNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-emerald-400 transition"
                          title="Pakua Episode"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Pakua</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Series Section */}
        {recommendedSeries.length > 0 && (
          <div className="mt-14 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Tamthilia Zingine Zinazopendekezwa</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {recommendedSeries.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => onSelectSeries(rec)}
                  className="group bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-500/50 hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
                    <img
                      src={rec.posterPath}
                      alt={rec.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {rec.narrated && (
                      <span className="absolute top-2 left-2 bg-cyan-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                        DJ Kiswahili
                      </span>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>{rec.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-cyan-400 transition">
                      {rec.name}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{rec.year}</span>
                      <span className="text-emerald-400 font-semibold">BURE</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
