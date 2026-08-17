/**
 * DEPRECATED: This file has been refactored into the types layer.
 * 
 * This file is kept for backward compatibility and re-exports from the new location.
 * 
 * New imports should use:
 * - import from '../types'
 */

// Re-export collection types for backward compatibility
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
  BACnetMeterReadingAgentConfig,
} from '../types/index.js';
