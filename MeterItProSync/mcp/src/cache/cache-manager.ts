/**
 * Central cache manager - singleton pattern
 * All caches are loaded here and accessed globally
 */

import { MeterCache } from './meter-cache.js';
import { DeviceRegisterCache } from './device-register-cache.js';
import { TenantCache } from './tenant-cache.js';

class CacheManager {
  private static instance: CacheManager;

  private meterCache: MeterCache;
  private deviceRegisterCache: DeviceRegisterCache;
  public tenantCache: TenantCache;

  private constructor() {
    this.meterCache = new MeterCache();
    this.deviceRegisterCache = new DeviceRegisterCache();
    this.tenantCache = new TenantCache();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  getMeterCache(): MeterCache {
    return this.meterCache;
  }

  getDeviceRegisterCache(): DeviceRegisterCache {
    return this.deviceRegisterCache;
  }

  getTenantCache(): TenantCache {
    return this.tenantCache;
  }

  /**
   * Initialize all caches from database
   */
  async initializeAll(syncDatabase: any): Promise<void> {
    console.log('📦 [CacheManager] Initializing all caches...');

    await this.tenantCache.initialize(syncDatabase);
    console.log('✅ [CacheManager] TenantCache initialized');

    await this.deviceRegisterCache.initialize(syncDatabase);
    console.log('✅ [CacheManager] DeviceRegisterCache initialized');

    await this.meterCache.reload(syncDatabase);
    console.log('✅ [CacheManager] MeterCache initialized');

    console.log('✅ [CacheManager] All caches initialized');
  }

  /**
   * Reload all caches (called after sync)
   */
  async reloadAll(syncDatabase: any): Promise<void> {
    console.log('🔄 [CacheManager] Reloading all caches...');
    await this.initializeAll(syncDatabase);
    console.log('✅ [CacheManager] All caches reloaded');
  }

  /**
 * Get the tenant ID from cache
 * Since cache always has only one record, returns that tenant's ID
 */
  getTenantId(): number | null {
    const tenantId = this.tenantCache.getTenantId() || null;
    if (!tenantId || tenantId <= 0) {
      throw new Error("Invalid tenant ID in cache");
    }
    return tenantId;
  }

/**
* Get the tenant cache
*/
  getTenant() {
    const tenant = this.tenantCache.getTenant() || null;
    if (!tenant) {
      throw new Error("Invalid tenant cache");
    }
    return tenant;
  }
  

}

export const cacheManager = CacheManager.getInstance();
