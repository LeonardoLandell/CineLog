import type { MediaItem, MediaType, WatchProvider } from '../types/types';
import { cache } from '../core/cache';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
export const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
export const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

interface TmdbRawItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  original_language?: string;
  genre_ids?: number[];
}

function normalizeItem(raw: TmdbRawItem, forcedType?: MediaType): MediaItem {
  const isAnime =
    forcedType === 'anime' ||
    (raw.genre_ids?.includes(16) && raw.original_language === 'ja');

  const resolvedType: MediaType = isAnime
    ? 'anime'
    : forcedType || (raw.title ? 'movie' : 'tv');

  const rawDate = raw.release_date || raw.first_air_date || '';

  return {
    uid: `tmdb-${resolvedType === 'anime' ? 'tv' : resolvedType}-${raw.id}`,
    tmdbId: raw.id,
    type: resolvedType,
    title: raw.title || raw.name || 'Sem título',
    originalTitle: raw.original_title || raw.original_name || '',
    overview: raw.overview || 'Sinopse indisponível em português.',
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    releaseDate: rawDate,
    year: rawDate ? rawDate.slice(0, 4) : '—',
    voteAverage: Number((raw.vote_average || 0).toFixed(1)),
    // Heurística inicial de disponibilidade BR (será enriquecida nos detalhes)
    hasSub: true,
    hasDub: raw.vote_average >= 6.5,
  };
}

async function fetchFromTmdb(endpoint: string, params: Record<string, string> = {}): Promise<TmdbRawItem[]> {
  const query = new URLSearchParams({
    api_key: API_KEY,
    language: 'pt-BR',
    region: 'BR',
    ...params,
  });

  const url = `${BASE_URL}${endpoint}?${query.toString()}`;
  const cached = cache.get<TmdbRawItem[]>(url);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro TMDB (${res.status})`);
  const data = await res.json();
  const results = data.results || [];
  cache.set(url, results);
  return results;
}

export const tmdbService = {
  /** Últimos Lançamentos / Estreias segmentados por tipo */
  async getLatest(category: MediaType): Promise<MediaItem[]> {
    if (category === 'movie') {
      const items = await fetchFromTmdb('/movie/now_playing');
      return items.map((i) => normalizeItem(i, 'movie'));
    }
    if (category === 'tv') {
      const items = await fetchFromTmdb('/tv/on_the_air');
      return items.map((i) => normalizeItem(i, 'tv'));
    }
    // Animes recentes (Animação + Idioma Japonês ordenados por lançamento)
    const items = await fetchFromTmdb('/discover/tv', {
      with_genres: '16',
      with_original_language: 'ja',
      sort_by: 'first_air_date.desc',
      'vote_count.gte': '20',
    });
    return items.map((i) => normalizeItem(i, 'anime'));
  },

  /** Mais Populares segmentados por tipo */
  async getPopular(category: MediaType): Promise<MediaItem[]> {
    if (category === 'movie') {
      const items = await fetchFromTmdb('/movie/popular');
      return items.map((i) => normalizeItem(i, 'movie'));
    }
    if (category === 'tv') {
      const items = await fetchFromTmdb('/tv/popular');
      return items.map((i) => normalizeItem(i, 'tv'));
    }
    const items = await fetchFromTmdb('/discover/tv', {
      with_genres: '16',
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
    });
    return items.map((i) => normalizeItem(i, 'anime'));
  },

  /** Busca global (Filmes, Séries e Animes) */
  async search(query: string): Promise<MediaItem[]> {
    const items = await fetchFromTmdb('/search/multi', { query });
    return items
      .filter((i: any) => i.media_type === 'movie' || i.media_type === 'tv')
      .map((i: any) => normalizeItem(i));
  },

  /** Busca plataformas de streaming disponíveis no Brasil (Netflix, Prime, Crunchyroll, etc.) */
  async getWatchProviders(tmdbId: number, type: MediaType): Promise<WatchProvider[]> {
    const endpointType = type === 'movie' ? 'movie' : 'tv';
    const url = `${BASE_URL}/${endpointType}/${tmdbId}/watch/providers?api_key=${API_KEY}`;

    const cached = cache.get<WatchProvider[]>(url);
    if (cached) return cached;

    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const brProviders: WatchProvider[] = data.results?.BR?.flatrate || [];
    cache.set(url, brProviders);
    return brProviders;
  },
};