import { ref, computed } from 'vue';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStore {
  [key: string]: CacheItem<any>;
}

export function useCache() {
  const cache = ref<CacheStore>({});

  const set = <T>(key: string, data: T, ttl: number = 5 * 60 * 1000) => {
    cache.value[key] = {
      data,
      timestamp: Date.now(),
      ttl,
    };
  };

  const get = <T>(key: string): T | null => {
    const item = cache.value[key];
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      delete cache.value[key];
      return null;
    }

    return item.data as T;
  };

  const has = (key: string): boolean => {
    const item = cache.value[key];
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      delete cache.value[key];
      return false;
    }

    return true;
  };

  const remove = (key: string) => {
    delete cache.value[key];
  };

  const clear = () => {
    cache.value = {};
  };

  // Периодическая очистка истёкшего кэша
  const cleanupExpired = () => {
    const now = Date.now();
    Object.keys(cache.value).forEach((key) => {
      const item = cache.value[key];
      if (item && now - item.timestamp > item.ttl) {
        delete cache.value[key];
      }
    });
  };

  // Запускаем очистку каждые 5 минут
  setInterval(cleanupExpired, 5 * 60 * 1000);

  return {
    set,
    get,
    has,
    remove,
    clear,
    cleanupExpired,
  };
}

// Глобальный экземпляр кэша
export const globalCache = useCache();
