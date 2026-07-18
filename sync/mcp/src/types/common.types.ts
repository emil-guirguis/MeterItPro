/**
 * Common types and interfaces shared across the sync system
 */

/**
 * Base response structure for API responses
 */
export interface BaseResponse {
  success: boolean;
  message?: string;
}

/**
 * Base sync result structure
 */
export interface BaseSyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  error?: string;
  timestamp: Date;
}

/**
 * Base sync status structure
 */
export interface BaseSyncStatus {
  isRunning: boolean;
  isSyncing: boolean;
  lastSyncTime?: Date;
  lastSyncSuccess?: boolean;
  lastSyncError?: string;
  lastSyncSkipped?: boolean;
  lastSyncSkipReason?: string;
  lastInsertedCount: number;
  lastUpdatedCount: number;
  lastDeletedCount: number;
  count: number;
}

/**
 * Entity metadata describing how to sync an entity type
 * Used by generic sync functions to handle different entity types uniformly
 */
export interface EntityMetadata {
  tableName: string;                    // Name of the table in the database
  primaryKey: string | string[];        // Single or composite primary key column(s)
  columns: string[];                    // Columns to sync
  compositeKey?: string[];              // For composite keys (e.g., ['device_id', 'register_id'])
  tenantFiltered?: boolean;             // Whether to filter by tenant_id
  syncServerFiltered?: boolean;         // Whether to filter by SYNC_SERVER_ID ($2, null = no filter)
  remoteQuery?: string;                 // Custom remote query template (optional)
}

/**
 * Registry of entity metadata for all syncable entities
 */
export const ENTITY_METADATA: Record<string, EntityMetadata> = {
  tenant: {
    tableName: 'tenant',
    primaryKey: 'tenant_id',
    columns: ['tenant_id', 'name', 'url', 'street', 'street2', 'city', 'state', 'zip', 'country', 'api_key'],
    tenantFiltered: true
  },
  meter: {
    tableName: 'meter',
    primaryKey: ['meter_id', 'meter_element_id'],
    columns: ['meter_id', 'device_id', 'name', 'active', 'ip', 'port', 'meter_element_id', 'element'],
    compositeKey: ['meter_id', 'meter_element_id'],
    tenantFiltered: true,
    syncServerFiltered: true,
    remoteQuery: `select m.meter_id, m.device_id, m.ip, m.port, m.active,
                         me.meter_element_id, me.element, me.name as name
                  from meter m
                     join meter_element me on me.meter_id = m.meter_id
                  where m.tenant_id = $1
                    and ($2::int is null or m.sync_server_id = $2::int)`,
  },
  register: {
    tableName: 'register',
    primaryKey: 'register_id',
    columns: ['register_id', 'name', 'register', 'unit', 'field_name'],
    tenantFiltered: false,
  },
  device_register: {
    tableName: 'device_register',
    primaryKey: ['device_id', 'register_id'],
    columns: ['device_id', 'register_id'],
    compositeKey: ['device_id', 'register_id'],
    tenantFiltered: false,
  },
};
