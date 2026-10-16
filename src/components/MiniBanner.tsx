import React, { useEffect, useState } from 'react';
import { Movie } from '../types/media';
import { getMiniBannerMovies } from '../services/mediaService';
import { Sparkles, Star, Flame, Clock, Play } from 'lucide-react';

interface MiniBannerProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

export const MiniBanner: React.FC<MiniBannerProps> = ({ movies, onSelectMovie }) => {
  const [displayedMovies, setDisplayedMovies] = useState<Movie[]>(() => getMiniBannerMovies(movies));

  // Rotate every 30 minutes automatically
  useEffect(() => {
    setDisplayedMovies(getMiniBannerMovies(movies));

    const interval = setInterval(() => {
      setDisplayedMovies(getMiniBannerMovies(movies));
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [movies]);

  if (!displayedMovies || displayedMovies.length === 0) return null;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-white font-extrabold text-sm sm:text-base leading-tight flex items-center gap-2">
              <span>Filamu Mpya Zinazovuma</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                New Movies
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Maudhui 5-6 mapya yaliyoteuliwa • Hubadilika kila baada ya dakika 30
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Kila dk 30</span>
        </div>
      </div>

      {/* Grid of 5-6 Movie Cards (NOT A SLIDER as requested!) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3 relative z-10">
        {displayedMovies.slice(0, 6).map((movie, index) => (
          <div
            key={movie.id}
            onClick={() => onSelectMovie(movie)}
            className="group relative bg-slate-950 border border-slate-800/90 hover:border-cyan-500/60 rounded-xl overflow-hidden cursor-pointer transition transform hover:-translate-y-1 hover:shadow-lg flex flex-col"
          >
            {/* Poster */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
              <img
                src={movie.posterPath}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-108 transition duration-300"
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (movie.posterPath && !img.src.includes('/api/proxy/image')) {
                    img.src = `/api/proxy/image?url=${encodeURIComponent(movie.posterPath)}`;
                  }
                }}
              />

              {/* Number Badge */}
              <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md bg-black/75 backdrop-blur-md text-white font-black text-[10px] flex items-center justify-center border border-white/20 shadow">
                #{index + 1}
              </div>

              {/* DJ Swahili Badge */}
              {movie.narrated && (
                <span className="absolute bottom-1.5 left-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded shadow uppercase">
                  DJ Swahili
                </span>
              )}

              {/* Rating */}
              <div className="absolute top-1.5 right-1.5 bg-black/75 backdrop-blur-md text-amber-400 text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-current" />
                <span>{movie.rating.toFixed(1)}</span>
              </div>

              {/* Hover Play Button */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-2 flex-1 flex flex-col justify-between">
              <h4 className="text-[11px] sm:text-xs font-bold text-white group-hover:text-cyan-400 transition line-clamp-1 leading-snug">
                {movie.title}
              </h4>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span>{movie.year}</span>
                <span className="text-emerald-400 font-bold">BURE</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
