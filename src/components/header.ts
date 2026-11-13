export function renderHeader(watchlistCount: number): string {
  return `
    <header class="navbar">
      <a href="/" class="logo" data-link>CINE<span>LOG</span></a>
      
      <div class="search-box">
        <input type="text" id="search-input" placeholder="Buscar filmes, séries ou animes..." />
      </div>

      <nav style="display: flex; align-items: center; gap: 1rem;">
        <ul class="nav-links" style="display: flex; gap: 1rem; align-items: center;">
          <li><button data-link href="/">Catálogo</button></li>
          <li><button data-link href="/watchlist">Watchlist (<span id="watchlist-count">${watchlistCount}</span>)</button></li>
        </ul>
        <button id="theme-toggle-btn" class="btn-watchlist" style="width: auto; padding: 0.4rem 0.8rem;" title="Alternar Tema">
          🌓
        </button>
      </nav>
    </header>
  `;
}