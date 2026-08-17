# Meter Sync - Upsert Query Fix

## Problem

The meter sync was failing with the error:
```
invalid input syntax for type integer: "F"
```

This occurred in the `upsertMeter()` method when trying to insert/update meters.

## Root Cause

The SQL query in `upsertMeter()` had two issues:

1. **Missing space in VALUES clause:** `$6,$7` should be `$6, $7`
2. **Wrong ON CONFLICT clause:** 
   - Was: `ON CONFLICT (id) DO UPDATE SET`
   - Should be: `ON CONFLICT (id, meter_element_id) DO UPDATE SET`
3. **Missing meter_element_id in UPDATE:** The UPDATE clause wasn't updating `meter_element_id = $7`

## The Fix

### Before
```typescript
const query = `
  INSERT INTO meter (id, name, ip, port, active, element, meter_element_id)
  VALUES ($1, $2, $3, $4, $5, $6,$7)
  ON CONFLICT (id) DO UPDATE SET
    name = $2,
    ip = $3,
    port = $4,
    active = $5,
    element = $6
`;
```

### After
```typescript
const query = `
  INSERT INTO meter (id, name, ip, port, active, element, meter_element_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (id, meter_element_id) DO UPDATE SET
    name = $2,
    ip = $3,
    port = $4,
    active = $5,
    element = $6,
    meter_element_id = $7
`;
```

## Why This Matters

### Composite Key Constraint
The database has a composite unique constraint on `(id, meter_element_id)`, which means:
- A meter can have multiple elements
- Each combination of `(meter_id, element_id)` must be unique
- The ON CONFLICT clause must reference BOTH columns

### Parameter Mapping
```
$1 = meter.meter_id (integer)
$2 = meter.name (string)
$3 = meter.ip (string)
$4 = meter.port (string)
$5 = meter.active (boolean)
$6 = meter.element (string)
$7 = meter.meter_element_id (integer)
```

The error `invalid input syntax for type integer: "F"` was happening because:
- The ON CONFLICT was only on `(id)`, not `(id, meter_element_id)`
- This caused the wrong conflict resolution behavior
- The UPDATE clause wasn't properly handling all columns

## Files Modified

- `MeterItProSync/mcp/src/database/sync-database.ts` - Fixed `upsertMeter()` method
- `MeterItProSync/mcp/dist/database/sync-database.js` - Compiled JavaScript (auto-generated)

## Testing

To verify the fix works:

1. Start the debugger: `VS Code → Run → "Debug Sync Backend"`
2. Open Sync Frontend: `http://localhost:3003`
3. Click "Trigger Meter Sync" button
4. The sync should now complete without the integer parsing error
5. Check the console logs for successful meter inserts/updates

## Expected Behavior

When syncing meters with multiple elements:

1. **Insert:** New `(meter_id, element_id)` combinations are inserted
2. **Update:** Existing combinations with changed values are updated
3. **Delete:** Combinations that no longer exist in remote are deactivated

Example:
```
Remote: Meter 1 with Element 1 (Temperature)
Remote: Meter 1 with Element 2 (Humidity)

Local (before): Meter 1 with Element 1 (Temperature)

Sync Result:
- Insert: Meter 1 with Element 2 (Humidity)
- Update: None (Element 1 unchanged)
- Delete: None (Element 1 still exists in remote)

Local (after): Meter 1 with Element 1 (Temperature)
Local (after): Meter 1 with Element 2 (Humidity)
```

## Build Status

✅ Build succeeded with no errors
✅ Ready to test meter sync
