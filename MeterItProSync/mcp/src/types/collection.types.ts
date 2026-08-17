/**
 * BACnet collection types and interfaces
 */

/**
 * Register map for BACnet data points
 */
export interface RegisterMap {
  [dataPointName: string]: {
    objectType: string;      // e.g., "analogInput", "analogOutput"
    objectInstance: number;  // e.g., 0, 1, 2
    propertyId: string;      // e.g., "presentValue", "units"
  };
}

/**
 * Result of a BACnet read operation
 */
export interface BACnetReadResult {
  success: boolean;
  value?: any;
  unit?: string;
  error?: string;
}

/**
 * Collection error during meter reading
 */
export interface CollectionError {
  meterId: string;
  dataPoint?: string;
  operation: 'connect' | 'read' | 'write' | 'connectivity';
  error: string;
  timestamp: Date;
}

/**
 * Timeout event during collection
 */
export interface TimeoutEvent {
  meterId: string;
  timestamp: Date;
  registerCount: number;
  batchSize: number;
  timeoutMs: number;
  recoveryMethod: 'sequential' | 'reduced_batch' | 'offline';
  success: boolean;
}

/**
 * Timeout metrics for collection operations
 */
export interface TimeoutMetrics {
  totalTimeouts: number;
  timeoutsByMeter: Record<string, number>;
  averageTimeoutRecoveryMs: number;
  lastTimeoutTime?: Date;
  timeoutEvents: TimeoutEvent[];
}

/**
 * Result of a collection cycle
 */
export interface CollectionCycleResult {
  cycleId: string;
  startTime: Date;
  endTime: Date;
  metersProcessed: number;
  readingsCollected: number;
  errors: CollectionError[];
  success: boolean;
  timeoutMetrics?: TimeoutMetrics;
}

/**
 * Status of an offline meter
 */
export interface OfflineMeterStatus {
  meterId: string;
  lastCheckedAt: Date;
  consecutiveFailures: number;
  offlineSince?: Date;
}

/**
 * Status of the collection agent
 */
export interface AgentStatus {
  isRunning: boolean;
  lastCycleResult?: CollectionCycleResult;
  totalCyclesExecuted: number;
  totalReadingsCollected: number;
  totalErrorsEncountered: number;
  activeErrors: CollectionError[];
  timeoutMetrics?: TimeoutMetrics;
  offlineMeters: OfflineMeterStatus[];
}

/**
 * Pending reading from collection
 */
export interface PendingReading {
  meter_id: number;
  meter_element_id: number;
  field_name: string;
  value: number;
  created_at: Date;
  element: string;
  register: number;
}

/**
 * Validation result for readings
 */
export interface ValidationResult {
  valid: number;
  invalid: number;
  skipped: number;
  errors: ValidationError[];
}

/**
 * Validation error for a reading
 */
export interface ValidationError {
  readingIndex: number;
  reading: PendingReading;
  errors: string[];
}

/**
 * Result of batch insertion
 */
export interface BatchInsertionResult {
  success: boolean;
  totalReadings: number;
  insertedCount: number;
  failedCount: number;
  skippedCount: number;
  timestamp: Date;
  errors?: string[];
  retryAttempts: number;
  insertedReadingIds?: string[];  // IDs of successfully inserted readings
}
