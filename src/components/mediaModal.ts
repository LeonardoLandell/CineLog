import { store } from '../core/store';
import { storage } from '../core/storage';
import type { MediaItem } from '../types/types';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';

interface TMDBDetailExtra {
  runtime?: number;
  numberOfEpisodes?: number;
  status?: string;
  director?: string;
  cast: string[];
  trailerUrl?: string;
  certification?: string;
  backdropFallback?: string;
}

const tmdbDetailsService = {
  async getDetails(type: string, id: number, title: string): Promise<TMDBDetailExtra | null> {
    const cacheKey = `tmdb_full_details_${type}_${id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      let mediaEndpoint = type === 'anime' ? 'tv' : type;
      let targetId = id;

      // 1. Tenta buscar direto pelo ID
      let url = `${TMDB_BASE_URL}/${mediaEndpoint}/${targetId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=credits,videos,release_dates,content_ratings`;
      let res = await fetch(url);

      // 2. Se falhar, busca pelo título no TMDB para encontrar o ID real
      if (!res.ok) {
        const searchRes = await fetch(
          `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(title)}`
        );
        if (searchRes.ok) {
          const searchJson = await searchRes.json();
          const match = searchJson.results?.find((r: any) => r.media_type === 'tv' || r.media_type === 'movie');
          if (match) {
            mediaEndpoint = match.media_type;
            targetId = match.id;
            url = `${TMDB_BASE_URL}/${mediaEndpoint}/${targetId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=credits,videos,release_dates,content_ratings`;
            res = await fetch(url);
          }
        }
      }

      if (!res.ok) return null;
      const data = await res.json();

      // Diretor ou Criador
      const crew = data.credits?.crew || [];
      const directorObj = crew.find((c: any) => c.job === 'Director' || c.job === 'Series Director');
      const director = directorObj ? directorObj.name : (data.created_by?.[0]?.name || undefined);

      // Elenco (Top 4)
      const cast = (data.credits?.cast || []).slice(0, 4).map((actor: any) => actor.name);

      // Trailer oficial do YouTube
      const videos = data.videos?.results || [];
      const trailer = videos.find((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
      const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined;

      // Classificação Indicativa
      let certification = 'Livre';
      const releaseDates = data.release_dates?.results || [];
      const brRelease = releaseDates.find((r: any) => r.iso_3166_1 === 'BR');
      if (brRelease && brRelease.release_dates?.[0]?.certification) {
        certification = brRelease.release_dates[0].certification;
      } else if (data.content_ratings?.results) {
        const brRating = data.content_ratings.results.find((r: any) => r.iso_3166_1 === 'BR');
        if (brRating && brRating.rating) certification = brRating.rating;
      }

      // Imagem de fundo caso o card original não tenha trazido
      const backdropFallback = data.backdrop_path
        ? `${TMDB_IMG_BASE}${data.backdrop_path}`
        : data.poster_path
          ? `${TMDB_IMG_BASE}${data.poster_path}`
          : undefined;

      const result: TMDBDetailExtra = {
        runtime: data.runtime || data.episode_run_time?.[0],
        numberOfEpisodes: data.number_of_episodes,
        status: data.status === 'Ended' ? 'Finalizado' : data.status === 'Returning Series' ? 'Em lançamento' : data.status,
        director,
        cast,
        trailerUrl,
        certification: certification || 'Livre',
        backdropFallback
      };

      sessionStorage.setItem(cacheKey, JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('Erro ao buscar detalhes no TMDB:', error);
      return null;
    }
  }
};

export function initMediaModal(): HTMLElement {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: rgba(0, 0, 0, 0.78);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: none;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    opacity: 0;
    transition: opacity 0.25s ease;
  `;

  async function renderContent() {
    const item: MediaItem | null = store.getState().modalItem;
    if (!item) {
      modalOverlay.style.opacity = '0';
      setTimeout(() => {
        modalOverlay.style.display = 'none';
      }, 250);
      return;
    }

    const itemId = item.tmdbId;
    const isSaved = storage.isInWatchlist(itemId);
    const mediaReviews = storage.getReviewsForMedia(itemId);

    // Garante URL completa da imagem
    const rawAny = item as any;
    let rawPath = item.backdropPath || item.posterPath || rawAny.backdrop_path || rawAny.poster_path || '';
    if (rawPath && !rawPath.startsWith('http') && !rawPath.startsWith('data:')) {
      rawPath = `${TMDB_IMG_BASE}${rawPath.startsWith('/') ? '' : '/'}${rawPath}`;
    }

    modalOverlay.style.display = 'flex';
    setTimeout(() => {
      modalOverlay.style.opacity = '1';
    }, 10);

    modalOverlay.innerHTML = `
      <div style="
        position: relative;
        width: 100%;
        max-width: 820px;
        background: var(--bg-surface);
        border: 1px solid var(--border-subtle);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.6);
        display: flex;
        flex-direction: column;
        max-height: 90vh;
      ">
        <div id="modal-banner-container" style="position: relative; width: 100%; height: 240px; background: var(--bg-primary); overflow: hidden; flex-shrink: 0;">
          ${rawPath ? `<img id="modal-banner-img" src="${rawPath}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85;" />` : ''}
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, var(--bg-surface) 0%, transparent 85%);"></div>
          
          <button id="modal-close-btn" aria-label="Fechar modal" style="
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: var(--bg-glass);
            backdrop-filter: blur(8px);
            border: 1px solid var(--border-subtle);
            color: var(--text-primary);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            z-index: 10;
          ">✕</button>
        </div>

        <div style="padding: 1.75rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <span style="background: var(--accent); color: #fff; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">
              ★ ${item.voteAverage} Média
            </span>
            <span style="color: var(--text-secondary); font-size: 0.85rem; font-weight: 600;">
              ${item.year} • ${item.type.toUpperCase()}
            </span>
          </div>

          <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1.2;">
            ${item.title}
          </h2>

          <p style="color: var(--text-secondary); font-size: 0.92rem; line-height: 1.6; margin: 0;">
            ${item.overview}
          </p>

          <div id="tmdb-extra-container"></div>

          <div style="display: flex; gap: 1rem; padding-top: 0.5rem;">
            <button id="modal-watchlist-btn" class="icon-btn" aria-label="Watchlist" style="flex: 1; justify-content: center; padding: 0.75rem; background: ${isSaved ? 'var(--bg-surface-elevated)' : 'var(--accent)'}; color: ${isSaved ? 'var(--text-primary)' : '#fff'}; border: ${isSaved ? '1px solid var(--border-subtle)' : 'none'};">
              ${isSaved ? '✓ Na sua Watchlist' : '+ Adicionar à Watchlist'}
            </button>
          </div>

          <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 0.5rem 0;" />

          <div>
            <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.85rem;">
              Notas e Comentários (${mediaReviews.length})
            </h3>

            <form id="review-form" style="display: flex; flex-direction: column; gap: 0.75rem; background: var(--bg-primary); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-subtle);">
              <div style="display: flex; gap: 1rem; align-items: center;">
                <label style="font-size: 0.82rem; color: var(--text-secondary); font-weight: 600;">Sua Nota:</label>
                <select id="review-rating" aria-label="Nota" style="background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border-subtle); padding: 4px 8px; border-radius: 6px;">
                  <option value="5">★★★★★ (5/5)</option>
                  <option value="4">★★★★☆ (4/5)</option>
                  <option value="3">★★★☆☆ (3/5)</option>
                  <option value="2">★★☆☆☆ (2/5)</option>
                  <option value="1">★☆☆☆☆ (1/5)</option>
                </select>
                
                <select id="review-visibility" aria-label="Visibilidade" style="background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border-subtle); padding: 4px 8px; border-radius: 6px; margin-left: auto;">
                  <option value="public">Pública</option>
                  <option value="private">Privada</option>
                </select>
              </div>

              <textarea id="review-text" placeholder="Escreva sua opinião..." rows="2" aria-label="Comentário" style="background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border-subtle); padding: 0.75rem; border-radius: 8px; resize: vertical;"></textarea>
              
              <button type="submit" class="icon-btn" style="align-self: flex-end; background: var(--accent); color: #fff; border: none; padding: 0.5rem 1.25rem;">
                Publicar Avaliação
              </button>
            </form>

            <div id="reviews-list" style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
              ${mediaReviews.map(r => `
                <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); padding: 0.85rem; border-radius: 8px; display: flex; flex-direction: column; gap: 0.35rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${r.user}</span>
                    <span style="font-size: 0.75rem; color: var(--accent); font-weight: 700;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">${r.comment}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Eventos básicos do modal
    modalOverlay.querySelector('#modal-close-btn')?.addEventListener('click', () => store.closeModal());
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) store.closeModal();
    });

    modalOverlay.querySelector('#modal-watchlist-btn')?.addEventListener('click', () => {
      if (storage.isInWatchlist(itemId)) {
        storage.removeFromWatchlist(itemId);
      } else {
        storage.addToWatchlist({
          mediaId: itemId,
          title: item.title,
          type: item.type,
          posterPath: rawPath || '',
          year: item.year,
          voteAverage: item.voteAverage
        });
      }
      renderContent();
    });

    const form = modalOverlay.querySelector('#review-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const commentInput = modalOverlay.querySelector('#review-text') as HTMLTextAreaElement;
      const ratingSelect = modalOverlay.querySelector('#review-rating') as HTMLSelectElement;
      const visibilitySelect = modalOverlay.querySelector('#review-visibility') as HTMLSelectElement;

      const text = commentInput.value.trim();
      if (!text) return;

      storage.addReview({
        mediaId: itemId,
        mediaTitle: item.title,
        mediaType: item.type,
        posterPath: rawPath || '',
        rating: Number(ratingSelect.value),
        comment: text,
        listType: visibilitySelect.value as 'public' | 'private'
      });

      renderContent();
    });

    // Busca detalhes completos do TMDB
    const extraContainer = modalOverlay.querySelector('#tmdb-extra-container');
    if (extraContainer) {
      extraContainer.innerHTML = `<span style="font-size: 0.78rem; color: var(--text-secondary);">Carregando ficha técnica...</span>`;
      
      const details = await tmdbDetailsService.getDetails(item.type, item.tmdbId, item.title);
      
      if (details && modalOverlay.contains(extraContainer)) {
        if (!rawPath && details.backdropFallback) {
          rawPath = details.backdropFallback;
          const bannerImg = modalOverlay.querySelector('#modal-banner-img') as HTMLImageElement;
          if (bannerImg) {
            bannerImg.src = rawPath;
          } else {
            const bannerContainer = modalOverlay.querySelector('#modal-banner-container');
            if (bannerContainer) {
              bannerContainer.insertAdjacentHTML(
                'afterbegin',
                `<img id="modal-banner-img" src="${rawPath}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85;" />`
              );
            }
          }
        }

        extraContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 0.55rem; background: var(--bg-primary); border: 1px solid var(--border-subtle); padding: 0.9rem 1rem; border-radius: 10px; font-size: 0.82rem;">
            <div style="display: flex; flex-wrap: wrap; gap: 0.85rem; align-items: center;">
              <span style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); padding: 2px 7px; border-radius: 5px; font-weight: 700; color: var(--text-primary);">
                ${details.certification}
              </span>
              ${details.runtime ? `<span style="color: var(--text-secondary);">• Duração: <strong style="color: var(--text-primary);">${details.runtime} min</strong></span>` : ''}
              ${details.numberOfEpisodes ? `<span style="color: var(--text-secondary);">• Episódios: <strong style="color: var(--text-primary);">${details.numberOfEpisodes}</strong></span>` : ''}
              ${details.status ? `<span style="color: var(--text-secondary);">• Status: <strong style="color: var(--text-primary);">${details.status}</strong></span>` : ''}
            </div>

            ${details.director ? `<div style="color: var(--text-secondary);">Direção / Criação: <strong style="color: var(--text-primary);">${details.director}</strong></div>` : ''}
            
            ${details.cast.length > 0 ? `<div style="color: var(--text-secondary);">Elenco: <span style="color: var(--text-primary);">${details.cast.join(', ')}</span></div>` : ''}
            
            ${details.trailerUrl ? `
              <div style="margin-top: 0.4rem;">
                <button id="open-trailer-btn" style="display: inline-flex; align-items: center; gap: 0.4rem; background: var(--accent); color: #fff; padding: 0.45rem 0.9rem; border-radius: 6px; font-weight: 700; border: none; cursor: pointer; font-size: 0.8rem;">
                  ▶ Assistir Trailer
                </button>
              </div>
            ` : ''}
          </div>
        `;

        // Evento para abrir o trailer embutido no site (via iframe)
        const openTrailerBtn = modalOverlay.querySelector('#open-trailer-btn');
        openTrailerBtn?.addEventListener('click', () => {
          const videoKey = details.trailerUrl?.split('v=')[1];
          if (!videoKey) return;

          const bannerContainer = modalOverlay.querySelector('#modal-banner-container');
          if (bannerContainer) {
            bannerContainer.innerHTML = `
              <iframe 
                src="https://www.youtube.com/embed/${videoKey}?autoplay=1" 
                title="Trailer Oficial" 
                style="width: 100%; height: 100%; border: none;" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
              </iframe>
              <button id="close-trailer-btn" aria-label="Fechar trailer" style="
                position: absolute;
                top: 1rem;
                left: 1rem;
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(8px);
                border: 1px solid var(--border-subtle);
                color: #fff;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                z-index: 20;
              ">✕</button>
            `;

            modalOverlay.querySelector('#close-trailer-btn')?.addEventListener('click', () => {
              renderContent(); // Restaura a capa e o banner original
            });
          }
        });

      } else if (modalOverlay.contains(extraContainer)) {
        extraContainer.innerHTML = '';
      }
    }
  }

  store.on('modal:opened', () => renderContent());
  store.on('modal:closed', () => renderContent());

  return modalOverlay;
}