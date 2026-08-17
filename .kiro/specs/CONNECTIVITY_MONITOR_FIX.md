# Connectivity Monitor Fix

## Problem
The Connectivity Monitor was returning an incorrect status (always disconnected) because:

1. **Missing Environment Variable**: `CLIENT_API_URL` was not configured in `.env`
2. **Fallback to Default**: The code was falling back to `http://localhost:3001/api` which may not be correct
3. **No Logging**: There was no visibility into what URL was being tested or why it was failing

## Root Cause
In `MeterItProSync/mcp/src/index.ts`, the ClientSystemApiClient was being created with:
```typescript
const apiClient = new ClientSystemApiClient({
  apiUrl: process.env.CLIENT_API_URL || 'http://localhost:3001/api',  // ← Fallback to default
  apiKey: process.env.CLIENT_API_KEY || '',
  timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
  maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
});
```

If `CLIENT_API_URL` wasn't set, it would use the default, which might not be where the Client API is actually running.

## Solution

### 1. Added Environment Variables to `.env`
```env
# Backend Client API URL (for Sync MCP Server)
CLIENT_API_URL=http://localhost:3001/api
CLIENT_API_KEY=
```

### 2. Enhanced Logging in ClientSystemApiClient
Added detailed logging to `testConnection()` method:
```typescript
async testConnection(): Promise<boolean> {
  try {
    console.log(`🔍 [ClientSystemApiClient] Testing connection to: ${this.client.defaults.baseURL}/health`);
    const response = await this.client.get('/health', {
      timeout: 5000,
    });
    console.log(`✅ [ClientSystemApiClient] Connection successful - Status: ${response.status}`);
    return response.status === 200;
  } catch (error) {
    console.error(`❌ [ClientSystemApiClient] Connection failed:`, {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      baseURL: this.client.defaults.baseURL,
    });
    return false;
  }
}
```

### 3. Enhanced Logging in ConnectivityMonitor
Added error logging to `checkConnectivity()` method:
```typescript
} catch (error) {
  console.error('❌ [ConnectivityMonitor] Error during connectivity check:', error);
  this.status.lastCheckTime = new Date();
  this.status.isConnected = false;
  this.status.lastFailedConnection = new Date();
  this.status.consecutiveFailures++;
  // ... rest of error handling
}
```

## How to Verify the Fix

### 1. Check Environment Variables
Verify `.env` has:
```
CLIENT_API_URL=http://localhost:3001/api
CLIENT_API_KEY=
```

### 2. Check Backend Logs
Look for these log messages:
```
🔄 [ConnectivityMonitor] Checking connectivity...
🔍 [ClientSystemApiClient] Testing connection to: http://localhost:3001/api/health
✅ [ClientSystemApiClient] Connection successful - Status: 200
✓ [ConnectivityMonitor] Connection test result: true
📊 [ConnectivityMonitor] Updated status.isConnected to: true
```

### 3. Check Frontend
The System Connection card should show "Connected" (green) if the Client API is running.

## Debugging Steps

If still showing disconnected:

1. **Verify Client API is running**
   ```bash
   curl http://localhost:3001/health
   ```
   Should return `200 OK`

2. **Check the logs for the actual URL being tested**
   Look for: `Testing connection to: [URL]`

3. **Verify network connectivity**
   ```bash
   ping localhost
   telnet localhost 3001
   ```

4. **Check if firewall is blocking**
   Ensure port 3001 is accessible

5. **Verify API Key if needed**
   If the Client API requires authentication, set `CLIENT_API_KEY` in `.env`

## Files Modified
1. `.env` - Added `CLIENT_API_URL` and `CLIENT_API_KEY`
2. `MeterItProSync/mcp/src/api/client-system-api.ts` - Enhanced logging in `testConnection()`
3. `MeterItProSync/mcp/src/api/connectivity-monitor.ts` - Enhanced error logging in `checkConnectivity()`

## Expected Behavior After Fix

1. **On Startup**: Connectivity Monitor performs initial check
2. **Every 60 seconds**: Connectivity Monitor checks again
3. **On Success**: Status shows "Connected", logs show success messages
4. **On Failure**: Status shows "Disconnected", logs show error details with URL and error code
5. **Frontend**: System Connection card updates to reflect actual status
