export interface JikanExtraData {
  episodes: number | null;
  status: string;
  studio: string;
  malScore: number | null;
  rating: string;
}

export const jikanService = {
  async getAnimeDetails(title: string): Promise<JikanExtraData | null> {
    try {
      const response = await fetch(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`
      );
      if (!response.ok) return null;

      const json = await response.json();
      const anime = json.data?.[0];
      if (!anime) return null;

      return {
        episodes: anime.episodes ?? null,
        status: anime.status || 'Desconhecido',
        studio: anime.studios?.[0]?.name || 'Estúdio não informado',
        malScore: anime.score ?? null,
        rating: anime.rating || 'Livre',
      };
    } catch {
      return null;
    }
  },
};