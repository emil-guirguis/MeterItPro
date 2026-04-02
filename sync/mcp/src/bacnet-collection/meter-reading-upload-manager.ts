/**
 * Meter Reading Upload Manager
 * 
 * Orchestrates the uploading of meter readings from Sync Database to Client System.
 * Handles scheduled uploads, batching, retry logic, and cleanup.
 * 
 * This is part of the BACnet collection workflow:
 * 1. BACnetMeterReadingAgent collects readings from BACnet devices
 * 2. Readings are stored in Sync Database
 * 3. MeterReadingUploadManager uploads readings to Client System API
 */

import * as cron from 'node-cron';
import { ClientSystemApiClient } from '../api/client-system-api.js';
import { ConnectivityMonitor } from '../api/connectivity-monitor.js';
import { SyncDatabase, MeterReadingEntity } from '../types/index.js';
import { cacheManager } from '../cache/cache-manager.js';
import { CRON_SYNC_TO_REMOTE } from '../config/scheduling-constants.js';
import ReadingValidationMiddleware from './reading-validation-middleware.js';
import { loadValidationConfig } from '../config/validation-config.js';

export interface MeterReadingUploadManagerConfig {
  database: SyncDatabase;
  apiClient: ClientSystemApiClient;
  batchSize?: number;
  maxRetries?: number;
  connectivityCheckIntervalMs?: number;
  enableAutoUpload?: boolean;
}

export interface UploadStatus {
  isRunning: boolean;
  lastUploadTime?: Date;
  lastUploadSuccess?: boolean;
  lastUploadError?: string;
  queueSize: number;
  totalUploaded: number;
  totalFailed: number;
  isClientConnected: boolean;
}


export class MeterReadingUploadManager {
  private database: SyncDatabase;
  private apiClient: ClientSystemApiClient | null = null;
  private connectivityMonitor: ConnectivityMonitor | null = null;
  private validationMiddleware: ReadingValidationMiddleware;
  private batchSize: number;
  private uploadBatchSize: number;
  private maxRetries: number;
  private config: MeterReadingUploadManagerConfig;

  private cronJob?: cron.ScheduledTask;
  private isUploading: boolean = false;
  private status: UploadStatus = {
    isRunning: false,
    queueSize: 0,
    totalUploaded: 0,
    totalFailed: 0,
    isClientConnected: false,
  };
  private tenantId: number = 0;

  constructor(config: MeterReadingUploadManagerConfig) {
    this.config = config;
    this.database = config.database;
    this.batchSize = config.batchSize || 1000;
    this.uploadBatchSize = config.batchSize || 100;
    this.maxRetries = config.maxRetries || 5;
    
    // Initialize validation middleware with loaded config
    const validationConfig = loadValidationConfig();
    this.validationMiddleware = new ReadingValidationMiddleware({
      strictMode: validationConfig.strictMode,
      logValidationResults: validationConfig.logValidationResults,
      validateBeforeUpload: validationConfig.validateBeforeUpload,
    });
  }

  /**
   * Start the upload manager (scheduling is managed by BACnetMeterReadingAgent)
   */
  async start(): Promise<void> {
    console.log('🚀 [UploadManager] Starting upload manager...');
    
    // Initialize tenant data from cache
    const tenantCache = cacheManager.getTenant();
    this.tenantId = tenantCache.tenant_id;
    console.log(`🚀 [UploadManager] Tenant ID: ${this.tenantId}`);
    
    // Load batch sizes from tenant cache
    this.uploadBatchSize = tenantCache.upload_batch_size || 100;
    console.log(`📊 [UploadManager] Loaded batch config for tenant ${this.tenantId}:`, {
      uploadBatchSize: this.uploadBatchSize,
      source: 'tenant cache'
    });
    
    // Initialize API client
    this.apiClient = this.config.apiClient;
    const apiKeyToSet = tenantCache.api_key || '';
    console.log(`🚀 [UploadManager] Setting API key: ${apiKeyToSet.substring(0, 8)}...`);
    this.apiClient.setApiKey(apiKeyToSet);
    
    // Initialize connectivity monitor
    this.connectivityMonitor = new ConnectivityMonitor(
      this.apiClient,
      this.config.connectivityCheckIntervalMs || 60000
    );
    console.log('🚀 [UploadManager] Connectivity monitor initialized');

    this.connectivityMonitor.on('connected', () => {
      console.log('🔗 [UploadManager] Connectivity restored - auto-resuming upload');
      this.status.isClientConnected = true;
      this.performUpload();
    });

    this.connectivityMonitor.on('disconnected', () => {
      console.log('🔗 [UploadManager] Connectivity lost - readings will be queued');
      this.status.isClientConnected = false;
    });

    this.connectivityMonitor.start();
    console.log('🚀 [UploadManager] Connectivity monitor started');
    
    await this.checkClientConnectivity();

    // Perform initial upload if auto upload is enabled
    this.status.isRunning = true;
    console.log('🚀 [UploadManager] Upload manager started successfully');
    if (this.config.enableAutoUpload) {
      this.performUpload();
    }
  }

  /**
   * Stop the upload manager
   */
  async stop(): Promise<void> {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = undefined;
      console.log('Upload manager stopped');
    }

    if (this.connectivityMonitor) {
      this.connectivityMonitor.stop();
    }
    this.status.isRunning = false;
  }

  /**
   * Perform a single upload operation
   */
  async performUpload(): Promise<void> {
    if (this.isUploading) {
      console.log('Upload already in progress, skipping');
      return;
    }

    this.isUploading = true;

    try {
      await this.checkClientConnectivity();

      let totalUploaded = 0;
      let totalFailed = 0;
      let batchNumber = 0;
      let hasAnyReadings = false;

      // Keep uploading until there are no more unsynchronized readings
      while (true) {
        const readings = await this.database.getUnsynchronizedReadings(this.uploadBatchSize);

        if (readings.length === 0) {
          if (!hasAnyReadings) {
            console.log('No readings to upload');
          }
          break;
        }

        hasAnyReadings = true;
        batchNumber++;
        this.status.queueSize = readings.length;

        console.log(`Validating batch ${batchNumber} (${readings.length} readings)...`);

        const { validReadings, invalidReadings, report } =
          await this.validationMiddleware.validateReadingsBeforeUpload(readings);

        if (invalidReadings.length > 0) {
          console.warn(`⚠️  [UploadManager] Skipping ${invalidReadings.length} invalid readings`);
          console.warn(`   Valid: ${validReadings.length}, Invalid: ${invalidReadings.length}`);
          console.warn(`   Real data: ${report.realDataReadings}, Mock data: ${report.mockDataDetected}`);
        }

        if (validReadings.length === 0) {
          console.log('No valid readings in this batch after validation');
          // Invalid readings won't be re-fetched (they still have is_synchronized=false)
          // but if ALL readings are invalid we'd loop forever — break to avoid that
          break;
        }

        console.log(`📦 [UploadManager] Uploading batch ${batchNumber} with ${validReadings.length} readings...`);

        const result = await this.uploadBatchWithRetry(validReadings);

        if (result.success) {
          const readingIds = validReadings.map((r: MeterReadingEntity) => r.meter_reading_id).filter((id): id is string => typeof id === 'string');

          await this.database.markReadingsAsSynchronized(readingIds, this.tenantId);
          console.log(`✅ Marked ${readingIds.length} reading(s) as synchronized`);
          totalUploaded += validReadings.length;
        } else {
          totalFailed += validReadings.length;
          console.error(`❌ Batch ${batchNumber} upload failed: ${result.error}`);
          // Stop looping on failure to avoid hammering a broken endpoint
          break;
        }
      }

      // Log overall operation result
      if (totalFailed === 0) {
        await this.database.logSyncOperation('upload', totalUploaded, true);

        this.status.lastUploadTime = new Date();
        this.status.lastUploadSuccess = true;
        this.status.lastUploadError = undefined;
        this.status.totalUploaded += totalUploaded;
      } else {
        await this.database.logSyncOperation(
          'upload',
          totalUploaded + totalFailed,
          false,
          `${totalFailed} readings failed to upload`
        );

        this.status.lastUploadTime = new Date();
        this.status.lastUploadSuccess = false;
        this.status.lastUploadError = `${totalFailed} readings failed to upload`;
        this.status.totalFailed += totalFailed;

        console.error(`Upload partially failed: ${totalFailed} readings failed`);
      }

    } catch (error) {
      console.error('Upload error:', error);

      this.status.lastUploadTime = new Date();
      this.status.lastUploadSuccess = false;
      this.status.lastUploadError = error instanceof Error ? error.message : 'Unknown error';

      await this.database.logSyncOperation(
        'upload',
        0,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      this.isUploading = false;
    }
  }

  /**
   * Upload batch with exponential backoff retry logic
   */
  private async uploadBatchWithRetry(
    readings: MeterReadingEntity[],
    retryCount: number = 0
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.apiClient) {
      return { success: false, error: 'API client not initialized' };
    }

    try {
      console.log(`📤 [UploadManager] Sending ${readings.length} readings to client API...`);
      console.log(`📤 [UploadManager] Sample reading:`, JSON.stringify(readings[0], null, 2));
      
      const response = await this.apiClient.uploadBatch(readings);

      console.log(`📤 [UploadManager] API response:`, JSON.stringify(response, null, 2));

      if (response.success) {
        console.log(`✅ [UploadManager] Upload successful - ${response.recordsProcessed} records processed`);
        return { success: true };
      } else {
        // API returned an error response - increment retry count
        const readingIds = readings.map((r) => r.meter_reading_id).filter((id): id is string => id !== undefined);
        await this.database.incrementRetryCount(readingIds);
        console.error(`❌ [UploadManager] API returned error: ${response.message}`);
        return { success: false, error: response.message };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [UploadManager] Upload error: ${errorMessage}`);

      if (errorMessage.includes('unreachable')) {
        this.status.isClientConnected = false;
        // Increment retry count for connection errors too
        const readingIds = readings.map((r) => r.meter_reading_id).filter((id): id is string => id !== undefined);
        await this.database.incrementRetryCount(readingIds);
        return { success: false, error: 'Client System unreachable' };
      }

      if (retryCount < this.maxRetries) {
        const delay = this.calculateBackoff(retryCount);
        console.log(`🔄 [UploadManager] Retry ${retryCount + 1}/${this.maxRetries} in ${delay}ms`);

        await this.sleep(delay);

        const readingIds = readings.map((r) => r.meter_reading_id).filter((id): id is string => id !== undefined);
        await this.database.incrementRetryCount(readingIds);

        return this.uploadBatchWithRetry(readings, retryCount + 1);
      }

      console.error(`❌ [UploadManager] Max retries (${this.maxRetries}) exceeded`);

      const readingIds = readings.map((r) => r.meter_reading_id).filter((id): id is string => id !== undefined);
      await this.database.incrementRetryCount(readingIds);

      return { success: false, error: `Max retries exceeded: ${errorMessage}` };
    }
  }

  /**
   * Check Client System connectivity
   */
  private async checkClientConnectivity(): Promise<boolean> {
    if (!this.connectivityMonitor) {
      return false;
    }
    const isConnected = this.connectivityMonitor.isConnected();
    console.log(`🔗 [UploadManager] checkClientConnectivity - Monitor says: ${isConnected}`);
    this.status.isClientConnected = isConnected;
    console.log(`🔗 [UploadManager] Updated status.isClientConnected to: ${isConnected}`);
    return isConnected;
  }

  /**
   * Get current upload status
   */
  getStatus(): UploadStatus {
    return { ...this.status };
  }

  /**
   * Get connectivity status
   */
  getConnectivityStatus() {
    if (!this.connectivityMonitor) {
      return null;
    }
    return this.connectivityMonitor.getStatus();
  }

  /**
   * Manually trigger an upload operation
   */
  async triggerUpload(): Promise<void> {
    console.log('Manual upload triggered');
    await this.performUpload();
  }

  /**
   * Manually trigger an upload operation (alias for API compatibility)
   */
  async triggerManualUpload(): Promise<void> {
    return this.triggerUpload();
  }

  /**
   * Get upload statistics
   */
  async getUploadStats(hours: number = 24): Promise<any> {
    return this.database.getSyncStats(hours);
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): any {
    return this.validationMiddleware.getStatistics();
  }

  /**
   * Get latest validation report
   */
  getLatestValidationReport(): any {
    return this.validationMiddleware.getLatestReport();
  }

  /**
   * Calculate exponential backoff delay in minutes
   * 
   * Exponential backoff progression:
   * Retry 1: 2 minutes (2^1)
   * Retry 2: 4 minutes (2^2)
   * Retry 3: 8 minutes (2^3)
   * Retry 4: 16 minutes (2^4)
   * Retry 5: 32 minutes (2^5)
   * Retry 6: 64 minutes (2^6)
   * Retry 7: 128 minutes (2^7)
   * Retry 8: 256 minutes (2^8)
   * Retry 9+: 480 minutes (8 hours) - continues indefinitely
   */
  private calculateBackoff(retryCount: number): number {
    // Calculate exponential backoff in minutes: 2^(retryCount + 1)
    const backoffMinutes = Math.pow(2, retryCount + 1);

    // Cap at 8 hours (480 minutes)
    const cappedMinutes = Math.min(backoffMinutes, 480);

    // Convert to milliseconds for setTimeout
    return cappedMinutes * 60 * 1000;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create upload manager from environment variables
 */
export function createMeterReadingUploadManagerFromEnv(
  database: SyncDatabase,
  apiClient: ClientSystemApiClient
): MeterReadingUploadManager {
  const config: MeterReadingUploadManagerConfig = {
    database,
    apiClient,
    batchSize: parseInt(process.env.BATCH_SIZE || '1000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
  };

  return new MeterReadingUploadManager(config);
}
