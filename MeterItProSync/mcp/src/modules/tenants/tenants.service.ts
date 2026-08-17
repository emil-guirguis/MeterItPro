/**
 * Tenants service - handles tenant-related operations
 */

import { TenantEntity } from '../../entities';
import { SyncDatabase } from '../../types';

export class TenantsService {
  constructor(private readonly syncDatabase: SyncDatabase) {}

  /**
   * Get the current tenant
   */
  async getTenant(): Promise<TenantEntity | null> {
    return this.syncDatabase.getTenant();
  }

  /**
   * Update tenant API key
   */
  async updateTenantApiKey(apiKey: string): Promise<void> {
    return this.syncDatabase.updateTenantApiKey(apiKey);
  }

  /**
   * Get tenant batch configuration
   */
  async getTenantBatchConfig(tenantId: number): Promise<{ downloadBatchSize: number; uploadBatchSize: number }> {
    return this.syncDatabase.getTenantBatchConfig(tenantId);
  }
}
