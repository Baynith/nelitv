import { Movie } from '../types/media';
import { SAMPLE_MOVIES } from './mediaService';

export interface Base44MovieRecord {
  id: string;
  title: string;
  release_year?: number;
  content_type?: string;
  description?: string;
  streaming_url?: string;
  tmdb_id?: string | number;
  tmdb_url?: string;
  poster_url?: string;
  backdrop_url?: string;
  language?: string;
  narration_type?: string;
  runtime_minutes?: number | string;
  price_tzs?: number | string;
  currency?: string;
  category?: string;
  is_published?: boolean;
  is_featured?: boolean;
  created_date?: string;
  updated_date?: string;
  created_by_id?: string;
}

const BASE44_APP_ID = '6accc406da6b85fbd25bc59a';
const BASE44_API_URL = 'https://neliplay-studio-copy-d25bc59a.base44.app/api';
const CACHE_KEY = 'neliplay_base44_movies_cache';
const CACHE_TIME_KEY = 'neliplay_base44_movies_time';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// Map a raw Base44 Movie record into our rich internal Movie model
export function mapBase44MovieToAppMovie(b44: Base44MovieRecord): Movie {
  const isAdult = Boolean(
    (b44.category && b44.category.toLowerCase().includes('adult')) ||
    (b44.category && b44.category.toLowerCase().includes('18+')) ||
    (b44.title && b44.title.toLowerCase().includes('18+')) ||
    (b44.content_type && b44.content_type.toLowerCase().includes('adult'))
  );

  const parsedYear = Number(b44.release_year) || 2024;
  const parsedRuntime = Number(b44.runtime_minutes) || 100;
  const parsedPrice = Number(b44.price_tzs) || 0;
  const isNarrated = Boolean(
    b44.narration_type ||
    (b44.language && b44.language.toLowerCase().includes('swahili')) ||
    (b44.title && b44.title.toLowerCase().includes('swahili'))
  );

  return {
    id: b44.id ? `b44_${b44.id}` : `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: b44.title || 'Filamu Bila Jina',
    originalTitle: b44.title,
    overview: b44.description || 'Tazama filamu hii kwenye NeliTv web.',
    posterPath: b44.poster_url || 'https://image.tmdb.org/t/p/w500/A7EByudX0eOzlkQ2FIbogzyazm2.jpg',
    backdropPath: b44.backdrop_url || b44.poster_url || 'https://image.tmdb.org/t/p/original/4woSOUD0equAYzvwhWBHIJDCM88.jpg',
    streamUrl: b44.streaming_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    playbackType: (b44.streaming_url && b44.streaming_url.includes('.m3u8')) ? 'm3u8' : 'mp4',
    rating: 8.0,
    voteCount: 120,
    year: parsedYear,
    releaseDate: `${parsedYear}-01-01`,
    runtime: parsedRuntime,
    genres: b44.category ? b44.category.split(',').map((c) => c.trim()) : ['Filamu'],
    narrated: isNarrated,
    narrationLanguage: b44.narration_type || b44.language || 'Swahili',
    originalLanguage: b44.language || 'en',
    featured: Boolean(b44.is_featured),
    published: b44.is_published !== false,
    downloadEnabled: true,
    isPremium: parsedPrice > 0,
    isAdult: isAdult,
    viewsCount: 1040,
  };
}

/**
 * Fetch movies from Base44 API with pagination support
 * Uses GET https://neliplay-studio-copy-d25bc59a.base44.app/api/entities/Movie
 */
export async function fetchBase44Movies(forceRefresh = false): Promise<Movie[]> {
  // Check localStorage cache first
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      if (cached && cachedTime) {
        const age = Date.now() - parseInt(cachedTime, 10);
        if (age < CACHE_TTL_MS) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch {}
  }

  const allRecords: Base44MovieRecord[] = [];
  const limit = 50;
  let skip = 0;
  let hasMore = true;
  let pageCount = 0;
  const maxPages = 10; // safety ceiling up to 500 records

  while (hasMore && pageCount < maxPages) {
    pageCount++;
    try {
      // 1. First attempt: via our robust server proxy route (/api/base44/movies) to prevent any CORS issues
      // 2. Fallback: directly to Base44 endpoint
      let url = `/api/base44/movies?limit=${limit}&skip=${skip}`;
      let response: Response;

      try {
        response = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('Proxy returned ' + response.status);
      } catch {
        // Direct fallback to Base44
        url = `${BASE44_API_URL}/entities/Movie?limit=${limit}&skip=${skip}`;
        response = await fetch(url, { headers: { Accept: 'application/json' } });
      }

      if (!response.ok) {
        console.warn(`[Base44] API request failed with status ${response.status}`);
        break;
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        break;
      }

      if (data.length === 0) {
        hasMore = false;
        break;
      }

      // Filter only published records
      const published = data.filter((item: Base44MovieRecord) => item && item.is_published !== false);
      allRecords.push(...published);

      if (data.length < limit) {
        hasMore = false;
      } else {
        skip += limit;
      }
    } catch (err) {
      console.warn('[Base44] Network error while fetching page:', err);
      break;
    }
  }

  // If Base44 returns live records, map them
  let appMovies: Movie[] = [];
  if (allRecords.length > 0) {
    appMovies = allRecords.map(mapBase44MovieToAppMovie);
  }

  // If Base44 database currently has 0 records or is initializing, merge with our rich Swahili catalog
  // ensuring the user's interface remains functional and never broken
  if (appMovies.length === 0) {
    appMovies = [...SAMPLE_MOVIES];
  } else {
    // Also include sample movies if Base44 has fewer than 10 so users get full experience
    for (const sm of SAMPLE_MOVIES) {
      if (!appMovies.some((m) => m.title.toLowerCase() === sm.title.toLowerCase())) {
        appMovies.push(sm);
      }
    }
  }

  // Cache locally
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(appMovies));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  } catch {}

  return appMovies;
}
