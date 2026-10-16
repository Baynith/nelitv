import { CastMember } from '../types/content';

const TMDB_API_KEY = '9e571833942d8651835053f5dc09363d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const castCache = new Map<string, CastMember[]>();

export async function fetchCast(tmdbId?: number, isTv: boolean = false): Promise<CastMember[]> {
  if (!tmdbId) return [];

  const cacheKey = `${isTv ? 'tv' : 'movie'}_${tmdbId}`;
  if (castCache.has(cacheKey)) {
    return castCache.get(cacheKey)!;
  }

  try {
    const endpoint = isTv
      ? `${TMDB_BASE_URL}/tv/${tmdbId}/credits?api_key=${TMDB_API_KEY}`
      : `${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`;

    const res = await fetch(endpoint);
    if (!res.ok) return [];

    const data = await res.json();
    const cast: CastMember[] = (data.cast || []).slice(0, 15).map((c: any) => ({
      id: c.id,
      name: c.name || c.original_name,
      character: c.character,
      profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
    }));

    castCache.set(cacheKey, cast);
    return cast;
  } catch (err) {
    console.warn('TMDB credits fetch failed:', err);
    return [];
  }
}
