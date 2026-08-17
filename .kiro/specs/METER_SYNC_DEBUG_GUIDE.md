# Meter Sync Debug Guide

## Button Location

The **"Trigger Meter Sync Now"** button already exists in the Sync Frontend UI.

**Location:** `MeterItProSync/frontend/src/pages/SyncStatus.tsx`

**Visual Location:** In the "Manual Meter Sync" card on the SyncStatus page

```tsx
<Grid item xs={12} md={6}>
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Manual Meter Sync
      </Typography>
      <Button
        variant="contained"
        startIcon={isMeterSyncing ? <CircularProgress size={20} /> : <SyncIcon />}
        onClick={handleMeterSyncTrigger}
        disabled={isMeterSyncing}
        fullWidth
      >
        {isMeterSyncing ? 'Syncing Meters...' : 'Trigger Meter Sync Now'}
      </Button>
    </CardContent>
  </Card>
</Grid>
```

## How It Works

### Frontend Flow
1. User clicks "Trigger Meter Sync Now" button
2. `handleMeterSyncTrigger()` is called
3. Frontend calls `meterSyncApi.triggerSync()` which POSTs to `/api/local/meter-sync-trigger`
4. Response shows success/error message and updates meter sync status

### Backend Flow (MCP Server)
1. **Endpoint:** `POST /api/local/meter-sync-trigger` (in `MeterItProSync/mcp/src/api/server.ts`)
2. **Handler:** Calls `meterSyncAgent.triggerSync()`
3. **Agent:** `MeterSyncAgent` (in `MeterItProSync/mcp/src/sync-service/meter-sync-agent.ts`)
   - Queries remote database for meters (from Client System)
   - Queries local database for meters (Sync database)
   - Compares and syncs:
     - **Inserts** new meters
     - **Updates** changed meters
     - **Deletes** (deactivates) removed meters
4. **Result:** Returns counts of inserted/updated/deleted meters

## Debugging the MCP Sync Process

### 1. Enable Debug Logging

The code already has extensive logging. Check the console output in the MCP server terminal for:

```
🔄 [Meter Sync] Starting meter synchronization for tenant X...
🔍 [Meter Sync] Querying remote database for meters...
📋 [Meter Sync] Found N remote meter(s)
🔍 [Meter Sync] Querying local database for meters...
📋 [Meter Sync] Found N local meter(s)
➕ [Meter Sync] Processing new meters...
   ✅ Inserted meter: ID (element_id)
🔄 [Meter Sync] Processing meter updates...
   ✅ Updated meter: ID (element_id)
➖ [Meter Sync] Processing deleted meters...
   ✅ Deactivated meter: ID
✅ [Meter Sync] Sync completed successfully
   Inserted: X, Updated: Y, Deleted: Z
```

### 2. Debug Points in Code

**File:** `MeterItProSync/mcp/src/sync-service/meter-sync-agent.ts`

Key debug points:
- Line ~80: `performSync()` - Main sync logic
- Line ~95: Remote meter query
- Line ~100: Local meter query
- Line ~110: Insert new meters loop
- Line ~130: Update existing meters loop
- Line ~150: Delete/deactivate meters loop

### 3. Check Database Directly

**Local Sync Database:**
```sql
-- Check meters in local database
SELECT id, meter_id, meter_element_id, ip, port, active FROM meter;

-- Check sync logs
SELECT id, batch_size, success, error_message, synced_at FROM sync_log ORDER BY synced_at DESC LIMIT 10;
```

**Remote Client Database:**
```sql
-- Check meters in remote database
SELECT m.id, m.tenant_id, me.meter_element_id, me.ip, me.port, m.active 
FROM meter m 
JOIN meter_element me ON me.meter_id = m.id 
WHERE m.tenant_id = YOUR_TENANT_ID;
```

### 4. API Endpoints for Debugging

**Get Meter Sync Status:**
```bash
curl http://localhost:3002/api/local/meter-sync-status
```

Response:
```json
{
  "last_sync_at": "2024-01-15T10:30:00.000Z",
  "last_sync_success": true,
  "last_sync_error": null,
  "inserted_count": 5,
  "updated_count": 2,
  "deleted_count": 0,
  "meter_count": 42,
  "is_syncing": false
}
```

**Trigger Meter Sync:**
```bash
curl -X POST http://localhost:3002/api/local/meter-sync-trigger
```

Response:
```json
{
  "success": true,
  "message": "Meter sync completed successfully",
  "result": {
    "inserted": 5,
    "updated": 2,
    "deleted": 0,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 5. VS Code Debugging

**Debug Configuration:** Already set up in `.vscode/launch.json`

**To Debug:**
1. Open `.vscode/launch.json`
2. Select "Debug Sync Backend" or "Debug Everything"
3. Press F5 to start debugging
4. Set breakpoints in `meter-sync-agent.ts`
5. Click the button in the UI to trigger sync
6. Debugger will pause at breakpoints

**Key Breakpoints to Set:**
- `meter-sync-agent.ts:80` - Start of `performSync()`
- `meter-sync-agent.ts:95` - Before remote query
- `meter-sync-agent.ts:100` - Before local query
- `meter-sync-agent.ts:110` - Insert loop
- `meter-sync-agent.ts:130` - Update loop
- `meter-sync-agent.ts:150` - Delete loop

### 6. Common Issues & Solutions

**Issue: "Meter sync agent not available"**
- Check if MCP server started successfully
- Verify `meterSyncAgent` is initialized in `MeterItProSync/mcp/src/index.ts`

**Issue: "Sync already in progress"**
- Wait for previous sync to complete
- Check logs for stuck sync operations

**Issue: No meters synced**
- Verify tenant ID is set in local database
- Check remote database has meters for this tenant
- Verify database connection strings are correct

**Issue: Meters not updating**
- Check if meter data actually changed in remote database
- Verify comparison logic in `performSync()` (line ~130)

### 7. Frontend Status Display

The SyncStatus page shows:
- **Last Meter Sync:** When the last sync occurred
- **Meter Count:** Total active meters in local database
- **Last Meter Sync Results:** Inserted/Updated/Deleted counts
- **Manual Meter Sync:** Button to trigger sync

All status is fetched from `/api/local/meter-sync-status` endpoint.

## Testing the Full Flow

1. **Start MCP Server:**
   ```bash
   npm run dev  # in MeterItProSync/mcp directory
   ```

2. **Start Frontend:**
   ```bash
   npm run dev  # in MeterItProSync/frontend directory
   ```

3. **Navigate to SyncStatus page** (usually http://localhost:3003)

4. **Click "Trigger Meter Sync Now"** button

5. **Watch the console** for detailed logging

6. **Check the UI** for success/error message

7. **Verify results** in the "Last Meter Sync Results" card

## Architecture Overview

```
Sync Frontend (React)
    ↓
    POST /api/local/meter-sync-trigger
    ↓
LocalApiServer (Express)
    ↓
MeterSyncAgent.triggerSync()
    ↓
    ├─→ Query Remote Database (Client System)
    │   └─→ Get meters for tenant
    │
    ├─→ Query Local Database (Sync)
    │   └─→ Get current meters
    │
    ├─→ Compare & Sync
    │   ├─→ Insert new meters
    │   ├─→ Update changed meters
    │   └─→ Deactivate removed meters
    │
    └─→ Log operation & return results
        ↓
    Response to Frontend
        ↓
    UI updates with results
```

## Next Steps for Debugging

1. Start the MCP server with debugging enabled
2. Open the Sync Frontend
3. Click the "Trigger Meter Sync Now" button
4. Watch the console output for the detailed sync logs
5. Check the database to verify meters were synced
6. Use the API endpoints to check status
7. Set breakpoints in the debugger for deeper investigation
