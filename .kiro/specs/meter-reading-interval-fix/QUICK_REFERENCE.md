# Quick Reference: Meter Reading Interval Issue

## The Problem
- **Configured**: 2 minutes (`CRON_METER_READ = */2 * * * *`)
- **Observed**: 6 minutes (actual data shows collections every 6 minutes)
- **Root Cause**: Cycle execution guard preventing overlapping execution when cycles take ~4 minutes

## Why 6 Minutes?

```
Timeline (if each cycle takes ~4 minutes):
0:00 - Cron triggers → Cycle starts (isCycleExecuting = true)
0:02 - Cron triggers → SKIPPED (cycle still running)
0:04 - Cron triggers → SKIPPED (cycle still running)
0:06 - Cron triggers → Cycle completes, new cycle starts
Result: 6-minute observed interval
```

## Key Files

| File | Issue |
|------|-------|
| `MeterItProSync/mcp/src/config/scheduling-constants.ts` | Defines `CRON_METER_READ = minutesToCronEvery(2)` |
| `MeterItProSync/mcp/src/bacnet-collection/bacnet-reading-agent.ts` | Uses hardcoded `CRON_METER_READ`, ignores `collectionIntervalSeconds` config |
| `MeterItProSync/mcp/src/index.ts` | Passes `collectionIntervalSeconds: 600` (10 min) but agent doesn't use it |

## Configuration Mismatch

```typescript
// In index.ts - passes 10 minutes
collectionIntervalSeconds: getBACnetCollectionIntervalSeconds(),  // Returns 600 seconds

// In bacnet-reading-agent.ts - uses 2 minutes
const collectionCronExpression = CRON_METER_READ;  // "*/2 * * * *"
```

## The Fix (3 Steps)

### Step 1: Create Configuration Function
```typescript
// In scheduling-constants.ts
export function getBACnetCollectionCronExpression(): string {
  const envValue = process.env.BACNET_COLLECTION_CRON;
  if (envValue) return envValue;
  
  const intervalSeconds = getBACnetCollectionIntervalSeconds();
  const intervalMinutes = Math.round(intervalSeconds / 60);
  return minutesToCronEvery(intervalMinutes);
}
```

### Step 2: Use Configuration Function
```typescript
// In bacnet-reading-agent.ts
const collectionCronExpression = getBACnetCollectionCronExpression();
this.logger.info(`Scheduling collection cycles with cron: ${collectionCronExpression}`);
```

### Step 3: Add Logging
```typescript
this.collectionCronJob = cron.schedule(collectionCronExpression, async () => {
  this.logger.info(`[CRON TRIGGER] Collection cycle triggered at ${new Date().toISOString()}`);
  
  if (!this.isCycleExecuting) {
    this.logger.info(`[CYCLE START] Starting collection cycle`);
    await this.executeCycleInternal();
  } else {
    this.logger.warn(`[CYCLE SKIP] Skipping collection cycle - previous cycle still executing`);
  }
});
```

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `BACNET_COLLECTION_CRON` | Override cron expression | Not set |
| `BACNET_COLLECTION_INTERVAL_SECONDS` | Collection interval in seconds | 600 (10 min) |

## Verification

After fix, verify:
1. Logs show cron triggers every 2 minutes (or configured interval)
2. Cycles execute every 2 minutes (or configured interval)
3. No "CYCLE SKIP" warnings in logs
4. Actual interval matches configured interval within ±10 seconds

## Debugging

### Check Current Configuration
```bash
# Look for these log lines at startup:
# "Scheduling collection cycles with cron: */2 * * * *"
# "BACNET_COLLECTION_INTERVAL_SECONDS: 120" (if env var set)
```

### Monitor Cycle Execution
```bash
# Look for these patterns in logs:
# [CRON TRIGGER] - Should appear every 2 minutes
# [CYCLE START] - Should appear every 2 minutes
# [CYCLE SKIP] - Should NOT appear (or rarely)
# [CYCLE END] - Should show cycle duration
```

### Calculate Actual Interval
```bash
# Extract cycle start times from logs:
grep "\[CYCLE START\]" logs.txt | awk '{print $1}' | \
  while read line; do echo $line; done | \
  # Calculate time differences between consecutive lines
```

## Related Issues

- **Cycle Duration**: If cycles take longer than the configured interval, they will be skipped
- **Multiple Instances**: If multiple agent instances are running, they might interfere
- **Environment Overrides**: Check if `BACNET_COLLECTION_INTERVAL_SECONDS` is set to 360 (6 minutes)

## Success Metrics

- ✅ Actual interval = Configured interval (within ±10 seconds)
- ✅ No unexpected skipped cycles
- ✅ Logs clearly show cron triggers and cycle execution
- ✅ Environment variable overrides work correctly
