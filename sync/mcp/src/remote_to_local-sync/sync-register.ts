/**
 * Register Sync Functions
 *
 * Orchestrates synchronization of the register table from the remote Client System database
 * to the local Sync database. Handles insert, update, and delete operations.
 *
 * Note: registers are NOT tenant-filtered.
 */

import { Pool } from 'pg';
import {
  getRemoteEntities,
  getLocalEntities,
  upsertEntity,
  deleteEntity,
} from '../helpers/sync-functions.js';
import { cacheManager } from '../cache/index.js';
import { SyncDatabase } from '../types/index.js';

export interface RegisterSyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  dataModified: boolean;
  error?: string;
  timestamp: Date;
}

/**
 * Synchronize registers from remote database to local sync database
 */
export async function syncRegisters(
  remotePool: Pool,
  syncPool: Pool,
  syncDatabase?: SyncDatabase
): Promise<RegisterSyncResult> {
  try {
    console.log(`\n🔄 [Register Sync] Starting register synchronization...`);

    // Get remote registers (no tenant filtering)
    console.log(`\n🔍 [Register Sync] Querying remote database for registers...`);
    const remoteRegisters = await getRemoteEntities(remotePool, 'register', 0, 'sync-register.ts > syncRegisters1');
    console.log(`📋 [Register Sync] Found ${remoteRegisters.length} remote register(s)`);

    // Get local registers
    console.log(`\n🔍 [Register Sync] Querying local database for registers...`);
    const localRegisters = await getLocalEntities(syncPool, 'register');
    console.log(`📋 [Register Sync] Found ${localRegisters.length} local register(s)`);

    let insertedCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;

    // Create maps for efficient lookup
    const remoteMap = new Map(
      remoteRegisters.map((r: any) => [String(r.register_id), r])
    );
    const localMap = new Map(
      localRegisters.map((r: any) => [String(r.register_id), r])
    );

    // Process deletes (registers in local but not in remote)
    console.log(`\n➖ [Register Sync] Processing registers to delete...`);
    for (const localRegister of localRegisters) {
      if (!remoteMap.has(String(localRegister.register_id))) {
        try {
          await deleteEntity(syncPool, 'register', localRegister.register_id);
          deletedCount++;
          console.log(`   ✅ Deleted register: ${localRegister.name}`);
        } catch (error) {
          console.error(`   ❌ Failed to delete register ${localRegister.register_id}:`, error);
        }
      }
    }

    // Process inserts (registers in remote but not in local)
    console.log(`\n➕ [Register Sync] Processing new registers...`);
    for (const remoteRegister of remoteRegisters) {
      if (!localMap.has(String(remoteRegister.register_id))) {
        try {
          await upsertEntity(syncPool, 'register', remoteRegister, 'sync-register.ts > syncRegisters2');
          insertedCount++;
          console.log(`   ✅ Inserted register: ${remoteRegister.name}`);
        } catch (error) {
          console.error(`   ❌ Failed to insert register ${remoteRegister.register_id}:`, error);
        }
      }
    }

    // Process updates (registers in both with different values)
    console.log(`\n🔄 [Register Sync] Processing register updates...`);
    for (const remoteRegister of remoteRegisters) {
      const localRegister = localMap.get(String(remoteRegister.register_id));
      if (localRegister) {
        const hasChanges =
          localRegister.name !== remoteRegister.name ||
          localRegister.register !== remoteRegister.register ||
          localRegister.unit !== remoteRegister.unit ||
          localRegister.field_name !== remoteRegister.field_name;

        if (hasChanges) {
          try {
            await upsertEntity(syncPool, 'register', remoteRegister, 'sync-register.ts > syncRegisters3');
            updatedCount++;
            console.log(`   ✅ Updated register: ${remoteRegister.name}`);
          } catch (error) {
            console.error(`   ❌ Failed to update register ${remoteRegister.register_id}:`, error);
          }
        }
      }
    }

    const dataModified = insertedCount > 0 || updatedCount > 0 || deletedCount > 0;

    if (dataModified && syncDatabase) {
      try {
        console.log(`\n🔄 [Register Sync] Data was modified, reloading cache...`);
        await cacheManager.reloadAll(syncDatabase);
        console.log(`✅ [Register Sync] Cache reloaded successfully`);
      } catch (error) {
        console.error(`❌ [Register Sync] Failed to reload cache:`, error);
      }
    }

    const result: RegisterSyncResult = {
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      deleted: deletedCount,
      dataModified,
      timestamp: new Date(),
    };

    console.log(`\n✅ [Register Sync] Sync completed successfully`);
    console.log(`   Inserted: ${insertedCount}, Updated: ${updatedCount}, Deleted: ${deletedCount}, Data Modified: ${dataModified}\n`);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n❌ [Register Sync] Sync failed:`, error);

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
