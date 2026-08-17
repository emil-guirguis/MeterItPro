# AI Search Feature - Troubleshooting Guide

## Issue: Search Returns No Results

### Step 1: Verify Backend is Running
```bash
# Check if backend is running on port 3001
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "OK",
  "database": "Connected",
  ...
}
```

### Step 2: Verify Database Connection
Check the backend logs for:
```
✅ [INIT] Database connected
```

If you see:
```
❌ [INIT] Initialization error: Database connection failed
```

Then:
1. Verify PostgreSQL is running
2. Check `.env` file has correct database credentials
3. Restart the backend server

### Step 3: Verify Devices Exist in Database
```bash
# Connect to PostgreSQL
psql -U postgres -d meteritpro

# Check if devices exist
SELECT COUNT(*) FROM public.device;
SELECT * FROM public.device LIMIT 5;
```

If no devices exist:
1. Create test devices through the UI
2. Or run the test data script

### Step 4: Verify Authentication Token
Open browser DevTools (F12) and check:
1. Go to Application tab
2. Check localStorage for `auth_token` or `token`
3. Check sessionStorage for `auth_token` or `token`

If no token exists:
1. Login to the application
2. Verify token is stored after login

### Step 5: Test Search Endpoint Directly
```bash
# Get your auth token from browser DevTools
TOKEN="your_token_here"

# Test the search endpoint
curl -X POST http://localhost:3001/api/ai/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "meter"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "device-1",
        "name": "Main Meter",
        "type": "device",
        "location": "Building A",
        "currentConsumption": 100,
        "unit": "kWh",
        "status": "active",
        "relevanceScore": 1.0,
        "lastReading": {
          "value": 100,
          "timestamp": "2024-01-31T..."
        }
      }
    ],
    "total": 1,
    "executionTime": 5
  }
}
```

### Step 6: Check Browser Console
Open DevTools (F12) and check Console tab for errors:

**Error: "No authentication token found"**
- Solution: Login to the application

**Error: "Search timeout"**
- Solution: Backend is slow or not responding
- Check backend logs for errors

**Error: "Network error"**
- Solution: Backend is not running
- Start backend: `npm run dev` in `client/backend`

### Step 7: Check Backend Logs
Look for these log messages:

**Good signs:**
```
🔍 [AI_SEARCH] Searching for: "meter" (tenant: test-tenant-123, limit: 20, offset: 0)
✅ [AI_SEARCH] Search completed in 5ms, returned 1 results
```

**Bad signs:**
```
❌ [AI_SEARCH] Error: Database not connected
❌ [AI_SEARCH] Error: Missing tenant ID in request context
```

## Common Issues and Solutions

### Issue: "Database not connected"
**Cause**: Backend hasn't connected to PostgreSQL yet
**Solution**: 
1. Wait 5-10 seconds for backend to initialize
2. Check PostgreSQL is running
3. Restart backend

### Issue: "Missing tenant ID"
**Cause**: Authentication middleware not working
**Solution**:
1. Verify you're logged in
2. Check token is valid
3. Restart backend

### Issue: "No results found"
**Cause**: No devices in database or no matches
**Solution**:
1. Create test devices through UI
2. Try searching for exact device name
3. Check database has data: `SELECT * FROM public.device;`

### Issue: Search bar not appearing
**Cause**: Frontend not loaded or Header component not rendering
**Solution**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check browser console for errors
3. Verify Header component is imported

### Issue: Voice search not working
**Cause**: Browser doesn't support Web Speech API or microphone not allowed
**Solution**:
1. Use Chrome, Edge, or Safari (Firefox has limited support)
2. Allow microphone access when prompted
3. Check browser console for errors

## Testing the Feature

### Unit Tests
```bash
cd client/backend
npm test -- aiSearch.test.js --run
```

All 15 tests should pass.

### Manual Testing
1. Start backend: `npm run dev` in `client/backend`
2. Start frontend: `npm run dev` in `MeterItPro/frontend`
3. Login to application
4. Type in search bar
5. Verify results appear

### Test Data
Create test devices:
```sql
INSERT INTO public.device (device_id, tenant_id, name, type, location, status)
VALUES 
  ('device-1', 'your-tenant-id', 'Main Meter', 'meter', 'Building A', 'active'),
  ('device-2', 'your-tenant-id', 'Backup Meter', 'meter', 'Building B', 'active');
```

## Performance Considerations

- Search is limited to 20 results by default
- Pagination supported with limit and offset
- Searches devices without readings (no filtering)
- Case-insensitive matching
- Partial keyword matching supported

## Security Notes

- All searches filtered by tenant ID
- Authentication required (Bearer token)
- Input validation on query, limit, offset
- Error messages don't leak sensitive data
