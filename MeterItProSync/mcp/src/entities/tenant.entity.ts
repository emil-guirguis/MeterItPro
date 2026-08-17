/**
 * Tenant entity representing a tenant in the system
 * Database table: tenant
 * Primary key: tenant_id
 * Tenant filtered: Yes
 */
export type TenantEntity = {
  tenant_id: number;
  name?: string;
  url?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  api_key?: string;
  download_batch_size?: number;
  upload_batch_size?: number;
};
