import React, { useState } from 'react';
import { Movie, Series } from '../types/media';
import {
  Film,
  Tv,
  Star,
  Search,
  Sparkles,
  SlidersHorizontal,
  Flame,
  Clock,
  Play
} from 'lucide-react';

interface MoviesPageProps {
  movies: Movie[];
  series: Series[];
  onSelectMovie: (movie: Movie) => void;
  onSelectSeries: (series: Series) => void;
  onPlayMovie?: (movie: Movie) => void;
}

export const MoviesPage: React.FC<MoviesPageProps> = ({
  movies,
  series,
  onSelectMovie,
  onSelectSeries,
  onPlayMovie,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'movies' | 'series' | 'swahili'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const genres = ['all', 'Action', 'Drama', 'Sci-Fi', 'Comedy', 'Thriller', 'Adventure', 'History'];

  // Filter movies
  const filteredMovies = movies.filter((m) => {
    if (filterType === 'series') return false;
    if (filterType === 'swahili' && !m.narrated) return false;
    if (selectedGenre !== 'all' && !m.genres.includes(selectedGenre)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q) || (m.originalTitle && m.originalTitle.toLowerCase().includes(q));
      const matchOverview = m.overview ? m.overview.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchOverview) return false;
    }
    return true;
  });

  // Filter series
  const filteredSeries = series.filter((s) => {
    if (filterType === 'movies') return false;
    if (filterType === 'swahili' && !s.narrated) return false;
    if (selectedGenre !== 'all' && !s.genres.includes(selectedGenre)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q) || (s.originalName && s.originalName.toLowerCase().includes(q));
      const matchOverview = s.overview.toLowerCase().includes(q);
      if (!matchName && !matchOverview) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pb-20 animate-fade-in">
      {/* Top Hero Banner */}
      <div className="relative bg-gradient-to-b from-cyan-950/40 via-slate-900/60 to-[#070b14] border-b border-slate-800/80 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Filamu na Tamthilia Bure (Movies &amp; Series)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Tazama Movie &amp; Series Bure Kabisa
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Burudika na filamu mpya za kimataifa, DJ Kiswahili (Swahili Narrated audio), na tamthilia kali za msimu bila malipo yoyote.
          </p>

          {/* Search and Filters Bar */}
          <div className="pt-2 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tafuta jina la movie, series au muigizaji..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500 transition shadow-inner"
              />
            </div>

            {/* Content Type Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  filterType === 'all'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Zote ({movies.length + series.length})
              </button>

              <button
                onClick={() => setFilterType('movies')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  filterType === 'movies'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Movies ({movies.length})</span>
              </button>

              <button
                onClick={() => setFilterType('series')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  filterType === 'series'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Series ({series.length})</span>
              </button>

              <button
                onClick={() => setFilterType('swahili')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  filterType === 'swahili'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>DJ Kiswahili Audio</span>
              </button>
            </div>
          </div>

          {/* Genre Category Row */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 scrollbar-none">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${
                  selectedGenre === g
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
                    : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-900'
                }`}
              >
                {g === 'all' ? 'Aina Zote (All Genres)' : g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-12">
        {/* MOVIES SECTION */}
        {(filterType === 'all' || filterType === 'movies' || filterType === 'swahili') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg sm:text-xl font-bold text-white">Filamu (Movies)</h2>
              </div>
              <span className="text-xs text-slate-400">Jumla: {filteredMovies.length}</span>
            </div>

            {filteredMovies.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs sm:text-sm bg-slate-900/30 rounded-2xl border border-slate-800/80">
                Hakuna filamu zilizopatikana kwa chaguo hili.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
                {filteredMovies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => onSelectMovie(movie)}
                    className="group bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-500/50 hover:shadow-2xl transition transform hover:-translate-y-1.5 flex flex-col"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
                      <img
                        src={movie.posterPath}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />

                      {/* Swahili Badge */}
                      {movie.narrated && (
                        <span className="absolute top-2 left-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-lg uppercase tracking-wider">
                          DJ Swahili
                        </span>
                      )}

                      {/* Rating */}
                      <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>{movie.rating.toFixed(1)}</span>
                      </div>

                      {/* Play overlay hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <div
                          onClick={(e) => {
                            if (onPlayMovie) {
                              e.stopPropagation();
                              onPlayMovie(movie);
                            }
                          }}
                          className="w-10 h-10 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition"
                          title="Tazama Sasa"
                        >
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-400 transition line-clamp-1">
                          {movie.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                          <span>{movie.year}</span>
                          <span>•</span>
                          <span>{movie.runtime} dk</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2 text-[10px]">
                        <span className="text-emerald-400 font-bold">BURE</span>
                        <span className="text-slate-400">{movie.genres[0]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SERIES SECTION */}
        {(filterType === 'all' || filterType === 'series' || filterType === 'swahili') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg sm:text-xl font-bold text-white">Tamthilia (Series)</h2>
              </div>
              <span className="text-xs text-slate-400">Jumla: {filteredSeries.length}</span>
            </div>

            {filteredSeries.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs sm:text-sm bg-slate-900/30 rounded-2xl border border-slate-800/80">
                Hakuna tamthilia zilizopatikana kwa chaguo hili.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
                {filteredSeries.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onSelectSeries(s)}
                    className="group bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-500/50 hover:shadow-2xl transition transform hover:-translate-y-1.5 flex flex-col"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
                      <img
                        src={s.posterPath}
                        alt={s.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />

                      {/* Swahili Badge */}
                      {s.narrated && (
                        <span className="absolute top-2 left-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-lg uppercase tracking-wider">
                          DJ Swahili
                        </span>
                      )}

                      {/* Rating */}
                      <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>{s.rating.toFixed(1)}</span>
                      </div>

                      {/* Play overlay hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-400 transition line-clamp-1">
                          {s.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                          <span>{s.year}</span>
                          <span>•</span>
                          <span>{s.seasons?.length || 1} Msimu (Seasons)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2 text-[10px]">
                        <span className="text-emerald-400 font-bold">BURE</span>
                        <span className="text-slate-400">{s.genres[0]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
