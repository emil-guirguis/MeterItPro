/**
 * Sync Orchestration Helpers
 * 
 * Provides reusable patterns and utilities for orchestrating entity synchronization.
 * Eliminates code duplication across different sync operations.
 */

import { Pool } from 'pg';
import {
  getRemoteEntities,
  getLocalEntities,
  upsertEntity,
  deleteEntity,
  buildCompositeKeyString,
} from './sync-functions.js';

/**
 * Result of a sync operation
 */
export interface SyncOperationResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  skipped?: number;
  error?: string;
  timestamp: Date;
}

/**
 * Configuration for a sync operation
 */
export interface SyncOperationConfig {
  entityType: string;
  remotePool: Pool;
  syncPool: Pool;
  tenantId: number;
  useCompositeKey?: boolean;
  keyColumns?: string[];
  changeDetector?: (remote: any, local: any) => boolean;
  validator?: (entity: any, syncPool: Pool) => Promise<boolean>;
}

/**
 * Orchestrate a complete entity sync operation
 * 
 * Handles the full sync lifecycle:
 * 1. Query remote and local entities
 * 2. Identify inserts, updates, and deletes
 * 3. Execute operations with optional validation
 * 4. Track and return results
 * 
 * @param config - Sync operation configuration
 * @returns SyncOperationResult with operation counts
 */
export async function orchestrateSync(config: SyncOperationConfig): Promise<SyncOperationResult> {
  const startTime = Date.now();

  try {
    console.log(`\n🔄 [Sync] Starting ${config.entityType} synchronization...`);

    // Validate tenant context before any remote query
    if (config.tenantId === undefined || config.tenantId === null) {
      throw new Error(`[Sync] tenantId is required for ${config.entityType} sync but was not provided.`);
    }

    // Get remote entities
    console.log(`🔍 [Sync] Querying remote database for ${config.entityType} entities...`);
    const remoteEntities = await getRemoteEntities(config.remotePool, config.entityType, config.tenantId, 'orchestrateSync>getRemoteEntities');
    console.log(`📋 [Sync] Found ${remoteEntities.length} remote ${config.entityType} record(s)`);

    // Get local entities
    console.log(`🔍 [Sync] Querying local database for ${config.entityType} entities...`);
    const localEntities = await getLocalEntities(config.syncPool, config.entityType);
    console.log(`📋 [Sync] Found ${localEntities.length} local ${config.entityType} record(s)`);

    // Track changes
    let insertedCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;
    let skippedCount = 0;

    // Create maps for efficient lookup
    const remoteMap = createEntityMap(remoteEntities, config.useCompositeKey, config.keyColumns);
    const localMap = createEntityMap(localEntities, config.useCompositeKey, config.keyColumns);

    // Process deletes
    console.log(`\n➖ [Sync] Processing ${config.entityType} entities to delete...`);
    for (const localEntity of localEntities) {
      const key = getEntityKey(localEntity, config.useCompositeKey, config.keyColumns);
      if (!remoteMap.has(key)) {
        try {
          const deleteKey = config.useCompositeKey && config.keyColumns
            ? config.keyColumns.map((col) => localEntity[col])
            : localEntity.id;

          await deleteEntity(config.syncPool, config.entityType, deleteKey);
          deletedCount++;
          console.log(`   ✅ Deleted ${config.entityType}: ${key}`);
        } catch (error) {
          console.error(`   ❌ Failed to delete ${config.entityType} ${key}:`, error);
        }
      }
    }

    // Process inserts
    console.log(`\n➕ [Sync] Processing new ${config.entityType} entities...`);
    for (const remoteEntity of remoteEntities) {
      const key = getEntityKey(remoteEntity, config.useCompositeKey, config.keyColumns);
      if (!localMap.has(key)) {
        try {
          // Validate entity if validator provided
          if (config.validator) {
            const isValid = await config.validator(remoteEntity, config.syncPool);
            if (!isValid) {
              console.warn(`   ⚠️  Skipping ${config.entityType}: validation failed for ${key}`);
              skippedCount++;
              continue;
            }
          }

          await upsertEntity(config.syncPool, config.entityType, remoteEntity, 'orchestrateSync>upsertEntity');
          insertedCount++;
          console.log(`   ✅ Inserted ${config.entityType}: ${key}`);
        } catch (error) {
          console.error(`   ❌ Failed to insert ${config.entityType} ${key}:`, error);
        }
      }
    }

    // Process updates
    console.log(`\n🔄 [Sync] Processing ${config.entityType} updates...`);
    for (const remoteEntity of remoteEntities) {
      const key = getEntityKey(remoteEntity, config.useCompositeKey, config.keyColumns);
      const localEntity = localMap.get(key);

      if (localEntity) {
        // Check if entity has changed
        const hasChanges = config.changeDetector
          ? config.changeDetector(remoteEntity, localEntity)
          : defaultChangeDetector(remoteEntity, localEntity);

        if (hasChanges) {
          try {
            // Validate entity if validator provided
            if (config.validator) {
              const isValid = await config.validator(remoteEntity, config.syncPool);
              if (!isValid) {
                console.warn(`   ⚠️  Skipping ${config.entityType} update: validation failed for ${key}`);
                skippedCount++;
                continue;
              }
            }

            await upsertEntity(config.syncPool, config.entityType, remoteEntity, 'orchestrateSync>upsertEntity2');
            updatedCount++;
            console.log(`   ✅ Updated ${config.entityType}: ${key}`);
          } catch (error) {
            console.error(`   ❌ Failed to update ${config.entityType} ${key}:`, error);
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    const result: SyncOperationResult = {
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      deleted: deletedCount,
      skipped: skippedCount > 0 ? skippedCount : undefined,
      timestamp: new Date(),
    };

    console.log(`\n✅ [Sync] ${config.entityType} sync completed successfully`);
    console.log(`   Inserted: ${insertedCount}, Updated: ${updatedCount}, Deleted: ${deletedCount}${skippedCount > 0 ? `, Skipped: ${skippedCount}` : ''}`);
    console.log(`   Duration: ${duration}ms\n`);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n❌ [Sync] ${config.entityType} sync failed:`, error);

    return {
      success: false,
      inserted: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
      error: errorMessage,
      timestamp: new Date(),
    };
  }
}

/**
 * Create a map of entities for efficient lookup
 */
function createEntityMap(
  entities: any[],
  useCompositeKey?: boolean,
  keyColumns?: string[]
): Map<string, any> {
  const map = new Map<string, any>();

  for (const entity of entities) {
    const key = getEntityKey(entity, useCompositeKey, keyColumns);
    map.set(key, entity);
  }

  return map;
}

/**
 * Get the key for an entity (single or composite)
 */
function getEntityKey(
  entity: any,
  useCompositeKey?: boolean,
  keyColumns?: string[]
): string {
  if (useCompositeKey && keyColumns) {
    return buildCompositeKeyString(keyColumns, entity);
  }
  return String(entity.id);
}

/**
 * Default change detector - compares all fields except timestamps
 */
function defaultChangeDetector(remote: any, local: any): boolean {
  const excludeFields = ['created_at', 'updated_at', 'id'];

  for (const key in remote) {
    if (!excludeFields.includes(key)) {
      if (remote[key] !== local[key]) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Create a change detector for specific fields
 */
export function createFieldChangeDetector(fields: string[]): (remote: any, local: any) => boolean {
  return (remote: any, local: any) => {
    for (const field of fields) {
      if (remote[field] !== local[field]) {
        return true;
      }
    }
    return false;
  };
}

/**
 * Create a validator that checks if referenced entities exist
 */
export function createReferentialIntegrityValidator(
  references: Array<{ field: string; table: string }>
): (entity: any, syncPool: Pool) => Promise<boolean> {
  return async (entity: any, syncPool: Pool) => {
    for (const ref of references) {
      const entityId = entity[ref.field];
      if (entityId === null || entityId === undefined) {
        continue; // Skip null/undefined references
      }

      try {
        const result = await syncPool.query(
          `SELECT 1 FROM ${ref.table} WHERE ${ref.table}id = $1 LIMIT 1`,
          [entityId]
        );

        if (result.rows.length === 0) {
          console.warn(`   ⚠️  Referenced ${ref.table} (ID: ${entityId}) does not exist`);
          return false;
        }
      } catch (error) {
        console.error(`   ❌ Error validating reference to ${ref.table}:`, error);
        return false;
      }
    }

    return true;
  };
}
