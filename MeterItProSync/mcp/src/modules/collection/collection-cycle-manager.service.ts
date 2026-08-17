/**
 * Collection cycle manager service - manages collection cycles
 */

import { SyncDatabase, CollectionCycleResult } from '../../types';

export class CollectionCycleManagerService {
  constructor(private readonly syncDatabase: SyncDatabase) {}

  /**
   * Get recent readings for cycle analysis
   */
  async getRecentReadings(hours: number): Promise<any[]> {
    return this.syncDatabase.getRecentReadings(hours);
  }

  /**
   * Get sync statistics for cycle analysis
   */
  async getSyncStats(hours: number): Promise<any> {
    return this.syncDatabase.getSyncStats(hours);
  }

  /**
   * Log sync operation for cycle tracking
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
}
