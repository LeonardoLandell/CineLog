const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBDetailExtra {
  runtime?: number;
  numberOfEpisodes?: number;
  status?: string;
  director?: string;
  cast: string[];
  trailerUrl?: string;
  certification?: string;
}

export const tmdbDetailsService = {
  async getDetails(type: string, id: number): Promise<TMDBDetailExtra | null> {
    // Se o tipo for anime, no TMDB ele geralmente é tratado como 'tv' ou 'movie'
    const mediaEndpoint = type === 'anime' ? 'tv' : type;
    const cacheKey = `tmdb_details_${mediaEndpoint}_${id}`;
    
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const url = `${TMDB_BASE_URL}/${mediaEndpoint}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=credits,videos,release_dates,content_ratings`;
      const res = await fetch(url);
      if (!res.ok) return null;
      
      const data = await res.json();

      // Extrair Diretor ou Criador
      const crew = data.credits?.crew || [];
      const directorObj = crew.find((c: any) => c.job === 'Director' || c.job === 'Series Director' || c.known_for_department === 'Directing');
      const director = directorObj ? directorObj.name : 'Não informado';

      // Extrair Elenco Principal (Top 4)
      const cast = (data.credits?.cast || []).slice(0, 4).map((actor: any) => actor.name);

      // Extrair Trailer do YouTube
      const videos = data.videos?.results || [];
      const trailer = videos.find((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
      const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined;

      // Extrair Classificação Indicativa (Brasil / US)
      let certification = 'Livre';
      const releaseDates = data.release_dates?.results || [];
      const brRelease = releaseDates.find((r: any) => r.iso_3166_1 === 'BR');
      if (brRelease && brRelease.release_dates?.[0]?.certification) {
        certification = brRelease.release_dates[0].certification;
      } else if (data.content_ratings?.results) {
        const brRating = data.content_ratings.results.find((r: any) => r.iso_3166_1 === 'BR');
        if (brRating) certification = brRating.rating;
      }

      const result: TMDBDetailExtra = {
        runtime: data.runtime || data.episode_run_time?.[0],
        numberOfEpisodes: data.number_of_episodes,
        status: data.status === 'Ended' ? 'Finalizado' : data.status === 'Returning Series' ? 'Em lançamento' : data.status,
        director,
        cast,
        trailerUrl,
        certification: certification || 'Livre'
      };

      sessionStorage.setItem(cacheKey, JSON.stringify(result));
      return result;
    } catch {
      return null;
    }
  }
};