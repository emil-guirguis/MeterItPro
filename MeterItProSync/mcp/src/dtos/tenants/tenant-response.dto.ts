/**
 * DTO for tenant API response
 */
export interface TenantResponseDto {
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
}
