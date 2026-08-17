/**
 * Tenant Sync Functions
 * 
 * Orchestrates synchronization of the tenant table from the remote Client System database
 * to the local Sync database. Handles insert and update operations for tenants.
 * 
 * Note: Tenant sync is critical for loading API keys used in connectivity checks.
 * Cache is reloaded only if tenant data was modified.
 */

import { Pool } from 'pg';
import {
  getRemoteEntities,
  getLocalEntities,
  upsertEntity,
} from '../helpers/sync-functions.js';
import { cacheManager } from '../cache/index.js';
import { SyncDatabase } from '../types/index.js';

export interface TenantSyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  dataModified: boolean;
  error?: string;
  timestamp: Date;
  loadedApiKey?: string;
}

/**
 * Synchronize tenants from remote database to local sync database
 * 
 * Orchestrates the complete tenant sync process:
 * 1. Query remote database for all tenants
 * 2. Query local database for all tenants
 * 3. Identify inserts (in remote, not in local)
 * 4. Identify updates (in both, with different values)
 * 5. Execute insert/update operations
 * 6. Extract and return API key from synced tenant
 * 7. Reload cache if data was modified
 * 8. Track and return counts
 * 
 * @param remotePool - Connection pool to the remote database
 * @param syncPool - Connection pool to the local sync database
 * @param tenantId - Tenant ID to sync
 * @param syncDatabase - SyncDatabase instance for cache reload
 * @returns TenantSyncResult with counts of inserted, updated tenants, plus loaded API key and dataModified flag
 */
export async function syncTenant(
  remotePool: Pool,
  syncPool: Pool,
  tenantId: number,
  syncDatabase?: SyncDatabase
): Promise<TenantSyncResult> {
  try {
    console.log(`\n🔄 [Tenant Sync] Starting tenant synchronization for tenant ${tenantId}...`);

    // Get remote tenants
    console.log(`\n🔍 [Tenant Sync] Querying remote database for tenants...`);
    const remoteTenants = await getRemoteEntities(remotePool, 'tenant', tenantId, 'sync-tenant.ts > syncTenant1');
    console.log(`📋 [Tenant Sync] Found ${remoteTenants.length} remote tenant(s)`);

    // Get local tenants
    console.log(`\n🔍 [Tenant Sync] Querying local database for tenants...`);
    const localTenants = await getLocalEntities(syncPool, 'tenant');
    console.log(`📋 [Tenant Sync] Found ${localTenants.length} local tenant(s)`);

    // Track changes
    let insertedCount = 0;
    let updatedCount = 0;
    let loadedApiKey: string | undefined;

    // Create maps for efficient lookup using primary key (tenant_id)
    const remoteMap = new Map(remoteTenants.map((t: any) => [t.tenant_id, t]));
    const localMap = new Map(localTenants.map((t: any) => [t.tenant_id, t]));

    // Process inserts (tenants in remote but not in local)
    console.log(`\n➕ [Tenant Sync] Processing new tenants...`);
    for (const remoteTenant of remoteTenants) {
      if (!localMap.has(remoteTenant.tenant_id)) {
        try {
          await upsertEntity(syncPool, 'tenant', remoteTenant, 'sync-tenant.ts > syncTenant2');
          insertedCount++;
          console.log(`   ✅ Inserted tenant: ${remoteTenant.name} (ID: ${remoteTenant.tenant_id})`);

          // If this is the target tenant, capture its API key
          if (remoteTenant.tenant_id === tenantId && remoteTenant.api_key) {
            loadedApiKey = remoteTenant.api_key;
            console.log(`   🔑 [Tenant Sync] Captured API key for tenant ${remoteTenant.tenant_id}`);
          }
        } catch (error) {
          console.error(`   ❌ Failed to insert tenant ${remoteTenant.tenant_id}:`, error);
        }
      }
    }

    // Process updates (tenants in both with different values)
    console.log(`\n🔄 [Tenant Sync] Processing tenant updates...`);
    for (const remoteTenant of remoteTenants) {
      const localTenant = localMap.get(remoteTenant.tenant_id);
      if (localTenant) {
        // Check if any fields have changed
        const hasChanges =
          localTenant.name !== remoteTenant.name ||
          localTenant.url !== remoteTenant.url ||
          localTenant.street !== remoteTenant.street ||
          localTenant.street2 !== remoteTenant.street2 ||
          localTenant.city !== remoteTenant.city ||
          localTenant.state !== remoteTenant.state ||
          localTenant.zip !== remoteTenant.zip ||
          localTenant.country !== remoteTenant.country ||
          localTenant.api_key !== remoteTenant.api_key;

        if (hasChanges) {
          try {
            await upsertEntity(syncPool, 'tenant', remoteTenant, 'sync-tenant.ts > syncTenant3');
            updatedCount++;
            console.log(`   ✅ Updated tenant: ${remoteTenant.name} (ID: ${remoteTenant.tenant_id})`);

            // If this is the target tenant and API key changed, capture it
            if (remoteTenant.tenant_id === tenantId && remoteTenant.api_key && remoteTenant.api_key !== localTenant.api_key) {
              loadedApiKey = remoteTenant.api_key;
              console.log(`   🔑 [Tenant Sync] Updated API key for tenant ${remoteTenant.tenant_id}`);
            }
          } catch (error) {
            console.error(`   ❌ Failed to update tenant ${remoteTenant.tenant_id}:`, error);
          }
        }
      }
    }

    // If no API key loaded yet, try to load from first tenant with one
    if (!loadedApiKey && remoteTenants.length > 0) {
      for (const remoteTenant of remoteTenants) {
        if (remoteTenant.api_key) {
          loadedApiKey = remoteTenant.api_key;
          console.log(`   🔑 [Tenant Sync] Loaded API key from tenant ${remoteTenant.tenant_id}`);
          break;
        }
      }
    }

    // Determine if data was modified
    const dataModified = insertedCount > 0 || updatedCount > 0;

    // Reload cache if data was modified
    if (dataModified && syncDatabase) {
      try {
        console.log(`\n🔄 [Tenant Sync] Data was modified, reloading cache...`);
        await cacheManager.reloadAll(syncDatabase);
        console.log(`✅ [Tenant Sync] Cache reloaded successfully`);
      } catch (error) {
        console.error(`❌ [Tenant Sync] Failed to reload cache:`, error);
        // Continue even if cache reload fails
      }
    }

    const result: TenantSyncResult = {
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      dataModified,
      timestamp: new Date(),
      loadedApiKey,
    };

    console.log(`\n✅ [Tenant Sync] Sync completed successfully`);
    console.log(`   Inserted: ${insertedCount}, Updated: ${updatedCount}, Data Modified: ${dataModified}`);
    if (loadedApiKey) {
      console.log(`   🔑 API key loaded: ${loadedApiKey.substring(0, 8)}...`);
    }
    console.log();

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n❌ [Tenant Sync] Sync failed:`, error);

    return {
      success: false,
      inserted: 0,
      updated: 0,
      dataModified: false,
      error: errorMessage,
      timestamp: new Date(),
    };
  }
}
