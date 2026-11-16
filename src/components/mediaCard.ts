import type { MediaItem } from '../types/types';
import { IMG_BASE } from '../services/tmdbService';
import { store } from '../core/store';

export function createMediaCard(item: MediaItem, isPriority: boolean = false): HTMLElement {
  const card = document.createElement('div');
  card.className = 'media-card';

  const posterUrl = item.posterPath 
    ? `${IMG_BASE}${item.posterPath}` 
    : 'https://via.placeholder.com/175x262?text=Sem+Poster';

  card.innerHTML = `
    <div class="media-poster-wrapper">
      <img 
        src="${posterUrl}" 
        alt="Pôster de ${item.title}" 
        loading="${isPriority ? 'eager' : 'lazy'}" 
        ${isPriority ? 'fetchpriority="high"' : ''} 
        decoding="async"
        width="150"
        height="225"
      />
      <div class="media-badge">★ ${item.voteAverage}</div>
    </div>
    <div class="media-info">
      <h4 class="media-title" title="${item.title}">${item.title}</h4>
      <span class="media-meta">${item.year} • ${item.type.toUpperCase()}</span>
    </div>
  `;

  card.addEventListener('click', () => {
    store.openModal(item);
  });

  return card;
}