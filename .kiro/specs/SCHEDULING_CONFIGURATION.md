# Scheduling Configuration

All scheduling intervals and cron expressions are now centralized in `MeterItProSync/mcp/src/config/scheduling-constants.ts`.

## Overview

The system has four independent scheduling cycles:

### 1. BACnet Collection (Local Meter Reading)
- **Interval**: 10 minutes (600 seconds)
- **Purpose**: Collects meter readings from BACnet devices
- **Used by**: `BACnetMeterReadingAgent`
- **Environment variable**: `BACNET_COLLECTION_INTERVAL_SECONDS`
- **Default**: 600 seconds

### 2. BACnet Upload (Local to Remote)
- **Interval**: 15 minutes
- **Cron**: `0 */15 * * *` (every 15 minutes at minute 0)
- **Purpose**: Uploads collected readings to remote Client System API
- **Used by**: `BACnetMeterReadingAgent`, `MeterReadingUploadManager`
- **Environment variable**: `BACNET_UPLOAD_INTERVAL_MINUTES`
- **Default**: 15 minutes

### 3. Remote to Local Sync (Download)
- **Interval**: 45 minutes
- **Cron**: `0 */45 * * *` (every 45 minutes at minute 0)
- **Purpose**: Downloads meter and tenant configuration from remote to local database
- **Includes**:
  - Tenant data sync
  - Meter device sync
  - Device register sync
- **Used by**: `RemoteToLocalSyncAgent`
- **Environment variable**: `REMOTE_TO_LOCAL_SYNC_INTERVAL_MINUTES`
- **Default**: 45 minutes

### 4. Data Sync (Complete Sync Cycle)
- **Interval**: 60 seconds
- **Purpose**: Orchestrates complete sync cycle (upload + download)
- **Includes**:
  - Upload of meter readings to remote
  - Download of meter configurations from remote
  - Download of tenant data from remote
- **Used by**: `SyncScheduler`
- **Environment variable**: `DATA_SYNC_INTERVAL_SECONDS`
- **Default**: 60 seconds (for testing/development)
- **Note**: Consider increasing to 5-10 minutes in production

## Configuration

### Using Environment Variables

Override any interval by setting environment variables:

```bash
# BACnet collection interval (in seconds)
export BACNET_COLLECTION_INTERVAL_SECONDS=600

# BACnet upload interval (in minutes)
export BACNET_UPLOAD_INTERVAL_MINUTES=15

# Remote to local sync interval (in minutes)
export REMOTE_TO_LOCAL_SYNC_INTERVAL_MINUTES=45

# Data sync interval (in seconds)
export DATA_SYNC_INTERVAL_SECONDS=60
```

### Using Code

Import the constants from `MeterItProSync/mcp/src/config/scheduling-constants.ts`:

```typescript
import {
  getBACnetCollectionIntervalSeconds,
  getBACnetUploadIntervalMinutes,
  getBACnetUploadCronExpression,
  getRemoteToLocalSyncIntervalMinutes,
  getRemoteToLocalSyncCronExpression,
  getDataSyncIntervalSeconds,
  SCHEDULING_CONFIG,
} from './config/scheduling-constants.js';

// Get current configuration
console.log(SCHEDULING_CONFIG);
```

## Files Updated

The following files now use the centralized scheduling constants:

1. **MeterItProSync/mcp/src/config/scheduling-constants.ts** (NEW)
   - Central location for all scheduling configuration
   - Provides both constants and getter functions
   - Supports environment variable overrides

2. **MeterItProSync/mcp/src/bacnet-collection/bacnet-reading-agent.ts**
   - Uses `getBACnetCollectionIntervalSeconds()`
   - Uses `getBACnetUploadIntervalMinutes()`
   - Uses `getBACnetUploadCronExpression()`

3. **MeterItProSync/mcp/src/bacnet-collection/meter-reading-upload-manager.ts**
   - Uses `getBACnetUploadCronExpression()`

4. **MeterItProSync/mcp/src/remote_to_local-sync/sync-agent.ts**
   - Uses `getRemoteToLocalSyncIntervalMinutes()`
   - Uses `getRemoteToLocalSyncCronExpression()`

5. **MeterItProSync/mcp/src/data-sync/sync-scheduler.ts**
   - Uses `getDataSyncIntervalSeconds()`

6. **MeterItProSync/mcp/src/index.ts**
   - Uses `getBACnetCollectionIntervalSeconds()`
   - Uses `getBACnetUploadIntervalMinutes()`

## Cron Expression Format

All cron expressions use the standard 5-field format:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

Examples:
- `0 */15 * * *` - Every 15 minutes at minute 0 (00:00, 00:15, 00:30, etc.)
- `0 */45 * * *` - Every 45 minutes at minute 0 (00:00, 00:45, 01:30, etc.)

## Summary Table

| Cycle | Interval | Type | Purpose |
|-------|----------|------|---------|
| BACnet Collection | 10 min | setInterval | Collect local readings |
| BACnet Upload | 15 min | cron | Upload to remote |
| Remote to Local Sync | 45 min | cron | Download config |
| Data Sync | 60 sec | setInterval | Orchestrate all syncs |

## Notes

- All intervals are independent and can be adjusted separately
- Environment variables override the defaults in `scheduling-constants.ts`
- The `SCHEDULING_CONFIG` object provides a summary of all current settings
- Cron expressions are automatically generated from interval values
