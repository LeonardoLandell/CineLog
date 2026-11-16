import { store } from '../core/store';
import { storage } from '../core/storage';
import { initLoginModal } from './loginModal';

interface NavbarCallbacks {
  onSearch: (query: string) => void;
  onProfileClick: () => void;
  onAuthStateChange: () => void;
}

export function createNavbar({ onSearch, onProfileClick, onAuthStateChange }: NavbarCallbacks): HTMLElement {
  const nav = document.createElement('header');
  nav.className = 'navbar';

  let searchTimeout: number;

  function updateMarkup() {
    const { theme } = store.getState();
    const loggedIn = storage.isLoggedIn();
    const user = storage.getUser();

    nav.innerHTML = `
      <div class="nav-left">
        <a href="#" class="brand-logo" id="logo-home" aria-label="CineLog Início">
          <span class="brand-dot"></span>
          CINELOG
        </a>
        <nav class="nav-links">
          <a href="#sec-filmes">Filmes</a>
          <a href="#sec-series">Séries</a>
          <a href="#sec-animes">Animes</a>
        </nav>
      </div>

      <div class="nav-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="search" 
          id="global-search-input" 
          placeholder="Buscar filmes, séries ou animes..." 
          aria-label="Buscar títulos no catálogo"
          autocomplete="off"
        />
      </div>

      <div class="nav-right">
        <button class="icon-btn" id="theme-toggle" aria-label="Alternar entre tema escuro e claro" title="Alternar Tema">
          ${theme === 'black' ? '☀️ Day' : '🌙 Black'}
        </button>

        ${loggedIn ? `
          <button class="profile-btn" id="profile-btn" aria-label="Abrir perfil de ${user.name}" title="Perfil: ${user.name} (@${user.username})">
            ${user.avatar}
          </button>
          <button class="icon-btn" id="logout-btn" aria-label="Encerrar sessão demo" title="Encerrar Sessão Demo" style="font-size: 0.75rem; padding: 0 0.6rem;">
            Sair
          </button>
        ` : `
          <button class="icon-btn" id="login-trigger-btn" aria-label="Entrar no modo demonstração" style="background: var(--accent); color: #fff; border: none;">
            Entrar
          </button>
        `}
      </div>
    `;

    // Eventos de Busca
    const searchInput = nav.querySelector('#global-search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value.trim();
      clearTimeout(searchTimeout);
      searchTimeout = window.setTimeout(() => {
        onSearch(value);
      }, 400);
    });

    nav.querySelector('#logo-home')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (searchInput) searchInput.value = '';
      onSearch('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Tema
    nav.querySelector('#theme-toggle')?.addEventListener('click', () => {
      store.toggleTheme();
    });

    // Auth Actions
    nav.querySelector('#login-trigger-btn')?.addEventListener('click', () => {
      const loginModal = initLoginModal({
        onSuccess: () => {
          updateMarkup();
          onAuthStateChange();
        }
      });
      document.body.appendChild(loginModal);
    });

    nav.querySelector('#logout-btn')?.addEventListener('click', () => {
      storage.logout();
      updateMarkup();
      onAuthStateChange();
    });

    nav.querySelector('#profile-btn')?.addEventListener('click', onProfileClick);
  }

  updateMarkup();
  store.on('theme:changed', () => updateMarkup());

  return nav;
}