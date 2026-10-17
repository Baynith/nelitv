import React, { useState, useEffect } from 'react';
import { Movie } from '../services/movieService';
import { Play, Info, Sparkles, ChevronLeft, ChevronRight, Clock, Star } from 'lucide-react';

interface MovieHeroBannerProps {
  movies: Movie[];
  onPlayMovie: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
}

export const MovieHeroBanner: React.FC<MovieHeroBannerProps> = ({
  movies,
  onPlayMovie,
  onOpenDetails,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-slide every 7 seconds
  useEffect(() => {
    if (!movies || movies.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % movies.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [movies]);

  if (!movies || movies.length === 0) return null;

  const current = movies[activeIndex] || movies[0];
  const bgImg = current.backdrop_path || current.poster_path;

  return (
    <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-2xl my-3 group">
      {/* Background Backdrop Image */}
      <div className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] lg:h-[460px] overflow-hidden">
        {bgImg ? (
          <img
            src={bgImg}
            alt={current.title}
            className="w-full h-full object-cover object-center transform transition-transform duration-1000 scale-105 group-hover:scale-100"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-950 via-slate-900 to-black" />
        )}

        {/* Cinematic Vignette & Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent sm:w-2/3" />

        {/* Content Box */}
        <div className="absolute inset-0 p-4 sm:p-8 md:p-10 flex flex-col justify-end max-w-2xl z-10 space-y-2 sm:space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-3 h-3" />
              Filamu Mpya ya Leo
            </span>
            {current.narration_language && (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                Imetafsiriwa Kiswahili
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
              BURE KABISA
            </span>
            {current.year && (
              <span className="text-xs text-slate-400 font-semibold">{current.year}</span>
            )}
          </div>

          <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md line-clamp-1">
            {current.title}
          </h2>

          {current.overview && (
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow">
              {current.overview}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-1 sm:pt-2">
            <button
              onClick={() => onPlayMovie(current)}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-4 sm:px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-500/25 active:scale-95 transition text-xs sm:text-sm cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Tazama Sasa</span>
            </button>

            <button
              onClick={() => onOpenDetails(current)}
              className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-semibold px-3.5 sm:px-5 py-2.5 rounded-xl border border-slate-700 active:scale-95 transition text-xs sm:text-sm cursor-pointer"
            >
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Maelezo &amp; Pakua</span>
            </button>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        {movies.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev - 1 + movies.length) % movies.length);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/60 border border-slate-700 text-white hover:bg-slate-800 transition active:scale-90 hidden sm:flex items-center justify-center z-20 cursor-pointer"
              aria-label="Previous movie"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev + 1) % movies.length);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/60 border border-slate-700 text-white hover:bg-slate-800 transition active:scale-90 hidden sm:flex items-center justify-center z-20 cursor-pointer"
              aria-label="Next movie"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicator Dots */}
            <div className="absolute bottom-3 right-4 sm:right-6 flex items-center gap-1.5 z-20">
              {movies.map((m, i) => (
                <button
                  key={m.id || i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? 'w-6 bg-cyan-400 shadow-sm shadow-cyan-400'
                      : 'w-2 bg-slate-600 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
