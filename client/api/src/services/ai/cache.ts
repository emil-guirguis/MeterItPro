/**
 * AI-Powered Meter Insights - Cache Utilities
 * Provides caching functionality for AI services
 */

import { CacheEntry } from './types';

/**
 * In-memory cache implementation
 * In production, this should be replaced with Redis
 */
export class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval to remove expired entries
    this.startCleanupInterval();
  }

  /**
   * Sets a value in the cache
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Gets a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Checks if a key exists in the cache
   */
  has(key: string): boolean {
    const entry = this.store.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Deletes a value from the cache
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clears all entries from the cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Gets the size of the cache
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Starts a cleanup interval to remove expired entries
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    // Allow the process to exit even if this interval is running
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Removes expired entries from the cache
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.store.delete(key));
  }

  /**
   * Stops the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

/**
 * Generates a cache key from components
 */
export function generateCacheKey(...components: string[]): string {
  return components.join(':');
}

/**
 * Generates a hash for a search query
 */
export function hashSearchQuery(tenantId: string, query: string): string {
  // Simple hash function - in production, use a proper hash library
  const combined = `${tenantId}:${query}`;
  let hash = 0;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `search:${Math.abs(hash).toString(16)}`;
}

/**
 * Generates a cache key for insights
 */
export function generateInsightsCacheKey(tenantId: string, period: string): string {
  return generateCacheKey('insights', tenantId, period);
}

/**
 * Generates a cache key for embeddings
 */
export function generateEmbeddingsCacheKey(deviceId: string): string {
  return generateCacheKey('embeddings', deviceId);
}

/**
 * Generates a cache key for baseline data
 */
export function generateBaselineCacheKey(deviceId: string): string {
  return generateCacheKey('baseline', deviceId);
}

/**
 * Singleton cache instance
 */
let cacheInstance: Cache | null = null;

/**
 * Gets the singleton cache instance
 */
export function getCache(): Cache {
  if (!cacheInstance) {
    cacheInstance = new Cache();
  }
  return cacheInstance;
}

/**
 * Resets the cache (useful for testing)
 */
export function resetCache(): void {
  if (cacheInstance) {
    cacheInstance.destroy();
    cacheInstance = null;
  }
}