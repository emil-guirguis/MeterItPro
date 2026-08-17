# Tenant Loading Error - Debugging Guide

## Error Message
```
Server error: Unable to retrieve tenant information. Please try again later.
```

## What's Happening

When the Sync Frontend loads, it tries to fetch tenant information from the MCP backend via the `/api/local/tenant` endpoint. If this returns a 500 error, you see the message above.

## Root Causes

The error can be caused by:

1. **Tenant table is empty** - No tenant records in the sync database
2. **Multiple tenant records** - More than one tenant record exists (should be exactly one)
3. **Database connection issue** - syncPool can't connect to the database
4. **Query error** - SQL query is failing for some reason

## How to Debug

### 1. Check Database Connection

```bash
# Test if the sync database is reachable
curl http://localhost:3002/api/health/sync-db
```

Expected response:
```json
{
  "status": "ok",
  "database": "sync",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

If this fails, check:
- Is the MCP server running?
- Are the database environment variables correct?
- Is PostgreSQL running?

### 2. Check Tenant Records

Connect to the sync database and run:

```sql
-- Check how many tenant records exist
SELECT COUNT(*) as count FROM tenant;

-- View all tenant records
SELECT id, name, url, street, city, state, zip, country, active, created_at, updated_at 
FROM tenant;
```

**Expected result:** Exactly 1 tenant record

**If 0 records:**
- You need to create a tenant record
- Use the "Connect Account" button in the UI to login and sync tenant data
- Or manually insert a tenant record

**If multiple records:**
- Delete duplicate records, keeping only one
- See "Fixing Multiple Tenant Records" below

### 3. Check MCP Server Logs

Watch the MCP server console for detailed error messages:

```
📥 [API] GET /api/local/tenant - Request received
🔍 [API] Checking tenant table...
📊 [API] Tenant table has X record(s)
🔍 [API] Executing tenant query...
📤 [API] GET /api/local/tenant - Returning: {...}
✅ [API] GET /api/local/tenant - Response sent successfully
```

If you see errors, they'll be logged with details.

### 4. Test the Endpoint Directly

```bash
# Get tenant information
curl http://localhost:3002/api/local/tenant
```

Expected response (if tenant exists):
```json
{
  "id": 1,
  "name": "Company Name",
  "url": "https://example.com",
  "street": "123 Main St",
  "street2": null,
  "city": "City",
  "state": "ST",
  "zip": "12345",
  "country": "USA",
  "active": true,
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z"
}
```

Expected response (if no tenant):
```json
null
```

## Solutions

### Solution 1: Create a Tenant Record

If the tenant table is empty, you need to create a tenant record. You can do this by:

**Option A: Use the UI**
1. Click "Connect Account" button
2. Enter your email and password
3. This will sync your tenant data to the local database

**Option B: Manually Insert**

```sql
INSERT INTO tenant (id, name, url, street, street2, city, state, zip, country, active, created_at, updated_at)
VALUES (
  1,
  'Your Company Name',
  'https://your-company.com',
  '123 Main Street',
  NULL,
  'Your City',
  'ST',
  '12345',
  'USA',
  true,
  NOW(),
  NOW()
);
```

### Solution 2: Fix Multiple Tenant Records

If there are multiple tenant records, delete the duplicates:

```sql
-- View all tenant records with their IDs
SELECT id, name, created_at FROM tenant ORDER BY created_at;

-- Delete duplicate records (keep the one with the lowest ID)
DELETE FROM tenant WHERE id > 1;

-- Verify only one remains
SELECT COUNT(*) FROM tenant;
```

### Solution 3: Verify Database Connection

Check your environment variables in the MCP server:

```bash
# In MeterItProSync/mcp/.env or root .env
POSTGRES_SYNC_HOST=localhost
POSTGRES_SYNC_PORT=5432
POSTGRES_SYNC_DB=sync_db
POSTGRES_SYNC_USER=postgres
POSTGRES_SYNC_PASSWORD=your_password
```

Make sure these match your actual PostgreSQL configuration.

## Expected Behavior After Fix

1. **MCP Server starts** and initializes database pools
2. **Frontend loads** and calls `/api/local/tenant`
3. **API returns** the single tenant record
4. **Frontend displays** "Company Info" card with tenant details
5. **Connection status** shows "Sync Connected" and "Remote Connected"

## Verification Checklist

- [ ] Sync database is running and accessible
- [ ] Tenant table exists
- [ ] Exactly one tenant record exists
- [ ] `/api/health/sync-db` returns 200 OK
- [ ] `/api/local/tenant` returns the tenant record
- [ ] Frontend displays tenant information without error
- [ ] "Connect Account" button is not shown (or shows "Connected")

## If Still Having Issues

1. **Check MCP server console** for detailed error messages
2. **Verify database credentials** are correct
3. **Restart the MCP server** after making changes
4. **Clear browser cache** and reload the page
5. **Check browser console** for network errors

## Related Files

- Frontend: `MeterItProSync/frontend/src/components/CompanyInfoCard.tsx`
- Backend: `MeterItProSync/mcp/src/api/server.ts` (GET /api/local/tenant endpoint)
- Database: `MeterItProSync/mcp/src/data-sync/connection-manager.ts`
