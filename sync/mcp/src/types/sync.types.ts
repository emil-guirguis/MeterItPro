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
    active_energy?: number | null;
    active_energy_export?: number | null;
    apparent_energy?: number | null;
    apparent_energy_export?: number | null;
    apparent_power?: number | null;
    apparent_power_phase_a?: number | null;
    apparent_power_phase_b?: number | null;
    apparent_power_phase_c?: number | null;
    current?: number | null;
    current_line_a?: number | null;
    current_line_b?: number | null;
    current_line_c?: number | null;
    frequency?: number | null;
    maximum_demand_real?: number | null;
    power?: number | null;
    power_factor?: number | null;
    power_factor_phase_a?: number | null;
    power_factor_phase_b?: number | null;
    power_factor_phase_c?: number | null;
    power_phase_a?: number | null;
    power_phase_b?: number | null;
    power_phase_c?: number | null;
    reactive_energy?: number | null;
    reactive_energy_export?: number | null;
    reactive_power?: number | null;
    reactive_power_phase_a?: number | null;
    reactive_power_phase_b?: number | null;
    reactive_power_phase_c?: number | null;
    voltage_a_b?: number | null;
    voltage_a_n?: number | null;
    voltage_b_c?: number | null;
    voltage_b_n?: number | null;
    voltage_c_a?: number | null;
    voltage_c_n?: number | null;
    voltage_p_n?: number | null;
    voltage_p_p?: number | null;
    voltage_thd?: number | null;
    voltage_thd_phase_a?: number | null;
    voltage_thd_phase_b?: number | null;
    voltage_thd_phase_c?: number | null;
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
