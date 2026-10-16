import React, { useState, useRef, useEffect } from 'react';
import { Channel } from '../data/channels';
import { Movie, Series, FirestoreTvChannel } from '../types/content';
import {
  Search,
  X,
  Tv,
  Film,
  Clapperboard,
  Play,
  Star,
  ChevronRight,
  Radio
} from 'lucide-react';

interface GlobalHeaderSearchProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  channels: Channel[];
  firestoreChannels: FirestoreTvChannel[];
  movies: Movie[];
  seriesList: Series[];
  onSelectChannel: (ch: Channel) => void;
  onSelectFirestoreChannel: (fsCh: FirestoreTvChannel) => void;
  onSelectMovie: (m: Movie) => void;
  onSelectSeries: (s: Series) => void;
  isMobileSearchOpen: boolean;
  onCloseMobileSearch: () => void;
}

export const GlobalHeaderSearch: React.FC<GlobalHeaderSearchProps> = ({
  searchQuery,
  onSearchChange,
  channels,
  firestoreChannels,
  movies,
  seriesList,
  onSelectChannel,
  onSelectFirestoreChannel,
  onSelectMovie,
  onSelectSeries,
  isMobileSearchOpen,
  onCloseMobileSearch,
}) => {
  const [isOpenDropdown, setIsOpenDropdown] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = searchQuery.trim().toLowerCase();

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpenDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Filter items
  const matchedChannels = query
    ? channels.filter((c) =>
        c.name.toLowerCase().includes(query) ||
        c.categoryLabel.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const matchedFirestoreChannels = query
    ? firestoreChannels.filter((c) =>
        c.name.toLowerCase().includes(query) ||
        (c.category && c.category.toLowerCase().includes(query))
      ).slice(0, 4)
    : [];

  const matchedMovies = query
    ? movies.filter((m) =>
        m.title.toLowerCase().includes(query) ||
        (m.originalTitle && m.originalTitle.toLowerCase().includes(query)) ||
        (m.genres && m.genres.some((g) => g.toLowerCase().includes(query)))
      ).slice(0, 5)
    : [];

  const matchedSeries = query
    ? seriesList.filter((s) => {
        const title = s.title || s.name || '';
        return (
          title.toLowerCase().includes(query) ||
          (s.genres && s.genres.some((g) => g.toLowerCase().includes(query)))
        );
      }).slice(0, 4)
    : [];

  const totalMatches =
    matchedChannels.length +
    matchedFirestoreChannels.length +
    matchedMovies.length +
    matchedSeries.length;

  const showDropdown = isOpenDropdown && query.length > 0;

  return (
    <>
      {/* Desktop & Tablet Search Bar (hidden md:flex) */}
      <div ref={containerRef} className="hidden md:flex flex-1 max-w-md mx-3 relative">
        <div className="flex w-full items-center bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 shadow-inner transition">
          <div className="pl-3.5 pr-2 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsOpenDropdown(true)}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsOpenDropdown(true);
            }}
            placeholder="Tafuta chaneli, movie, series..."
            className="w-full bg-transparent py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange('');
                setIsOpenDropdown(false);
              }}
              className="p-1.5 text-slate-400 hover:text-white mr-1"
              title="Futa utafutaji"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Instant Results Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[460px] overflow-y-auto no-scrollbar animate-fade-in divide-y divide-slate-900">
            {totalMatches === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Hakuna maudhui yaliyopatikana kwa "{searchQuery}".
              </div>
            ) : (
              <>
                {/* 1. Live TV Channels */}
                {(matchedChannels.length > 0 || matchedFirestoreChannels.length > 0) && (
                  <div className="p-2 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                      <Tv className="w-3 h-3 text-cyan-400" />
                      <span>Chaneli za Moja kwa Moja ({matchedChannels.length + matchedFirestoreChannels.length})</span>
                    </span>

                    {matchedChannels.map((ch) => (
                      <div
                        key={ch.id}
                        onClick={() => {
                          onSelectChannel(ch);
                          setIsOpenDropdown(false);
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-900 cursor-pointer transition text-left"
                      >
                        <img
                          src={ch.thumbnailUrl}
                          alt={ch.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/logo.svg';
                          }}
                          className="w-8 h-8 rounded-lg object-contain bg-black p-0.5 border border-slate-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{ch.name}</h4>
                          <span className="text-[10px] text-slate-400 truncate block">{ch.categoryLabel}</span>
                        </div>
                        <span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.2 rounded font-mono">
                          LIVE
                        </span>
                      </div>
                    ))}

                    {matchedFirestoreChannels.map((fsCh) => (
                      <div
                        key={fsCh.id}
                        onClick={() => {
                          onSelectFirestoreChannel(fsCh);
                          setIsOpenDropdown(false);
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-900 cursor-pointer transition text-left"
                      >
                        <img
                          src={fsCh.logo || fsCh.thumbnail || '/logo.svg'}
                          alt={fsCh.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/logo.svg';
                          }}
                          className="w-8 h-8 rounded-lg object-contain bg-black p-0.5 border border-slate-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{fsCh.name}</h4>
                          <span className="text-[10px] text-slate-400 truncate block">{fsCh.category || 'Live TV'}</span>
                        </div>
                        <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded font-mono">
                          LIVE
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Movies */}
                {matchedMovies.length > 0 && (
                  <div className="p-2 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                      <Film className="w-3 h-3 text-cyan-400" />
                      <span>Filamu & Movies ({matchedMovies.length})</span>
                    </span>

                    {matchedMovies.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => {
                          onSelectMovie(movie);
                          setIsOpenDropdown(false);
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-900 cursor-pointer transition text-left"
                      >
                        <div className="w-7 h-10 rounded-md overflow-hidden bg-slate-900 shrink-0">
                          {movie.posterPath ? (
                            <img
                              src={movie.posterPath}
                              alt={movie.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Film className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{movie.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {movie.year && <span>{movie.year}</span>}
                            {movie.rating ? (
                              <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                                <Star className="w-2.5 h-2.5 fill-amber-400" />
                                <span>{movie.rating.toFixed(1)}</span>
                              </span>
                            ) : null}
                            <span className="text-emerald-400 font-bold">BURE</span>
                          </div>
                        </div>
                        <Play className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Series */}
                {matchedSeries.length > 0 && (
                  <div className="p-2 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                      <Clapperboard className="w-3 h-3 text-cyan-400" />
                      <span>Series ({matchedSeries.length})</span>
                    </span>

                    {matchedSeries.map((series) => (
                      <div
                        key={series.id}
                        onClick={() => {
                          onSelectSeries(series);
                          setIsOpenDropdown(false);
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-900 cursor-pointer transition text-left"
                      >
                        <div className="w-7 h-10 rounded-md overflow-hidden bg-slate-900 shrink-0">
                          {series.posterPath ? (
                            <img
                              src={series.posterPath}
                              alt={series.title || series.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Clapperboard className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">
                            {series.title || series.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {series.genres?.join(', ') || 'Series'} • <strong className="text-emerald-400 font-bold">BURE</strong>
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Expandable Mobile Search Bar (md:hidden) */}
      {isMobileSearchOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 px-3 py-2.5 bg-slate-950 border-b border-slate-900 z-50 shadow-2xl animate-fade-in">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tafuta chaneli, movie, series..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={onCloseMobileSearch}
              className="text-xs text-cyan-400 font-semibold px-2 py-1 shrink-0"
            >
              Funga
            </button>
          </div>

          {/* Mobile Instant Results Dropdown */}
          {query.length > 0 && (
            <div className="mt-2 bg-slate-900 rounded-xl border border-slate-800 max-h-72 overflow-y-auto no-scrollbar divide-y divide-slate-800/80 shadow-2xl">
              {totalMatches === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  Hakuna maudhui yaliyopatikana kwa "{searchQuery}".
                </div>
              ) : (
                <>
                  {matchedChannels.map((ch) => (
                    <div
                      key={ch.id}
                      onClick={() => {
                        onSelectChannel(ch);
                        onCloseMobileSearch();
                      }}
                      className="flex items-center gap-2.5 p-2 hover:bg-slate-800 active:bg-slate-800 cursor-pointer"
                    >
                      <img
                        src={ch.thumbnailUrl}
                        alt={ch.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded object-contain bg-black p-0.5 border border-slate-800"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white truncate block">{ch.name}</span>
                        <span className="text-[10px] text-slate-400">{ch.categoryLabel}</span>
                      </div>
                      <span className="text-[9px] bg-red-600 text-white font-black px-1 rounded">LIVE</span>
                    </div>
                  ))}

                  {matchedFirestoreChannels.map((fsCh) => (
                    <div
                      key={fsCh.id}
                      onClick={() => {
                        onSelectFirestoreChannel(fsCh);
                        onCloseMobileSearch();
                      }}
                      className="flex items-center gap-2.5 p-2 hover:bg-slate-800 active:bg-slate-800 cursor-pointer"
                    >
                      <img
                        src={fsCh.logo || fsCh.thumbnail || '/logo.svg'}
                        alt={fsCh.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded object-contain bg-black p-0.5 border border-slate-800"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white truncate block">{fsCh.name}</span>
                        <span className="text-[10px] text-slate-400">{fsCh.category || 'Live TV'}</span>
                      </div>
                      <span className="text-[9px] bg-emerald-600 text-white font-black px-1 rounded">LIVE</span>
                    </div>
                  ))}

                  {matchedMovies.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => {
                        onSelectMovie(movie);
                        onCloseMobileSearch();
                      }}
                      className="flex items-center gap-2.5 p-2 hover:bg-slate-800 active:bg-slate-800 cursor-pointer"
                    >
                      <div className="w-6 h-8 rounded overflow-hidden bg-black shrink-0">
                        {movie.posterPath ? (
                          <img
                            src={movie.posterPath}
                            alt={movie.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Film className="w-3 h-3 text-slate-600 m-auto mt-2.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white truncate block">{movie.title}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">BURE • Filamu</span>
                      </div>
                    </div>
                  ))}

                  {matchedSeries.map((series) => (
                    <div
                      key={series.id}
                      onClick={() => {
                        onSelectSeries(series);
                        onCloseMobileSearch();
                      }}
                      className="flex items-center gap-2.5 p-2 hover:bg-slate-800 active:bg-slate-800 cursor-pointer"
                    >
                      <div className="w-6 h-8 rounded overflow-hidden bg-black shrink-0">
                        {series.posterPath ? (
                          <img
                            src={series.posterPath}
                            alt={series.title || series.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Clapperboard className="w-3 h-3 text-slate-600 m-auto mt-2.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white truncate block">
                          {series.title || series.name}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">BURE • Series</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
