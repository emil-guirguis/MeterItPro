/**
 * Main BACnet meter reading agent with scheduling
 * 
 * Handles two independent cron jobs:
 * 1. Collection cycle - collects readings from BACnet devices (every 15 minutes by default)
 * 2. Upload cycle - uploads collected readings to Client System API (every 5 minutes by default)
 */

import * as cron from 'node-cron';
import { BACnetMeterReadingAgentConfig, CollectionCycleResult, AgentStatus, TimeoutMetrics, OfflineMeterStatus } from './types.js';
import { cacheManager } from '../cache/index.js';
import { BACnetClient } from './bacnet-client.js';
import { CollectionCycleManager } from './collection-cycle-manager.js';
import { MeterReadingUploadManager } from './meter-reading-upload-manager.js';
import { CRON_METER_READ, CRON_SYNC_TO_REMOTE } from '../config/scheduling-constants.js';

export class BACnetMeterReadingAgent {
  private config: BACnetMeterReadingAgentConfig;
  private bacnetClient: BACnetClient;
  private cycleManager: CollectionCycleManager;
  private uploadManager?: MeterReadingUploadManager;
  private isRunning: boolean = false;
  private isCycleExecuting: boolean = false;
  private collectionCronJob: cron.ScheduledTask | null = null;
  private uploadCronJob: cron.ScheduledTask | null = null;
  private totalCyclesExecuted: number = 0;
  private totalReadingsCollected: number = 0;
  private totalErrorsEncountered: number = 0;
  private lastCycleResult?: CollectionCycleResult;
  private cumulativeTimeoutMetrics: TimeoutMetrics = {
    totalTimeouts: 0,
    timeoutsByMeter: {},
    averageTimeoutRecoveryMs: 0,
    timeoutEvents: [],
  };
  private offlineMetersMap: Map<string, OfflineMeterStatus> = new Map();
  private logger: any;

  constructor(config: BACnetMeterReadingAgentConfig, logger?: any) {
    this.config = {
      collectionIntervalSeconds: 60,
      enableAutoStart: true,
      bacnetInterface: '0.0.0.0',
      bacnetPort: 47808,
      connectionTimeoutMs: 5000,
      readTimeoutMs: 3000,
      batchReadTimeoutMs: 5000,
      sequentialReadTimeoutMs: 3000,
      connectivityCheckTimeoutMs: 2000,
      enableConnectivityCheck: true,
      enableSequentialFallback: true,
      adaptiveBatchSizing: true,
      ...config,
    };

    this.logger = logger || console;
    // Get singleton cache instances from CacheManager
    this.bacnetClient = new BACnetClient(
      this.config.bacnetInterface,
      this.config.bacnetPort,
      this.config.connectionTimeoutMs
    );
    this.cycleManager = new CollectionCycleManager(this.logger);

    // Initialize upload manager if API client is provided
    if (this.config.apiClient && this.config.syncDatabase) {
      this.uploadManager = new MeterReadingUploadManager({
        database: this.config.syncDatabase,
        apiClient: this.config.apiClient,
        batchSize: 1000,
        maxRetries: 5,
      });
    }
  }

  /**
   * Start the agent and schedule collection and upload cycles
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Agent is already running');
      return;
    }

    try {
      this.logger.info('Starting BACnet Meter Reading Agent');

      // Caches are already populated by CacheManager.initializeAll() in index.ts
      const meterCache = cacheManager.getMeterCache();
      const metersInCache = meterCache.getMeters().length;
      this.logger.info(`✅ [METER CACHE] Using meter cache with ${metersInCache} meters`);
      
      // Set up cron job for collection cycles using CRON_METER_READ constant (10 minutes)
      const collectionCronExpression = CRON_METER_READ;
      this.logger.info(`Scheduling collection cycles with cron: ${collectionCronExpression}`);

      this.collectionCronJob = cron.schedule(collectionCronExpression, async () => {
        // Execute collection cycle if one is not already running
        if (!this.isCycleExecuting) {
          await this.executeCycleInternal();
        } else {
          this.logger.warn('Skipping collection cycle: previous cycle still executing');
        }
      });

      // Start upload manager (if available)
      if (this.uploadManager) {
        this.logger.info('Starting upload manager...');
        await this.uploadManager.start();
        this.logger.info('Upload manager started successfully');

        // Perform initial upload immediately
        this.logger.info('Performing initial upload...');
        await this.uploadManager.performUpload();
        this.logger.info('Initial upload completed');

        const uploadCronExpression = CRON_SYNC_TO_REMOTE;
        this.logger.info(`Scheduling upload cycles with cron: ${uploadCronExpression}`);

        this.uploadCronJob = cron.schedule(uploadCronExpression, async () => {
          if (this.isCycleExecuting) {
            this.logger.info('⏳ [UploadManager] Skipping scheduled upload — collection cycle (including kWh calculation) still in progress');
            return;
          }
          this.logger.info('Cron job triggered - performing scheduled upload');
          await this.uploadManager!.performUpload();
        });
      }

      this.isRunning = true;
      this.logger.info('BACnet Meter Reading Agent started successfully');

      // Auto-start first cycle if enabled
      if (this.config.enableAutoStart) {
        this.logger.info('Triggering initial collection cycle');
        await this.executeCycleInternal();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to start agent: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Stop the agent gracefully
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Agent is not running');
      return;
    }

    try {
      this.logger.info('Stopping BACnet Meter Reading Agent');

      // Stop the collection cron job
      if (this.collectionCronJob) {
        this.collectionCronJob.stop();
        this.collectionCronJob = null;
        this.logger.info('Collection cron job stopped');
      }

      // Stop the upload cron job
      if (this.uploadCronJob) {
        this.uploadCronJob.stop();
        this.uploadCronJob = null;
        this.logger.info('Upload cron job stopped');
      }

      // Stop upload manager
      if (this.uploadManager) {
        await this.uploadManager.stop();
        this.logger.info('Upload manager stopped');
      }

      // Close BACnet connections
      await this.bacnetClient.close();
      this.logger.info('BACnet client closed');

      this.isRunning = false;
      this.logger.info('BACnet Meter Reading Agent stopped successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error during shutdown: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Manually trigger a collection cycle
   */
  async triggerCollection(): Promise<CollectionCycleResult> {
    if (!this.isRunning) {
      throw new Error('Agent is not running');
    }

    // Prevent overlapping execution with scheduled cycle
    if (this.isCycleExecuting) {
      throw new Error('Collection cycle is already executing');
    }

    return this.executeCycleInternal();
  }

  /**
   * Internal method to execute a collection cycle
   */
  private async executeCycleInternal(): Promise<CollectionCycleResult> {
    // Set lock to prevent overlapping execution
    this.isCycleExecuting = true;

    try {
      // Note: Do NOT reload meter cache on every cycle
      // The cache is loaded at startup and reloaded by the sync agent when data changes
      // Reloading on every cycle would cause unnecessary database queries

      // Execute the collection cycle
      const result = await this.cycleManager.executeCycle(
        this.bacnetClient,
        this.config.syncDatabase,
        this.config.readTimeoutMs
      );

      // Update metrics
      this.totalCyclesExecuted++;
      this.totalReadingsCollected += result.readingsCollected;
      this.totalErrorsEncountered += result.errors.length;
      this.lastCycleResult = result;

      // Accumulate timeout metrics from this cycle
      if (result.timeoutMetrics) {
        this.accumulateTimeoutMetrics(result.timeoutMetrics);
      }

      // Update offline meters tracking from cycle result
      this.updateOfflineMetersFromCycle(result);

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Collection cycle failed: ${errorMsg}`);

      // Record the error in metrics
      this.totalCyclesExecuted++;
      this.totalErrorsEncountered++;

      throw error;
    } finally {
      // Release the lock
      this.isCycleExecuting = false;
    }
  }

  /**
   * Accumulate timeout metrics from a cycle into cumulative metrics
   */
  private accumulateTimeoutMetrics(cycleMetrics: TimeoutMetrics): void {
    // Add to total timeouts
    this.cumulativeTimeoutMetrics.totalTimeouts += cycleMetrics.totalTimeouts;

    // Merge timeout counts by meter
    for (const [meterId, count] of Object.entries(cycleMetrics.timeoutsByMeter)) {
      if (!this.cumulativeTimeoutMetrics.timeoutsByMeter[meterId]) {
        this.cumulativeTimeoutMetrics.timeoutsByMeter[meterId] = 0;
      }
      this.cumulativeTimeoutMetrics.timeoutsByMeter[meterId] += count;
    }

    // Update last timeout time
    if (cycleMetrics.lastTimeoutTime) {
      this.cumulativeTimeoutMetrics.lastTimeoutTime = cycleMetrics.lastTimeoutTime;
    }

    // Accumulate timeout events
    if (cycleMetrics.timeoutEvents) {
      this.cumulativeTimeoutMetrics.timeoutEvents.push(...cycleMetrics.timeoutEvents);
    }

    // Recalculate average timeout recovery time
    if (this.cumulativeTimeoutMetrics.totalTimeouts > 0) {
      const totalRecoveryTime = this.cumulativeTimeoutMetrics.timeoutEvents.reduce(
        (sum, event) => sum + event.timeoutMs,
        0
      );
      this.cumulativeTimeoutMetrics.averageTimeoutRecoveryMs =
        totalRecoveryTime / this.cumulativeTimeoutMetrics.totalTimeouts;
    }

    this.logger.debug(
      `Accumulated timeout metrics: total=${this.cumulativeTimeoutMetrics.totalTimeouts}, ` +
      `average recovery=${this.cumulativeTimeoutMetrics.averageTimeoutRecoveryMs.toFixed(2)}ms`
    );
  }

  /**
   * Track offline meter status
   */
  private trackOfflineMeter(meterId: string): void {
    const meterIdStr = String(meterId);
    const now = new Date();

    if (this.offlineMetersMap.has(meterIdStr)) {
      // Meter already offline, increment consecutive failures
      const status = this.offlineMetersMap.get(meterIdStr)!;
      status.consecutiveFailures++;
      status.lastCheckedAt = now;
    } else {
      // New offline meter
      const status: OfflineMeterStatus = {
        meterId: meterIdStr,
        lastCheckedAt: now,
        consecutiveFailures: 1,
        offlineSince: now,
      };
      this.offlineMetersMap.set(meterIdStr, status);
      this.logger.warn(`🔴 Meter ${meterIdStr} marked as offline`);
    }
  }

  /**
   * Clear offline status for a meter when it comes back online
   */
  private clearOfflineMeter(meterId: string): void {
    const meterIdStr = String(meterId);
    if (this.offlineMetersMap.has(meterIdStr)) {
      this.offlineMetersMap.delete(meterIdStr);
      this.logger.info(`✅ Meter ${meterIdStr} is back online`);
    }
  }

  /**
   * Check for consistently slow meters and log warnings
   */
  private checkForSlowMeters(): void {
    const slowMeterThreshold = 3; // Number of timeouts to consider a meter slow
    const slowMeters: string[] = [];

    for (const [meterId, count] of Object.entries(this.cumulativeTimeoutMetrics.timeoutsByMeter)) {
      if (count >= slowMeterThreshold) {
        slowMeters.push(`${meterId} (${count} timeouts)`);
      }
    }

    if (slowMeters.length > 0) {
      this.logger.warn(
        `⚠️  Consistently slow meters detected: ${slowMeters.join(', ')}. Consider increasing timeout values or reducing batch sizes.`
      );
    }
  }

  /**
   * Update offline meters from cycle result
   */
  private updateOfflineMetersFromCycle(result: CollectionCycleResult): void {
    // Track meters that had connectivity errors
    for (const error of result.errors) {
      if (error.operation === 'connectivity') {
        this.trackOfflineMeter(error.meterId);
      }
    }

    // Track meters that had offline timeout events
    if (result.timeoutMetrics?.timeoutEvents) {
      for (const event of result.timeoutMetrics.timeoutEvents) {
        if (event.recoveryMethod === 'offline') {
          this.trackOfflineMeter(event.meterId);
        }
      }
    }

    // Check for consistently slow meters
    this.checkForSlowMeters();
  }

  /**
   * Get current agent status
   */
  getStatus(): AgentStatus {
    return {
      isRunning: this.isRunning,
      lastCycleResult: this.lastCycleResult,
      totalCyclesExecuted: this.totalCyclesExecuted,
      totalReadingsCollected: this.totalReadingsCollected,
      totalErrorsEncountered: this.totalErrorsEncountered,
      activeErrors: this.lastCycleResult?.errors || [],
      timeoutMetrics: this.cumulativeTimeoutMetrics,
      offlineMeters: Array.from(this.offlineMetersMap.values()),
    };
  }
}
