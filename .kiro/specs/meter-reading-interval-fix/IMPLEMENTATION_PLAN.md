# Implementation Plan: Meter Reading Collection Interval Fix

## Overview

Fix the meter reading collection interval discrepancy by:
1. Creating a configuration-based cron expression function
2. Adding comprehensive logging to track cycle execution
3. Implementing cycle skip detection and reporting
4. Verifying the actual interval matches the configured interval

## Tasks

### Phase 1: Add Logging Infrastructure

- [ ] 1.1 Add cycle execution tracking to BACnetMeterReadingAgent
  - Add `lastCycleStartTime` and `lastCycleEndTime` timestamps
  - Add `skippedCycleCount` counter
  - Add `cycleExecutionTimes` array to track duration of each cycle
  - _Requirements: Requirement 2 (Comprehensive Logging)_

- [ ] 1.2 Add logging to cron trigger handler
  - Log when cron job is triggered with timestamp
  - Log whether cycle will execute or be skipped
  - Log reason for skip (cycle still executing)
  - _Requirements: Requirement 2.1_

- [ ] 1.3 Add logging to cycle start/end
  - Log cycle start with timestamp and cycle number
  - Log cycle end with timestamp, duration, and readings collected
  - Log any errors encountered during cycle
  - _Requirements: Requirement 2.2, 2.3_

### Phase 2: Create Configuration-Based Cron Expression

- [ ] 2.1 Create `getBACnetCollectionCronExpression()` function
  - Check for `BACNET_COLLECTION_CRON` environment variable
  - Fall back to calculating cron from `BACNET_COLLECTION_INTERVAL_SECONDS`
  - Convert seconds to minutes and use `minutesToCronEvery()`
  - Add logging to show which source was used (env var or default)
  - _Requirements: Requirement 5 (Environment Variable Detection)_
  - _File: `MeterItProSync/mcp/src/config/scheduling-constants.ts`_

- [ ] 2.2 Update BACnetMeterReadingAgent to use new function
  - Replace hardcoded `CRON_METER_READ` with `getBACnetCollectionCronExpression()`
  - Log the resolved cron expression at startup
  - _Requirements: Requirement 1.1, 5.3_
  - _File: `MeterItProSync/mcp/src/bacnet-collection/bacnet-reading-agent.ts`_

### Phase 3: Implement Interval Verification

- [ ] 3.1 Add interval tracking to agent status
  - Track time between consecutive cycle starts
  - Calculate average interval and deviation
  - Add to `getStatus()` return value
  - _Requirements: Requirement 3.2, 3.3_

- [ ] 3.2 Add interval deviation warning
  - Compare actual interval to configured interval
  - Log warning if deviation exceeds ±10 seconds
  - Include metrics in warning message
  - _Requirements: Requirement 3.4_

- [ ] 3.3 Add metrics endpoint for interval verification
  - Expose configured interval, actual interval, cycle count, skip count
  - Allow operators to query current metrics
  - _Requirements: Requirement 3.2, 3.3_

### Phase 4: Add Skip Detection and Reporting

- [ ] 4.1 Enhance skip logging with duration tracking
  - When cycle is skipped, log how long current cycle has been running
  - Log cumulative skip count
  - Warn if skip count exceeds threshold (e.g., 5 skips in a row)
  - _Requirements: Requirement 4.2, 4.4_

- [ ] 4.2 Add skip metrics to agent status
  - Track total skipped cycles
  - Track consecutive skips
  - Track longest cycle duration
  - _Requirements: Requirement 4.4_

### Phase 5: Testing and Verification

- [ ] 5.1 Write unit tests for cron expression generation
  - Test `getBACnetCollectionCronExpression()` with various intervals
  - Test environment variable override
  - Test fallback to default
  - _File: `MeterItProSync/mcp/src/config/scheduling-constants.test.ts`_

- [ ] 5.2 Write integration tests for interval tracking
  - Mock cron scheduler
  - Verify logging output
  - Verify metrics calculation
  - _File: `MeterItProSync/mcp/src/bacnet-collection/bacnet-reading-agent.test.ts`_

- [ ] 5.3 Manual verification
  - Deploy to test environment
  - Monitor logs for 30 minutes
  - Verify actual interval matches configured interval
  - Verify no unexpected skips
  - Verify environment variable overrides work

## Implementation Details

### Logging Format

All logs should follow this format for easy parsing:
```
[TIMESTAMP] [LEVEL] [COMPONENT] [EVENT] message
```

Examples:
```
2024-01-15T10:30:00.123Z INFO [CRON] [TRIGGER] Collection cycle triggered
2024-01-15T10:30:00.456Z INFO [CYCLE] [START] Starting collection cycle #42
2024-01-15T10:34:30.789Z INFO [CYCLE] [END] Cycle completed in 270123ms, collected 1250 readings
2024-01-15T10:32:00.000Z WARN [CYCLE] [SKIP] Skipping cycle - previous cycle still executing (running for 120000ms)
```

### Metrics Structure

```typescript
interface CollectionMetrics {
  configuredIntervalSeconds: number;
  actualIntervalSeconds: number;
  intervalDeviationSeconds: number;
  totalCyclesExecuted: number;
  totalCyclesSkipped: number;
  consecutiveSkips: number;
  longestCycleDurationMs: number;
  averageCycleDurationMs: number;
  lastCycleStartTime: Date;
  lastCycleEndTime: Date;
}
```

### Configuration Priority

1. Environment variable `BACNET_COLLECTION_CRON` (if set)
2. Environment variable `BACNET_COLLECTION_INTERVAL_SECONDS` (if set, converted to cron)
3. Default constant `CRON_METER_READ` (fallback)

## Success Criteria

- [ ] Actual collection interval matches configured interval within ±10 seconds
- [ ] Logging clearly shows when cron jobs trigger and when cycles execute
- [ ] No cycles are unexpectedly skipped (skip count should be 0 if cycle duration < interval)
- [ ] Environment variable overrides work correctly
- [ ] Metrics are available for monitoring and debugging
- [ ] All tests pass
- [ ] No performance degradation from added logging

## Rollback Plan

If issues arise:
1. Revert to using hardcoded `CRON_METER_READ` constant
2. Disable new logging if it causes performance issues
3. Keep interval tracking for future debugging
