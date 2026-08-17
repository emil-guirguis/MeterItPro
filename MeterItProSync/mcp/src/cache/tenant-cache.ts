/**
 * In-memory cache for tenant configuration and API keys
 * Loaded at MCP server startup for fast access to tenant data
 */

export interface CachedTenant {
  tenant_id: number;
  name: string;
  street?: string,
  street2?: string,
  city?: string,
  state?: string,
  zip?: string,
  country?: string,
  api_key?: string;
  download_batch_size?: number;
  upload_batch_size?: number;
}

export class TenantCache {
  private tenants: Map<number, CachedTenant> = new Map();
  private valid: boolean = false;

  /**
   * Load all tenants from database at startup
   */
  async initialize(syncDatabase: any): Promise<void> {
    try {
      console.log('📦 [TenantCache] Initializing tenant cache...');

      this.tenants.clear();
      this.valid = false;

      // Load tenant from database
      console.log('📦 [TenantCache] Loading tenant from database...');
      const tenant = await syncDatabase.getTenant();

      if (!tenant) {
        console.warn('⚠️  [TenantCache] WARNING: No tenant found in database!');
        this.valid = false;
        return;
      }

      const cached: CachedTenant = {
        tenant_id: tenant.tenant_id,
        name: tenant.name,
        street: tenant.street,
        street2: tenant.street2,
        city: tenant.city,
        state: tenant.state,
        zip: tenant.zip,
        country: tenant.country,
        api_key: tenant.api_key,
        download_batch_size: tenant.download_batch_size || 1000,
        upload_batch_size: tenant.upload_batch_size || 100,
      };

      this.tenants.set(tenant.tenant_id, cached);
      this.valid = true;

      console.log(`✅ [TenantCache] Loaded tenant ${tenant.tenant_id}: ${tenant.name}`);
      if (tenant.api_key) {
        console.log(`✅ [TenantCache] API key available: ${tenant.api_key.substring(0, 8)}...`);
      }
    } catch (error) {
      console.error('❌ [TenantCache] Failed to initialize:', error);
      this.valid = false;
      throw error;
    }
  }

  /**
   * Get all cached tenants
   */
  getTenants(): CachedTenant[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Get a specific tenant from cache
   */
  getTenant(tenantId?: number): CachedTenant | null {
    if (tenantId === undefined) {
      // Return first tenant if no ID specified
      const tenants = Array.from(this.tenants.values());
      return tenants.length > 0 ? tenants[0] : null;
    }
    return this.tenants.get(tenantId) || null;
  }

  /**
   * Get the tenant ID from cache
   * Since cache always has only one record, returns that tenant's ID
   */
  getTenantId(): number | null {
    const tenantId = this.getTenant()?.tenant_id || null;
    if (!tenantId || tenantId <= 0) {
      throw new Error("Invalid tenant ID in cache");
    }
    return tenantId;
  }

  /**
   * Check if cache is valid
   */
  isValid(): boolean {
    return this.valid;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.tenants.clear();
    this.valid = false;
  }

  /**
   * Reload tenant data from database
   */
  async reload(syncDatabase: any): Promise<void> {
    await this.initialize(syncDatabase);
  }
}
