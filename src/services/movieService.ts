// Supabase Movie & Adult Content Service for NeliTV Web
// Connected to 'neli-central-movies' Supabase project:
// Project URL: https://bfvzfbtkmhpqahcaeluh.supabase.co

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Movie {
  id: string;
  title: string;
  tmdb_id?: number | null;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  stream_url: string;
  language?: string;
  narrated?: boolean;
  narration_language?: string;
  runtime?: number;
  year?: number;
  category_type?: string;
  genres?: string[];
  published?: boolean;
  price?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdultVideo {
  id: string;
  title: string;
  thumbnail_url?: string;
  video_url: string;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
}

const MOVIES_SUPABASE_URL = 'https://bfvzfbtkmhpqahcaeluh.supabase.co';
const MOVIES_SUPABASE_KEY = 'sb_publishable_wd-990R-PjrcfKXCVl6Z6w_iiXsk55f';

let moviesClient: SupabaseClient | null = null;

export function getMoviesSupabase(): SupabaseClient {
  if (!moviesClient) {
    moviesClient = createClient(MOVIES_SUPABASE_URL, MOVIES_SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return moviesClient;
}

// Fallback seed movies if offline
const FALLBACK_MOVIES: Movie[] = [
  {
    id: 'mov_never_a_thief',
    title: 'Never a Thief',
    year: 2025,
    runtime: 120,
    category_type: 'Crime',
    genres: ['Crime', 'Action'],
    narrated: true,
    narration_language: 'Swahili',
    overview: 'Mpelelezi anayeingia kwa siri katika genge la walanguzi wa sanaa za thamani akitumia mbinu zake za kufungua kufuli, akikabiliana na hatari kubwa ili kufichua siri ya kutoweka kwa baba yake.',
    poster_path: 'https://image.tmdb.org/t/p/w500/ui5Ujx256vAI5JbXzeTGVwMkVhs.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/vuq5EfA9ED9vnxQgEV4zWEAFmKJ.jpg',
    stream_url: 'https://vz-1bb50f2e-8ea.b-cdn.net/9d14eb59-d3a0-4b01-9010-ba9bc5492865/play_480p.mp4',
    published: true,
    price: 0,
  },
  {
    id: 'mov_affinity',
    title: 'Affinity',
    year: 2025,
    runtime: 81,
    category_type: 'Action',
    genres: ['Action', 'Thriller'],
    narrated: true,
    narration_language: 'Swahili',
    overview: 'Bruno, askari wa zamani wa kikosi maalum anayesumbuliwa na kumbukumbu mbaya za vita, anakutana na mwanamke wa ajabu. Wakati mwanamke huyo anapotekwa, Bruno analazimika kurudia maisha yake ya ukatili ili kumuokoa.',
    poster_path: 'https://image.tmdb.org/t/p/w500/WKwQOPh2mQPRL12jSu2yFHk4A7.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/ekpdjcuVVU2LIFM3EyePYykYZ4b.jpg',
    stream_url: 'https://vz-1bb50f2e-8ea.b-cdn.net/7735279f-692f-456f-8a91-cf8145ed905a/play_480p.mp4',
    published: true,
    price: 0,
  },
  {
    id: 'mov_play_dirty',
    title: 'Play Dirty',
    year: 2025,
    runtime: 128,
    category_type: 'Action',
    genres: ['Action', 'Crime'],
    narrated: true,
    narration_language: 'Swahili',
    overview: 'Mwizi mweledi Parker anapata dili kubwa la wizi lakini ili afanikiwe lazima yeye na timu yake wamzidi akili dikteta wa Amerika Kusini, mafia wa New York, na mtu tajiri zaidi duniani.',
    poster_path: 'https://image.tmdb.org/t/p/w500/ovZ0zq0NwRghtWI1oLaM0lWuoEw.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/k6tdiMTO39RQj3dhfspuzprfoe0.jpg',
    stream_url: 'https://vz-1bb50f2e-8ea.b-cdn.net/ce6ed963-a4fc-43fd-9583-1a80311bf683/play_480p.mp4',
    published: true,
    price: 0,
  },
  {
    id: 'mov_the_twits',
    title: 'The Twits',
    year: 2025,
    runtime: 99,
    category_type: 'Animation',
    genres: ['Animation', 'Comedy', 'Family'],
    narrated: true,
    narration_language: 'Swahili',
    overview: 'Watu wawili waovu na wakatili zaidi wanapopanga hila ya kutawala mji wao, watoto wawili mashujaa wanashirikiana na familia ya wanyama wenye uchawi ili kuwazima.',
    poster_path: 'https://image.tmdb.org/t/p/w500/zNP1nMRFqa9qAkpCkLeHa1V7kDR.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/i4o2aPGlnsxfPmDPF5lmlgjScyv.jpg',
    stream_url: 'https://vz-1bb50f2e-8ea.b-cdn.net/371bbd82-61c8-427e-b8ac-e15a1e041f89/play_480p.mp4',
    published: true,
    price: 0,
  },
  {
    id: 'mov_stolen_girl',
    title: 'Stolen Girl',
    year: 2025,
    runtime: 110,
    category_type: 'Thriller',
    genres: ['Thriller', 'Drama'],
    narrated: true,
    narration_language: 'Swahili',
    overview: 'Binti mdogo wa miaka 6 anapoondolewa nchini kinyemela na baba yake mzazi, mama yake anapigania kwa miaka kadhaa kumrudisha na hatimaye anaungana na mpelelezi maalum wa watoto waliotekwa.',
    poster_path: 'https://image.tmdb.org/t/p/w500/njU663VbT88zZjsJYizfWcam6sS.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/qcDDn7WeKBenM4nLlOPXAeJ4hpg.jpg',
    stream_url: 'https://vz-1bb50f2e-8ea.b-cdn.net/845977c0-04d7-46d5-aa30-01a5bbaab994/play_720p.mp4',
    published: true,
    price: 0,
  },
];

/**
 * Fetch all published regular movies from Supabase "movies" table
 */
export async function fetchPublishedMovies(): Promise<Movie[]> {
  try {
    const client = getMoviesSupabase();
    const { data, error } = await client
      .from('movies')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase Movies fetch error]:', error.message);
      return FALLBACK_MOVIES;
    }

    if (data && data.length > 0) {
      return data as Movie[];
    }
  } catch (err) {
    console.warn('[Supabase Movies exception]:', err);
  }
  return FALLBACK_MOVIES;
}

/**
 * Fetch published adult videos (Strictly separated from regular movies!)
 */
export async function fetchPublishedAdultVideos(): Promise<AdultVideo[]> {
  try {
    const client = getMoviesSupabase();
    const { data, error } = await client
      .from('adult_videos')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase Adult Videos fetch error]:', error.message);
      return [];
    }
    return (data || []) as AdultVideo[];
  } catch (err) {
    console.warn('[Supabase Adult Videos exception]:', err);
    return [];
  }
}

/**
 * Get 5 daily rotating banner movies for Homepage.
 * Changes automatically every 1 day based on calendar day.
 */
export function getDailyFeaturedMovies(movies: Movie[], count = 5): Movie[] {
  if (!movies || movies.length === 0) return FALLBACK_MOVIES.slice(0, count);
  if (movies.length <= count) return movies;

  // Day of year seed (0 to 365)
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const offset = (dayOfYear * 2) % movies.length;
  const rotated = [...movies.slice(offset), ...movies.slice(0, offset)];
  return rotated.slice(0, count);
}

/**
 * Group movies by a single primary genre to ensure no duplicate movies in rows
 */
export function groupMoviesByPrimaryGenre(movies: Movie[]): Record<string, Movie[]> {
  const groups: Record<string, Movie[]> = {};

  const cleanCategory = (m: Movie): string => {
    if (m.category_type && m.category_type.trim()) {
      return m.category_type.trim();
    }
    if (m.genres && m.genres.length > 0 && m.genres[0]) {
      return m.genres[0].trim();
    }
    return 'Zinginezo';
  };

  movies.forEach((m) => {
    const cat = cleanCategory(m);
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(m);
  });

  return groups;
}
