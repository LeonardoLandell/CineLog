export function createFooter(): HTMLElement {
  const footer = document.createElement('footer');
  footer.style.cssText = `
    margin-top: 3rem;
    padding: 2rem 3vw;
    background: var(--bg-surface);
    border-top: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    font-size: 0.82rem;
  `;

  footer.innerHTML = `
    <div style="
      max-width: 1680px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    ">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.5rem;">
        <div style="max-width: 680px; display: flex; flex-direction: column; gap: 0.45rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent);"></span>
            <strong style="color: var(--text-primary); letter-spacing: 0.08em; font-size: 0.9rem;">CINELOG • v1.0.0</strong>
          </div>
          <p style="line-height: 1.55; margin: 0;">
            <strong>Aviso Legal e Uso Comunitário:</strong> Este aplicativo é um projeto de portfólio desenvolvido exclusivamente para fins educacionais, demonstração técnica e uso gratuito pela comunidade, <strong>sem qualquer fim lucrativo ou comercial</strong>. Nenhum arquivo de vídeo é hospedado ou transmitido por esta plataforma.
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem; max-width: 460px;">
          <strong style="color: var(--text-primary); font-size: 0.85rem;">Créditos e Fontes de Dados</strong>
          <p style="line-height: 1.5; margin: 0;">
            Este produto utiliza a API do <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: none; font-weight: 600;">TMDB (The Movie Database)</a>, mas não é endossado nem certificado pelo TMDB. Metadados complementares de animes são fornecidos pela API aberta <a href="https://jikan.moe/" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: none; font-weight: 600;">Jikan (MyAnimeList)</a>.
          </p>
        </div>
      </div>

      <div style="
        padding-top: 1rem;
        border-top: 1px solid var(--border-subtle);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
        font-size: 0.76rem;
      ">
        <span>Desenvolvido por <strong>Leonardo Landell</strong> • Landell.Studio</span>
        <span>Dados persistidos localmente no navegador (Modo Demo v1.0.0)</span>
      </div>
    </div>
  `;

  return footer;
}