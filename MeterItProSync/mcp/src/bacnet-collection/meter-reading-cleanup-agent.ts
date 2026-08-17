/**
 * Meter Reading Cleanup Agent
 * 
 * Deletes meter readings older than 2 months to manage database size.
 * Runs on a scheduled cron job (default: daily at 2 AM).
 */

import * as cron from 'node-cron';
import { SyncDatabase } from '../types/index.js';
import { CRON_METER_READING_CLEANUP } from '../config/scheduling-constants.js';

export interface MeterReadingCleanupAgentConfig {
  database: SyncDatabase;
  retentionDays?: number; // Default: 60 days (2 months)
  enableAutoStart?: boolean;
}

export interface CleanupStatus {
  isRunning: boolean;
  lastCleanupTime?: Date;
  lastCleanupSuccess?: boolean;
  lastCleanupError?: string;
  totalDeletedReadings: number;
}

export class MeterReadingCleanupAgent {
  private database: SyncDatabase;
  private retentionDays: number;
  private enableAutoStart: boolean;
  private cronJob?: cron.ScheduledTask;
  private isRunning: boolean = false;
  private isCleanupExecuting: boolean = false;
  private status: CleanupStatus = {
    isRunning: false,
    totalDeletedReadings: 0,
  };
  private logger: any;

  constructor(config: MeterReadingCleanupAgentConfig, logger?: any) {
    this.database = config.database;
    this.retentionDays = config.retentionDays || 60; // 2 months default
    this.enableAutoStart = config.enableAutoStart !== false;
    this.logger = logger || console;
  }

  /**
   * Start the cleanup agent
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Cleanup agent is already running');
      return;
    }

    try {
      this.logger.info(`🧹 Starting Meter Reading Cleanup Agent (retention: ${this.retentionDays} days)`);

      // Schedule cleanup job
      this.cronJob = cron.schedule(CRON_METER_READING_CLEANUP, async () => {
        await this.executeCleanup();
      });

      this.isRunning = true;
      this.status.isRunning = true;
      this.logger.info(`🧹 Cleanup agent started - scheduled with cron: ${CRON_METER_READING_CLEANUP}`);

      // Run initial cleanup if enabled
      if (this.enableAutoStart) {
        this.logger.info('🧹 Running initial cleanup');
        await this.executeCleanup();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to start cleanup agent: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Stop the cleanup agent
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Cleanup agent is not running');
      return;
    }

    try {
      if (this.cronJob) {
        this.cronJob.stop();
        this.cronJob = undefined;
      }

      this.isRunning = false;
      this.status.isRunning = false;
      this.logger.info('🧹 Cleanup agent stopped');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error stopping cleanup agent: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Execute cleanup - delete readings older than retention period
   */
  private async executeCleanup(): Promise<void> {
    // Prevent overlapping cleanup executions
    if (this.isCleanupExecuting) {
      this.logger.warn('Cleanup is already executing, skipping');
      return;
    }

    this.isCleanupExecuting = true;

    try {
      this.logger.info(`🧹 Starting cleanup - deleting readings older than ${this.retentionDays} days`);

      // Calculate cutoff date (2 months ago)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      // Delete old readings
      const deletedCount = await this.database.deleteOldReadings(cutoffDate);

      this.status.lastCleanupTime = new Date();
      this.status.lastCleanupSuccess = true;
      this.status.lastCleanupError = undefined;
      this.status.totalDeletedReadings += deletedCount;

      this.logger.info(`✅ Cleanup completed - deleted ${deletedCount} readings older than ${cutoffDate.toISOString()}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Cleanup failed: ${errorMsg}`);

      this.status.lastCleanupTime = new Date();
      this.status.lastCleanupSuccess = false;
      this.status.lastCleanupError = errorMsg;
    } finally {
      this.isCleanupExecuting = false;
    }
  }

  /**
   * Manually trigger cleanup
   */
  async triggerCleanup(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Cleanup agent is not running');
    }

    await this.executeCleanup();
  }

  /**
   * Get cleanup status
   */
  getStatus(): CleanupStatus {
    return { ...this.status };
  }
}
