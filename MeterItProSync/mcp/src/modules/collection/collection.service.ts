/**
 * Collection service - handles BACnet meter reading collection
 */

import { SyncDatabase, CollectionCycleResult, AgentStatus } from '../../types';

export class CollectionService {
  constructor(private readonly syncDatabase: SyncDatabase) {}

  /**
   * Get unsynchronized readings for collection
   */
  async getUnsynchronizedReadings(limit: number): Promise<any[]> {
    return this.syncDatabase.getUnsynchronizedReadings(limit);
  }

  /**
   * Mark readings as synchronized after collection
   */
  async markReadingsAsSynchronized(readingIds: string[], tenantId?: number): Promise<number> {
    return this.syncDatabase.markReadingsAsSynchronized(readingIds, tenantId);
  }

  /**
   * Log a reading failure during collection
   */
  async logReadingFailure(meterId: string, operation: string, error: string): Promise<void> {
    return this.syncDatabase.logReadingFailure(meterId, operation, error);
  }
}
