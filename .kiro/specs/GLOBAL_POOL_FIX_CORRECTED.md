# Global Pool Fix - Corrected

## What Was Wrong

You were right - there's already a global `syncPool` exported from `data-sync.ts`. I was overcomplicating it by adding a wrapper method.

## What We Fixed

### Before (Incorrect)
```typescript
// reading-batcher.ts
const pool = database.getPool ? database.getPool() : database.pool;
if (!pool) {
  throw new Error('Database pool is not available');
}
client = await pool.connect();
```

### After (Correct)
```typescript
// reading-batcher.ts
import { syncPool } from '../data-sync/data-sync.js';

// Later in flushBatch()
if (!syncPool) {
  throw new Error('Global syncPool is not initialized. Call initializePools() first.');
}
client = await syncPool.connect();
```

## Changes Made

### 1. `MeterItProSync/mcp/src/bacnet-collection/reading-batcher.ts`
- Added import: `import { syncPool } from '../data-sync/data-sync.js';`
- Changed pool access to use global `syncPool` directly
- Removed the wrapper method call

### 2. `MeterItProSync/mcp/src/data-sync/data-sync.ts`
- Removed the unnecessary `getPool()` method
- `SyncDatabase` still uses the global `syncPool` internally
- No changes to the global pool initialization

## How It Works Now

```
1. initializePools() is called in index.ts
   ↓
2. Global syncPool is created and exported
   ↓
3. ReadingBatcher imports syncPool directly
   ↓
4. When flushBatch() is called, it uses syncPool.connect()
   ↓
5. Readings are inserted into the database
```

## Benefits

✅ **Simpler** - Uses the global pool directly, no wrapper needed
✅ **Cleaner** - No unnecessary method calls
✅ **Faster** - Direct access to the pool
✅ **Correct** - Uses the same pool that's already initialized

## Verification

Both files compile without errors:
- ✅ `MeterItProSync/mcp/src/bacnet-collection/reading-batcher.ts`
- ✅ `MeterItProSync/mcp/src/data-sync/data-sync.ts`

## Next Steps

The database pool is now correctly using the global `syncPool`. Once the BACnet meter issue is resolved (meter at 10.10.10.22:47808 needs to be online), readings will flow through and be inserted into the database.

See `BACNET_QUICK_FIX.md` for BACnet diagnostics.
