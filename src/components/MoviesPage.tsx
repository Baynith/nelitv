import React, { useState, useEffect } from 'react';
import { Movie, fetchPublishedMovies, groupMoviesByPrimaryGenre } from '../services/movieService';
import {
  Film,
  Play,
  Sparkles,
  Search,
  SlidersHorizontal,
  Clock,
  Star,
  Download,
  Info
} from 'lucide-react';

interface MoviesPageProps {
  onSelectMovie: (movie: Movie) => void;
  onPlayMovie: (movie: Movie) => void;
}

export const MoviesPage: React.FC<MoviesPageProps> = ({
  onSelectMovie,
  onPlayMovie,
}) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchPublishedMovies()
      .then((data) => setMovies(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const genresList = [
    'all',
    'Action',
    'Drama',
    'Thriller',
    'Crime',
    'Animation',
    'Adventure',
    'Comedy',
  ];

  // Filter movies by search query and genre filter pill
  const filteredMovies = movies.filter((m) => {
    if (selectedGenre !== 'all') {
      const g = (m.category_type || (m.genres && m.genres[0]) || '').toLowerCase();
      if (!g.includes(selectedGenre.toLowerCase())) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchOverview = m.overview ? m.overview.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchOverview) return false;
    }
    return true;
  });

  // Group movies by a single primary genre (No duplicate movies across genre sections!)
  const groupedByPrimary = groupMoviesByPrimaryGenre(filteredMovies);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pb-20 animate-fade-in">
      {/* Top Hero Banner */}
      <div className="relative bg-gradient-to-b from-blue-950/40 via-slate-900/60 to-[#070b14] border-b border-slate-800/80 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#2563EB]/15 border border-[#2563EB]/40 text-[#3B82F6] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Katalogi Kuu ya Filamu za Bure (Movies)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Filamu za Kiswahili na Kimataifa (Bure Kabisa)
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Tazama au pakua movie zote bure zenye tafsiri ya DJ Kiswahili na lugha asilia. Zimepangwa kwa makundi ya aina ya filamu bila kurudiarudia.
          </p>

          {/* Search & Genre Filters */}
          <div className="pt-2 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tafuta jina la filamu au muigizaji..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#2563EB] placeholder:text-slate-500 transition shadow-inner"
              />
            </div>

            {/* Genre Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              {genresList.map((g) => {
                const isActive = selectedGenre === g;
                return (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-900/40'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{g === 'all' ? 'Aina Zote' : g}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Inapakia filamu kutoka Supabase...</p>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-20 space-y-3 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8">
            <Film className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base sm:text-lg font-bold text-white">Hakuna filamu iliyopatikana</h3>
            <p className="text-xs text-slate-400">Jaribu kubadilisha neno la utafutaji au aina ya filamu.</p>
          </div>
        ) : (
          Object.entries(groupedByPrimary).map(([genreName, genreMovies]) => {
            if (genreMovies.length === 0) return null;
            return (
              <section key={genreName} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                    <h2 className="text-lg sm:text-xl font-black text-white capitalize">
                      {genreName}
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {genreMovies.length} Filamu
                  </span>
                </div>

                {/* Horizontal responsive row for TV, Desktop, and Mobile */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                  {genreMovies.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => onSelectMovie(movie)}
                      className="group relative rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-[#2563EB] overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col"
                    >
                      {/* Poster Image */}
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                        {movie.poster_path ? (
                          <img
                            src={movie.poster_path}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                            <Film className="w-8 h-8" />
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {movie.narration_language && (
                            <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                              SW
                            </span>
                          )}
                          <span className="bg-emerald-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded shadow uppercase">
                            Bure
                          </span>
                        </div>

                        {movie.year && (
                          <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-sm text-slate-300 font-bold text-[10px] px-1.5 py-0.5 rounded border border-slate-700">
                            {movie.year}
                          </div>
                        )}

                        {/* Hover Overlay with Play Button */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayMovie(movie);
                            }}
                            className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform active:scale-95"
                            title="Tazama Sasa"
                          >
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-1.5">
                        <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#3B82F6] transition">
                          {movie.title}
                        </h3>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="truncate max-w-[70%]">
                            {movie.category_type || (movie.genres && movie.genres[0]) || 'Filamu'}
                          </span>
                          {movie.runtime ? <span>{movie.runtime}m</span> : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};
