import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Movie, Series, Episode, FirestoreTvChannel } from '../types/content';
import { SAMPLE_MOVIES, SAMPLE_SERIES } from './mediaService';
import { fetchBase44Movies } from './base44Service';

export function isSwahiliNarrated(data: any): boolean {
  if (data.narrated === false) return false;
  if (!data.narrated) return false;
  if (data.narrator && typeof data.narrator === 'string' && data.narrator.trim().length > 0) {
    return true;
  }
  const lang = String(data.language || data.audioLanguage || '').toLowerCase();
  if (lang.includes('sw') || lang.includes('kiswahili')) {
    return true;
  }
  const cat = String(data.category || '').toLowerCase();
  if (cat.includes('swahili') || cat.includes('narrat')) {
    return true;
  }
  const genres = (data.genres || []).map((g: any) => String(g).toLowerCase());
  if (genres.some((g: string) => g.includes('swahili') || g.includes('narrat'))) {
    return true;
  }
  return false;
}

export function isAdultContent(item: {
  genres?: string[];
  title?: string;
  name?: string;
  category?: string;
  streamUrl?: string;
  overview?: string;
}): boolean {
  const genres = (item.genres || []).map((g) => String(g).toLowerCase().trim());
  const title = String(item.title || item.name || '').toLowerCase();
  const cat = String(item.category || '').toLowerCase();
  const stream = String(item.streamUrl || '').toLowerCase();

  const adultKeywords = [
    'adult',
    '18+',
    'xxx',
    'porn',
    'anal',
    'blowjob',
    'erotic',
    'creampie',
    'pussy',
    'cock',
    'fucked',
    'sucks cock',
    'threesome',
    'fetish',
    'orgy',
    'masturbat',
    'teens (18+)',
    'xcdn',
    'xcdn1.me',
    'stepmom and son',
  ];

  if (genres.some((g) => adultKeywords.some((w) => g.includes(w)))) return true;
  if (adultKeywords.some((w) => title.includes(w))) return true;
  if (adultKeywords.some((w) => cat.includes(w))) return true;
  if (stream.includes('xcdn1.me')) return true;

  return false;
}

const DEFAULT_STREAM = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

/**
 * Fetch all published Movies from Base44 (Neliplay Studio central database) or Firestore
 */
export async function getMovies(forceRefresh = false): Promise<Movie[]> {
  try {
    const base44List = await fetchBase44Movies(forceRefresh);
    if (base44List && base44List.length > 0) {
      return base44List;
    }
  } catch (err) {
    console.warn('[Base44] Failed in getMovies, falling back to Firestore/Sample:', err);
  }

  try {
    const colRef = collection(db, 'movies');
    const snap = await getDocs(colRef);
    const list: Movie[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as any;
      if (data.published !== false) {
        const stream = data.streamUrl || data.stream_url || data.videoUrl || data.video_url || data.url || data.link || data.playbackUrl || '';
        const poster = data.posterPath || data.poster_path || data.poster || data.thumbnail || data.image || '';
        const backdrop = data.backdropPath || data.backdrop_path || data.backdrop || data.cover || '';
        list.push({
          id: doc.id,
          ...data,
          title: data.title || data.name || 'Bila Jina',
          streamUrl: stream || DEFAULT_STREAM,
          posterPath: poster,
          backdropPath: backdrop,
          narrated: isSwahiliNarrated(data),
          isAdult: isAdultContent(data) || data.isAdult === true,
        });
      }
    });

    const merged = [...list];
    for (const sm of SAMPLE_MOVIES as any[]) {
      if (!merged.some((m) => m.id === sm.id || m.title.toLowerCase() === sm.title.toLowerCase())) {
        merged.push(sm);
      }
    }

    return merged.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (b.year || 0) - (a.year || 0);
    });
  } catch (err) {
    console.error('Error fetching movies from Firestore:', err);
    return SAMPLE_MOVIES as any[];
  }
}

/**
 * Real-time listener for Movies collection with Base44 live support
 */
export function subscribeToMovies(callback: (movies: Movie[]) => void): () => void {
  // 1. Immediately fetch from Base44
  fetchBase44Movies(false)
    .then((b44List) => {
      if (b44List && b44List.length > 0) {
        callback(b44List);
      } else {
        callback(SAMPLE_MOVIES as any[]);
      }
    })
    .catch(() => {
      callback(SAMPLE_MOVIES as any[]);
    });

  const colRef = collection(db, 'movies');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: Movie[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as any;
        if (data.published !== false) {
          const stream = data.streamUrl || data.stream_url || data.videoUrl || data.video_url || data.url || data.link || data.playbackUrl || '';
          const poster = data.posterPath || data.poster_path || data.poster || data.thumbnail || data.image || '';
          const backdrop = data.backdropPath || data.backdrop_path || data.backdrop || data.cover || '';
          list.push({
            id: doc.id,
            ...data,
            title: data.title || data.name || 'Bila Jina',
            streamUrl: stream || DEFAULT_STREAM,
            posterPath: poster,
            backdropPath: backdrop,
            narrated: isSwahiliNarrated(data),
            isAdult: isAdultContent(data) || data.isAdult === true,
          });
        }
      });

      const merged = [...list];
      for (const sm of SAMPLE_MOVIES as any[]) {
        if (!merged.some((m) => m.id === sm.id || m.title.toLowerCase() === sm.title.toLowerCase())) {
          merged.push(sm);
        }
      }

      merged.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.year || 0) - (a.year || 0);
      });
      callback(merged);
    },
    (err) => {
      console.warn('Movies listener error, keeping current movies:', err);
    }
  );
}

/**
 * Fetch all published Series from Firestore collection /series
 */
export async function getSeries(): Promise<Series[]> {
  try {
    const colRef = collection(db, 'series');
    const snap = await getDocs(colRef);
    const list: Series[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as any;
      if (data.published !== false) {
        list.push({
          id: doc.id,
          ...data,
          title: data.title || data.name || 'Bila Jina',
          narrated: isSwahiliNarrated(data),
          isAdult: isAdultContent(data) || data.isAdult === true,
        });
      }
    });

    const merged = [...list];
    for (const ss of SAMPLE_SERIES as any[]) {
      if (!merged.some((s) => s.id === ss.id || (s.title && s.title.toLowerCase() === (ss.title || ss.name || '').toLowerCase()))) {
        merged.push(ss);
      }
    }

    return merged.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (b.year || 0) - (a.year || 0);
    });
  } catch (err) {
    console.error('Error fetching series from Firestore:', err);
    return SAMPLE_SERIES as any[];
  }
}

/**
 * Real-time listener for Series collection
 */
export function subscribeToSeries(callback: (series: Series[]) => void): () => void {
  // Immediately supply sample series
  callback(SAMPLE_SERIES as any[]);

  const colRef = collection(db, 'series');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: Series[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as any;
        if (data.published !== false) {
          list.push({
            id: doc.id,
            ...data,
            title: data.title || data.name || 'Bila Jina',
            narrated: isSwahiliNarrated(data),
            isAdult: isAdultContent(data) || data.isAdult === true,
          });
        }
      });

      const merged = [...list];
      for (const ss of SAMPLE_SERIES as any[]) {
        if (!merged.some((s) => s.id === ss.id || (s.title && s.title.toLowerCase() === (ss.title || ss.name || '').toLowerCase()))) {
          merged.push(ss);
        }
      }

      merged.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.year || 0) - (a.year || 0);
      });
      callback(merged);
    },
    (err) => {
      console.warn('Series listener error, using sample series:', err);
      callback(SAMPLE_SERIES as any[]);
    }
  );
}

/**
 * Fetch all episodes for a specific series from Firestore collection /episodes
 * Grouped and sorted by seasonNumber, then episodeNumber
 */
export async function getEpisodesForSeries(seriesId: string): Promise<Episode[]> {
  try {
    const colRef = collection(db, 'episodes');
    const q = query(colRef, where('seriesId', '==', seriesId));
    const snap = await getDocs(q);
    const list: Episode[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as any;
      if (data.published !== false) {
        list.push({
          id: doc.id,
          ...data,
          seasonNumber: Number(data.seasonNumber) || 1,
          episodeNumber: Number(data.episodeNumber) || 1,
          title: data.title || data.name || `Episode ${data.episodeNumber || 1}`,
          streamUrl: data.streamUrl || data.stream_url || data.videoUrl || data.url || DEFAULT_STREAM,
        });
      }
    });

    if (list.length > 0) {
      return list.sort((a, b) => {
        if (a.seasonNumber !== b.seasonNumber) {
          return a.seasonNumber - b.seasonNumber;
        }
        return a.episodeNumber - b.episodeNumber;
      });
    }

    // Fallback: Generate sample episodes if seriesId matches or has no episodes in Firestore
    const sampleEpisodes: Episode[] = [
      {
        id: `${seriesId}-s1e1`,
        seriesId,
        seasonNumber: 1,
        episodeNumber: 1,
        title: 'Sehemu ya 1: Mwanzo Mpya (Episode 1)',
        overview: 'Mwanzo wa safari ya kusisimua. Hatua za kwanza za mpango mkuu zinaanza kufunuka.',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        durationMinutes: 45,
        downloadEnabled: true,
        narrated: true,
      } as any,
      {
        id: `${seriesId}-s1e2`,
        seriesId,
        seasonNumber: 1,
        episodeNumber: 2,
        title: 'Sehemu ya 2: Vita vya Siri (Episode 2)',
        overview: 'Vikwazo vipya vinajitokeza na maadui wanaanza kufuatilia nyayo.',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        durationMinutes: 48,
        downloadEnabled: true,
        narrated: true,
      } as any,
      {
        id: `${seriesId}-s1e3`,
        seriesId,
        seasonNumber: 1,
        episodeNumber: 3,
        title: 'Sehemu ya 3: Msaliti Bungeni (Episode 3)',
        overview: 'Ukweli kuhusu njama za siri unafichuka kwa ushahidi mzito.',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        durationMinutes: 50,
        downloadEnabled: true,
        narrated: true,
      } as any,
      {
        id: `${seriesId}-s1e4`,
        seriesId,
        seasonNumber: 1,
        episodeNumber: 4,
        title: 'Sehemu ya 4: Mapambano ya Mwisho (Episode 4)',
        overview: 'Kilele cha msimu wa kwanza. Hatua ya mwisho inaleta majibu yote yaliyosubiriwa.',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        durationMinutes: 52,
        downloadEnabled: true,
        narrated: true,
      } as any,
    ];

    return sampleEpisodes;
  } catch (err) {
    console.error(`Error fetching episodes for series ${seriesId}:`, err);
    return [];
  }
}

/**
 * Fetch live TV channels from Firestore collection /tvChannels
 */
export async function getFirestoreTvChannels(): Promise<FirestoreTvChannel[]> {
  try {
    const colRef = collection(db, 'tvChannels');
    const snap = await getDocs(colRef);
    const list: FirestoreTvChannel[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as any;
      if (data.published !== false && data.enabled !== false) {
        const logo = data.logo || data.logoUrl || data.channel_logo || data.thumbnail || data.icon || data.image || '';
        const stream = data.streamUrl || data.stream_url || data.url || data.link || data.videoUrl || data.video_url || '';
        list.push({
          id: doc.id,
          ...data,
          name: data.name || data.title || 'Chaneli',
          category: data.category || 'Chaneli za Moja kwa Moja',
          logo,
          thumbnail: logo || data.thumbnail,
          streamUrl: stream,
          streamFormat: stream.includes('.mp4') ? 'mp4' : (stream.includes('.mpd') ? 'dash' : 'hls'),
        });
      }
    });
    return list;
  } catch (err) {
    console.error('Error fetching tvChannels from Firestore:', err);
    return [];
  }
}

/**
 * Real-time listener for /tvChannels collection (Allows all channels including international & adult)
 */
export function subscribeToFirestoreTvChannels(
  callback: (channels: FirestoreTvChannel[]) => void
): () => void {
  const colRef = collection(db, 'tvChannels');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: FirestoreTvChannel[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as any;
        if (data.published !== false && data.enabled !== false) {
          const logo = data.logo || data.logoUrl || data.channel_logo || data.thumbnail || data.icon || data.image || '';
          const stream = data.streamUrl || data.stream_url || data.url || data.link || data.videoUrl || data.video_url || '';
          list.push({
            id: doc.id,
            ...data,
            name: data.name || data.title || 'Chaneli',
            category: data.category || 'Chaneli za Moja kwa Moja',
            logo,
            thumbnail: logo || data.thumbnail,
            streamUrl: stream,
            streamFormat: stream.includes('.mp4') ? 'mp4' : (stream.includes('.mpd') ? 'dash' : 'hls'),
          });
        }
      });
      callback(list);
    },
    (err) => console.warn('tvChannels listener error:', err)
  );
}
