import React, { useEffect, useState } from 'react';
import { Movie, Series } from '../types/content';
import {
  Play,
  Info,
  ChevronLeft,
  ChevronRight,
  Star,
  Sparkles,
  Calendar,
  Film
} from 'lucide-react';

interface MediaHeroSliderProps {
  items: (Movie | Series)[];
  onPlayMovie: (movie: Movie) => void;
  onOpenMovieDetails: (movie: Movie) => void;
  onOpenSeriesDetails: (series: Series) => void;
}

export const MediaHeroSlider: React.FC<MediaHeroSliderProps> = ({
  items,
  onPlayMovie,
  onOpenMovieDetails,
  onOpenSeriesDetails,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // 10-Second Auto Slider
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [items.length]);

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex];
  const isMovie = 'runtime' in currentItem || !('numberOfSeasons' in currentItem);
  const title = ('title' in currentItem && currentItem.title) || ('name' in currentItem && currentItem.name) || 'Kichwa cha Habari';
  const isNarrated = currentItem.narrated === true || (currentItem.narrationLanguage && currentItem.narrationLanguage.toLowerCase().includes('swahili'));

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handleActionPlay = () => {
    if (isMovie) {
      onPlayMovie(currentItem as Movie);
    } else {
      onOpenSeriesDetails(currentItem as Series);
    }
  };

  const handleActionDetails = () => {
    if (isMovie) {
      onOpenMovieDetails(currentItem as Movie);
    } else {
      onOpenSeriesDetails(currentItem as Series);
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl mb-8 group">
      {/* Mini Visible Notice Bar on Top */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white text-[11px] sm:text-xs font-black py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-inner">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
        <span>ANGALIA MOVIE NA SERIES ZOTE BURE KABISA BILA KULIPIA AU KUINGIA!</span>
      </div>

      {/* Hero Banner Carousel Body (Increased height: h-80 sm:h-96 md:h-[420px]) */}
      <div className="relative h-80 sm:h-96 md:h-[420px] w-full overflow-hidden">
        {/* Backdrop Image with gradient overlay */}
        {currentItem.backdropPath || currentItem.posterPath ? (
          <img
            src={currentItem.backdropPath || currentItem.posterPath}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center brightness-70 transition-all duration-700 transform scale-100 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950" />
        )}

        {/* Gradient Shadow Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />

        {/* Content Over Banner (Smaller compact typography) */}
        <div className="absolute inset-0 p-4 sm:p-7 md:p-8 flex flex-col justify-end max-w-2xl z-20 space-y-2 sm:space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="bg-emerald-500 text-slate-950 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full shadow">
              BURE 100%
            </span>

            {isNarrated && (
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-slate-950" />
                <span>Swahili Narrated 🇹🇿</span>
              </span>
            )}

            <span className="bg-slate-800/80 backdrop-blur-md text-cyan-300 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700">
              {isMovie ? 'Filamu (Movie)' : 'Series'}
            </span>
          </div>

          <h2 className="text-base sm:text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-lg line-clamp-1">
            {title}
          </h2>

          <div className="flex items-center gap-2.5 text-[11px] sm:text-xs text-slate-300">
            {currentItem.rating && (
              <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{currentItem.rating.toFixed(1)}</span>
              </span>
            )}
            {currentItem.year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-cyan-400" />
                <span>{currentItem.year}</span>
              </span>
            )}
            {currentItem.genres && currentItem.genres.length > 0 && (
              <span className="text-slate-400 hidden sm:inline text-[11px]">
                {currentItem.genres.slice(0, 3).join(', ')}
              </span>
            )}
          </div>

          {currentItem.overview && (
            <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-2 max-w-lg leading-relaxed drop-shadow">
              {currentItem.overview}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={handleActionPlay}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black px-4 sm:px-5 py-2 rounded-xl shadow-xl transition active:scale-95 text-xs sm:text-sm"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>{isMovie ? 'Play Sasa (Bure)' : 'Tazama Episodes'}</span>
            </button>

            <button
              onClick={handleActionDetails}
              className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition text-xs sm:text-sm backdrop-blur-md active:scale-95"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Maelezo</span>
            </button>
          </div>
        </div>

        {/* Carousel Arrow Navigation */}
        <button
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-slate-700 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100 shadow-xl"
          title="Nyuma"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-slate-700 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100 shadow-xl"
          title="Mbele"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Indicators Dots */}
        <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5">
          {items.slice(0, 8).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                currentIndex === idx ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-600/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
