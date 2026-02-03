export interface Meter {
  meter_id: number;
  name: string;
  device_id: number | null;
  ip: string | null;
  port: number | null;
  active: boolean;
  element: string;
}
export interface MeterReading {
  id: number;
  meter_id: number;
  timestamp: string;
  data_point: string;
  value: number;
  unit: string | null;
  is_synchronized: boolean;
  retry_count?: number;
}

export interface SyncStatus {
  is_connected: boolean;
  last_sync_at: string | null;
  queue_size: number;
  sync_errors: SyncError[];
  meter_sync?: MeterSyncStatus;
}

export interface MeterSyncStatus {
  last_sync_at: string | null;
  last_sync_success: boolean | null;
  last_sync_error: string | null;
  inserted_count: number;
  updated_count: number;
  deleted_count: number;
  meter_count: number;
  is_syncing: boolean;
}

export interface SyncError {
  id: number;
  batch_size: number;
  error_message: string;
  synced_at: string;
}

export interface TenantError {
  tenant_id: number;
  batch_size: number;
  error_message: string;
  synced_at: string;
}
export interface MeterStatus {
  meter_id: number;
  meter_name: string;
  is_connected: boolean;
  last_reading_at: string | null;
  last_error: string | null;
}

export interface TenantInfo {
  tenant_id: number;
  name: string;
  url?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  active?: boolean;
}

// Re-export connection types
export * from './connection';