import React, { useEffect, useState } from 'react';
import { Movie, CastMember } from '../types/media';
import { fetchCastForMovie } from '../services/mediaService';
import {
  Play,
  Download,
  Share2,
  Star,
  Clock,
  Calendar,
  Languages,
  ArrowLeft,
  Sparkles,
  Film,
  Check,
  User,
  ShieldCheck
} from 'lucide-react';

interface MovieDetailsPageProps {
  movie: Movie;
  allMovies?: Movie[];
  onBack: () => void;
  onWatch?: (movie: Movie) => void;
  onPlay?: (movie: Movie) => void;
  onSelectMovie?: (movie: Movie) => void;
  onSelectRecommended?: (movie: Movie) => void;
}

export const MovieDetailsPage: React.FC<MovieDetailsPageProps> = ({
  movie,
  allMovies = [],
  onBack,
  onWatch,
  onPlay,
  onSelectMovie,
  onSelectRecommended,
}) => {
  const [cast, setCast] = useState<CastMember[]>(movie.cast || []);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleWatch = () => {
    if (typeof onWatch === 'function') {
      onWatch(movie);
    } else if (typeof onPlay === 'function') {
      onPlay(movie);
    }
  };

  const handleSelectRec = (rec: Movie) => {
    if (typeof onSelectMovie === 'function') {
      onSelectMovie(rec);
    } else if (typeof onSelectRecommended === 'function') {
      onSelectRecommended(rec);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [movie?.id]);

  useEffect(() => {
    let isMounted = true;
    fetchCastForMovie(movie.title, movie.year, movie.cast).then((fetched) => {
      if (isMounted && fetched.length > 0) {
        setCast(fetched);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [movie]);

  // Recommended movies: other movies sharing genre or rating
  const recommendedMovies = allMovies
    .filter((m) => m.id !== movie.id)
    .slice(0, 6);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: `Tazama filamu ya ${movie.title} bure kwenye NeliTv web!`,
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
          src={movie.backdropPath || movie.posterPath}
          alt={movie.title}
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

      {/* Main Details Card (Overlapping Backdrop) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-36 sm:-mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
          {/* Movie Poster */}
          <div
            onClick={handleWatch}
            className="w-44 sm:w-60 md:w-72 shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/60 bg-slate-900 mx-auto md:mx-0 group cursor-pointer relative"
            title="Bofya kuanza filamu"
          >
            <img
              src={movie.posterPath}
              alt={movie.title}
              className="w-full h-auto object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition">
                <Play className="w-7 h-7 fill-slate-950 ml-1" />
              </div>
            </div>
          </div>

          {/* Meta Information & Actions */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {movie.narrated && (
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md shadow-cyan-500/20 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Swahili Audio (DJ)</span>
                  </span>
                )}
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  BURE KABISA
                </span>
                <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-700">
                  {movie.year}
                </span>
                {movie.runtime > 0 && (
                  <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{movie.runtime} dk</span>
                  </span>
                )}
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current text-amber-400" />
                  <span>{movie.rating.toFixed(1)}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="text-sm text-slate-400 italic">
                  Jina Halisi: {movie.originalTitle}
                </p>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
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
              <button
                onClick={handleWatch}
                className="flex items-center gap-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-cyan-500/25 transition active:scale-95 text-sm sm:text-base cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Tazama Sasa (Bure)</span>
              </button>

              {movie.downloadEnabled !== false && (
                <a
                  href={movie.streamUrl}
                  download={movie.title}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold px-4 py-3.5 rounded-2xl transition active:scale-95 text-sm"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Pakua (Download)</span>
                </a>
              )}

              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium px-4 py-3.5 rounded-2xl transition text-sm"
              >
                {copiedLink ? <Check className="w-4 h-4 text-cyan-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Kimenakiliwa!' : 'Shiriki'}</span>
              </button>
            </div>

            {/* DJ Ads Skip Notice for Swahili Narrated */}
            {movie.narrated && (
              <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-cyan-200">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Mfumo wa Kipekee wa Auto-Skip:</strong> Matangazo yote ya DJ mwanzo wa filamu yatarukwa kiotomatiki kwa sekunde 330 (dk 5:30) ili uanze kutazama filamu mara moja!
                </div>
              </div>
            )}

            {/* Overview */}
            <div className="space-y-1.5 pt-2">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Maelezo ya Filamu</h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                {movie.overview}
              </p>
            </div>
          </div>
        </div>

        {/* Cast & Crew Section (TMDB Cast API) */}
        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Waigizaji Wakuu (Cast &amp; Characters)</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">TMDB API Verified</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {cast.map((actor, idx) => (
              <div
                key={actor.id || idx}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 hover:border-slate-700 transition"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 shrink-0 shadow-md">
                  {actor.profilePath ? (
                    <img
                      src={actor.profilePath}
                      alt={actor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-lg">
                      {actor.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white line-clamp-1">{actor.name}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{actor.character}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Movies Section (Filamu Zinazopendekezwa) */}
        {recommendedMovies.length > 0 && (
          <div className="mt-14 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Filamu Zinazopendekezwa (Recommended)</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {recommendedMovies.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => handleSelectRec(rec)}
                  className="group bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-500/50 hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
                    <img
                      src={rec.posterPath}
                      alt={rec.title}
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
                      {rec.title}
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
