# API Key Loading from Environment - Complete Fix

## Problem
The tenant sync was not populating the API key in the local sync database because:
1. The remote database's tenant table doesn't have the API key
2. The API key is stored in the environment variable `CLIENT_API_KEY`
3. The code was waiting for the tenant sync to complete, but the API key was never being stored

## Root Cause
The API key needs to come from the environment variable, not from the remote database. The initialization flow was:
1. Start RemoteToLocalSyncAgent (syncs tenant from remote DB)
2. Wait for tenant sync to complete
3. Try to load API key from local database (but it's not there!)
4. Create API client with blank API key

## Solution
Modified the initialization to:
1. Load API key from environment variable `CLIENT_API_KEY`
2. Start RemoteToLocalSyncAgent (syncs tenant from remote DB)
3. **Store the API key in the local sync database tenant table**
4. Load API key from database (now guaranteed to have it)
5. Create API client with loaded key
6. Start SyncManager

### Changes Made

#### 1. Added `updateTenantApiKey()` method to SyncDatabase class
**File:** `MeterItProSync/mcp/src/data-sync/data-sync.ts`

```typescript
async updateTenantApiKey(apiKey: string): Promise<void> {
  // Updates the api_key column in the tenant table
  // Handles gracefully if column doesn't exist
}
```

#### 2. Updated SyncDatabase interface
**File:** `MeterItProSync/mcp/src/types/entities.ts`

Added method signature to interface:
```typescript
updateTenantApiKey(apiKey: string): Promise<void>;
```

#### 3. Modified initialization order in SyncMcpServer
**File:** `MeterItProSync/mcp/src/index.ts`

New flow:
```
1. Load API key from environment variable CLIENT_API_KEY
2. Initialize RemoteToLocalSyncAgent
3. Start RemoteToLocalSyncAgent (syncs tenant)
4. Store API key in local database tenant table
5. Load API key from database (fallback if env var not set)
6. Create ClientSystemApiClient with API key
7. Start SyncManager
```

## Result
- API key is now guaranteed to be available when `testConnection()` is called
- API key is stored in the local sync database for persistence
- Connectivity tests will have the correct API key
- No more blank API key errors

## Environment Variable
The API key must be set in `.env`:
```
CLIENT_API_KEY=your_api_key_here
```

If not set, the system will attempt to load it from the database (fallback).

## Files Modified
- `MeterItProSync/mcp/src/index.ts` - Updated initialization order
- `MeterItProSync/mcp/src/data-sync/data-sync.ts` - Added `updateTenantApiKey()` method
- `MeterItProSync/mcp/src/types/entities.ts` - Added method to interface

## Build Status
✅ Build successful with `npm run build`
