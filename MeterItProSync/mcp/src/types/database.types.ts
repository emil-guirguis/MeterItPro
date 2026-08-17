/**
 * Database service interface and types
 */

import {
  TenantEntity,
  MeterEntity,
  RegisterEntity,
  DeviceRegisterEntity,
  MeterReadingEntity,
  SyncLog,
} from '../entities';

/**
 * Sync database service interface
 * Defines all database operations for the sync system
 */
export interface SyncDatabase {
  // ==================== TENANT METHODS ====================
  getTenant(): Promise<TenantEntity | null>;
  updateTenantApiKey(apiKey: string): Promise<void>;
  getTenantBatchConfig(tenantId: number): Promise<{ downloadBatchSize: number; uploadBatchSize: number }>;

  // ==================== METER METHODS ====================
  getMeters(activeOnly: boolean): Promise<MeterEntity[]>;
  upsertMeter(meter: MeterEntity): Promise<void>;

  // ==================== REGISTER METHODS ====================
  /**
   * Get all registers from the sync database
   */
  getRegisters(): Promise<RegisterEntity[]>;

  /**
   * Upsert a register into the sync database
   */
  upsertRegister(register: RegisterEntity): Promise<void>;

  /**
   * Delete a register from the sync database
   */
  deleteRegister(registerId: number): Promise<void>;

  // ==================== DEVICE_REGISTER METHODS ====================
  /**
   * Get all device_register associations from the sync database
   */
  getDeviceRegisters(): Promise<DeviceRegisterEntity[]>;

  /**
   * Upsert a device_register association into the sync database
   */
  upsertDeviceRegister(deviceRegister: DeviceRegisterEntity): Promise<void>;

  /**
   * Delete a device_register association from the sync database
   */
  deleteDeviceRegister(deviceId: number, registerId: number): Promise<void>;

  // ==================== METER READING METHODS ====================
  getUnsynchronizedReadings(limit: number): Promise<MeterReadingEntity[]>;
  deleteSynchronizedReadings(readingIds: string[]): Promise<number>;
  markReadingsAsPending(readingIds: string[]): Promise<void>;
  markReadingsAsSynchronized(readingIds: string[], tenantId?: number): Promise<number>;
  deleteOldReadings(cutoffDate: Date): Promise<number>;
  incrementRetryCount(readingIds: string[]): Promise<void>;
  logReadingFailure(meterId: string, operation: string, error: string): Promise<void>;
  getRecentReadings(hours: number): Promise<MeterReadingEntity[]>;

  // ==================== SYNC LOG METHODS ====================
  logSyncOperation(operationType: string, readingsCount: number, success: boolean, errorMessage?: string, details?: string): Promise<void>;
  getRecentSyncLogs(limit: number): Promise<SyncLog[]>;
  getSyncStats(hours: number): Promise<any>;
}
