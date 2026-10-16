import React from 'react';
import { Movie, Series } from '../types/content';
import { Play, Star, Sparkles, Layers } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
  onPlayDirect?: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, onPlayDirect }) => {
  const isNarrated = movie.narrated === true;

  return (
    <div
      onClick={onClick}
      className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 flex flex-col"
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        {movie.posterPath ? (
          <img
            src={movie.posterPath}
            alt={movie.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (movie.posterPath && !img.src.includes('/api/proxy/image')) {
                img.src = `/api/proxy/image?url=${encodeURIComponent(movie.posterPath)}`;
              }
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900 text-xs p-2 text-center">
            {movie.title}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

        {/* Free Tag */}
        <span className="absolute top-2 left-2 bg-emerald-500/90 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md shadow">
          BURE
        </span>

        {/* Narrated Tag */}
        {isNarrated && (
          <span className="absolute top-2 right-2 bg-cyan-500/90 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md shadow flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 fill-slate-950" />
            <span>SW</span>
          </span>
        )}

        {/* Rating */}
        {movie.rating && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-amber-400 font-bold border border-white/10">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Quick Play Hover Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onPlayDirect) {
                onPlayDirect();
              } else {
                onClick();
              }
            }}
            className="w-12 h-12 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition cursor-pointer"
            title="Tazama Sasa"
          >
            <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-cyan-400 transition">
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-400 mt-1">
            {movie.year && <span>{movie.year}</span>}
            {movie.runtime && <span>• {movie.runtime}m</span>}
            {movie.genres && movie.genres[0] && <span>• {movie.genres[0]}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SeriesCardProps {
  series: Series;
  onClick: () => void;
}

export const SeriesCard: React.FC<SeriesCardProps> = ({ series, onClick }) => {
  const title = series.title || series.name || 'Series';
  const isNarrated = series.narrated === true;

  return (
    <div
      onClick={onClick}
      className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 flex flex-col"
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        {series.posterPath ? (
          <img
            src={series.posterPath}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (series.posterPath && !img.src.includes('/api/proxy/image')) {
                img.src = `/api/proxy/image?url=${encodeURIComponent(series.posterPath)}`;
              }
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900 text-xs p-2 text-center">
            {title}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

        <span className="absolute top-2 left-2 bg-emerald-500/90 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md shadow">
          BURE
        </span>

        {isNarrated && (
          <span className="absolute top-2 right-2 bg-cyan-500/90 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md shadow flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 fill-slate-950" />
            <span>SW</span>
          </span>
        )}

        {series.rating && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-amber-400 font-bold border border-white/10">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{series.rating.toFixed(1)}</span>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div className="w-12 h-12 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-cyan-400 transition">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-400 mt-1">
            {series.year && <span>{series.year}</span>}
            <span>• Series</span>
            {series.genres && series.genres[0] && <span>• {series.genres[0]}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
