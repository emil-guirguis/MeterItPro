# Meter Sync - Primary Key Constraint Fix

## Problem

The meter sync was failing with the error:
```
duplicate key value violates unique constraint "meters_pkey"
```

This occurred because the `ON CONFLICT` clause was referencing a composite key `(id, meter_element_id)` that doesn't actually exist as a constraint in the database.

## Root Cause

### Database Schema
The meter table has:
- **Primary Key:** `id` (VARCHAR(255)) - single column
- **No composite unique constraint** on `(id, meter_element_id)`

### The Problem
The upsert query was trying to use:
```sql
ON CONFLICT (id, meter_element_id) DO UPDATE SET
```

But PostgreSQL couldn't find a constraint on `(id, meter_element_id)`, so it fell back to the primary key `id`. When trying to insert a meter with an `id` that already exists, it violated the primary key constraint.

## The Fix

### Before
```typescript
const query = `
  INSERT INTO meter (id, name, ip, port, active, element, meter_element_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (id, meter_element_id) DO UPDATE SET
    id = $1,
    name = $2,
    ip = $3,
    port = $4,
    active = $5,
    element = $6,
    meter_element_id = $7
`;
```

### After
```typescript
const query = `
  INSERT INTO meter (id, name, ip, port, active, element, meter_element_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (id) DO UPDATE SET
    name = $2,
    ip = $3,
    port = $4,
    active = $5,
    element = $6,
    meter_element_id = $7
`;
```

## Key Changes

1. **ON CONFLICT clause:** Changed from `(id, meter_element_id)` to `(id)`
2. **Removed `id = $1`:** Don't update the primary key (it's immutable)
3. **Kept all other updates:** name, ip, port, active, element, meter_element_id

## How It Works Now

### Upsert Logic
1. **Try to INSERT** a new meter with the given `id`
2. **If conflict on `id`:**
   - Update the existing meter's fields
   - Keep the same `id` (primary key)
   - Update `meter_element_id` if it changed
3. **If no conflict:**
   - Insert the new meter record

### Example Scenario

#### Scenario 1: New Meter
```
Remote: Meter ID=1, Element ID=1, Name="Meter A"
Local: (empty)

Result: INSERT new meter with ID=1
```

#### Scenario 2: Existing Meter with Same Element
```
Remote: Meter ID=1, Element ID=1, Name="Meter A", IP="192.168.1.1"
Local: Meter ID=1, Element ID=1, Name="Meter A", IP="192.168.1.0"

Result: UPDATE meter ID=1, set IP="192.168.1.1"
```

#### Scenario 3: Existing Meter with Different Element
```
Remote: Meter ID=1, Element ID=2, Name="Meter A", Element="Humidity"
Local: Meter ID=1, Element ID=1, Name="Meter A", Element="Temperature"

Result: INSERT new record with ID=1, Element ID=2
        (This will fail because ID=1 already exists!)
```

## Important Note: Composite Key Limitation

The current schema has a limitation: **the meter table uses `id` as the primary key, not a composite key on `(id, meter_element_id)`**.

This means:
- ✅ You can have one meter with ID=1
- ❌ You cannot have multiple records with ID=1 (even with different element IDs)

### To Support Multiple Elements Per Meter

If you need to store multiple elements per meter in the same table, you would need to:

**Option 1: Change Primary Key to Composite**
```sql
ALTER TABLE meter DROP CONSTRAINT meter_pkey;
ALTER TABLE meter ADD PRIMARY KEY (id, meter_element_id);
```

**Option 2: Use a Separate meter_element Table**
```sql
CREATE TABLE meter_element (
  id SERIAL PRIMARY KEY,
  meter_id VARCHAR(255) REFERENCES meter(id),
  element_id INTEGER,
  element VARCHAR(255),
  UNIQUE(meter_id, element_id)
);
```

**Option 3: Store Elements as JSON**
```sql
ALTER TABLE meter ADD COLUMN elements JSONB;
-- Store multiple elements as JSON array
```

## Current Implementation

The current implementation assumes:
- **One meter per ID:** Each meter ID appears only once in the table
- **One element per meter:** Each meter has a single element
- **Upsert by ID:** Updates are based on meter ID only

## Files Modified

- `MeterItProSync/mcp/src/database/sync-database.ts` - Fixed `upsertMeter()` method
- `MeterItProSync/mcp/dist/database/sync-database.js` - Compiled JavaScript (auto-generated)

## Build Status

✅ Build succeeded with no errors
✅ Ready to test meter sync

## Next Steps

1. Test the meter sync with the fixed upsert query
2. If you need to support multiple elements per meter, consider implementing one of the options above
3. Update the database schema accordingly if needed

## Related Documentation

- `METER_TABLE_SCHEMA_ANALYSIS.md` - Complete schema analysis
- `METER_SYNC_COMPOSITE_KEY_FIX.md` - Composite key implementation details
- `METER_SYNC_UPSERT_FIX.md` - Previous upsert fix
