import React, { useState } from 'react';
import { Movie } from '../types/media';
import {
  Film,
  FolderHeart,
  Clock,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Bookmark
} from 'lucide-react';

interface LibraryPageProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onPlayMovie?: (movie: Movie) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  movies,
  onSelectMovie,
  onPlayMovie,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'saved'>('history');

  // Load recently viewed movies from localStorage
  const [historyIds, setHistoryIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('nelitv_watch_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('nelitv_saved_movies');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const historyMovies = movies.filter((m) => historyIds.includes(m.id));
  const savedMovies = movies.filter((m) => savedIds.includes(m.id));

  // If empty, suggest top movies
  const displayMovies = activeTab === 'history'
    ? (historyMovies.length > 0 ? historyMovies : movies.slice(0, 8))
    : (savedMovies.length > 0 ? savedMovies : movies.slice(4, 12));

  const clearHistory = () => {
    localStorage.removeItem('nelitv_watch_history');
    setHistoryIds([]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-[#131b2e] to-slate-950 p-6 sm:p-8 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
            <FolderHeart className="w-3.5 h-3.5" />
            <span>Maktaba Yako (Library)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Filamu Ulizotazama na Zilizohifadhiwa
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Fuatilia filamu ulizotazama hivi karibuni na zile ulizoweka kwenye orodha yako ya baadaye.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[#272727] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white bg-[#1a1a1a]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Historia ({historyMovies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white bg-[#1a1a1a]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Imehifadhiwa ({savedMovies.length})</span>
          </button>
        </div>

        {activeTab === 'history' && historyMovies.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Futa Historia</span>
          </button>
        )}
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {displayMovies.map((movie) => (
          <div
            key={movie.id}
            onClick={() => onSelectMovie(movie)}
            className="group relative rounded-2xl bg-[#141414] border border-[#272727] hover:border-cyan-500/60 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
              <img
                src={movie.posterPath}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                </div>
              </div>
            </div>

            <div className="p-2.5 space-y-1">
              <h3 className="text-xs font-bold text-white truncate group-hover:text-cyan-400 transition">
                {movie.title}
              </h3>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{movie.year}</span>
                {movie.narrated && (
                  <span className="text-[9px] bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 px-1 rounded font-bold">
                    Swahili
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
