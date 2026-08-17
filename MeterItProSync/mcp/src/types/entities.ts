/**
 * DEPRECATED: This file has been refactored into separate layers.
 * 
 * This file is kept for backward compatibility and re-exports from the new locations.
 * 
 * New imports should use:
 * - Entities: import from '../entities'
 * - DTOs: import from '../dtos'
 * - Types: import from '../types'
 */

// Re-export entities for backward compatibility
export { TenantEntity, MeterEntity, RegisterEntity, DeviceRegisterEntity, MeterReadingEntity, SyncLog } from '../entities/index.js';

// Re-export types for backward compatibility
export {
  BaseResponse,
  BaseSyncResult,
  BaseSyncStatus,
  EntityMetadata,
  ENTITY_METADATA,
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
  ApiClientConfig,
  BACnetMeterReadingAgentConfig,
  SyncDatabase,
} from './index.js';
