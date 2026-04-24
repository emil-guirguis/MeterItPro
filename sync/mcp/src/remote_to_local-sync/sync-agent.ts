/**
 * Remote to Local Sync Agent
 * 
 * Synchronizes configuration from the remote Client System database to the local Sync database.
 * Orchestrates three separate sync operations:
 * 1. Tenant sync - loads API keys and tenant configuration
 * 2. Meter sync - syncs meter devices and their configuration
 * 3. Device Register sync - syncs device-to-register associations
 * 
 * Each sync operation handles its own cache reload if data was modified.
 * Runs automatically on a schedule and can be manually triggered.
 */

import * as cron from 'node-cron';
import { Pool } from 'pg';
import { MeterSyncResult, MeterSyncStatus, SyncDatabase, ComprehensiveSyncResult } from '../types/index.js';
import { syncPool } from '../data-sync/data-sync.js';
import { syncMeters } from './sync-meter.js';
import { syncDeviceRegisters } from './sync-device-register.js';
import { syncRegisters } from './sync-register.js';
import { syncTenant } from './sync-tenant.js';
import { BACnetMeterReadingAgent } from '../bacnet-collection/bacnet-reading-agent.js';
import { cacheManager } from '../cache/index.js';
import { getRemoteToLocalSyncIntervalMinutes, getRemoteToLocalSyncCronExpression } from '../config/scheduling-constants.js';

export interface RemoteToLocalSyncAgentConfig {
  syncDatabase: SyncDatabase;
  remotePool: Pool;
  syncIntervalMinutes?: number;
  enableAutoSync?: boolean;
  bacnetMeterReadingAgent?: BACnetMeterReadingAgent;
}

export class RemoteToLocalSyncAgent {
  private syncDatabase: SyncDatabase;
  private remotePool: Pool;
  private syncIntervalMinutes: number;
  private enableAutoSync: boolean;
  private bacnetMeterReadingAgent?: BACnetMeterReadingAgent;

  private cronJob?: cron.ScheduledTask;
  private isSyncing: boolean = false;
  private status: MeterSyncStatus;
  private tenantId: number | null = null;

  constructor(config: RemoteToLocalSyncAgentConfig) {
    this.syncDatabase = config.syncDatabase;
    this.remotePool = config.remotePool;
    this.syncIntervalMinutes = getRemoteToLocalSyncIntervalMinutes();
    this.enableAutoSync = config.enableAutoSync !== false;
    this.bacnetMeterReadingAgent = config.bacnetMeterReadingAgent;

    this.status = {
      isRunning: false,
      isSyncing: false,
      lastInsertedCount: 0,
      lastUpdatedCount: 0,
      lastDeletedCount: 0,
      count: 0,
      lastSyncSkipped: false,
      lastSyncSkipReason: undefined,
    };
  }

  /**
   * Start the sync agent with scheduled sync
   * 
   * This performs the complete sync workflow:
   * 1. Sync tenant data from remote to local DB
   * 2. Sync meter data from remote to local DB
   * 3. Sync device_register data from remote to local DB
   * 4. Load all caches from local DB
   * 5. Schedule periodic syncs
   */
  async start(): Promise<void> {
    console.log('Starting sync agent...');
    if (this.cronJob) {
      console.log('Sync agent already running');
      return;
    }

    console.log(`Starting sync agent with ${this.syncIntervalMinutes} minute interval`);

    // Perform initial sync (which includes cache loading)
    await this.performSync();

    if (this.enableAutoSync) {
      // Schedule sync job
      const cronExpression = getRemoteToLocalSyncCronExpression();
      this.cronJob = cron.schedule(cronExpression, async () => {
        await this.performSync();
      });

      console.log(`✅ [Sync Agent] Sync scheduled: every ${this.syncIntervalMinutes} minute(s)`);
    }

    this.status.isRunning = true;
  }

  /**
   * Stop the sync agent
   */
  async stop(): Promise<void> {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = undefined;
      console.log('Sync agent stopped');
    }

    this.status.isRunning = false;
  }

  /**
   * Perform a single sync operation
   * 
   * Orchestrates three separate sync operations:
   * 1. Tenant sync - loads API keys and tenant configuration
   * 2. Meter sync - syncs meter devices and their configuration
   * 3. Device Register sync - syncs device-to-register associations
   * 
   * Each sync operation handles its own cache reload if data was modified.
   */
  async performSync(): Promise<MeterSyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping');
      return {
        success: false,
        inserted: 0,
        updated: 0,
        deleted: 0,
        error: 'Sync already in progress',
        timestamp: new Date(),
      };
    }

    // Get tenant ID from cache if available, otherwise from remote database
    if (!this.tenantId) {
      try {
        this.tenantId = cacheManager.getTenantCache().getTenantId();
        console.log(`✅ [Sync Agent] Using tenant ID from cache: ${this.tenantId}`);
        if (!this.tenantId) {
          throw new Error('Tenant ID not found in cache');
        }
      } catch (error) {
        // Cache not initialized yet, query remote database for first tenant
        console.log(`⚠️  [Sync Agent] Cache not initialized, querying remote database for tenant...`);
      }
    }

    // Check if BACnet meter collection is currently active
    if (this.bacnetMeterReadingAgent) {
      const bacnetStatus = this.bacnetMeterReadingAgent.getStatus();
      if (bacnetStatus.isRunning && bacnetStatus.lastCycleResult) {
        // Check if a cycle is currently executing by looking at the last cycle result
        const lastCycleEndTime = new Date(bacnetStatus.lastCycleResult.endTime);
        const timeSinceLastCycle = Date.now() - lastCycleEndTime.getTime();
        
        // If the last cycle ended very recently (within 5 seconds), skip the sync
        if (timeSinceLastCycle < 5000) {
          const skipReason = 'BACnet meter collection cycle in progress';
          console.log(`⏭️  [Sync Agent] Skipping sync: ${skipReason}`);
          
          this.status.lastSyncSkipped = true;
          this.status.lastSyncSkipReason = skipReason;
          this.status.lastSyncTime = new Date();
          
          return {
            success: false,
            inserted: 0,
            updated: 0,
            deleted: 0,
            error: skipReason,
            timestamp: new Date(),
          };
        }
      }
    }

    this.isSyncing = true;
    this.status.isSyncing = true;
    this.status.lastSyncSkipped = false;
    this.status.lastSyncSkipReason = undefined;

    try {
      console.log(`\n🔄 [Sync Agent] Starting comprehensive synchronization for tenant ${this.tenantId}...`);

      // ==================== TENANT SYNC ====================
      console.log(`\n${'='.repeat(60)}`);
      console.log(`PHASE 1: TENANT SYNCHRONIZATION`);
      console.log(`${'='.repeat(60)}`);

      const tenantSyncResult = await syncTenant(this.remotePool, syncPool, this.tenantId as number, this.syncDatabase);
      await this.syncDatabase.logSyncOperation(
        'remote_download_tenant',
        tenantSyncResult.inserted + tenantSyncResult.updated,
        tenantSyncResult.success,
        tenantSyncResult.error,
        JSON.stringify({ inserted: tenantSyncResult.inserted, updated: tenantSyncResult.updated })
      );

      // ==================== METER SYNC ====================
      console.log(`\n${'='.repeat(60)}`);
      console.log(`PHASE 2: METER SYNCHRONIZATION`);
      console.log(`${'='.repeat(60)}`);

      const meterSyncResult = await syncMeters(this.remotePool, syncPool, this.tenantId as number, this.syncDatabase);
      await this.syncDatabase.logSyncOperation(
        'remote_download_meter',
        meterSyncResult.inserted + meterSyncResult.updated + meterSyncResult.deleted,
        meterSyncResult.success,
        meterSyncResult.error,
        JSON.stringify({ inserted: meterSyncResult.inserted, updated: meterSyncResult.updated, deleted: meterSyncResult.deleted })
      );

      // ==================== REGISTER SYNC ====================
      console.log(`\n${'='.repeat(60)}`);
      console.log(`PHASE 3: REGISTER SYNCHRONIZATION`);
      console.log(`${'='.repeat(60)}`);

      const registerSyncResult = await syncRegisters(this.remotePool, syncPool, this.syncDatabase);
      await this.syncDatabase.logSyncOperation(
        'remote_download_register',
        registerSyncResult.inserted + registerSyncResult.updated + registerSyncResult.deleted,
        registerSyncResult.success,
        registerSyncResult.error,
        JSON.stringify({ inserted: registerSyncResult.inserted, updated: registerSyncResult.updated, deleted: registerSyncResult.deleted })
      );

      // ==================== DEVICE REGISTER SYNC ====================
      console.log(`\n${'='.repeat(60)}`);
      console.log(`PHASE 4: DEVICE REGISTER SYNCHRONIZATION`);
      console.log(`${'='.repeat(60)}`);

      const deviceRegisterSyncResult = await syncDeviceRegisters(this.remotePool, syncPool, this.syncDatabase);
      await this.syncDatabase.logSyncOperation(
        'remote_download_device_register',
        deviceRegisterSyncResult.inserted + deviceRegisterSyncResult.updated + deviceRegisterSyncResult.deleted,
        deviceRegisterSyncResult.success,
        deviceRegisterSyncResult.error,
        JSON.stringify({ inserted: deviceRegisterSyncResult.inserted, updated: deviceRegisterSyncResult.updated, deleted: deviceRegisterSyncResult.deleted, skipped: deviceRegisterSyncResult.skipped })
      );

      // ==================== AGGREGATE RESULTS ====================
      console.log(`\n${'='.repeat(60)}`);
      console.log(`SYNC SUMMARY`);
      console.log(`${'='.repeat(60)}`);

      const comprehensiveResult: ComprehensiveSyncResult = {
        success: tenantSyncResult.success && meterSyncResult.success && registerSyncResult.success && deviceRegisterSyncResult.success,
        tenants: {
          inserted: tenantSyncResult.inserted,
          updated: tenantSyncResult.updated,
          deleted: 0
        },
        meters: {
          inserted: meterSyncResult.inserted,
          updated: meterSyncResult.updated,
          deleted: meterSyncResult.deleted,
        },
        registers: {
          inserted: registerSyncResult.inserted,
          updated: registerSyncResult.updated,
          deleted: registerSyncResult.deleted,
        },
        deviceRegisters: {
          inserted: deviceRegisterSyncResult.inserted,
          updated: deviceRegisterSyncResult.updated,
          deleted: deviceRegisterSyncResult.deleted,
          skipped: deviceRegisterSyncResult.skipped,
        },
        timestamp: new Date(),
      };

      // Log any errors
      if (!tenantSyncResult.success) {
        comprehensiveResult.error = `Tenant sync failed: ${tenantSyncResult.error}`;
      } else if (!meterSyncResult.success) {
        comprehensiveResult.error = `Meter sync failed: ${meterSyncResult.error}`;
      } else if (!registerSyncResult.success) {
        comprehensiveResult.error = `Register sync failed: ${registerSyncResult.error}`;
      } else if (!deviceRegisterSyncResult.success) {
        comprehensiveResult.error = `Device register sync failed: ${deviceRegisterSyncResult.error}`;
      }

      // Print summary
      console.log(`\n📊 COMPREHENSIVE SYNC RESULTS:`);
      console.log(`   Tenants:          Inserted: ${comprehensiveResult.tenants.inserted}, Updated: ${comprehensiveResult.tenants.updated}, Deleted: ${comprehensiveResult.tenants.deleted}`);
      console.log(`   Meters:           Inserted: ${comprehensiveResult.meters.inserted}, Updated: ${comprehensiveResult.meters.updated}, Deleted: ${comprehensiveResult.meters.deleted}`);
      console.log(`   Registers:        Inserted: ${comprehensiveResult.registers.inserted}, Updated: ${comprehensiveResult.registers.updated}, Deleted: ${comprehensiveResult.registers.deleted}`);
      console.log(`   Device Registers: Inserted: ${comprehensiveResult.deviceRegisters.inserted}, Updated: ${comprehensiveResult.deviceRegisters.updated}, Deleted: ${comprehensiveResult.deviceRegisters.deleted}, Skipped: ${comprehensiveResult.deviceRegisters.skipped}`);

      if (comprehensiveResult.success) {
        console.log(`\n✅ [Sync Agent] All sync operations completed successfully\n`);
      } else {
        console.log(`\n⚠️  [Sync Agent] Some sync operations failed: ${comprehensiveResult.error}\n`);
      }

      // Update status
      this.status.lastSyncTime = new Date();
      this.status.lastSyncSuccess = comprehensiveResult.success;
      this.status.lastSyncError = comprehensiveResult.error;
      this.status.lastInsertedCount = meterSyncResult.inserted;
      this.status.lastUpdatedCount = meterSyncResult.updated;
      this.status.lastDeletedCount = meterSyncResult.deleted;

      // Load caches from sync database after successful sync
      if (comprehensiveResult.success) {
        try {
          console.log(`\n📚 [Sync Agent] Loading caches from sync database...`);
          await cacheManager.initializeAll(this.syncDatabase);
          console.log(`✅ [Sync Agent] All caches loaded successfully\n`);
        } catch (error) {
          console.error(`❌ [Sync Agent] Failed to load caches:`, error);
          // Continue even if cache loading fails - collection will use previous cache state
        }
      }

      // Return meter sync result for backward compatibility
      return {
        success: comprehensiveResult.success,
        inserted: meterSyncResult.inserted,
        updated: meterSyncResult.updated,
        deleted: meterSyncResult.deleted,
        error: comprehensiveResult.error,
        timestamp: comprehensiveResult.timestamp,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\n❌ [Sync Agent] Sync failed:`, error);

      // Log the failed sync operation
      try {
        await this.syncDatabase.logSyncOperation(
          'sync',
          0,
          false,
          errorMessage
        );
      } catch (logError) {
        console.error('Failed to log sync error:', logError);
      }

      // Update status
      this.status.lastSyncTime = new Date();
      this.status.lastSyncSuccess = false;
      this.status.lastSyncError = errorMessage;

      return {
        success: false,
        inserted: 0,
        updated: 0,
        deleted: 0,
        error: errorMessage,
        timestamp: new Date(),
      };
    } finally {
      this.isSyncing = false;
      this.status.isSyncing = false;
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): MeterSyncStatus {
    return { ...this.status };
  }

  /**
   * Manually trigger a sync operation
   */
  async triggerSync(): Promise<MeterSyncResult> {
    console.log('Manual sync triggered');
    return this.performSync();
  }
}
