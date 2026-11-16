export type MediaType = 'movie' | 'tv' | 'anime';
export type ThemeMode = 'day' | 'black';
export type WatchStatus = 'want_to_watch' | 'watching' | 'completed';

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface MediaItem {
  uid: string;
  tmdbId: number;
  type: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  year: string;
  voteAverage: number;
  genres?: string[];
  providers?: WatchProvider[];
  hasDub?: boolean;
  hasSub?: boolean;
}

export interface AnimeEnrichment {
  malScore: number | null;
  studio: string;
  episodes: number | null;
  status: string;
}

export interface WatchlistItem {
  id?: number;
  uid: string;
  title: string;
  type: MediaType;
  poster_path: string | null;
  year: string;
  rating: number;
  status: WatchStatus;
  personal_rating: number | null;
  notes: string;
  updated_at?: string;
}