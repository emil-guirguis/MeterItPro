# Offline Meter Retry Backoff Implementation

## Summary

Implemented a 5-minute backoff mechanism for offline meters in the BACnet meter reading system. When a meter is detected as offline, it is automatically paused for 5 minutes before the next retry attempt. This prevents wasted resources and allows time for the meter to come back online.

## Changes Made

### 1. BACnetMeterReadingAgent (`MeterItProSync/mcp/src/bacnet-collection/bacnet-reading-agent.ts`)

**Added backoff tracking:**
- `meterBackoffMap: Map<string, Date>` - Tracks backoff expiration time for each offline meter
- `offlineBackoffMinutes: number = 5` - Configurable backoff duration (default 5 minutes)

**Added backoff management methods:**
- `isMeterInBackoff(meterId: string): boolean` - Check if a meter is currently in backoff
- `setMeterBackoff(meterId: string): void` - Set a meter into 5-minute backoff
- `clearMeterBackoff(meterId: string): void` - Clear backoff when meter comes back online

**Updated cycle execution:**
- Modified `executeCycleInternal()` to pass `meterBackoffMap` to the collection cycle manager
- Updated `getStatus()` to include meters currently in backoff

### 2. CollectionCycleManager (`MeterItProSync/mcp/src/bacnet-collection/collection-cycle-manager.ts`)

**Updated cycle execution:**
- Modified `executeCycle()` signature to accept optional `meterBackoffMap` parameter
- Added backoff check in meter processing loop - skips meters in backoff period

**Updated meter reading logic:**
- Modified `readMeterDataPoints()` to accept and use `meterBackoffMap`
- When a meter is detected as offline:
  - Sets meter into 5-minute backoff
  - Logs backoff expiration time
  - Skips the meter for this cycle
- When a meter comes back online:
  - Clears its backoff status
  - Proceeds with normal reading

## How It Works

### Offline Detection Flow

1. **Collection Cycle Starts** - Every 15 minutes (configurable)
2. **Connectivity Check** - For each meter, check if it's online
3. **Meter Offline** - If connectivity check fails:
   - Record offline error
   - Set meter into 5-minute backoff
   - Skip meter for this cycle
   - Continue with next meter
4. **Backoff Period** - Meter is skipped for 5 minutes
5. **Backoff Expires** - Next collection cycle after 5 minutes will retry the meter
6. **Meter Online** - If meter responds, backoff is cleared and readings resume

### Concurrent Agent Execution

The system already runs collection and upload agents concurrently:

- **Collection Cycles**: Run every 15 minutes (configurable via `BACNET_COLLECTION_INTERVAL_SECONDS`)
- **Upload Cycles**: Run every 5 minutes (configurable via `BACNET_UPLOAD_INTERVAL_MINUTES`)
- **Independent Scheduling**: Each uses its own timer/cron job
- **No Blocking**: Upload operations don't block collection and vice versa

Both agents are started in `index.ts`:
```typescript
// Step 8: Start BACnet Meter Reading Agent (includes both collection and upload)
await this.bacnetMeterReadingAgent.start();
```

The agent internally manages:
- Collection cycles via `setInterval` (runs independently)
- Upload cycles via `cron.schedule` (runs independently)

## Configuration

### Environment Variables

- `BACNET_COLLECTION_INTERVAL_SECONDS` - Collection cycle interval (default: 900 = 15 minutes)
- `BACNET_UPLOAD_INTERVAL_MINUTES` - Upload cycle interval (default: 5 minutes)
- `BACNET_AUTO_START` - Auto-start agent on server startup (default: true)

### Backoff Duration

Currently hardcoded to 5 minutes. Can be made configurable by:
1. Adding environment variable: `METER_OFFLINE_BACKOFF_MINUTES`
2. Updating `BACnetMeterReadingAgent` constructor to read from env
3. Passing to `CollectionCycleManager` if needed

## Logging

The implementation includes detailed logging:

```
⏸️  Meter 123 set to backoff until 2024-01-16T10:30:00.000Z (5 minutes)
⏸️  Skipping meter 123 - in backoff until 2024-01-16T10:30:00.000Z
✅ Meter 123 backoff period expired, ready for retry
✅ Meter 123 backoff cleared - meter is online
```

## Testing

To test the backoff mechanism:

1. **Simulate offline meter**: Disconnect a BACnet device or block its network
2. **Trigger collection cycle**: Call `trigger_meter_reading` MCP tool
3. **Observe backoff**: Check logs for backoff messages
4. **Wait 5 minutes**: Backoff period expires
5. **Reconnect meter**: Bring meter back online
6. **Next cycle**: Meter should be retried and readings should resume

## Benefits

1. **Resource Efficiency** - Stops wasting resources on unreachable meters
2. **Faster Recovery** - Allows time for meters to come back online
3. **Cleaner Logs** - Reduces repeated timeout errors for offline meters
4. **Concurrent Operation** - Collection and upload run independently
5. **Automatic Recovery** - Meters are automatically retried after backoff expires

## Future Enhancements

1. **Configurable Backoff Duration** - Make 5 minutes configurable per environment
2. **Exponential Backoff** - Increase backoff duration for repeatedly offline meters
3. **Persistence** - Store backoff state in database to survive restarts
4. **Alerts** - Notify operators when meters remain offline for extended periods
5. **Manual Override** - Allow operators to force immediate retry of offline meters
