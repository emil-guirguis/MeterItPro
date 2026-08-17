# Meter Sync Flow Diagram

## Complete Flow with Debugger Breakpoints

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SYNC FRONTEND (React)                              │
│                    MeterItProSync/frontend/src/components/                            │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ MeterSyncCard.tsx                                                    │   │
│  │                                                                      │   │
│  │ User clicks: "Trigger Meter Sync" button                            │   │
│  │                                                                      │   │
│  │ handleMeterSyncTrigger() {                                          │   │
│  │   await meterSyncApi.triggerSync()                                  │   │
│  │ }                                                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    │ HTTP POST                               │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ MeterItProSync/frontend/src/api/services.ts                                    │   │
│  │                                                                      │   │
│  │ meterSyncApi.triggerSync() {                                        │   │
│  │   POST /api/local/meter-sync-trigger                                │   │
│  │ }                                                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP POST
                                    │ /api/local/meter-sync-trigger
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SYNC MCP SERVER (Node.js)                              │
│                    MeterItProSync/mcp/src/api/server.ts                               │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ POST /api/local/meter-sync-trigger                                   │   │
│  │                                                                      │   │
│  │ 🔴 DEBUGGER #1 BREAKS HERE                                          │   │
│  │ debugger;                                                            │   │
│  │                                                                      │   │
│  │ ✓ Validate meterSyncAgent exists                                    │   │
│  │ ✓ Check if sync already in progress                                 │   │
│  │ ✓ Call: this.meterSyncAgent.triggerSync()                           │   │
│  │                                                                      │   │
│  │ Return: {                                                            │   │
│  │   success: true,                                                    │   │
│  │   message: "Meter sync completed successfully",                     │   │
│  │   result: { inserted, updated, deleted, timestamp }                 │   │
│  │ }                                                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    │ Calls triggerSync()                     │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ MeterSyncAgent.triggerSync()                                         │   │
│  │                                                                      │   │
│  │ async triggerSync() {                                               │   │
│  │   return this.performSync()                                         │   │
│  │ }                                                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    │ Calls performSync()                     │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ MeterSyncAgent.performSync()                                         │   │
│  │                                                                      │   │
│  │ 🔴 DEBUGGER #2 BREAKS HERE                                          │   │
│  │ debugger;                                                            │   │
│  │                                                                      │   │
│  │ ✓ Check if sync already in progress                                 │   │
│  │ ✓ Get tenant_id from local database                                 │   │
│  │ ✓ Call: this.getRemoteMeters(tenantId)                              │   │
│  │                                                                      │   │
│  │    ┌─────────────────────────────────────────────────────────────┐  │   │
│  │    │ getRemoteMeters(tenantId)                                   │  │   │
│  │    │                                                             │  │   │
│  │    │ 🔴 DEBUGGER #3 BREAKS HERE                                 │  │   │
│  │    │ debugger;                                                  │  │   │
│  │    │                                                             │  │   │
│  │    │ Query REMOTE database:                                     │  │   │
│  │    │ SELECT m.id, m.name, m.ip, m.port, m.active,              │  │   │
│  │    │        me.element                                          │  │   │
│  │    │ FROM meter m                                               │  │   │
│  │    │ JOIN meter_element me ON me.meter_id = m.id                │  │   │
│  │    │ WHERE m.tenant_id = $1                                     │  │   │
│  │    │                                                             │  │   │
│  │    │ Return: MeterEntity[] from REMOTE database                 │  │   │
│  │    └─────────────────────────────────────────────────────────────┘  │   │
│  │                                    │                                  │   │
│  │                                    ▼                                  │   │
│  │ ✓ Get local meters from LOCAL database                              │   │
│  │ ✓ Compare remote vs local                                           │   │
│  │ ✓ INSERT new meters into LOCAL database                             │   │
│  │ ✓ UPDATE changed meters in LOCAL database                           │   │
│  │ ✓ DELETE/DEACTIVATE removed meters in LOCAL database                │   │
│  │ ✓ Log sync operation to sync_log table                              │   │
│  │                                                                      │   │
│  │ Return: MeterSyncResult {                                           │   │
│  │   success: true,                                                    │   │
│  │   inserted: 5,                                                      │   │
│  │   updated: 2,                                                       │   │
│  │   deleted: 1,                                                       │   │
│  │   timestamp: Date                                                   │   │
│  │ }                                                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Response
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SYNC FRONTEND (React)                                  │
│                                                                              │
│ MeterSyncCard receives response and updates UI:                             │
│ - Shows "Meter sync triggered successfully"                                 │
│ - Updates last sync timestamp                                               │
│ - Shows inserted/updated/deleted counts                                     │
│ - Refreshes meter count                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Connections

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    SYNC MCP SERVER                                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Connection Pools (connection-pools.ts)                             │ │
│  │                                                                    │ │
│  │ remotePool ──────────────────────────────────────────────────────┐ │ │
│  │ (Client System Database)                                         │ │ │
│  │                                                                  │ │ │
│  │ syncPool ────────────────────────────────────────────────────────┐ │ │
│  │ (Sync System Database)                                          │ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ MeterSyncAgent                                                     │ │
│  │                                                                    │ │
│  │ getRemoteMeters() ──────────────────────────────────────────────┐ │ │
│  │                                                                 │ │ │
│  │ Uses: this.remotePool.query()                                  │ │ │
│  │ Queries: REMOTE database                                       │ │ │
│  │ Returns: Meters from Client System                             │ │ │
│  │                                                                 │ │ │
│  │ performSync() ──────────────────────────────────────────────────┐ │ │
│  │                                                                 │ │ │
│  │ Uses: this.syncDatabase (which uses syncPool)                  │ │ │
│  │ Queries: LOCAL database                                        │ │ │
│  │ Updates: LOCAL database with synced meters                     │ │ │
│  │                                                                 │ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌─────────────────────────┐     ┌─────────────────────────┐
        │  REMOTE DATABASE        │     │  LOCAL DATABASE         │
        │  (Client System)        │     │  (Sync System)          │
        │                         │     │                         │
        │ Tables:                 │     │ Tables:                 │
        │ - meter                 │     │ - meter                 │
        │ - meter_element         │     │ - meter_reading         │
        │ - tenant                │     │ - sync_log              │
        │ - user                  │     │ - tenant                │
        │ - etc.                  │     │ - etc.                  │
        │                         │     │                         │
        │ READ ONLY               │     │ READ/WRITE              │
        │ (by meter sync)         │     │ (by meter sync)         │
        └─────────────────────────┘     └─────────────────────────┘
```

---

## Debugger Breakpoint Sequence

```
User clicks "Trigger Meter Sync"
        │
        ▼
🔴 DEBUGGER #1 (API Endpoint)
   MeterItProSync/mcp/src/api/server.ts
   POST /api/local/meter-sync-trigger
   
   Inspect:
   - _req (HTTP request)
   - this.meterSyncAgent (agent instance)
   
   Press: Continue (F5)
        │
        ▼
🔴 DEBUGGER #2 (Main Sync Operation)
   MeterItProSync/mcp/src/sync-service/meter-sync-agent.ts
   performSync()
   
   Inspect:
   - this.tenant_id (tenant being synced)
   - this.isSyncing (sync status)
   - this.status (current status)
   
   Press: Continue (F5)
        │
        ▼
🔴 DEBUGGER #3 (Remote Database Query)
   MeterItProSync/mcp/src/sync-service/meter-sync-agent.ts
   getRemoteMeters(tenantId)
   
   Inspect:
   - tenantId (tenant ID)
   - query (SQL being executed)
   - result.rows (meters from REMOTE database)
   
   Press: Continue (F5)
        │
        ▼
Sync completes and returns to frontend
```

---

## Key Variables to Inspect

### At Debugger #1
```javascript
_req.body          // Request body (empty for this endpoint)
this.meterSyncAgent // MeterSyncAgent instance
this.database      // SyncDatabase instance
```

### At Debugger #2
```javascript
this.tenant_id     // e.g., 1
this.isSyncing     // false (should be false at start)
this.status        // { isRunning, isSyncing, lastInsertedCount, ... }
remoteMeters       // Array of meters from REMOTE database
localMeters        // Array of meters from LOCAL database
```

### At Debugger #3
```javascript
tenantId           // e.g., 1
query              // SQL query string
result.rows        // Array of meter objects from REMOTE database
result.rows[0]     // First meter object (inspect structure)
```

---

## Summary

✅ **Debugger #1** - Entry point when trigger button is clicked  
✅ **Debugger #2** - Main sync operation starts  
✅ **Debugger #3** - Remote database query executes  

All three debuggers are compiled and ready to use. Just start the debugger and click the button!
