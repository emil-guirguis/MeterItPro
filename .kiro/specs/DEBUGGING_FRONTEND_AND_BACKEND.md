# Debugging Frontend and Backend Together

## Problem

When you set a breakpoint in the frontend and step into an API call, the debugger can't follow because:
- The frontend debugger is attached to Chrome
- The backend debugger is attached to Node.js
- They're separate processes

## Solution: Debug Both Simultaneously

### Step 1: Start Debugging Both Processes

1. Open VS Code
2. Go to Run → Debug Configurations
3. Select **"Debug Sync Full (Backend + Frontend)"**
4. Press **F5**

This will:
- Start the Sync MCP Server with Node.js debugger attached
- Start Chrome with the Sync Frontend
- Both debuggers are now active

### Step 2: Set Breakpoints in Both Places

**In Frontend** (`MeterItProSync/frontend/src/components/CompanyInfoCard.tsx`):
```typescript
const fetchTenantInfo = async () => {
  try {
    setIsLoading(true);
    setError(null);
    const data = await tenantApi.getTenantInfo();  // ← Set breakpoint here
    // ...
  }
}
```

**In Backend** (`MeterItProSync/mcp/src/api/server.ts`):
```typescript
this.app.get('/api/local/tenant', async (_req, res, next) => {
  try {
    console.log('📥 [API] GET /api/local/tenant - Request received');  // ← Set breakpoint here
    // ...
  }
}
```

### Step 3: Debug the Flow

1. **Frontend breakpoint hits first** - You're in `CompanyInfoCard.tsx`
2. **Step over** the `await tenantApi.getTenantInfo()` call
3. **Switch to Node.js debugger** - Click on the Node.js debug session in the Debug sidebar
4. **Backend breakpoint hits** - You're now in the API endpoint
5. **Step through** the backend code to see what's happening
6. **Switch back to Chrome** - Click on the Chrome debug session
7. **Continue** in the frontend

### Step 4: Use the Debug Sidebar

The Debug sidebar shows both debug sessions:

```
CALL STACK
├─ Node.js (Sync MCP Server)
│  └─ /api/local/tenant endpoint
└─ Chrome (Sync Frontend)
   └─ CompanyInfoCard.tsx
```

Click on each to switch between them.

## Debugging Workflow

### To Debug the Tenant Loading Issue:

1. **Start debugging** with "Debug Sync Full (Backend + Frontend)"
2. **Set breakpoint** in frontend at `tenantApi.getTenantInfo()`
3. **Set breakpoint** in backend at the start of `/api/local/tenant` endpoint
4. **Open frontend** in Chrome (should open automatically)
5. **Frontend breakpoint hits** - You're in the API call
6. **Step over** the await
7. **Switch to Node.js debugger** in the Debug sidebar
8. **Backend breakpoint hits** - You're in the endpoint
9. **Step through** the code:
   - Check if `syncPool` is defined
   - Check if the count query works
   - Check if the tenant query works
   - Check the error if it fails
10. **Inspect variables** in the Debug Console

## Debug Console Commands

### In Frontend (Chrome):
```javascript
// Check the API client
apiClient
apiClient.defaults.baseURL

// Check the response
data
JSON.stringify(data, null, 2)
```

### In Backend (Node.js):
```javascript
// Check the database pool
syncPool
syncPool.options

// Check query results
countResult
countResult.rows
tenant
```

## Common Debugging Scenarios

### Scenario 1: API Call Never Reaches Backend

**Check:**
1. Frontend breakpoint hits
2. Step over the await
3. Does backend breakpoint hit?

**If NO:**
- Network request failed
- Check browser Network tab (F12)
- Check if MCP server is running
- Check if port 3002 is correct

**If YES:**
- Request reached backend
- Continue debugging

### Scenario 2: Backend Query Fails

**Check:**
1. Backend breakpoint hits
2. Step to the count query
3. Inspect `syncPool`:
   ```javascript
   syncPool.options  // See connection config
   syncPool._clients  // See active connections
   ```
4. Step into the query
5. Check if error is thrown

**Common errors:**
- `42P01` - Table doesn't exist
- `ECONNREFUSED` - Can't connect to database
- `ENOTFOUND` - Host not found

### Scenario 3: Query Returns Wrong Data

**Check:**
1. Backend breakpoint hits
2. Step through the query
3. Inspect the result:
   ```javascript
   countResult.rows
   countResult.rowCount
   tenant
   JSON.stringify(tenant, null, 2)
   ```
4. Check if data is what you expect

## Switching Between Debuggers

### Using the Debug Sidebar:

1. Look at the left sidebar under "Debug"
2. You'll see two debug sessions:
   - "Sync MCP Server (Node.js)"
   - "Sync Frontend (Chrome)"
3. Click on each to switch

### Using Keyboard Shortcuts:

- **Ctrl+Shift+D** - Open Debug sidebar
- **F5** - Continue
- **F10** - Step over
- **F11** - Step into
- **Shift+F11** - Step out

## Tips for Debugging Both

1. **Arrange windows side-by-side:**
   - VS Code on left
   - Chrome DevTools on right
   - Can see both at once

2. **Use the Debug Console:**
   - Each debugger has its own console
   - Switch between them in the Debug sidebar
   - Type commands to inspect variables

3. **Set conditional breakpoints:**
   - Right-click breakpoint
   - Add condition: `tenantCount === 0`
   - Only breaks when condition is true

4. **Use logpoints instead of breakpoints:**
   - Right-click line number
   - "Add Logpoint"
   - Logs without stopping
   - Useful for high-frequency code

5. **Watch expressions:**
   - Add watch in Debug sidebar
   - Watch `syncPool.options`
   - Watch `tenant`
   - See values update as you step

## Troubleshooting

### Issue: Backend Debugger Doesn't Start

**Solution:**
1. Make sure MCP server is not already running
2. Kill any existing Node processes: `pkill -f "MeterItProSync/mcp"`
3. Rebuild: `npm run build` (in MeterItProSync/mcp)
4. Try again with F5

### Issue: Frontend Debugger Doesn't Start

**Solution:**
1. Make sure Chrome is not already running
2. Close all Chrome windows
3. Try again with F5
4. Chrome should open automatically

### Issue: Can't Switch Between Debuggers

**Solution:**
1. Look at the Debug sidebar on the left
2. You should see two debug sessions
3. Click on the one you want to switch to
4. If you don't see them, the debuggers didn't start properly

### Issue: Breakpoints Not Working in Backend

**Solution:**
1. Rebuild the project: `npm run build` (in MeterItProSync/mcp)
2. Restart the debugger (Shift+F5, then F5)
3. Make sure breakpoints are in `src/`, not `dist/`
4. Check that source maps are generated: `ls MeterItProSync/mcp/dist/*.map`

## Files to Debug

**Frontend:**
- `MeterItProSync/frontend/src/components/CompanyInfoCard.tsx` - Tenant loading
- `MeterItProSync/frontend/src/api/services.ts` - API calls

**Backend:**
- `MeterItProSync/mcp/src/api/server.ts` - API endpoints
- `MeterItProSync/mcp/src/data-sync/connection-manager.ts` - Database connections

## Next Steps

1. Start debugging with "Debug Sync Full (Backend + Frontend)"
2. Set breakpoints in both frontend and backend
3. Trigger the tenant loading
4. Step through both processes
5. Inspect variables to find the issue
6. Check the MCP server console for detailed logs

This way you can see exactly where the request fails!
