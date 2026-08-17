/**
 * Sync operation types and interfaces
 */

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  error?: string;
  timestamp: Date;
}

/**
 * Status of an ongoing sync operation
 */
export interface SyncStatus {
  isRunning: boolean;
  isSyncing: boolean;
  lastSyncTime?: Date;
  lastSyncSuccess?: boolean;
  lastSyncError?: string;
  lastSyncSkipped?: boolean;
  lastSyncSkipReason?: string;
  lastInsertedCount: number;
  lastUpdatedCount: number;
  lastDeletedCount: number;
  count: number;
}

/**
 * Meter sync result
 */
export interface MeterSyncResult extends SyncResult {}

/**
 * Meter sync status
 */
export interface MeterSyncStatus extends SyncStatus {}

/**
 * Comprehensive sync result that aggregates results from all four sync operations:
 * tenants, meters, registers, and device_register associations
 */
export interface ComprehensiveSyncResult {
  success: boolean;
  tenants: {
    inserted: number;
    updated: number;
    deleted: number;
  };
  meters: {
    inserted: number;
    updated: number;
    deleted: number;
  };
  registers: {
    inserted: number;
    updated: number;
    deleted: number;
  };
  deviceRegisters: {
    inserted: number;
    updated: number;
    deleted: number;
    skipped: number;
  };
  error?: string;
  timestamp: Date;
}

/**
 * Sync operation types
 */
export enum SyncOperationType {
  TENANT_SYNC = 'tenant_sync',
  METER_SYNC = 'meter_sync',
  REGISTER_SYNC = 'register_sync',
  DEVICE_REGISTER_SYNC = 'device_register_sync',
  READING_UPLOAD = 'reading_upload',
}

/**
 * Auth response from API
 */
export interface AuthResponse {
  success: boolean;
  siteId?: string;
  message?: string;
}

/**
 * Config download response from API
 */
export interface ConfigDownloadResponse {
  meters: any[];
}

/**
 * Batch upload request for meter readings
 */
export interface BatchUploadRequest {
  readings: Array<{
    meter_id: number;
    meter_element_id?: number | null;
    kwh?: number | null;
    mwh?: number | null;
    kvah?: number | null;
    kvah_export?: number | null;
    kva?: number | null;
    phase_kva_a?: number | null;
    phase_kva_b?: number | null;
    phase_kva_c?: number | null;
    amperage?: number | null;
    phase_amperage_a?: number | null;
    phase_amperage_b?: number | null;
    phase_amperage_c?: number | null;
    frequency?: number | null;
    peak_kw?: number | null;
    kw?: number | null;
    power_factor?: number | null;
    pf_a?: number | null;
    pf_b?: number | null;
    pf_c?: number | null;
    phase_kw_a?: number | null;
    phase_kw_b?: number | null;
    phase_kw_c?: number | null;
    kvarh?: number | null;
    reactive_energy_export?: number | null;
    kvar?: number | null;
    phase_kvar_a?: number | null;
    phase_kvar_b?: number | null;
    phase_kvar_c?: number | null;
    voltage_a_b?: number | null;
    voltage_a_n?: number | null;
    voltage_b_c?: number | null;
    voltage_b_n?: number | null;
    voltage_c_a?: number | null;
    voltage_c_n?: number | null;
    voltage_p_n?: number | null;
    voltage_p_p?: number | null;
    total_thdv?: number | null;
    phase_thdv_a?: number | null;
    phase_thdv_b?: number | null;
    phase_thdv_c?: number | null;
    calculated_kwh?: number | null;
  }>;
}

/**
 * Batch upload response
 */
export interface BatchUploadResponse {
  success: boolean;
  recordsProcessed: number;
  message?: string;
}
