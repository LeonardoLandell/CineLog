import { MediaItem } from '../types';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

async function fetchWithCache<T>(cacheKey: string, url: string): Promise<T> {
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
  const data = await response.json();
  sessionStorage.setItem(cacheKey, JSON.stringify(data));
  return data;
}

function normalizeTMDB(item: any, mediaType?: string): MediaItem {
  const type = mediaType || item.media_type || 'movie';
  const rawDate = item.release_date || item.first_air_date || '';
  return {
    uid: `tmdb-${type}-${item.id}`,
    externalId: item.id,
    source: 'tmdb',
    type,
    title: item.title || item.name || 'Sem título',
    poster: item.poster_path ? `${TMDB_IMG_BASE}${item.poster_path}` : 'https://via.placeholder.com/500x750/141821/94a3b8?text=Sem+Poster',
    year: rawDate ? rawDate.slice(0, 4) : 'N/A',
    rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : null,
    overview: item.overview || 'Sinopse indisponível.'
  };
}

function normalizeJikan(item: any): MediaItem {
  return {
    uid: `jikan-anime-${item.mal_id}`,
    externalId: item.mal_id,
    source: 'jikan',
    type: 'anime',
    title: item.title_english || item.title,
    poster: item.images?.jpg?.large_image_url || 'https://via.placeholder.com/500x750/141821/94a3b8?text=Sem+Poster',
    year: item.year || (item.aired?.from ? item.aired.from.slice(0, 4) : 'N/A'),
    rating: item.score ? Number(item.score.toFixed(1)) : null,
    overview: item.synopsis || 'Sinopse indisponível.'
  };
}

export const MediaService = {
  async getPopularMovies(): Promise<MediaItem[]> {
    const data = await fetchWithCache<any>('tmdb_pop_movies', `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`);
    return data.results.slice(0, 12).map((m: any) => normalizeTMDB(m, 'movie'));
  },

  async getPopularSeries(): Promise<MediaItem[]> {
    const data = await fetchWithCache<any>('tmdb_pop_tv', `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`);
    return data.results.slice(0, 12).map((s: any) => normalizeTMDB(s, 'tv'));
  },

  async getPopularAnimes(): Promise<MediaItem[]> {
    const data = await fetchWithCache<any>('jikan_pop_animes', `${JIKAN_BASE_URL}/top/anime?filter=bypopularity&limit=12`);
    return data.data.map(normalizeJikan);
  },

  async searchAll(query: string): Promise<MediaItem[]> {
    const q = encodeURIComponent(query.trim());
    if (!q) return [];
    const tmdbUrl = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${q}&page=1`;
    const jikanUrl = `${JIKAN_BASE_URL}/anime?q=${q}&limit=8`;

    const [tmdbRes, jikanRes] = await Promise.allSettled([
      fetchWithCache<any>(`search_tmdb_${q}`, tmdbUrl),
      fetchWithCache<any>(`search_jikan_${q}`, jikanUrl)
    ]);

    const results: MediaItem[] = [];
    if (tmdbRes.status === 'fulfilled' && tmdbRes.value.results) {
      results.push(...tmdbRes.value.results
        .filter((i: any) => i.media_type === 'movie' || i.media_type === 'tv')
        .slice(0, 10)
        .map((i: any) => normalizeTMDB(i)));
    }
    if (jikanRes.status === 'fulfilled' && jikanRes.value.data) {
      results.push(...jikanRes.value.data.map(normalizeJikan));
    }
    return results;
  }
};