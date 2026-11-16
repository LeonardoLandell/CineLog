import type { MediaItem, MediaType } from '../types/types';

export type ThemeMode = 'black' | 'day';

interface StoreState {
  theme: ThemeMode;
  discoveryCategory: MediaType;
  modalItem: MediaItem | null;
}

class Store {
  private state: StoreState = {
    // Lê o tema salvo no navegador ou assume 'black' como padrão
    theme: (localStorage.getItem('cinelog_theme') as ThemeMode) || 'black',
    discoveryCategory: 'movie',
    modalItem: null,
  };

  private listeners: Record<string, Function[]> = {};

  getState(): StoreState {
    return this.state;
  }

  toggleTheme() {
    const next = this.state.theme === 'black' ? 'day' : 'black';

    // Aplica transição fluida nativa se o navegador suportar
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        this.state.theme = next;
        localStorage.setItem('cinelog_theme', next);
        this.emit('theme:changed', next);
      });
    } else {
      // Fallback para navegadores sem suporte
      this.state.theme = next;
      localStorage.setItem('cinelog_theme', next);
      this.emit('theme:changed', next);
    }
  }

  setDiscoveryCategory(category: MediaType) {
    this.state.discoveryCategory = category;
    this.emit('category:changed', category);
  }

  openModal(item: MediaItem) {
    this.state.modalItem = item;
    this.emit('modal:opened', item);
  }

  closeModal() {
    this.state.modalItem = null;
    this.emit('modal:closed', null);
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }
}

// Única exportação da instância no arquivo todo
export const store = new Store();