// Cache Manager for Store Data

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  version: number;
  tags: string[];
}

export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  storage: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
  compression: boolean;
  encryption: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

// Memory cache implementation
class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, hitRate: 0 };
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size--;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number, tags: string[] = []): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        this.stats.size--;
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: 1,
      tags,
    };

    const wasNew = !this.cache.has(key);
    this.cache.set(key, entry);
    
    if (wasNew) {
      this.stats.size++;
    }
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size--;
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
        this.stats.size--;
      }
    }
    return count;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

// Storage cache implementation
class StorageCache {
  private storage: Storage;
  private prefix: string;

  constructor(storage: Storage, prefix = 'cache_') {
    this.storage = storage;
    this.prefix = prefix;
  }

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(this.prefix + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.storage.removeItem(this.prefix + key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  set<T>(key: string, data: T, ttl: number, tags: string[] = []): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        version: 1,
        tags,
      };

      this.storage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Cache set error:', error);
      // Storage might be full, try to clear some space
      this.cleanup();
    }
  }

  delete(key: string): boolean {
    try {
      this.storage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.warn('Cache delete error:', error);
      return false;
    }
  }

  clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => this.storage.removeItem(key));
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(this.prefix)) {
          const item = this.storage.getItem(key);
          if (item) {
            const entry: CacheEntry = JSON.parse(item);
            if (entry.tags.includes(tag)) {
              keysToRemove.push(key);
              count++;
            }
          }
        }
      }
      
      keysToRemove.forEach(key => this.storage.removeItem(key));
    } catch (error) {
      console.warn('Cache invalidate by tag error:', error);
    }
    return count;
  }

  private cleanup(): void {
    // Remove expired entries
    try {
      const keysToRemove: string[] = [];
      const now = Date.now();
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(this.prefix)) {
          const item = this.storage.getItem(key);
          if (item) {
            const entry: CacheEntry = JSON.parse(item);
            if (now - entry.timestamp > entry.ttl) {
              keysToRemove.push(key);
            }
          }
        }
      }
      
      keysToRemove.forEach(key => this.storage.removeItem(key));
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }
}

// Main cache manager
export class CacheManager {
  private memoryCache: MemoryCache;
  private storageCache: StorageCache | null = null;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      storage: 'memory',
      compression: false,
      encryption: false,
      ...config,
    };

    this.memoryCache = new MemoryCache(this.config.maxSize);

    // Initialize storage cache if needed
    if (this.config.storage !== 'memory' && typeof window !== 'undefined') {
      let storage: Storage | null = null;
      
      switch (this.config.storage) {
        case 'localStorage':
          storage = window.localStorage;
          break;
        case 'sessionStorage':
          storage = window.sessionStorage;
          break;
        case 'indexedDB':
          // IndexedDB implementation would go here
          console.warn('IndexedDB cache not implemented yet, falling back to localStorage');
          storage = window.localStorage;
          break;
      }

      if (storage) {
        this.storageCache = new StorageCache(storage);
      }
    }
  }

  get<T>(key: string): T | null {
    // Try memory cache first
    let data = this.memoryCache.get<T>(key);
    
    if (data === null && this.storageCache) {
      // Try storage cache
      data = this.storageCache.get<T>(key);
      
      // If found in storage, promote to memory cache
      if (data !== null) {
        this.memoryCache.set(key, data, this.config.defaultTTL);
      }
    }

    return data;
  }

  set<T>(key: string, data: T, ttl?: number, tags: string[] = []): void {
    const cacheTTL = ttl || this.config.defaultTTL;
    
    // Always set in memory cache
    this.memoryCache.set(key, data, cacheTTL, tags);
    
    // Also set in storage cache if available
    if (this.storageCache) {
      this.storageCache.set(key, data, cacheTTL, tags);
    }
  }

  delete(key: string): boolean {
    let deleted = this.memoryCache.delete(key);
    
    if (this.storageCache) {
      deleted = this.storageCache.delete(key) || deleted;
    }
    
    return deleted;
  }

  clear(): void {
    this.memoryCache.clear();
    
    if (this.storageCache) {
      this.storageCache.clear();
    }
  }

  invalidateByTag(tag: string): number {
    let count = this.memoryCache.invalidateByTag(tag);
    
    if (this.storageCache) {
      count += this.storageCache.invalidateByTag(tag);
    }
    
    return count;
  }

  getStats(): CacheStats {
    return this.memoryCache.getStats();
  }

  // Cache key generators
  generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${prefix}${sortedParams ? `_${sortedParams}` : ''}`;
  }

  // Batch operations
  setMany<T>(entries: Array<{ key: string; data: T; ttl?: number; tags?: string[] }>): void {
    entries.forEach(({ key, data, ttl, tags }) => {
      this.set(key, data, ttl, tags);
    });
  }

  getMany<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    keys.forEach(key => {
      result[key] = this.get<T>(key);
    });
    return result;
  }

  deleteMany(keys: string[]): number {
    let count = 0;
    keys.forEach(key => {
      if (this.delete(key)) count++;
    });
    return count;
  }
}

// Global cache instance
export const globalCache = new CacheManager({
  storage: 'localStorage',
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  maxSize: 500,
});

// Cache decorators and utilities
export const withCache = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyGenerator: (...args: Parameters<T>) => string;
    ttl?: number;
    tags?: string[];
    cache?: CacheManager;
  }
): T => {
  const cache = options.cache || globalCache;
  
  return (async (...args: Parameters<T>) => {
    const key = options.keyGenerator(...args);
    
    // Try to get from cache
    let result = cache.get(key);
    
    if (result === null) {
      // Not in cache, call original function
      result = await fn(...args);
      
      // Store in cache
      cache.set(key, result, options.ttl, options.tags);
    }
    
    return result;
  }) as T;
};

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate entity cache
  invalidateEntity: (entityType: string, id?: string) => {
    if (id) {
      globalCache.invalidateByTag(`${entityType}:${id}`);
    } else {
      globalCache.invalidateByTag(entityType);
    }
  },

  // Invalidate list cache
  invalidateList: (entityType: string) => {
    globalCache.invalidateByTag(`${entityType}:list`);
  },

  // Invalidate user-specific cache
  invalidateUser: (userId: string) => {
    globalCache.invalidateByTag(`user:${userId}`);
  },

  // Invalidate all cache
  invalidateAll: () => {
    globalCache.clear();
  },
};