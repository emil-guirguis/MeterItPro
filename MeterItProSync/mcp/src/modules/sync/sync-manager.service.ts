/**
 * Sync manager service - orchestrates sync operations
 */

import { SyncDatabase, ComprehensiveSyncResult } from '../../types';

export class SyncManagerService {
  constructor(private readonly syncDatabase: SyncDatabase) {}

  /**
   * Get unsynchronized readings
   */
  async getUnsynchronizedReadings(limit: number): Promise<any[]> {
    return this.syncDatabase.getUnsynchronizedReadings(limit);
  }

  /**
   * Mark readings as synchronized
   */
  async markReadingsAsSynchronized(readingIds: string[], tenantId?: number): Promise<number> {
    return this.syncDatabase.markReadingsAsSynchronized(readingIds, tenantId);
  }

  /**
   * Mark readings as pending
   */
  async markReadingsAsPending(readingIds: string[]): Promise<void> {
    return this.syncDatabase.markReadingsAsPending(readingIds);
  }

  /**
   * Delete synchronized readings
   */
  async deleteSynchronizedReadings(readingIds: string[]): Promise<number> {
    return this.syncDatabase.deleteSynchronizedReadings(readingIds);
  }

  /**
   * Delete old readings before a cutoff date
   */
  async deleteOldReadings(cutoffDate: Date): Promise<number> {
    return this.syncDatabase.deleteOldReadings(cutoffDate);
  }

  /**
   * Increment retry count for readings
   */
  async incrementRetryCount(readingIds: string[]): Promise<void> {
    return this.syncDatabase.incrementRetryCount(readingIds);
  }

  /**
   * Log a reading failure
   */
  async logReadingFailure(meterId: string, operation: string, error: string): Promise<void> {
    return this.syncDatabase.logReadingFailure(meterId, operation, error);
  }

  /**
   * Get recent readings
   */
  async getRecentReadings(hours: number): Promise<any[]> {
    return this.syncDatabase.getRecentReadings(hours);
  }
}
