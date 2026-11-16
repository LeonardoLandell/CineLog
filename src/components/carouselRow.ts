import type { MediaItem } from '../types/types';
import { createMediaCard } from './mediaCard';

export function createCarouselRow(title: string, items: MediaItem[]): HTMLElement {
  const section = document.createElement('section');
  section.className = 'carousel-section'; // Aplica a camada de 30%

  section.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.15rem;">
      <span style="width: 4px; height: 18px; border-radius: 2px; background: var(--accent);"></span>
      <h3 style="font-size: 1.15rem; font-weight: 700; letter-spacing: 0.03em; color: var(--text-primary); margin: 0;">${title}</h3>
    </div>
    <div class="carousel-track" style="display: flex; gap: 1.1rem; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 0.4rem; scrollbar-width: none;">
    </div>
  `;

  const track = section.querySelector('.carousel-track') as HTMLDivElement;
  
  if (items.length === 0) {
    track.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-secondary);">Nenhum item encontrado nesta categoria.</p>`;
  } else {
    // Limita a 12 itens por carrossel para aliviar a Main Thread e otimizar a pontuação Mobile
    items.slice(0, 12).forEach((item, index) => {
      const isPriority = index < 4;
      track.appendChild(createMediaCard(item, isPriority));
    });
  }

  return section;
}