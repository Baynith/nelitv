export interface Movie {
  id: string;
  tmdbId?: number;
  title: string;
  originalTitle?: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  year?: number;
  runtime?: number; // minutes
  genres?: string[];
  rating?: number;
  voteCount?: number;
  originalLanguage?: string;
  productionCountries?: string[];
  streamUrl: string;
  downloadEnabled?: boolean;
  narrated?: boolean;
  narrationLanguage?: string;
  featured?: boolean;
  published?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Series {
  id: string;
  tmdbId?: number;
  title?: string;
  name?: string; // fallback in some documents
  originalTitle?: string;
  originalName?: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  year?: number;
  genres?: string[];
  rating?: number;
  voteCount?: number;
  originalLanguage?: string;
  productionCountries?: string[];
  narrated?: boolean;
  narrationLanguage?: string;
  featured?: boolean;
  published?: boolean;
  numberOfSeasons?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Episode {
  id: string;
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  title?: string;
  name?: string; // fallback
  overview?: string;
  stillPath?: string;
  thumbnail?: string;
  posterPath?: string;
  airDate?: string;
  runtime?: number;
  streamUrl: string;
  downloadEnabled?: boolean;
  narrated?: boolean;
  narrationLanguage?: string;
  published?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface FirestoreTvChannel {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  thumbnail?: string;
  streamUrl: string;
  streamFormat?: string;
  category?: string;
  country?: string;
  language?: string;
  published?: boolean;
  enabled?: boolean;
  featured?: boolean;
  isLive?: boolean;
  premium?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profilePath?: string | null;
}
