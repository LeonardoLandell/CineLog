import type { MediaItem } from '../types/types';
import { createCarouselRow } from '../components/carouselRow';

export interface HomeData {
  trendingMovies: MediaItem[];
  popularMovies: MediaItem[];
  topSeries: MediaItem[];
  topAnimes: MediaItem[];
}

export function renderHomeView(container: HTMLElement, data: HomeData): void {
  // Limpa o contentor principal
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'home-container';
  wrapper.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding-bottom: 3rem;
  `;

  container.appendChild(wrapper);

  // 1. Renderiza APENAS o primeiro carrossel de imediato (Conteúdo Crítico / Acima da Dobra - LCP)
  if (data.trendingMovies && data.trendingMovies.length > 0) {
    wrapper.appendChild(createCarouselRow('Filmes em Cartaz & Lançamentos', data.trendingMovies));
  }

  // 2. Difere os carrosséis restantes para liberar a Main Thread no arranque mobile
  requestAnimationFrame(() => {
    setTimeout(() => {
      if (data.popularMovies && data.popularMovies.length > 0) {
        wrapper.appendChild(createCarouselRow('Filmes Populares', data.popularMovies));
      }
      if (data.topSeries && data.topSeries.length > 0) {
        wrapper.appendChild(createCarouselRow('Séries em Alta', data.topSeries));
      }
      if (data.topAnimes && data.topAnimes.length > 0) {
        wrapper.appendChild(createCarouselRow('Animes Recentes', data.topAnimes));
      }
    }, 50);
  });
}