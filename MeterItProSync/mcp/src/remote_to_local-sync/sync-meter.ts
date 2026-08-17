/**
 * Meter Sync Functions
 * 
 * Orchestrates synchronization of the meter table from the remote Client System database
 * to the local Sync database. Handles insert, update, and delete operations for meters
 * filtered by tenant_id.
 * 
 * Cache is reloaded only if meter data was modified.
 */

import { Pool } from 'pg';
import {
  getRemoteEntities,
  getLocalEntities,
  upsertEntity,
  deleteEntity,
  buildCompositeKeyString,
} from '../helpers/sync-functions.js';
import { cacheManager } from '../cache/index.js';
import { SyncDatabase } from '../types/index.js';

export interface MeterSyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  dataModified: boolean;
  error?: string;
  timestamp: Date;
}

/**
 * Synchronize meters from remote database to local sync database
 * 
 * Orchestrates the complete meter sync process:
 * 1. Query remote database for all meters (filtered by tenant_id)
 * 2. Query local database for all meters
 * 3. Identify inserts (in remote, not in local)
 * 4. Identify updates (in both, with different values)
 * 5. Identify deletes (in local, not in remote)
 * 6. Execute insert/update/delete operations
 * 7. Reload cache if data was modified
 * 8. Track and return counts
 * 
 * @param remotePool - Connection pool to the remote database
 * @param syncPool - Connection pool to the local sync database
 * @param tenantId - Tenant ID for filtering meters
 * @param syncDatabase - SyncDatabase instance for cache reload
 * @returns MeterSyncResult with counts of inserted, updated, deleted meters and dataModified flag
 */
export async function syncMeters(
  remotePool: Pool,
  syncPool: Pool,
  tenantId: number,
  syncDatabase?: SyncDatabase
): Promise<MeterSyncResult> {
  try {
    console.log(`\n🔄 [Meter Sync] Starting meter synchronization for tenant ${tenantId}...`);

    // Get remote meters filtered by tenant_id
    console.log(`\n🔍 [Meter Sync] Querying remote database for meters...`);
    const remoteMeters = await getRemoteEntities(remotePool, 'meter', tenantId, 'sync-meter.ts > syncMeters1');
    console.log(`📋 [Meter Sync] Found ${remoteMeters.length} remote meter(s)`);

    // Get local meters
    console.log(`\n🔍 [Meter Sync] Querying local database for meters...`);
    const localMeters = await getLocalEntities(syncPool, 'meter');
    console.log(`📋 [Meter Sync] Found ${localMeters.length} local meter(s)`);

    // Track changes
    let insertedCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;

    // Create maps for efficient lookup using composite key (id, meter_element_id)
    const remoteMap = new Map(
      remoteMeters.map((m: any) => [buildCompositeKeyString(['id', 'meter_element_id'], m), m])
    );
    const localMap = new Map(
      localMeters.map((m: any) => [buildCompositeKeyString(['id', 'meter_element_id'], m), m])
    );

    // Process deletes (meters in local but not in remote)
    console.log(`\n➖ [Meter Sync] Processing meters to delete...`);
    for (const localMeter of localMeters) {
      const compositeKey = buildCompositeKeyString(['id', 'meter_element_id'], localMeter);
      if (!remoteMap.has(compositeKey)) {
        try {
          await deleteEntity(syncPool, 'meter', [localMeter.meter_id, localMeter.meter_element_id]);
          deletedCount++;
          console.log(`   ✅ Deleted meter: ${localMeter.name}`);
        } catch (error) {
          console.error(`   ❌ Failed to delete meter ${localMeter.meter_id}:`, error);
        }
      }
    }

    // Process inserts (meters in remote but not in local)
    console.log(`\n➕ [Meter Sync] Processing new meters...`);
    for (const remoteMeter of remoteMeters) {
      const compositeKey = buildCompositeKeyString(['id', 'meter_element_id'], remoteMeter);
      if (!localMap.has(compositeKey)) {
        try {
          await upsertEntity(syncPool, 'meter', remoteMeter, 'sync-meter.ts > syncMeters2');
          insertedCount++;
          console.log(`   ✅ Inserted meter: ${remoteMeter.name}`);
        } catch (error) {
          console.error(`   ❌ Failed to insert meter ${remoteMeter.meter_id}:`, error);
        }
      }
    }

    // Process updates (meters in both with different values)
    console.log(`\n🔄 [Meter Sync] Processing meter updates...`);
    for (const remoteMeter of remoteMeters) {
      const compositeKey = buildCompositeKeyString(['id', 'meter_element_id'], remoteMeter);
      const localMeter = localMap.get(compositeKey);
      if (localMeter) {
        // Check if any fields have changed
        const hasChanges =
          localMeter.ip !== remoteMeter.ip ||
          localMeter.port !== remoteMeter.port ||
          localMeter.device_id !== remoteMeter.device_id ||
          localMeter.active !== remoteMeter.active ||
          localMeter.element !== remoteMeter.element;

        if (hasChanges) {
          try {
            await upsertEntity(syncPool, 'meter', remoteMeter, 'sync-meter.ts > syncMeters3');
            updatedCount++;
            console.log(`   ✅ Updated meter: ${remoteMeter.name}`);
          } catch (error) {
            console.error(`   ❌ Failed to update meter ${remoteMeter.meter_id}:`, error);
          }
        }
      }
    }

    // Determine if data was modified
    const dataModified = insertedCount > 0 || updatedCount > 0 || deletedCount > 0;

    // Reload cache if data was modified
    if (dataModified && syncDatabase) {
      try {
        console.log(`\n🔄 [Meter Sync] Data was modified, reloading cache...`);
        await cacheManager.reloadAll(syncDatabase);
        console.log(`✅ [Meter Sync] Cache reloaded successfully`);
      } catch (error) {
        console.error(`❌ [Meter Sync] Failed to reload cache:`, error);
        // Continue even if cache reload fails
      }
    }

    const result: MeterSyncResult = {
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      deleted: deletedCount,
      dataModified,
      timestamp: new Date(),
    };

    console.log(`\n✅ [Meter Sync] Sync completed successfully`);
    console.log(`   Inserted: ${insertedCount}, Updated: ${updatedCount}, Deleted: ${deletedCount}, Data Modified: ${dataModified}\n`);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n❌ [Meter Sync] Sync failed:`, error);

    return {
      success: false,
      inserted: 0,
      updated: 0,
      deleted: 0,
      dataModified: false,
      error: errorMessage,
      timestamp: new Date(),
    };
  }
}
