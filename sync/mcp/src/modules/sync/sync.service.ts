/**
 * Sync service - handles sync operations
 */

import { SyncDatabase, SyncResult, ComprehensiveSyncResult } from '../../types';

export class SyncService {
  constructor(private readonly syncDatabase: SyncDatabase) {}

  /**
   * Log a sync operation
   */
  async logSyncOperation(
    operationType: string,
    readingsCount: number,
    success: boolean,
    errorMessage?: string,
    details?: string,
  ): Promise<void> {
    return this.syncDatabase.logSyncOperation(operationType, readingsCount, success, errorMessage, details);
  }

  /**
   * Get recent sync logs
   */
  async getRecentSyncLogs(limit: number): Promise<any[]> {
    return this.syncDatabase.getRecentSyncLogs(limit);
  }

  /**
   * Get sync statistics for the last N hours
   */
  async getSyncStats(hours: number): Promise<any> {
    return this.syncDatabase.getSyncStats(hours);
  }
}
