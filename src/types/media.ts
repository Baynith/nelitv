export interface CastMember {
  id?: number;
  name: string;
  character: string;
  profilePath?: string;
}

export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  overview?: string;
  posterPath: string;
  backdropPath?: string;
  streamUrl: string;
  embedCode?: string;
  embedUrl?: string;
  playbackType?: 'mp4' | 'm3u8' | 'embed';
  rating: number;
  voteCount?: number;
  year: number;
  releaseDate?: string;
  runtime: number; // in minutes
  genres: string[];
  narrated: boolean; // DJ / Swahili Audio
  narrationLanguage?: string;
  originalLanguage?: string;
  productionCountries?: string[];
  featured?: boolean;
  published?: boolean;
  downloadEnabled?: boolean;
  isPremium?: boolean;
  isAdult?: boolean;
  viewsCount?: number;
  watchlistsCount?: number;
  tmdbId?: number;
  cast?: CastMember[];
}

export interface SeriesSeason {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  posterPath?: string;
}

export interface Series {
  id: string;
  name: string;
  title?: string;
  originalName?: string;
  overview: string;
  posterPath: string;
  backdropPath?: string;
  year: number;
  rating: number;
  voteCount?: number;
  genres: string[];
  seasons?: SeriesSeason[];
  published?: boolean;
  isPremium?: boolean;
  viewsCount?: number;
  watchlistsCount?: number;
  narrated?: boolean;
  narrationLanguage?: string;
  tmdbId?: number;
  cast?: CastMember[];
}

export interface Episode {
  id: string;
  seriesId: string;
  name: string;
  title?: string;
  episodeNumber: number;
  seasonNumber: number;
  overview?: string;
  stillPath?: string;
  streamUrl: string;
  embedCode?: string;
  playbackType?: 'mp4' | 'm3u8' | 'embed';
  runtime?: number;
  narrated?: boolean;
  narrationLanguage?: string;
  published?: boolean;
  downloadEnabled?: boolean;
  airDate?: string;
  viewsCount?: number;
}
