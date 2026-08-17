# Scheduling Quick Reference

## Current Configuration

| Cycle | Interval | Cron | Purpose |
|-------|----------|------|---------|
| **BACnet Collection** | 10 min | N/A (setInterval) | Collect meter readings from BACnet devices |
| **BACnet Upload** | 15 min | `0 */15 * * *` | Upload readings to remote Client System |
| **Remote to Local Sync** | 45 min | `0 */45 * * *` | Download meter/tenant config from remote |
| **Data Sync** | 60 sec | N/A (setInterval) | Orchestrate complete sync cycle |

## Change an Interval

### Option 1: Environment Variables (Recommended)

```bash
# Change BACnet collection to 5 minutes (300 seconds)
export BACNET_COLLECTION_INTERVAL_SECONDS=300

# Change BACnet upload to 10 minutes
export BACNET_UPLOAD_INTERVAL_MINUTES=10

# Change remote to local sync to 30 minutes
export REMOTE_TO_LOCAL_SYNC_INTERVAL_MINUTES=30

# Change data sync to 30 seconds
export DATA_SYNC_INTERVAL_SECONDS=30
```

### Option 2: Edit Constants File

Edit `MeterItProSync/mcp/src/config/scheduling-constants.ts`:

```typescript
// Change default values
export const BACNET_COLLECTION_INTERVAL_SECONDS = 300;      // was 600
export const BACNET_UPLOAD_INTERVAL_MINUTES = 10;           // was 15
export const REMOTE_TO_LOCAL_SYNC_INTERVAL_MINUTES = 30;    // was 45
export const DATA_SYNC_INTERVAL_SECONDS = 30;               // was 60
```

## Files to Update

All scheduling is centralized in one file:
- **`MeterItProSync/mcp/src/config/scheduling-constants.ts`** - Central configuration

These files automatically use the constants:
- `MeterItProSync/mcp/src/bacnet-collection/bacnet-reading-agent.ts`
- `MeterItProSync/mcp/src/bacnet-collection/meter-reading-upload-manager.ts`
- `MeterItProSync/mcp/src/remote_to_local-sync/sync-agent.ts`
- `MeterItProSync/mcp/src/data-sync/sync-scheduler.ts`
- `MeterItProSync/mcp/src/index.ts`

## Cron Expression Syntax

```
0 */15 * * *
│  │   │ │ │
│  │   │ │ └─ Day of week (0-6, Sunday=0)
│  │   │ └─── Month (1-12)
│  │   └───── Day of month (1-31)
│  └───────── Hour (0-23)
└──────────── Minute (0-59)
```

Common patterns:
- `0 */15 * * *` - Every 15 minutes at minute 0
- `0 */30 * * *` - Every 30 minutes at minute 0
- `0 */45 * * *` - Every 45 minutes at minute 0
- `0 * * * *` - Every hour at minute 0
- `*/5 * * * *` - Every 5 minutes

## Verify Configuration

Check current settings at runtime:

```typescript
import { SCHEDULING_CONFIG } from './config/scheduling-constants.js';

console.log(SCHEDULING_CONFIG);
// Output:
// {
//   bacnetCollection: { intervalSeconds: 600, description: '...' },
//   bacnetUpload: { intervalMinutes: 15, cronExpression: '0 */15 * * *', description: '...' },
//   remoteToLocalSync: { intervalMinutes: 45, cronExpression: '0 */45 * * *', description: '...' },
//   dataSync: { intervalSeconds: 60, description: '...' }
// }
```

## No Other Crons Found

The system has **4 independent scheduling cycles**:
1. BACnet Collection (setInterval)
2. BACnet Upload (cron)
3. Remote to Local Sync (cron)
4. Data Sync (setInterval)

All other operations are triggered by these cycles or manual API calls.
