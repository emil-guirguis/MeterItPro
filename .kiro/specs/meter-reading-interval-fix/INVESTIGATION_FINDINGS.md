# Investigation Findings: Meter Reading Collection Interval Issue

## Problem Summary
The meter reading collection is configured to run every 2 minutes (`CRON_METER_READ = minutesToCronEvery(2)` → `*/2 * * * *`), but the comments indicate it should be 10 minutes. Additionally, actual data shows it's running every 6 minutes instead of the configured 2 minutes.

## Root Cause Analysis

### Issue Identified: Configuration Mismatch

**Location**: `MeterItProSync/mcp/src/bacnet-collection/bacnet-reading-agent.ts` (line 93-97)

The agent uses `CRON_METER_READ` constant to schedule collection cycles:
```typescript
const collectionCronExpression = CRON_METER_READ;  // "*/2 * * * *"
this.collectionCronJob = cron.schedule(collectionCronExpression, async () => {
  if (!this.isCycleExecuting) {
    await this.executeCycleInternal();
  } else {
    this.logger.warn('Skipping collection cycle: previous cycle still executing');
  }
});
```

**However**, there's a critical issue:

1. **The `collectionIntervalSeconds` config is passed but never used for scheduling**
   - In `index.ts` line 167: `collectionIntervalSeconds: getBACnetCollectionIntervalSeconds()`
   - This value is stored in `this.config.collectionIntervalSeconds` but never used to create the cron expression
   - The function `getBACnetCollectionIntervalSeconds()` returns 600 seconds (10 minutes) by default

2. **The cron expression is hardcoded to use `CRON_METER_READ` (2 minutes)**
   - But the configuration suggests the intended interval is 10 minutes (600 seconds)
   - This creates a mismatch between configuration intent and actual behavior

### Why 6 Minutes Instead of 2 Minutes?

The 6-minute interval (instead of the configured 2 minutes) is likely caused by:

**Hypothesis 1: Cycle Execution Guard (Most Likely)**
- Each collection cycle takes approximately 4 minutes to complete
- When a cron trigger fires at 2-minute intervals, the previous cycle is still executing
- The guard `if (!this.isCycleExecuting)` prevents overlapping execution
- Result: Only every 3rd trigger actually executes (2 min × 3 = 6 min observed interval)

**Hypothesis 2: Environment Variable Override**
- `BACNET_COLLECTION_INTERVAL_SECONDS` environment variable might be set to 360 (6 minutes)
- But the agent ignores this and uses the hardcoded `CRON_METER_READ` constant
- This would explain why the config says one thing but the system does another

### Code Issues Found

1. **Unused Configuration Parameter**
   ```typescript
   // In index.ts - this is passed but never used for scheduling
   collectionIntervalSeconds: getBACnetCollectionIntervalSeconds(),
   ```

2. **Hardcoded Cron Expression**
   ```typescript
   // In bacnet-reading-agent.ts - always uses CRON_METER_READ
   const collectionCronExpression = CRON_METER_READ;
   ```

3. **No Environment Variable Override for Collection Cron**
   - Unlike upload cron which has `getBACnetUploadCronExpression()` that checks env vars
   - Collection cron directly uses the constant without checking for overrides

4. **Misleading Comment**
   ```typescript
   // Set up cron job for collection cycles using CRON_METER_READ constant (10 minutes)
   // ^^^ Comment says 10 minutes but CRON_METER_READ is actually 2 minutes
   ```

## Evidence

### Configuration Constants
- `CRON_METER_READ = minutesToCronEvery(2)` → generates `*/2 * * * *` (every 2 minutes)
- `getBACnetCollectionIntervalSeconds()` returns 600 seconds (10 minutes) by default
- These are inconsistent!

### Agent Initialization
- Agent receives `collectionIntervalSeconds: 600` from config
- But uses `CRON_METER_READ` (2 minutes) for scheduling
- The `collectionIntervalSeconds` is never converted to a cron expression

### Cycle Execution Guard
```typescript
private isCycleExecuting: boolean = false;

this.collectionCronJob = cron.schedule(collectionCronExpression, async () => {
  if (!this.isCycleExecuting) {
    await this.executeCycleInternal();
  } else {
    this.logger.warn('Skipping collection cycle: previous cycle still executing');
  }
});
```

If cycles take 4 minutes and cron fires every 2 minutes:
- Trigger at 0:00 → Cycle starts, `isCycleExecuting = true`
- Trigger at 0:02 → Skipped (cycle still running)
- Trigger at 0:04 → Skipped (cycle still running)
- Trigger at 0:06 → Cycle completes, new cycle starts
- **Result: 6-minute observed interval**

## Recommended Fixes

### Fix 1: Use Configuration-Based Cron Expression (Recommended)
Create a function similar to `getBACnetUploadCronExpression()` for collection:

```typescript
export function getBACnetCollectionCronExpression(): string {
  const envValue = process.env.BACNET_COLLECTION_CRON;
  if (envValue) {
    return envValue;
  }
  
  // Fall back to interval-based calculation
  const intervalSeconds = getBACnetCollectionIntervalSeconds();
  const intervalMinutes = Math.round(intervalSeconds / 60);
  return minutesToCronEvery(intervalMinutes);
}
```

Then use it in the agent:
```typescript
const collectionCronExpression = getBACnetCollectionCronExpression();
```

### Fix 2: Add Comprehensive Logging
Add logging to track:
- When cron triggers
- When cycles start/end
- Cycle duration
- Whether cycles are skipped

```typescript
this.collectionCronJob = cron.schedule(collectionCronExpression, async () => {
  const triggerTime = new Date().toISOString();
  this.logger.info(`[CRON TRIGGER] Collection cycle triggered at ${triggerTime}`);
  
  if (!this.isCycleExecuting) {
    this.logger.info(`[CYCLE START] Starting collection cycle`);
    await this.executeCycleInternal();
  } else {
    this.logger.warn(`[CYCLE SKIP] Skipping collection cycle - previous cycle still executing`);
  }
});
```

### Fix 3: Detect and Report Skipped Cycles
Track how many cycles are being skipped to identify the root cause:

```typescript
private skippedCycleCount: number = 0;
private lastCycleStartTime?: Date;

// In the cron handler:
if (!this.isCycleExecuting) {
  this.lastCycleStartTime = new Date();
  await this.executeCycleInternal();
} else {
  this.skippedCycleCount++;
  const timeSinceStart = this.lastCycleStartTime 
    ? new Date().getTime() - this.lastCycleStartTime.getTime() 
    : 0;
  this.logger.warn(
    `[CYCLE SKIP] Skipped cycle #${this.skippedCycleCount}. ` +
    `Current cycle running for ${timeSinceStart}ms`
  );
}
```

## Next Steps

1. **Immediate**: Add logging to confirm the root cause (cycle duration vs. skipped cycles)
2. **Short-term**: Implement `getBACnetCollectionCronExpression()` function
3. **Medium-term**: Update agent to use configuration-based cron expression
4. **Long-term**: Consider if cycles should run in parallel or if interval should be increased

## Testing Recommendations

After implementing fixes:
1. Verify actual collection interval matches configured interval (within ±10 seconds)
2. Monitor cycle duration to ensure it doesn't exceed the interval
3. Track skipped cycle count to ensure it's zero
4. Verify environment variable overrides work correctly
