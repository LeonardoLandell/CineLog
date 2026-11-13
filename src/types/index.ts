export type MediaType = 'movie' | 'tv' | 'anime';
export type MediaStatus = 'planned' | 'watched';

export interface MediaItem {
  uid: string;
  externalId: number;
  source: 'tmdb' | 'jikan';
  type: MediaType;
  title: string;
  poster: string;
  year: string;
  rating: number | null;
  overview: string;
}

export interface WatchlistEntry extends MediaItem {
  status: MediaStatus;
  personal_rating: number | null;
  added_at: string;
}