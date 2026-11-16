import './style.css';
import { store } from './core/store';
import { tmdbService } from './services/tmdbService';
import { createNavbar } from './components/navbar';
import { createCarouselRow } from './components/carouselRow';
import { createMediaCard } from './components/mediaCard';
import { initMediaModal } from './components/mediaModal';
import { createFooter } from './components/footer';

// 1. Sincroniza o tema inicial e as alterações no HTML raiz
function applyThemeToRoot(theme: string) {
  document.documentElement.setAttribute('data-theme', theme);
}

applyThemeToRoot(store.getState().theme);

store.on('theme:changed', (newTheme: string) => {
  applyThemeToRoot(newTheme);
});

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  const mainContainer = document.createElement('main');
  mainContainer.style.cssText = 'padding: 1.5rem 3vw; max-width: 1680px; margin: 0 auto;';

  async function loadUnifiedHome() {
    mainContainer.innerHTML = `
      <p style="color: var(--text-secondary); text-align: center; padding: 4rem 0;">
        Carregando catálogos...
      </p>
    `;

    try {
      const [
        moviesLatest,
        moviesPopular,
        seriesPopular,
        animesLatest,
        animesPopular,
      ] = await Promise.all([
        tmdbService.getLatest('movie'),
        tmdbService.getPopular('movie'),
        tmdbService.getPopular('tv'),
        tmdbService.getLatest('anime'),
        tmdbService.getPopular('anime'),
      ]);

      mainContainer.innerHTML = '';

      const moviesSec = document.createElement('div');
      moviesSec.id = 'sec-filmes';
      moviesSec.appendChild(createCarouselRow('Filmes em Cartaz & Lançamentos', moviesLatest));
      moviesSec.appendChild(createCarouselRow('Filmes Populares', moviesPopular));
      mainContainer.appendChild(moviesSec);

      const seriesSec = document.createElement('div');
      seriesSec.id = 'sec-series';
      seriesSec.appendChild(createCarouselRow('Séries em Alta', seriesPopular));
      mainContainer.appendChild(seriesSec);

      const animesSec = document.createElement('div');
      seriesSec.id = 'sec-animes';
      animesSec.appendChild(createCarouselRow('Animes Recentes', animesLatest));
      animesSec.appendChild(createCarouselRow('Animes Populares', animesPopular));
      mainContainer.appendChild(animesSec);

    } catch (error) {
      console.error('Erro ao carregar o feed:', error);
      mainContainer.innerHTML = `
        <p style="color: #ef4444; text-align: center; padding: 3rem;">
          Erro ao conectar com o TMDB. Verifique sua chave no arquivo .env.
        </p>
      `;
    }
  }

  async function handleSearch(query: string) {
    if (!query) {
      loadUnifiedHome();
      return;
    }

    mainContainer.innerHTML = `
      <p style="color: var(--text-secondary); padding: 2rem 0;">
        Buscando por "${query}"...
      </p>
    `;

    try {
      const results = await tmdbService.search(query);
      mainContainer.innerHTML = `
        <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--text-primary);">
          Resultados para "${query}" (${results.length})
        </h2>
        <div id="search-grid" class="search-results-grid"></div>
      `;

      const grid = mainContainer.querySelector('#search-grid');
      if (grid) {
        if (results.length === 0) {
          grid.innerHTML = `<p style="color: var(--text-secondary);">Nenhum título encontrado.</p>`;
        } else {
          results.forEach((item) => grid.appendChild(createMediaCard(item)));
        }
      }
    } catch (err) {
      console.error('Erro na busca:', err);
    }
  }

  // 2. Monta a Navbar com os estados de Auth e injeta no app
  const navbar = createNavbar({
    onSearch: handleSearch,
    onProfileClick: () => {
      alert('Drawer de Perfil & Watchlist do usuário logado será conectado no próximo passo!');
    },
    onAuthStateChange: () => {
      loadUnifiedHome();
    },
  });

  app.innerHTML = '';
  app.appendChild(navbar);
  app.appendChild(mainContainer);
  app.appendChild(createFooter()); // <-- Corrigido para executar a função e retornar o HTMLElement

  document.body.appendChild(initMediaModal());

  loadUnifiedHome();
}