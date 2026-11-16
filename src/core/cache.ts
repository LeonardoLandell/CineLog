interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private storage = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTL = 15 * 60 * 1000; // 15 minutos

  get<T>(key: string): T | null {
    const entry = this.storage.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.storage.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    this.storage.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  clear(): void {
    this.storage.clear();
  }
}

export const cache = new MemoryCache();