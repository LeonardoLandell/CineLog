import { storage } from '../core/storage';

interface LoginModalCallbacks {
  onSuccess: () => void;
}

export function initLoginModal({ onSuccess }: LoginModalCallbacks): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 3000;
    background: rgba(0, 0, 0, 0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    opacity: 0;
    transition: opacity 0.25s ease;
  `;

  overlay.innerHTML = `
    <div style="
      position: relative;
      width: 100%;
      max-width: 440px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 18px;
      padding: 2.25rem;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    ">
      <!-- Botão de Fechar -->
      <button id="login-close-btn" aria-label="Fechar modal" style="
        position: absolute;
        top: 1.25rem;
        right: 1.25rem;
        background: var(--bg-primary);
        border: 1px solid var(--border-subtle);
        color: var(--text-primary);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.9rem;
        transition: border-color 0.2s, background 0.2s;
      ">✕</button>

      <div style="text-align: center; display: flex; flex-direction: column; gap: 0.5rem;">
        <div style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.25rem;">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px var(--accent);"></span>
          <h2 style="font-size: 1.5rem; font-weight: 900; letter-spacing: 0.1em; color: var(--text-primary); margin: 0;">CINELOG</h2>
        </div>
        <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0;">
          Acesse o modo demonstração da v1.0.0 para testar a Watchlist e o diário de notas.
        </p>
      </div>

      <form id="login-form" style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">Seu Nome / Apelido</label>
          <input 
            type="text" 
            id="login-name" 
            placeholder="Ex: Recrutador Tech" 
            value="Recrutador Convidado"
            required
            style="
              background: var(--bg-primary);
              border: 1px solid var(--border-subtle);
              color: var(--text-primary);
              padding: 0.75rem 1rem;
              border-radius: 10px;
              font-size: 0.9rem;
              outline: none;
              transition: border-color 0.2s;
            "
          />
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">Nome de Usuário (@)</label>
          <input 
            type="text" 
            id="login-username" 
            placeholder="Ex: recrutador.guest" 
            value="recrutador.tech"
            required
            style="
              background: var(--bg-primary);
              border: 1px solid var(--border-subtle);
              color: var(--text-primary);
              padding: 0.75rem 1rem;
              border-radius: 10px;
              font-size: 0.9rem;
              outline: none;
              transition: border-color 0.2s;
            "
          />
        </div>

        <button type="submit" class="icon-btn" style="
          width: 100%;
          justify-content: center;
          padding: 0.85rem;
          background: var(--accent);
          color: #fff;
          border: none;
          font-weight: 700;
          margin-top: 0.5rem;
          border-radius: 10px;
        ">
          Entrar na Demo (v1.0.0)
        </button>
      </form>
    </div>
  `;

  setTimeout(() => {
    overlay.style.opacity = '1';
  }, 10);

  // Ação do botão de fechar (✕)
  const closeBtn = overlay.querySelector('#login-close-btn');
  closeBtn?.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 250);
  });

  // Ação ao clicar fora do card (no overlay escuro)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 250);
    }
  });

  const form = overlay.querySelector('#login-form') as HTMLFormElement;
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = overlay.querySelector('#login-name') as HTMLInputElement;
    const usernameInput = overlay.querySelector('#login-username') as HTMLInputElement;

    storage.loginDemo(nameInput.value, usernameInput.value);

    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      onSuccess();
    }, 250);
  });

  return overlay;
}