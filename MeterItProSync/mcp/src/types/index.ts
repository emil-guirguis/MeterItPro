/**
 * Type Layer - Centralized exports for all TypeScript types and interfaces
 * Types define pure TypeScript constructs without validation or ORM decorators
 */

// Entity types (imported directly from entities layer)
export type { MeterReadingEntity } from '../entities/meter-reading.entity.js';

// Common types
export { BaseResponse, BaseSyncResult, BaseSyncStatus, EntityMetadata, ENTITY_METADATA } from './common.types.js';

// Sync types
export {
  SyncResult,
  SyncStatus,
  MeterSyncResult,
  MeterSyncStatus,
  ComprehensiveSyncResult,
  SyncOperationType,
  AuthResponse,
  ConfigDownloadResponse,
  BatchUploadRequest,
  BatchUploadResponse,
} from './sync.types.js';

// Collection types
export {
  RegisterMap,
  BACnetReadResult,
  CollectionError,
  TimeoutEvent,
  TimeoutMetrics,
  CollectionCycleResult,
  OfflineMeterStatus,
  AgentStatus,
  PendingReading,
  ValidationResult,
  ValidationError,
  BatchInsertionResult,
} from './collection.types.js';

// Config types
export { ApiClientConfig, BACnetMeterReadingAgentConfig } from './config.types.js';

// Database types
export { SyncDatabase } from './database.types.js';
