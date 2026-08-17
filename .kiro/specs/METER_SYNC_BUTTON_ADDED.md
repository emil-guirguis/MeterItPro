# Meter Sync Button - Now Visible

## What Was Done

I've created a new **"Trigger Meter Sync"** button that is now always visible on the SyncStatus page, independent of tenant connection status.

## Changes Made

### 1. Created New Component: `MeterSyncCard.tsx`
**File:** `MeterItProSync/frontend/src/components/MeterSyncCard.tsx`

This component displays:
- **Remote Meter Sync** status card with health indicator
- **Trigger Meter Sync** button (always visible)
- Last sync timestamp and status
- Sync results (Inserted/Updated/Deleted counts)
- Total meter count in local database

### 2. Updated SyncStatus Page
**File:** `MeterItProSync/frontend/src/pages/SyncStatus.tsx`

- Added import for `MeterSyncCard` component
- Added `<MeterSyncCard />` to the page layout
- Placed it before the BACnet Meter Reading Agent card
- The button is now always visible (not hidden by tenant connection status)

## How to Use

1. **Navigate to SyncStatus page** (usually http://localhost:3003/sync-status)
2. **Look for "Remote Meter Sync" card** - it's now always visible
3. **Click "Trigger Meter Sync" button** to sync meters from remote database
4. **Watch the status** update with:
   - Last sync timestamp
   - Number of meters inserted/updated/deleted
   - Total meter count

## What the Button Does

When you click "Trigger Meter Sync":

1. **Frontend** sends POST request to `/api/local/meter-sync-trigger`
2. **MCP Backend** (MeterSyncAgent) performs:
   - Queries remote database for meters (from Client System)
   - Queries local database for current meters
   - Compares and syncs:
     - **Inserts** new meters
     - **Updates** changed meters (IP, port, active status)
     - **Deactivates** removed meters
3. **Results** are displayed in the UI with counts

## Debugging

### Check Console Logs
The MCP server logs every step with detailed output:
```
🔄 [Meter Sync] Starting meter synchronization for tenant X...
🔍 [Meter Sync] Querying remote database for meters...
📋 [Meter Sync] Found N remote meter(s)
...
✅ [Meter Sync] Sync completed successfully
   Inserted: X, Updated: Y, Deleted: Z
```

### API Endpoint
You can also trigger sync directly:
```bash
curl -X POST http://localhost:3002/api/local/meter-sync-trigger
```

### Check Status
```bash
curl http://localhost:3002/api/local/meter-sync-status
```

## Difference Between Buttons

Now you have TWO sync buttons on the SyncStatus page:

1. **"Trigger Meter Sync"** (Remote Meter Sync card)
   - Syncs meter **configuration** from remote Client System database
   - Updates: IP, port, active status, element info
   - Shows: Inserted/Updated/Deleted counts

2. **"Trigger Collection"** (BACnet Meter Reading Agent card)
   - Collects **readings** from BACnet meters
   - Reads: Current values, data points
   - Shows: Meters processed, readings collected, errors

## Next Steps

1. Start the MCP server: `npm run dev` (in MeterItProSync/mcp)
2. Start the frontend: `npm run dev` (in MeterItProSync/frontend)
3. Navigate to SyncStatus page
4. Click "Trigger Meter Sync" button
5. Watch the console for detailed logs
6. Check the UI for results

The button is now ready to use for debugging the meter sync process!
