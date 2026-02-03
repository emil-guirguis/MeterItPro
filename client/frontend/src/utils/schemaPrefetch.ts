/**
 * Schema Prefetch Utility
 * 
 * Prefetches commonly used schemas on app startup to improve performance
 */

import { prefetchSchemas, getAvailableSchemas } from '@framework/components/form/utils/schemaLoader';

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
    console.log('[Schema Prefetch] 🚀 Starting schema prefetch...');
    console.log(`[Schema Prefetch] Prefetching ${ENTITIES_TO_PREFETCH.length} entities:`, ENTITIES_TO_PREFETCH);
    const startTime = Date.now();
    
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    console.log('[Schema Prefetch] API URL:', apiUrl);
    
    // Fetch available schemas dynamically from backend and prefetch them
    let entitiesToFetch = ENTITIES_TO_PREFETCH;
    try {
      const available = await getAvailableSchemas(apiUrl);
      const discovered = available
        .map(s => {
          // endpoint is like "/api/schema/contact" - take last segment
          const parts = (s.endpoint || '').split('/');
          return parts.pop() || s.entityName.toLowerCase();
        })
        .filter(Boolean);
      if (discovered.length > 0) {
        console.log('[Schema Prefetch] Discovered schemas from backend:', discovered);
        entitiesToFetch = Array.from(new Set([...ENTITIES_TO_PREFETCH, ...discovered]));
      }
    } catch (e) {
      console.warn('[Schema Prefetch] Could not fetch available schemas, falling back to static list', e);
    }

    await prefetchSchemas(entitiesToFetch, { baseUrl: apiUrl });
    
    const duration = Date.now() - startTime;
    console.log(`[Schema Prefetch] ✅ Completed in ${duration}ms`);
    console.log(`[Schema Prefetch] Made ${ENTITIES_TO_PREFETCH.length} parallel requests`);
    console.log('[Schema Prefetch] 📋 All schemas are now cached and ready for use');
  } catch (error) {
    console.error('[Schema Prefetch] ❌ Failed to prefetch schemas:', error);
    // Don't throw - app should still work even if prefetch fails
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
