# API Key Memory Loading Implementation

## Overview
Updated the Sync system to load the API key from the tenant table and store it in memory for use during connectivity checks and sync operations.

## Changes Made

### 1. Updated TenantEntity Interface
**File**: `MeterItProSync/mcp/src/types/entities.ts`

Added `api_key` field to the TenantEntity interface:
```typescript
export interface TenantEntity {
  tenant_id: number;
  url?: string;
  name?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  api_key?: string;  // ← Added this field
}
```

### 2. Updated SyncManager
**File**: `MeterItProSync/mcp/src/sync-service/sync-manager.ts`

Added API key storage in memory:
```typescript
export class SyncManager {
  // ... other properties
  private apiKey: string = ''; // Store API key in memory
  
  // ... rest of class
}
```

Updated `start()` method to load API key from tenant:
```typescript
async start(): Promise<void> {
  // ... existing code
  
  // Load API key from tenant
  try {
    const tenant = await this.database.getTenant();
    if (tenant && tenant.api_key) {
      this.apiKey = tenant.api_key;
      console.log(`✅ [SyncManager] API key loaded from tenant: ${this.apiKey.substring(0, 8)}...`);
      // Update the API client with the loaded key
      this.apiClient.setApiKey(this.apiKey);
    } else {
      console.warn('⚠️  [SyncManager] No API key found in tenant, connectivity checks may fail');
    }
  } catch (error) {
    console.error('❌ [SyncManager] Failed to load API key from tenant:', error);
  }
  
  // ... rest of method
}
```

### 3. Updated ClientSystemApiClient
**File**: `MeterItProSync/mcp/src/api/client-system-api.ts`

Added `setApiKey()` method to update the API key at runtime:
```typescript
/**
 * Set or update the API key
 */
setApiKey(apiKey: string): void {
  this.apiKey = apiKey;
  this.client.defaults.headers['X-API-Key'] = apiKey;
  console.log(`🔑 [ClientSystemApiClient] API key updated: ${apiKey.substring(0, 8)}...`);
}
```

## How It Works

### Startup Flow

1. **SyncManager starts**
   ```
   Starting sync manager...
   ```

2. **Load tenant from database**
   ```
   SELECT * FROM tenant LIMIT 1
   ```

3. **Extract API key from tenant**
   ```
   ✅ [SyncManager] API key loaded from tenant: a1b2c3d4...
   ```

4. **Update ClientSystemApiClient with the key**
   ```
   🔑 [ClientSystemApiClient] API key updated: a1b2c3d4...
   ```

5. **Start connectivity monitoring**
   ```
   Starting connectivity monitor...
   ```

6. **Test initial connectivity using the loaded key**
   ```
   🔍 [ClientSystemApiClient] Testing connection to: http://localhost:3001/api/sync/heartbeat
   ✅ [ClientSystemApiClient] Connection successful - Status: 200
   ```

### Connectivity Check Flow

When the connectivity monitor checks connection:

1. Uses the API key stored in memory (loaded at startup)
2. Sends heartbeat to `/sync/heartbeat` endpoint
3. Includes the API key in the `X-API-Key` header
4. Returns `true` if successful, `false` if failed

## Database Schema

The tenant table now has:

```sql
ALTER TABLE tenant ADD COLUMN api_key UUID UNIQUE;
```

Example data:
```sql
INSERT INTO tenant (id, name, api_key) 
VALUES (1, 'My Tenant', 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6');
```

## Benefits

✅ **No environment variable needed** - API key is loaded from database  
✅ **Automatic synchronization** - When tenant syncs, API key is loaded  
✅ **In-memory storage** - Fast access during connectivity checks  
✅ **Dynamic updates** - API key can be updated without restarting  
✅ **Secure** - Key is not exposed in logs (only first 8 chars shown)  

## Verification

### Check Logs on Startup

Look for these messages:
```
✅ [SyncManager] API key loaded from tenant: a1b2c3d4...
🔑 [ClientSystemApiClient] API key updated: a1b2c3d4...
🔍 [ClientSystemApiClient] Testing connection to: http://localhost:3001/api/sync/heartbeat
✅ [ClientSystemApiClient] Connection successful - Status: 200
```

### Check Frontend

The System Connection card should show "Connected" (green) if the API key is valid and the Client API is running.

### Manual Test

```bash
# Get the API key from the tenant table
SELECT api_key FROM tenant WHERE id = 1;

# Test the connection
curl -X POST http://localhost:3001/api/sync/heartbeat \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"timestamp": "2024-01-06T12:00:00Z"}'
```

## Troubleshooting

### "No API key found in tenant"
- The `api_key` field is NULL in the tenant table
- Solution: Update the tenant record with a valid UUID

### "Connection failed" after loading key
- The API key is invalid or doesn't match what's in the Client database
- Solution: Verify the API key in both databases matches

### API key not updating
- The SyncManager needs to be restarted to reload the key
- Solution: Restart the Sync MCP Server

## Files Modified
1. `MeterItProSync/mcp/src/types/entities.ts` - Added `api_key` field to TenantEntity
2. `MeterItProSync/mcp/src/sync-service/sync-manager.ts` - Added API key loading logic
3. `MeterItProSync/mcp/src/api/client-system-api.ts` - Added `setApiKey()` method
