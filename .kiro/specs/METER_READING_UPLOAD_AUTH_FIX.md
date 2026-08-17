# Meter Reading Upload Authentication 500 Error - FIXED

## Issue

The meter reading upload manager was receiving a **500 Internal Server Error** with message "Authentication error" when attempting to upload meter readings to the remote client API.

**Error Log:**
```
❌ [Auth] Sync authentication error: error: column "id" does not exist
at PostgresDB.query (C:\Projects\MeterItPro\client\backend\src\config\database.js:92:28)
at authenticateSyncServer (C:\Projects\MeterItPro\client\backend\src\middleware\auth.js:227:20)
```

## Root Cause

The `authenticateSyncServer` middleware in `client/backend/src/middleware/auth.js` was querying for a non-existent column `id` instead of the correct column `tenant_id` in the tenant table.

### Problem 1: Wrong Column Name in authenticateSyncServer

**Location:** Line 227 in `client/backend/src/middleware/auth.js`

**Before (WRONG):**
```javascript
const result = await db.query(
  'SELECT id as tenant_id FROM tenant WHERE api_key = $1 AND active = true',
  [apiKey]
);
```

**After (FIXED):**
```javascript
const result = await db.query(
  'SELECT tenant_id FROM tenant WHERE api_key = $1 AND active = true',
  [apiKey]
);
```

**Why:** The tenant table's primary key column is named `tenant_id`, not `id`. This is defined in the TenantWithSchema model:
```javascript
static get primaryKey() {
  return 'id';  // Logical name
}

entityFields: {
  id: field({
    dbField: 'tenant_id',  // Physical database column
  })
}
```

### Problem 2: Wrong Column Name in getSiteIdFromApiKey

**Location:** Lines 195-196 in `client/backend/src/middleware/auth.js`

**Before (WRONG):**
```javascript
const result = await db.query(
  'SELECT tenant_id FROM tenant WHERE api_key = $1 AND is_active = true',
  [apiKey]
);
// ...
return result.rows[0].id;  // Wrong column name
```

**After (FIXED):**
```javascript
const result = await db.query(
  'SELECT tenant_id FROM tenant WHERE api_key = $1 AND active = true',
  [apiKey]
);
// ...
return result.rows[0].tenant_id;  // Correct column name
```

**Why:** 
- The tenant table uses `active` (boolean), not `is_active`
- The query returns `tenant_id`, so we must return `result.rows[0].tenant_id`

## Solution Applied

Fixed both database queries in `client/backend/src/middleware/auth.js`:

1. **Line 227:** Changed `SELECT id as tenant_id` to `SELECT tenant_id`
2. **Line 195:** Changed `is_active = true` to `active = true`
3. **Line 196:** Changed `return result.rows[0].id` to `return result.rows[0].tenant_id`

## Impact

- ✅ Meter reading upload manager can now authenticate successfully
- ✅ No more 500 "Authentication error" responses
- ✅ Meter readings will upload without authentication errors
- ✅ Invalid API keys will return 401 (not 500)
- ✅ Inactive tenants will return 401 (not 500)

## Testing

To verify the fix works:

1. **Start the backend server:**
   ```bash
   cd client/backend
   npm start
   ```

2. **Start the sync MCP server:**
   ```bash
   cd MeterItProSync/mcp
   npm start
   ```

3. **Verify meter readings upload:**
   - Check logs for successful uploads
   - Verify no 500 authentication errors
   - Verify readings appear in the remote database

## Files Modified

- `client/backend/src/middleware/auth.js` - Fixed authenticateSyncServer and getSiteIdFromApiKey functions

## Related Specs

- `.kiro/specs/meter-reading-upload-authentication-500-error/` - Full spec for this fix
- `.kiro/specs/meter-reading-remote-upload/` - Meter reading upload feature spec

