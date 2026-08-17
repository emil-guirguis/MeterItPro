# Debugging Sync MCP Server

## Issue: Breakpoints Not Stopping

The debugger isn't stopping at breakpoints in the Sync MCP Server. This is because:

1. The MCP server runs as a stdio process (for Model Context Protocol)
2. Source maps might not be properly configured
3. The compiled code might not match the source

## Solution: Proper Debugging Setup

### Step 1: Rebuild with Source Maps

Make sure the project is built with source maps:

```bash
cd MeterItProSync/mcp
npm run build
```

This should generate `.js.map` files in the `dist/` directory.

### Step 2: Use the Updated Launch Configuration

The launch.json has been updated with proper source map configuration:

```json
{
  "name": "Sync MCP Server (Node.js)",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/MeterItProSync/mcp/dist/index.js",
  "sourceMaps": true,
  "outFiles": [
    "${workspaceFolder}/MeterItProSync/mcp/dist/**/*.js"
  ],
  "resolveSourceMapLocations": [
    "${workspaceFolder}/MeterItProSync/mcp/**",
    "!**/node_modules/**"
  ]
}
```

### Step 3: Start Debugging

1. Open VS Code
2. Go to Run → Debug Configurations
3. Select "Debug Sync Backend"
4. Press F5 to start debugging
5. Set breakpoints in the TypeScript source files (in `MeterItProSync/mcp/src/`)
6. The debugger should now stop at breakpoints

### Step 4: Trigger the API Call

Once the debugger is running:

1. Open the Sync Frontend (http://localhost:3003)
2. The page will try to load tenant info
3. This will trigger the `/api/local/tenant` endpoint
4. The debugger should stop at your breakpoints

## Debugging the Tenant Endpoint

To debug the tenant loading issue:

### Set Breakpoints

1. Open `MeterItProSync/mcp/src/api/server.ts`
2. Find the `GET /api/local/tenant` endpoint (around line 130)
3. Click on the line number to set a breakpoint at:
   - `console.log('📥 [API] GET /api/local/tenant - Request received');`
   - `const countQuery = ...`
   - `const result = await syncPool.query(query);`

### Debug Steps

1. Start debugging with F5
2. Open frontend in browser
3. Debugger should pause at first breakpoint
4. Use the Debug Console to inspect variables:
   ```javascript
   // In Debug Console
   syncPool
   countResult
   tenant
   ```

5. Step through the code with F10 (step over) or F11 (step into)
6. Watch the Variables panel to see values change

## Common Debugging Issues

### Issue: Breakpoints Show as "Unverified"

**Solution:**
1. Rebuild the project: `npm run build`
2. Restart the debugger (F5)
3. Make sure you're setting breakpoints in the `src/` directory, not `dist/`

### Issue: Debugger Doesn't Stop

**Solution:**
1. Check that the preLaunchTask "build-sync-mcp" is configured
2. Verify source maps are generated: `ls MeterItProSync/mcp/dist/*.map`
3. Try adding a `debugger;` statement in the code:
   ```typescript
   this.app.get('/api/local/tenant', async (_req, res, next) => {
     debugger;  // Add this line
     try {
       console.log('📥 [API] GET /api/local/tenant - Request received');
   ```

### Issue: Breakpoints Stop Working After Changes

**Solution:**
1. Stop the debugger (Shift+F5)
2. Rebuild: `npm run build`
3. Restart the debugger (F5)

## Alternative: Console Logging

If breakpoints aren't working, use console logging instead:

```typescript
// In MeterItProSync/mcp/src/api/server.ts
this.app.get('/api/local/tenant', async (_req, res, next) => {
  try {
    console.log('📥 [API] GET /api/local/tenant - Request received');
    console.log('   syncPool:', syncPool);
    console.log('   syncPool.query:', typeof syncPool.query);
    
    const countQuery = `SELECT COUNT(*) as count FROM tenant`;
    console.log('   Executing query:', countQuery);
    
    const countResult = await syncPool.query(countQuery);
    console.log('   Query result:', countResult);
    console.log('   Result rows:', countResult.rows);
    
    // ... rest of code
  } catch (error) {
    console.error('❌ [API] Error:', error);
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    console.error('   Error code:', (error as any)?.code);
    console.error('   Error detail:', (error as any)?.detail);
    next(error);
  }
});
```

Then watch the console output in the terminal where the MCP server is running.

## Debugging Workflow

### For API Endpoint Issues:

1. **Start debugging** with F5
2. **Set breakpoint** in the endpoint handler
3. **Trigger the endpoint** from the frontend
4. **Inspect variables** in the Debug Console
5. **Step through code** with F10/F11
6. **Check error details** in the Variables panel

### For Database Issues:

1. **Set breakpoint** before the query
2. **Inspect syncPool** in Debug Console:
   ```javascript
   syncPool.options  // See connection config
   syncPool._clients  // See active connections
   ```
3. **Step into the query** with F11
4. **Check the error** if query fails

### For Initialization Issues:

1. **Set breakpoint** in `index.ts` at `initializeServices()`
2. **Step through** the initialization
3. **Check each service** is initialized:
   ```javascript
   this.syncDatabase
   this.meterSyncAgent
   this.bacnetMeterReadingAgent
   this.apiServer
   ```

## Debug Console Commands

Once paused at a breakpoint, use the Debug Console to inspect:

```javascript
// Check if syncPool is initialized
syncPool

// Check pool configuration
syncPool.options

// Check active connections
syncPool._clients

// Check error details
error.message
error.code
error.detail
error.hint

// Check query results
countResult.rows
countResult.rowCount

// Check tenant data
tenant
JSON.stringify(tenant, null, 2)
```

## Files to Debug

- `MeterItProSync/mcp/src/api/server.ts` - API endpoints
- `MeterItProSync/mcp/src/data-sync/connection-manager.ts` - Database connections
- `MeterItProSync/mcp/src/index.ts` - Server initialization
- `MeterItProSync/mcp/src/sync-service/meter-sync-agent.ts` - Meter sync logic

## Tips

1. **Always rebuild** after making changes: `npm run build`
2. **Use the Debug Console** to inspect variables
3. **Set breakpoints in src/, not dist/**
4. **Watch the terminal** for console.log output
5. **Check source maps** are generated: `ls MeterItProSync/mcp/dist/*.map`
6. **Restart debugger** if breakpoints stop working

## Next Steps

1. Rebuild the project
2. Start debugging with F5
3. Set breakpoints in `MeterItProSync/mcp/src/api/server.ts`
4. Trigger the API call from the frontend
5. Inspect variables in the Debug Console
6. Step through the code to find the issue
