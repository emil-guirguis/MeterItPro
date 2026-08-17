# Meter Sync Debugger Summary

## ✅ Debugger Statements Added

I've added **3 debugger statements** to help you trace the meter sync flow from the frontend trigger all the way through to the remote database query.

### Location 1: API Endpoint Entry Point
**File:** `MeterItProSync/mcp/src/api/server.ts` (Line ~440)  
**Compiled:** `MeterItProSync/mcp/dist/api/server.js` (Line ~391)

```typescript
this.app.post('/api/local/meter-sync-trigger', async (_req, res, next) => {
  debugger; // ← DEBUGGER #1
  try {
    console.log('📥 [API] POST /api/local/meter-sync-trigger - Request received');
    // ...
  }
});
```

**What happens here:**
- Frontend sends POST request to `/api/local/meter-sync-trigger`
- Server receives the request
- Validates that meterSyncAgent is available
- Calls `meterSyncAgent.triggerSync()`

---

### Location 2: Main Sync Operation
**File:** `MeterItProSync/mcp/src/sync-service/meter-sync-agent.ts` (Line ~100)  
**Compiled:** `MeterItProSync/mcp/dist/sync-service/meter-sync-agent.js` (Line ~82)

```typescript
async performSync(): Promise<MeterSyncResult> {
  debugger; // ← DEBUGGER #2
  if (this.isSyncing) {
    // ...
  }
}
```

**What happens here:**
- Main sync operation starts
- Checks if sync is already in progress
- Gets tenant_id from local database
- Calls `getRemoteMeters()` to fetch from REMOTE database
- Calls `syncDatabase.getMeters()` to fetch from LOCAL database
- Compares the two lists
- Performs INSERT/UPDATE/DELETE operations on LOCAL database

---

### Location 3: Remote Database Query
**File:** `MeterItProSync/mcp/src/sync-service/meter-sync-agent.ts` (Line ~240)  
**Compiled:** `MeterItProSync/mcp/dist/sync-service/meter-sync-agent.js` (Line ~244)

```typescript
private async getRemoteMeters(tenantId: number): Promise<MeterEntity[]> {
  debugger; // ← DEBUGGER #3
  try {
    const query = `
      SELECT m.id as meter_id,
             m.name as name,
             m.ip as ip,
             m.port as port,
             m.active as active,
             me.element as element
        FROM meter m
             JOIN meter_element me ON me.meter_id = m.id
      WHERE m.tenant_id = $1
    `;
    
    const result = await this.remotePool.query(query, [tenantId]);
    // ← This queries the REMOTE database
    return result.rows as MeterEntity[];
  }
}
```

**What happens here:**
- Queries the REMOTE database (Client System database)
- Joins meter table with meter_element table
- Filters by tenant_id
- Returns array of meters from REMOTE database

---

## How to Use the Debuggers

### Step 1: Start the Debugger
```
VS Code → Run → "Debug Sync Backend" or "Debug All Backends"
```

### Step 2: Trigger the Meter Sync
1. Open Sync Frontend: http://localhost:3003
2. Find the "Remote Meter Sync" card
3. Click "Trigger Meter Sync" button

### Step 3: Debugger Will Break At
- **Debugger #1:** When the button is clicked (API endpoint receives request)
- **Debugger #2:** When the sync operation starts
- **Debugger #3:** When querying the remote database

### Step 4: Inspect Variables
At each debugger breakpoint, you can inspect:

**At Debugger #1:**
- `_req` - The HTTP request object
- `res` - The HTTP response object
- `this.meterSyncAgent` - The sync agent instance

**At Debugger #2:**
- `this.tenant_id` - The tenant being synced
- `this.isSyncing` - Whether sync is already in progress
- `this.status` - Current sync status

**At Debugger #3:**
- `tenantId` - The tenant ID being queried
- `query` - The SQL query being executed
- `result.rows` - The meters returned from REMOTE database

---

## Database Flow

```
REMOTE Database (Client System)
    ↓
    │ (getRemoteMeters queries here)
    │
    ├─ SELECT from meter table
    ├─ JOIN with meter_element table
    └─ Filter by tenant_id
    
    ↓
    
LOCAL Database (Sync System)
    ↓
    │ (performSync compares and syncs)
    │
    ├─ INSERT new meters
    ├─ UPDATE changed meters
    └─ DELETE/DEACTIVATE removed meters
```

---

## Key Files

| File | Purpose |
|------|---------|
| `MeterItProSync/frontend/src/components/MeterSyncCard.tsx` | UI component - "Trigger Meter Sync" button |
| `MeterItProSync/frontend/src/api/services.ts` | API client - calls `/api/local/meter-sync-trigger` |
| `MeterItProSync/mcp/src/api/server.ts` | Express endpoint - receives trigger request |
| `MeterItProSync/mcp/src/sync-service/meter-sync-agent.ts` | Core sync logic - reads remote, writes local |
| `MeterItProSync/mcp/src/database/connection-pools.ts` | Database connections (remote & local) |

---

## What Gets Synced

The meter sync reads from the **REMOTE** database and writes to the **LOCAL** database:

**From REMOTE database:**
- `meter.id` → `meter_id`
- `meter.name` → `name`
- `meter.ip` → `ip`
- `meter.port` → `port`
- `meter.active` → `active`
- `meter_element.element` → `element`

**Filtered by:**
- `meter.tenant_id = $1` (current tenant only)

**Operations:**
- **INSERT:** New meters from remote that don't exist locally
- **UPDATE:** Existing meters where IP, port, or active status changed
- **DELETE:** Meters that were deleted from remote or deactivated

---

## Notes

✅ All debugger statements are already compiled and ready to use  
✅ Source maps are configured for proper breakpoint mapping  
✅ The sync is tenant-aware (only syncs meters for the current tenant)  
✅ The sync can run automatically on a schedule or be manually triggered  
✅ The sync logs all operations to the `sync_log` table  

---

## Next Steps

1. Rebuild if you made any changes: `npm run build` in `MeterItProSync/mcp`
2. Start the debugger: VS Code → Run → "Debug Sync Backend"
3. Click "Trigger Meter Sync" in the Sync Frontend
4. Debugger will break at the three locations above
5. Use the debugger console to inspect variables and step through the code
