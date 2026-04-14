/**
 * Schema Prefetch Utility
 * 
 * Prefetches commonly used schemas on app startup to improve performance
 */

import { prefetchSchemas } from '@framework/components/form/utils/schemaLoader';

/**
 * List of entities to prefetch on app startup
 * Add entities that are frequently accessed
 */
const ENTITIES_TO_PREFETCH = [
  'contact',
  'device',
  'location',
  'meter',
  'meter_reading',
  'user',
  'tenant',
];

/**
 * Prefetch schemas on app startup
 * Call this in your main App component or index file
 * 
 * @returns Promise that resolves when prefetch is complete
 */
export async function prefetchAppSchemas(): Promise<void> {
  try {
    const t0 = performance.now();
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

    console.log(`[SchemaPrefetch] Starting — ${ENTITIES_TO_PREFETCH.length} entities in parallel`);
    await prefetchSchemas(ENTITIES_TO_PREFETCH, { baseUrl: apiUrl });
    console.log(`[SchemaPrefetch] ✅ Done in ${(performance.now() - t0).toFixed(0)}ms`);
  } catch (error) {
    console.error('[SchemaPrefetch] Failed:', error);
  }
}

/**
 * Prefetch schemas for a specific feature
 * Useful for lazy-loaded routes
 * 
 * @param entityNames - Array of entity names to prefetch
 */
export async function prefetchFeatureSchemas(entityNames: string[]): Promise<void> {
  try {
    await prefetchSchemas(entityNames);
  } catch (error) {
    console.error('[Schema Prefetch] Failed to prefetch feature schemas:', error);
  }
}
