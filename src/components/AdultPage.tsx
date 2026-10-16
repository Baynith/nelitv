import React, { useState } from 'react';
import { Movie } from '../types/media';
import {
  ShieldAlert,
  Lock,
  Play,
  Search,
  SlidersHorizontal,
  Flame,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface AdultPageProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onPlayMovie?: (movie: Movie) => void;
  onPayRequired: () => void;
  isSubscribed: boolean;
}

export const AdultPage: React.FC<AdultPageProps> = ({
  movies,
  onSelectMovie,
  onPlayMovie,
  onPayRequired,
  isSubscribed,
}) => {
  const [hasConfirmedAge, setHasConfirmedAge] = useState<boolean>(() => {
    return sessionStorage.getItem('nelitv_18_confirmed') === 'true';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter adult items from Base44 / media catalog
  const adultMovies = movies.filter((m) => {
    const isAdultFlag = m.isAdult === true;
    const hasAdultGenre = m.genres.some((g) => {
      const gl = g.toLowerCase();
      return gl.includes('adult') || gl.includes('18+') || gl.includes('erotic') || gl.includes('romance');
    });
    const hasAdultTitle = m.title.toLowerCase().includes('18+') || m.title.toLowerCase().includes('adult');
    return isAdultFlag || hasAdultGenre || hasAdultTitle;
  });

  // If few records in Base44, also include adult/mature selections
  const displayCatalog = adultMovies.length > 0 ? adultMovies : movies.slice(0, 12);

  const filtered = displayCatalog.filter((m) => {
    if (selectedCategory !== 'all' && !m.genres.includes(selectedCategory)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!m.title.toLowerCase().includes(q) && !(m.overview || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleConfirmAge = () => {
    sessionStorage.setItem('nelitv_18_confirmed', 'true');
    setHasConfirmedAge(true);
  };

  if (!hasConfirmedAge) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-gradient-to-b from-rose-950/40 to-slate-950 border border-rose-500/40 rounded-3xl text-center space-y-4 shadow-2xl animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 mx-auto flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-500/40">
            Maudhui ya Watu Wazima (18+)
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">Uthibitisho wa Umri</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sehemu hii ina filamu na video zilizotengwa kwa ajili ya watu wazima wenye umri wa kuanzia miaka 18 na zaidi pekee.
          </p>
        </div>

        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-amber-300 flex items-center gap-2 text-left">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <span>Ikiwa uko chini ya miaka 18, tafadhali rudi kwenye ukurasa wa kawaida wa Mwanzo.</span>
        </div>

        <div className="pt-2 space-y-2">
          <button
            onClick={handleConfirmAge}
            className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black py-3 rounded-xl shadow-lg transition active:scale-95 text-xs sm:text-sm cursor-pointer"
          >
            Ndiyo, Nina Umri wa Miaka 18+ (Fungua)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Adult Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-rose-950/60 via-[#1a0a14] to-slate-950 p-6 sm:p-8 border border-rose-500/30 shadow-2xl overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Maudhui ya Watu Wazima (18+)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Filamu za Watu Wazima na Mapenzi
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Katalogi maalum ya watu wazima kutoka kwenye database kuu ya Neliplay Studio (Base44).
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tafuta filamu za 18+..."
            className="w-full bg-[#141414] border border-[#272727] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        <div className="text-xs text-slate-400">
          Zinazoonekana: <strong className="text-white">{filtered.length}</strong>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {filtered.map((movie) => (
          <div
            key={movie.id}
            onClick={() => onSelectMovie(movie)}
            className="group relative rounded-2xl bg-[#141414] border border-rose-900/30 hover:border-rose-500 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
              <img
                src={movie.posterPath}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute top-2 right-2 bg-rose-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-md shadow">
                18+
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
              </div>
            </div>

            <div className="p-2.5 space-y-1">
              <h3 className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition">
                {movie.title}
              </h3>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{movie.year}</span>
                <span className="text-[9px] bg-rose-950/70 border border-rose-800/60 text-rose-300 px-1 rounded font-bold">
                  Adult
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
