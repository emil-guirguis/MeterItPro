# Simplified Sync Architecture

## Overview

After cleanup, the sync system is now streamlined with a single, clear implementation path.

## Active Components

### 1. BACnet Meter Reading Agent
**Location**: `MeterItProSync/mcp/src/bacnet-collection/bacnet-reading-agent.ts`

**Responsibilities**:
- Collects meter readings from BACnet devices
- Uploads readings to remote Client System

**Scheduling**:
- Collection: Every 10 minutes (setInterval)
- Upload: Every 15 minutes (cron: `0 */15 * * *`)

**Dependencies**:
- BACnetClient - Communicates with BACnet devices
- CollectionCycleManager - Manages collection cycles
- MeterReadingUploadManager - Handles uploads
- ClientSystemApiClient - Communicates with remote API

### 2. Remote to Local Sync Agent
**Location**: `MeterItProSync/mcp/src/remote_to_local-sync/sync-agent.ts`

**Responsibilities**:
- Syncs tenant data from remote to local
- Syncs meter devices from remote to local
- Syncs device registers from remote to local
- Loads caches after successful sync

**Scheduling**:
- Sync: Every 45 minutes (cron: `0 */45 * * *`)

**Dependencies**:
- syncTenant - Syncs tenant data
- syncMeters - Syncs meter devices
- syncDeviceRegisters - Syncs device registers
- cacheManager - Loads caches after sync

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Sync MCP Server                          │
│                    (index.ts)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
    ┌───────────▼──────────────┐  ┌────────▼──────────────┐
    │ BACnetMeterReadingAgent  │  │RemoteToLocalSyncAgent│
    │                          │  │                      │
    │ Collection (10 min)      │  │ Sync (45 min)        │
    │ ├─ BACnetClient          │  │ ├─ syncTenant       │
    │ ├─ CollectionCycleManager│  │ ├─ syncMeters       │
    │ └─ MeterReadingUploadMgr │  │ ├─ syncDeviceRegs   │
    │                          │  │ └─ cacheManager     │
    │ Upload (15 min)          │  │                      │
    │ └─ ClientSystemApiClient │  │ Remote DB           │
    │                          │  │ ↓                    │
    │ Local DB                 │  │ Local DB             │
    │ ↓                        │  │                      │
    │ Meter Readings           │  │ Tenant Config        │
    │ (stored for upload)      │  │ Meter Config         │
    │                          │  │ Device Registers     │
    └──────────────────────────┘  └─────────────────────┘
            │                              │
            └──────────────┬───────────────┘
                           │
                    ┌──────▼──────┐
                    │  Local DB   │
                    │  (Sync DB)  │
                    └─────────────┘
```

## Scheduling Configuration

All intervals are centralized in:
**`MeterItProSync/mcp/src/config/scheduling-constants.ts`**

### Constants

```typescript
// BACnet Collection (local meter reading)
BACNET_COLLECTION_INTERVAL_SECONDS = 600  // 10 minutes

// BACnet Upload (local to remote)
BACNET_UPLOAD_INTERVAL_MINUTES = 15
BACNET_UPLOAD_CRON_EXPRESSION = "0 */15 * * *"

// Remote to Local Sync (download)
REMOTE_TO_LOCAL_SYNC_INTERVAL_MINUTES = 45
REMOTE_TO_LOCAL_SYNC_CRON_EXPRESSION = "0 */45 * * *"
```

### Environment Variable Overrides

```bash
BACNET_COLLECTION_INTERVAL_SECONDS=600
BACNET_UPLOAD_INTERVAL_MINUTES=15
REMOTE_TO_LOCAL_SYNC_INTERVAL_MINUTES=45
```

## Initialization Flow

```
1. initializeServices()
   ├─ Initialize database pools
   ├─ Create SyncDatabase
   ├─ Initialize BACnetMeterReadingAgent
   ├─ Initialize RemoteToLocalSyncAgent
   ├─ Start RemoteToLocalSyncAgent (syncs data + loads caches)
   ├─ Start BACnetMeterReadingAgent (starts collection + upload)
   └─ Start Local API Server

2. BACnetMeterReadingAgent.start()
   ├─ Schedule collection cycle (every 10 min)
   └─ Schedule upload cycle (every 15 min)

3. RemoteToLocalSyncAgent.start()
   ├─ Perform initial sync
   └─ Schedule sync cycle (every 45 min)
```

## Key Features

### Mutual Exclusion
- Collection cycles prevent overlapping execution
- Sync cycles prevent overlapping execution
- Upload cycles prevent overlapping execution

### Graceful Shutdown
- Agents wait for current operations to complete
- Timeouts prevent indefinite hangs
- Clean resource cleanup

### Error Handling
- Retry logic with exponential backoff
- Connectivity monitoring
- Detailed error logging

### Caching
- Meter cache loaded at startup
- Tenant cache loaded at startup
- Caches reloaded after successful sync
- Reduces database queries

## Removed Components

The following unused components have been removed:

❌ **SyncScheduler** - Unused orchestrator
❌ **UploadSyncManager** - Duplicate of BACnetMeterReadingAgent upload
❌ **DownloadSyncManager** - Duplicate of RemoteToLocalSyncAgent sync

These were part of an abandoned refactoring and are no longer needed.

## Benefits of Simplified Architecture

✅ **Single Implementation Path**: No confusion about which code is active
✅ **Clear Responsibilities**: Each agent has a single, well-defined purpose
✅ **Easier Debugging**: Fewer components to trace through
✅ **Better Performance**: No redundant code execution
✅ **Simpler Maintenance**: Fewer files to update when making changes
✅ **Faster Onboarding**: New developers understand the system quickly

## Future Enhancements

If centralized orchestration is needed in the future:
1. Create a new SyncOrchestrator from scratch
2. Use the centralized scheduling constants
3. Leverage the existing agent interfaces
4. No need to resurrect old code

## Testing

Each component can be tested independently:

```typescript
// Test BACnet collection
const agent = new BACnetMeterReadingAgent(config);
await agent.triggerCollection();

// Test remote to local sync
const syncAgent = new RemoteToLocalSyncAgent(config);
await syncAgent.triggerSync();

// Test upload
const uploadMgr = new MeterReadingUploadManager(config);
await uploadMgr.triggerUpload();
```

## Monitoring

Check status of active agents:

```typescript
// BACnet agent status
const bacnetStatus = bacnetMeterReadingAgent.getStatus();
console.log(bacnetStatus.isRunning);
console.log(bacnetStatus.totalReadingsCollected);

// Sync agent status
const syncStatus = remoteToLocalSyncAgent.getStatus();
console.log(syncStatus.isRunning);
console.log(syncStatus.lastSyncSuccess);
```

## Summary

The sync system now has a clean, simplified architecture with:
- 2 active agents (BACnet + RemoteToLocal)
- 4 independent scheduling cycles
- Centralized configuration
- No dead code or duplication
- Clear data flow and responsibilities
