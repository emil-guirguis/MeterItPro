# Design: BACnet Batch Read Timeout Configuration Fix

## Overview

The BACnet meter reading system has a critical bug where batch read operations are using the wrong timeout value. The `readTimeoutMs` (3 seconds, intended for sequential reads) is being passed to batch read operations instead of `batchReadTimeoutMs` (5 seconds). This causes batch reads to timeout prematurely, triggering unnecessary batch size reductions and cascading failures.

The fix involves:
1. Passing the correct timeout parameter to batch read operations
2. Ensuring sequential fallback uses its own timeout
3. Verifying timeout metrics accurately reflect the operation type
4. Adding logging to confirm correct timeout usage

## Architecture

### Current Flow (Broken)
```
Collection Cycle Manager
  ├─ readMeterDataPoints(meter, bacnetClient, readTimeoutMs=3000)
  │  └─ performBatchReadWithAdaptiveSizing(...)
  │     └─ bacnetClient.readPropertyMultiple(..., readTimeoutMs=3000)  ❌ WRONG
  │        └─ Timeout after 3 seconds instead of 5 seconds
  │           └─ Triggers batch size reduction
  │              └─ Cascading failures
```

### Fixed Flow
```
Collection Cycle Manager
  ├─ readMeterDataPoints(meter, bacnetClient, readTimeoutMs, batchReadTimeoutMs)
  │  └─ performBatchReadWithAdaptiveSizing(..., batchReadTimeoutMs=5000)
  │     ├─ bacnetClient.readPropertyMultiple(..., batchReadTimeoutMs=5000)  ✅ CORRECT
  │     │  └─ Timeout after 5 seconds as configured
  │     └─ On failure: bacnetClient.readPropertySequential(..., sequentialReadTimeoutMs=3000)  ✅ CORRECT
  │        └─ Timeout after 3 seconds as configured
```

## Components and Interfaces

### 1. Collection Cycle Manager Changes

**File**: `MeterItProSync/mcp/src/bacnet-collection/collection-cycle-manager.ts`

**Changes**:
- Add `batchReadTimeoutMs` parameter to `executeCycle()` method
- Pass `batchReadTimeoutMs` to `readMeterDataPoints()`
- Pass `batchReadTimeoutMs` to `performBatchReadWithAdaptiveSizing()`
- Update method signatures to accept both timeout values

**Key Methods**:
```typescript
async executeCycle(
  bacnetClient: BACnetClient,
  database: any,
  readTimeoutMs: number = 3000,
  batchReadTimeoutMs: number = 5000  // NEW PARAMETER
): Promise<CollectionCycleResult>

private async readMeterDataPoints(
  meter: any,
  bacnetClient: BACnetClient,
  readTimeoutMs: number,
  batchReadTimeoutMs: number,  // NEW PARAMETER
  errors: CollectionError[]
): Promise<PendingReading[]>

private async performBatchReadWithAdaptiveSizing(
  meter: any,
  bacnetClient: BACnetClient,
  allRequests: BatchReadRequest[],
  deviceRegisters: any[],
  readTimeoutMs: number,
  batchReadTimeoutMs: number  // NEW PARAMETER
): Promise<any[]>
```

### 2. BACnet Reading Agent Changes

**File**: `MeterItProSync/mcp/src/bacnet-collection/bacnet-reading-agent.ts`

**Changes**:
- Pass `batchReadTimeoutMs` when calling `cycleManager.executeCycle()`
- Add logging to confirm timeout values at startup

**Key Changes**:
```typescript
const result = await this.cycleManager.executeCycle(
  this.bacnetClient,
  this.config.syncDatabase,
  this.config.readTimeoutMs,
  this.config.batchReadTimeoutMs  // NEW PARAMETER
);
```

### 3. Batch Read Operation

**File**: `MeterItProSync/mcp/src/bacnet-collection/collection-cycle-manager.ts`

**Changes in `performBatchReadWithAdaptiveSizing()`**:
- Use `batchReadTimeoutMs` for batch read operations
- Use `readTimeoutMs` for sequential fallback operations
- Log which timeout is being used for each operation

```typescript
// Batch read with correct timeout
const batchResults = await bacnetClient.readPropertyMultiple(
  meter.ip,
  port,
  batchRequests,
  batchReadTimeoutMs  // ✅ CORRECT TIMEOUT
);

// Sequential fallback with correct timeout
const sequentialResults = await bacnetClient.readPropertySequential(
  meter.ip,
  port,
  batchRequests,
  readTimeoutMs  // ✅ CORRECT TIMEOUT
);
```

## Data Models

No changes to data models. The fix only affects parameter passing and timeout configuration.

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Batch Read Uses Correct Timeout

**For any** batch read operation with a configured batchReadTimeoutMs value, the operation SHALL timeout after exactly batchReadTimeoutMs milliseconds if the device doesn't respond.

**Validates: Requirements 1.1, 1.3**

### Property 2: Sequential Fallback Uses Correct Timeout

**For any** sequential fallback read operation with a configured sequentialReadTimeoutMs value, the operation SHALL timeout after exactly sequentialReadTimeoutMs milliseconds if the device doesn't respond.

**Validates: Requirements 1.2, 1.4**

### Property 3: Timeout Metrics Reflect Operation Type

**For any** timeout event recorded in the metrics, the timeoutMs value SHALL match the timeout configuration used for that operation type (batchReadTimeoutMs for batch operations, sequentialReadTimeoutMs for sequential operations).

**Validates: Requirements 2.3, 3.1, 3.2**

### Property 4: Configuration Consistency at Startup

**When** the BACnet Reading Agent starts, the logger SHALL output all timeout configuration values, confirming that batchReadTimeoutMs and sequentialReadTimeoutMs are correctly set.

**Validates: Requirements 2.1, 2.4**

## Error Handling

### Timeout Handling
- Batch read timeouts: Reduce batch size and retry with same timeout
- Sequential fallback timeouts: Record as failed and move to next batch
- Timeout events: Always recorded with correct timeout value for metrics

### Logging
- Log timeout values at agent startup
- Log which timeout is being used for each operation
- Log timeout events with correct duration values

## Testing Strategy

### Unit Tests
- Test that `executeCycle()` passes correct timeout values to `readMeterDataPoints()`
- Test that `readMeterDataPoints()` passes correct timeout values to `performBatchReadWithAdaptiveSizing()`
- Test that batch read operations use `batchReadTimeoutMs`
- Test that sequential fallback operations use `readTimeoutMs`
- Test timeout metrics record correct values for each operation type

### Property-Based Tests

**Property 1: Batch Read Timeout Correctness**
- Generate random batch read requests
- Verify that timeout occurs at batchReadTimeoutMs (not readTimeoutMs)
- Verify that timeout events record batchReadTimeoutMs value

**Property 2: Sequential Fallback Timeout Correctness**
- Generate random sequential read requests
- Verify that timeout occurs at readTimeoutMs (not batchReadTimeoutMs)
- Verify that timeout events record readTimeoutMs value

**Property 3: Timeout Metrics Consistency**
- Generate random timeout events for both batch and sequential operations
- Verify that metrics correctly distinguish between operation types
- Verify that accumulated metrics maintain correct timeout values

**Property 4: Configuration Propagation**
- Verify that agent configuration values are correctly passed through all layers
- Verify that timeout values don't change during operation
- Verify that logging confirms correct values at startup

