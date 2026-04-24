/**
 * Generic Sync Functions
 * 
 * Provides reusable sync functions that work with any entity type.
 * These functions eliminate code duplication and make the system extensible for future tables.
 * 
 * Supports:
 * - Single and composite primary keys
 * - Tenant-scoped and non-tenant-scoped entities
 * - Custom query templates for complex entities
 * - Comprehensive logging and error handling
 */

import { Pool } from 'pg';
import { EntityMetadata, ENTITY_METADATA } from '../types/index.js';
import { execQuery } from '../../../../framework/backend/shared/helpers/sql-functions.js';

/**
 * Get entities from the remote database based on entity type
 * 
 * Queries the remote database for all entities of a given type.
 * Applies tenant_id filter if the entity is tenant-scoped.
 * Supports custom query templates for complex entities.
 * 
 * @param remotePool - Connection pool to the remote database
 * @param entityType - Type of entity to query (e.g., 'meter', 'register', 'device_register')
 * @param tenantId - Tenant ID for filtering (required for tenant-scoped entities)
 * @returns Array of entity records from the remote database
 * @throws Error if entity type is not found or query fails
 */
export async function getRemoteEntities(
  remotePool: Pool,
  entityType: string,
  tenantId: number,
  logMessage: string,
): Promise<any[]> {
    console.log(`\n🔍 [Remote Query] Querying remote database for ${entityType} entities with tenant ID: ${tenantId}`);

  try {
    // Get entity metadata
    const metadata = ENTITY_METADATA[entityType];
    if (!metadata) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    // Build query
    let query: string = '';
    let params: any[] = [];

    if (metadata.remoteQuery) {
      // Use custom query template if provided
      query = metadata.remoteQuery;
      if (metadata.tenantFiltered && tenantId) {
        params = [tenantId];
      }
    } else {
      // Build standard query
      const columns = metadata.columns.join(', ');
      query = `SELECT ${columns} FROM ${metadata.tableName}`;

      // Add tenant filter if applicable
      if (metadata.tenantFiltered) {
        if (!tenantId) {
          throw new Error(`Tenant ID is required for tenant-scoped entity: ${entityType}`);
        }
        query += ` WHERE tenant_id = $1`;
        params = [tenantId];
      }
    }

    console.log(`📋 [Remote Query] Query: ${query}`);
    if (params.length > 0) {
      console.log(`📋 [Remote Query] Parameters: ${JSON.stringify(params)}`);
    }

    // Execute query
    const result = await execQuery(remotePool, query, params, logMessage);

    if (result.rows.length > 0) {
      console.log(`📊 [Remote Query] Sample data:`, JSON.stringify(result.rows[0], null, 2));
    }

    return result.rows;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Remote Query] Failed to query remote ${entityType}:`, errorMessage);
    throw new Error(`Failed to query remote database for ${entityType}: ${errorMessage}`);
  }
}

/**
 * Get entities from the local sync database based on entity type
 * 
 * Queries the sync database for all entities of a given type.
 * Optionally filters by primary key for single entity lookup.
 * 
 * @param syncPool - Connection pool to the sync database
 * @param entityType - Type of entity to query (e.g., 'meter', 'register', 'device_register')
 * @param primaryKey - Optional primary key value(s) to filter by (single value or array for composite keys)
 * @returns Array of entity records from the sync database
 * @throws Error if entity type is not found or query fails
 */
export async function getLocalEntities(
  syncPool: Pool,
  entityType: string,
  primaryKey?: any
): Promise<any[]> {
  try {
    // Get entity metadata
    const metadata = ENTITY_METADATA[entityType];
    if (!metadata) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    console.log(`\n🔍 [Local Query] Querying local database for ${entityType} entities`);

    // Build query
    const columns = metadata.columns.join(', ');
    let query = `SELECT ${columns} FROM ${metadata.tableName}`;
    let params: any[] = [];

    // Add WHERE clause if primary key is provided
    if (primaryKey !== undefined) {
      const primaryKeyColumns = Array.isArray(metadata.primaryKey)
        ? metadata.primaryKey
        : [metadata.primaryKey];

      if (Array.isArray(primaryKey)) {
        // Composite key
        const whereConditions = primaryKeyColumns
          .map((col, i) => `${col} = ${i + 1}`)
          .join(' AND ');
        query += ` WHERE ${whereConditions}`;
        params = primaryKey;
      } else {
        // Single key
        query += ` WHERE ${primaryKeyColumns[0]} = $1`;
        params = [primaryKey];
      }

      console.log(`📋 [Local Query] Filtering by primary key:`, JSON.stringify(primaryKey, null, 2));
    }

    console.log(`📋 [Local Query] Query: ${query}`);
    if (params.length > 0) {
      console.log(`📋 [Local Query] Parameters: ${JSON.stringify(params)}`);
    }

    const result = await execQuery(syncPool, query, params, 'sync-functions.ts>getLocalEntities');

    console.log(`✅ [Local Query] Found ${result.rows.length} ${entityType} record(s)`);

    if (result.rows.length > 0) {
      console.log(`📊 [Local Query] Sample data:`, JSON.stringify(result.rows[0], null, 2));
    }

    return result.rows;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Local Query] Failed to query local ${entityType}:`, errorMessage);
    throw new Error(`Failed to query local database for ${entityType}: ${errorMessage}`);
  }
}

/**
 * Upsert an entity into the local sync database
 * 
 * Inserts or updates an entity in the sync database.
 * Generates appropriate SQL based on entity metadata.
 * Handles composite keys automatically.
 * 
 * @param syncPool - Connection pool to the sync database
 * @param entityType - Type of entity to upsert (e.g., 'meter', 'register', 'device_register')
 * @param entity - Entity data to insert or update
 * @throws Error if entity type is not found or upsert fails
 */
export async function upsertEntity(
  syncPool: Pool,
  entityType: string,
  entity: any,
  logMessage: string
): Promise<void> {
  try {
    // Get entity metadata
    const metadata = ENTITY_METADATA[entityType];
    if (!metadata) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    console.log(`\n🔄 [Upsert] Upserting ${entityType} entity`);
    console.log(`   Data:`, JSON.stringify(entity, null, 2));

    // Build INSERT statement
    const columns = metadata.columns.filter(col => col in entity);
    const values = columns.map((_, i) => `$${i + 1}`).join(', ');
    const params = columns.map(col => entity[col]);

    // Determine primary key for conflict clause
    const primaryKeyColumns = Array.isArray(metadata.primaryKey)
      ? metadata.primaryKey
      : [metadata.primaryKey];

    // Build ON CONFLICT clause
    const conflictColumns = primaryKeyColumns.join(', ');
    const updateColumns = columns
      .filter(col => !primaryKeyColumns.includes(col))
      .map(col => `${col} = EXCLUDED.${col}`)
      .join(', ');

    // Build query - handle case where there are no non-key columns to update
    let query: string;
    if (updateColumns.length === 0) {
      // No non-key columns to update, use DO NOTHING
      query = `INSERT INTO ${metadata.tableName} (${columns.join(', ')})
      VALUES (${values})
      ON CONFLICT (${conflictColumns}) DO NOTHING
      RETURNING *`;
    } else {
      // Update non-key columns
      query = `INSERT INTO ${metadata.tableName} (${columns.join(', ')})
      VALUES (${values})
      ON CONFLICT (${conflictColumns}) DO UPDATE SET
      ${updateColumns}
      RETURNING *`;
    }

    console.log(`📋 [Upsert] Query: ${query}`);
    console.log(`📋 [Upsert] Parameters:`, JSON.stringify(params, null, 2));

    const result = await execQuery(syncPool, query, params, logMessage);


    if (!result || !result.rows || result.rows.length === 0) {
      throw new Error(`Upsert failed: No rows returned for ${entityType}`);
    }

    console.log(`✅ [Upsert] Successfully upserted ${entityType} entity`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Upsert] Failed to upsert ${entityType}:`, errorMessage);
    throw new Error(`Failed to upsert ${entityType}: ${errorMessage}`);
  }
}

/**
 * Delete an entity from the local sync database
 * 
 * Deletes an entity from the sync database using its primary key.
 * Handles composite keys automatically.
 * 
 * @param syncPool - Connection pool to the sync database
 * @param entityType - Type of entity to delete (e.g., 'meter', 'register', 'device_register')
 * @param primaryKey - Primary key value(s) to identify the entity to delete
 * @throws Error if entity type is not found or delete fails
 */
export async function deleteEntity(
  syncPool: Pool,
  entityType: string,
  primaryKey: any
): Promise<void> {
  try {
    // Get entity metadata
    const metadata = ENTITY_METADATA[entityType];
    if (!metadata) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    console.log(`\n➖ [Delete] Deleting ${entityType} entity`);
    console.log(`   Primary Key:`, JSON.stringify(primaryKey, null, 2));

    // Determine primary key columns
    const primaryKeyColumns = Array.isArray(metadata.primaryKey)
      ? metadata.primaryKey
      : [metadata.primaryKey];

    // Build WHERE clause
    let whereClause = '';
    let params: any[] = [];

    if (Array.isArray(primaryKey)) {
      // Composite key
      whereClause = primaryKeyColumns
        .map((col, i) => `${col} = $${i + 1}`)
        .join(' AND ');
      params = primaryKey;
    } else {
      // Single key
      whereClause = `${primaryKeyColumns[0]} = $1`;
      params = [primaryKey];
    }

    const query = `DELETE FROM ${metadata.tableName} WHERE ${whereClause}`;
    // Execute query
    const result = await execQuery(syncPool, query, params, 'sync-functions.ts>deleteEntity');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Delete] Failed to delete ${entityType}:`, errorMessage);
    throw new Error(`Failed to delete ${entityType}: ${errorMessage}`);
  }
}

/**
 * Build a composite key string for efficient lookup
 * 
 * Creates a string representation of a composite key for use in Map lookups.
 * Example: buildCompositeKeyString(['device_id', 'register_id'], entity)
 *          returns "123:456" for entity with device_id=123, register_id=456
 * 
 * @param keyColumns - Array of column names that make up the composite key
 * @param entity - Entity object containing the key values
 * @returns String representation of the composite key
 */
export function buildCompositeKeyString(keyColumns: string[], entity: any): string {
  return keyColumns.map(col => entity[col]).join(':');
}

/**
 * Parse a composite key string back into an array
 * 
 * Reverses the buildCompositeKeyString operation.
 * Example: parseCompositeKeyString("123:456") returns [123, 456]
 * 
 * @param keyString - String representation of the composite key
 * @returns Array of key values
 */
export function parseCompositeKeyString(keyString: string): any[] {
  return keyString.split(':').map(val => {
    // Try to parse as number, otherwise keep as string
    const num = Number(val);
    return isNaN(num) ? val : num;
  });
}
