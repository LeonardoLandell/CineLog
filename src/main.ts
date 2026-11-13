import './style.css';
import { router } from './router';
import { WatchlistClient } from './services/watchlistClient';
import { MediaService } from './services/mediaService';
import { renderHome } from './views/homeView';
import { renderWatchlist } from './views/watchlistView';
import { createMediaCard } from './components/card';
import { renderHeader } from './components/header';
import { MediaItem, WatchlistEntry, MediaStatus } from './types';

const headerContainer = document.getElementById('header-container') as HTMLElement;
const appEl = document.getElementById('app') as HTMLElement;

let watchlistCache: WatchlistEntry[] = [];
let watchlistUids = new Set<string>();

// --- GERENCIAMENTO DE TEMA ---
function initTheme() {
  const savedTheme = localStorage.getItem('cinelog_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'day' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('cinelog_theme', next);
}

async function updateHeader() {
  headerContainer.innerHTML = renderHeader(watchlistCache.length);
  
  // Event listener para o botão de tema
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.onclick = toggleTheme;
  }

  // Reatribuir listener de busca após renderizar o header
  setupSearchListener();
}

async function syncWatchlistState() {
  try {
    watchlistCache = await WatchlistClient.getAll();
    watchlistUids = new Set(watchlistCache.map(i => i.uid));
    await updateHeader();
  } catch (err) {
    console.error('Erro ao sincronizar watchlist:', err);
  }
}

// Configuração das rotas
router.add('/', async () => {
  await syncWatchlistState();
  renderHome(appEl, watchlistUids, handleToggleWatchlist);
});

router.add('/watchlist', async () => {
  await syncWatchlistState();
  renderWatchlist(
    appEl, 
    watchlistCache, 
    handleUpdateStatus, 
    handleUpdateRating, 
    handleRemoveFromWatchlist
  );
});

async function handleToggleWatchlist(item: MediaItem) {
  try {
    if (watchlistUids.has(item.uid)) {
      await WatchlistClient.remove(item.uid);
    } else {
      await WatchlistClient.add(item.uid);
    }
    await syncWatchlistState();
    router.handleRoute();
  } catch (err) {
    alert('Erro ao atualizar watchlist no servidor.');
  }
}

async function handleUpdateStatus(uid: string, status: MediaStatus) {
  try {
    await WatchlistClient.update(uid, { status });
    await syncWatchlistState();
  } catch {
    alert('Erro ao atualizar status.');
  }
}

async function handleUpdateRating(uid: string, rating: number | null) {
  if (rating !== null && (rating < 1 || rating > 10)) {
    alert('A nota pessoal deve estar entre 1 e 10.');
    return;
  }
  try {
    await WatchlistClient.update(uid, { personal_rating: rating });
    await syncWatchlistState();
  } catch {
    alert('Erro ao salvar avaliação.');
  }
}

async function handleRemoveFromWatchlist(uid: string) {
  try {
    await WatchlistClient.remove(uid);
    await syncWatchlistState();
    router.handleRoute();
  } catch {
    alert('Erro ao remover item.');
  }
}

// Delegação de cliques para os botões de Watchlist nos cards
appEl.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('[data-action="toggle-watchlist"]');
  if (!btn) return;
  const itemJson = (btn as HTMLElement).dataset.item;
  if (itemJson) {
    const item: MediaItem = JSON.parse(itemJson);
    handleToggleWatchlist(item);
  }
});

// Pesquisa dinâmica com debounce
function setupSearchListener() {
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  if (!searchInput) return;

  let searchTimeout: any;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const q = (e.target as HTMLInputElement).value.trim();

    searchTimeout = setTimeout(async () => {
      if (!q) {
        router.navigateTo('/');
        return;
      }

      appEl.innerHTML = `<h2 class="section-title" style="margin-bottom:1.25rem">Buscando por "${q}"...</h2>`;
      try {
        const results = await MediaService.searchAll(q);
        if (results.length === 0) {
          appEl.innerHTML = `<div class="feedback-box">Nenhum resultado encontrado para "${q}".</div>`;
          return;
        }
        appEl.innerHTML = `
          <h2 class="section-title" style="margin-bottom:1.25rem">Resultados para "${q}"</h2>
          <div class="media-grid">${results.map(item => createMediaCard(item, watchlistUids.has(item.uid))).join('')}</div>
        `;
      } catch {
        appEl.innerHTML = `<div class="feedback-box">Erro ao realizar pesquisa.</div>`;
      }
    }, 400);
  });
}

// Inicialização
initTheme();
syncWatchlistState().then(() => {
  router.init();
});