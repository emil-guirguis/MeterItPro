# Fixing Tenant 500 Error

## Error Details
```
AxiosError: Request failed with status code 500
at GET /api/local/tenant
```

## Root Cause

The 500 error means the backend is throwing an exception. Most likely causes:

1. **Tenant table doesn't exist** - Schema not created
2. **Database connection failed** - syncPool not initialized
3. **Query error** - SQL syntax or permission issue
4. **Missing environment variables** - Database credentials not set

## Step-by-Step Fix

### Step 1: Check MCP Server Console

Look at the MCP server terminal for detailed error messages. You should see:

```
📥 [API] GET /api/local/tenant - Request received
🔍 [API] Checking tenant table...
   Executing count query...
❌ [API] Error checking tenant count: ...
   Error details: {
     message: "...",
     code: "...",
     detail: "..."
   }
```

**Common error codes:**
- `42P01` - Table doesn't exist
- `ECONNREFUSED` - Can't connect to database
- `ENOTFOUND` - Host not found

### Step 2: Verify Database Connection

Test if the sync database is reachable:

```bash
# Test the health endpoint
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

**If this fails:**
- Check if MCP server is running
- Check if PostgreSQL is running
- Verify database credentials in `.env`

### Step 3: Check Database Schema

Connect to the sync database and run the schema check:

```bash
# Using psql
psql -h localhost -U postgres -d sync_db -f MeterItPro/.utils/check-sync-db-schema.sql
```

Or manually:

```sql
-- Check if tenant table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'tenant'
) as tenant_table_exists;

-- Check tenant records
SELECT COUNT(*) FROM tenant;
```

### Step 4: Create Tenant Table (if missing)

If the table doesn't exist, create it:

```sql
CREATE TABLE IF NOT EXISTS tenant (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(255),
  street VARCHAR(255),
  street2 VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(50),
  zip VARCHAR(20),
  country VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Step 5: Insert Tenant Record

If the table is empty, insert a test tenant:

```sql
INSERT INTO tenant (name, url, street, city, state, zip, country, active, created_at, updated_at)
VALUES (
  'Test Company',
  'https://example.com',
  '123 Main Street',
  'Test City',
  'TS',
  '12345',
  'USA',
  true,
  NOW(),
  NOW()
);

-- Verify it was inserted
SELECT * FROM tenant;
```

### Step 6: Verify Environment Variables

Check that your `.env` file has the correct database credentials:

```bash
# In MeterItProSync/mcp/.env or root .env
POSTGRES_SYNC_HOST=localhost
POSTGRES_SYNC_PORT=5432
POSTGRES_SYNC_DB=sync_db
POSTGRES_SYNC_USER=postgres
POSTGRES_SYNC_PASSWORD=your_password
```

Make sure these match your actual PostgreSQL setup.

### Step 7: Restart MCP Server

After making changes, restart the MCP server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev  # in MeterItProSync/mcp directory
```

### Step 8: Test the Endpoint

Once the server restarts, test the endpoint:

```bash
curl http://localhost:3002/api/local/tenant
```

Expected response (if tenant exists):
```json
{
  "id": 1,
  "name": "Test Company",
  "url": "https://example.com",
  "street": "123 Main Street",
  "street2": null,
  "city": "Test City",
  "state": "TS",
  "zip": "12345",
  "country": "USA",
  "active": true,
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z"
}
```

### Step 9: Reload Frontend

Clear browser cache and reload the page:

```
Ctrl+Shift+Delete  # Open DevTools cache
# Or just do a hard refresh: Ctrl+Shift+R
```

## Troubleshooting Checklist

- [ ] MCP server is running
- [ ] PostgreSQL is running
- [ ] Database credentials in `.env` are correct
- [ ] Tenant table exists in sync database
- [ ] At least one tenant record exists
- [ ] `/api/health/sync-db` returns 200 OK
- [ ] `/api/local/tenant` returns tenant data
- [ ] Frontend shows "Company Info" card without error
- [ ] Browser console shows no errors

## Common Issues & Solutions

### Issue: "Table 'tenant' doesn't exist"
**Solution:** Create the table using the SQL above

### Issue: "Connection refused"
**Solution:** 
- Check if PostgreSQL is running
- Verify host/port in `.env`
- Check firewall settings

### Issue: "Authentication failed"
**Solution:**
- Verify username/password in `.env`
- Check PostgreSQL user permissions

### Issue: "Multiple tenant records"
**Solution:**
```sql
-- Delete duplicates, keep only one
DELETE FROM tenant WHERE id > 1;
```

### Issue: "No tenant records"
**Solution:**
- Insert a test tenant using the SQL above
- Or use the "Connect Account" button in the UI

## Debug Mode

To see more detailed logs, set the log level:

```bash
# In MeterItProSync/mcp/.env
LOG_LEVEL=debug
```

Then restart the server and check the console output.

## Files to Check

- `.env` - Database credentials
- `MeterItProSync/mcp/src/api/server.ts` - API endpoint (GET /api/local/tenant)
- `MeterItProSync/mcp/src/data-sync/connection-manager.ts` - Database pool initialization
- `MeterItProSync/frontend/src/components/CompanyInfoCard.tsx` - Frontend component

## Next Steps

1. Check MCP server console for the exact error
2. Run the schema check SQL
3. Create table if missing
4. Insert test tenant if needed
5. Restart MCP server
6. Reload frontend
7. Verify tenant data displays correctly

If you're still having issues, check the MCP server console output and share the error message for more specific help.
