# Cron Scheduling Migration - Fixes Complete

## Summary

Fixed the incomplete cron scheduling migration by:
1. Adding missing helper functions to retrieve scheduling configuration
2. Fixing type mismatches between cron expressions and minute-based intervals
3. Removing unused interval configuration from the upload manager
4. Updating all initialization code to use the correct functions and types

## Changes Made

### 1. Added Helper Functions to `scheduling-constants.ts`

Added three new functions to retrieve scheduling configuration from environment variables with fallback to defaults:

- **`getBACnetCollectionIntervalSeconds()`** - Returns collection interval in seconds
  - Reads from `BACNET_COLLECTION_INTERVAL_SECONDS` env var
  - Default: 600 seconds (10 minutes)

- **`getBACnetUploadCronExpression()`** - Returns upload cron expression
  - Reads from `BACNET_UPLOAD_CRON` env var (new)
  - Falls back to `UPLOAD_INTERVAL_MINUTES` env var (old, converts to cron)
  - Default: `*/15 * * * *` (every 15 minutes)

- **`getRemoteToLocalSyncCronExpression()`** - Returns remote sync cron expression
  - Reads from `REMOTE_TO_LOCAL_SYNC_CRON` env var (new)
  - Falls back to `METER_SYNC_INTERVAL_MINUTES` env var (old, converts to cron)
  - Default: `*/45 * * * *` (every 45 minutes)

- **`getRemoteToLocalSyncIntervalMinutes()`** - Returns remote sync interval in minutes
  - Used by RemoteToLocalSyncAgent for backward compatibility
  - Reads from `METER_SYNC_INTERVAL_MINUTES` env var
  - Default: 45 minutes

### 2. Updated `index.ts`

- Added imports for the new helper functions
- Changed agent initialization to use:
  - `getBACnetCollectionIntervalSeconds()` instead of undefined function
  - `getBACnetUploadCronExpression()` instead of undefined function
  - Removed call to non-existent `getBACnetUploadIntervalMinutes()`

### 3. Fixed Type Definitions in `types.ts`

Updated `BACnetMeterReadingAgentConfig` interface:
- Changed `uploadIntervalMinutes?: number` → `uploadCronExpression?: string`
- Updated `collectionIntervalSeconds` comment to reflect correct default (600 seconds)
- Updated `uploadCronExpression` comment to show cron format

### 4. Updated `bacnet-reading-agent.ts`

- Constructor now uses `uploadCronExpression` instead of `uploadIntervalMinutes`
- Updated default values to use correct types
- Updated upload cron scheduling to use config value: `this.config.uploadCronExpression || CRON_SYNC_TO_REMOTE`
- Updated log message to show cron expression instead of minutes

### 5. Cleaned Up `meter-reading-upload-manager.ts`

- Removed `uploadIntervalMinutes` from `MeterReadingUploadManagerConfig` interface
- Removed `enableAutoUpload` from config (scheduling is now managed by agent)
- Removed `uploadIntervalMinutes` field from class
- Removed `enableAutoUpload` field from class
- Updated `start()` method to remove cron scheduling (now handled by agent)
- Updated factory function `createMeterReadingUploadManagerFromEnv()` to not parse upload interval

## Environment Variables

### New Variables (Recommended)
- `BACNET_COLLECTION_INTERVAL_SECONDS` - Collection interval in seconds (default: 600)
- `BACNET_UPLOAD_CRON` - Upload cron expression (default: `*/15 * * * *`)
- `REMOTE_TO_LOCAL_SYNC_CRON` - Remote sync cron expression (default: `*/45 * * * *`)

### Old Variables (Still Supported for Backward Compatibility)
- `UPLOAD_INTERVAL_MINUTES` - Converted to cron expression if `BACNET_UPLOAD_CRON` not set
- `METER_SYNC_INTERVAL_MINUTES` - Used by RemoteToLocalSyncAgent

## How It Works Now

1. **Initialization**: When the sync MCP server starts, it calls the helper functions to get scheduling configuration
2. **Collection**: Uses `collectionIntervalSeconds` with `setInterval()` for precise timing
3. **Upload**: Uses `uploadCronExpression` with `cron.schedule()` for flexible scheduling
4. **Remote Sync**: Uses `getRemoteToLocalSyncCronExpression()` for remote sync scheduling
5. **Upload Manager**: No longer manages its own scheduling - the agent calls `performUpload()` on the cron schedule

## Backward Compatibility

The system maintains backward compatibility:
- Old minute-based env vars are still supported
- They're automatically converted to cron expressions
- New cron expression env vars take precedence if both are set
- Existing deployments will continue to work without changes

## Testing

All TypeScript files compile without errors:
- ✅ `MeterItProSync/mcp/src/index.ts`
- ✅ `MeterItProSync/mcp/src/config/scheduling-constants.ts`
- ✅ `MeterItProSync/mcp/src/bacnet-collection/types.ts`
- ✅ `MeterItProSync/mcp/src/bacnet-collection/bacnet-reading-agent.ts`
- ✅ `MeterItProSync/mcp/src/bacnet-collection/meter-reading-upload-manager.ts`

## Next Steps

1. Test the application to ensure scheduling works correctly
2. Verify that cron expressions are being used for upload and remote sync
3. Update any deployment documentation to reference the new env vars
4. Consider removing old env var support in a future version
