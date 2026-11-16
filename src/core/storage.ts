export interface MediaReview {
  id: string;
  mediaId: number;
  mediaTitle: string;
  mediaType: string;
  posterPath: string;
  user: string;
  rating: number;
  comment: string;
  listType: 'public' | 'private';
  createdAt: string;
}

export interface WatchlistItem {
  mediaId: number;
  title: string;
  type: string;
  posterPath: string;
  voteAverage: number;
  year: string;
}

export interface UserProfile {
  name: string;
  username: string;
  avatar: string;
  role: string;
}

const STORAGE_KEYS = {
  USER: 'cinelog_demo_user',
  WATCHLIST: 'cinelog_watchlist',
  REVIEWS: 'cinelog_reviews',
  IS_LOGGED_IN: 'cinelog_is_logged_in',
};

const DEFAULT_USER: UserProfile = {
  name: 'Recrutador Convidado',
  username: 'recrutador.tech',
  avatar: 'R',
  role: 'Visitante / Recrutador',
};

export const storage = {
  // Estado de Autenticação
  isLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
  },

  loginDemo(customName: string, customUsername: string) {
    const name = customName.trim() || DEFAULT_USER.name;
    const username = customUsername.trim() || DEFAULT_USER.username;
    
    const user: UserProfile = {
      name,
      username,
      avatar: name.charAt(0).toUpperCase(),
      role: 'Visitante / Recrutador',
    };
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
  },

  logout() {
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'false');
  },

  getUser(): UserProfile {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (!data) {
      return DEFAULT_USER;
    }
    return JSON.parse(data);
  },

  // Watchlist
  getWatchlist(): WatchlistItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
    return data ? JSON.parse(data) : [];
  },

  addToWatchlist(item: WatchlistItem) {
    const list = this.getWatchlist();
    if (!list.some((i) => i.mediaId === item.mediaId)) {
      list.push(item);
      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(list));
    }
  },

  removeFromWatchlist(mediaId: number) {
    const list = this.getWatchlist().filter((i) => i.mediaId !== mediaId);
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(list));
  },

  isInWatchlist(mediaId: number): boolean {
    return this.getWatchlist().some((i) => i.mediaId === mediaId);
  },

  // Avaliações e Comentários
  getReviews(): MediaReview[] {
    const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return data ? JSON.parse(data) : [];
  },

  getReviewsForMedia(mediaId: number): MediaReview[] {
    return this.getReviews().filter((r) => r.mediaId === mediaId);
  },

  addReview(review: Omit<MediaReview, 'id' | 'createdAt' | 'user'>): MediaReview {
    const reviews = this.getReviews();
    const user = this.getUser();
    
    const newReview: MediaReview = {
      ...review,
      id: 'rev_' + Math.random().toString(36).substring(2, 9),
      user: user.name,
      createdAt: new Date().toISOString(),
    };

    reviews.unshift(newReview);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    return newReview;
  },

  deleteReview(reviewId: string) {
    const reviews = this.getReviews().filter((r) => r.id !== reviewId);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }
};