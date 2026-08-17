/**
 * Meters service - handles meter-related operations
 */

import { MeterEntity } from '../../entities';
import { SyncDatabase } from '../../types';

export class MetersService {
  constructor(private readonly syncDatabase: SyncDatabase) {}

  /**
   * Get all meters, optionally filtered to active only
   */
  async getMeters(activeOnly: boolean = false): Promise<MeterEntity[]> {
    return this.syncDatabase.getMeters(activeOnly);
  }

  /**
   * Upsert a meter (insert or update)
   */
  async upsertMeter(meter: MeterEntity): Promise<void> {
    return this.syncDatabase.upsertMeter(meter);
  }
}
