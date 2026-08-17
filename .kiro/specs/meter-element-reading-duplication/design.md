# Meter Element Reading Duplication - Design

## Solution Overview

Fix the `SyncDatabase.getMeters()` function to properly join the `meter` and `meter_element` tables, so that each meter element is treated as a separate entity during collection.

## Architecture

### Current (Broken) Flow
```
meter table (no meter_element_id)
    ↓
getMeters() returns 1 row per meter
    ↓
Collection cycle processes 1 meter
    ↓
All 6 elements get identical readings
```

### Fixed Flow
```
meter table + meter_element table (JOIN)
    ↓
getMeters() returns 1 row per meter-element combination
    ↓
Collection cycle processes 6 separate meter objects
    ↓
Each element gets unique readings
```

## Changes Required

### 1. Update `SyncDatabase.getMeters()` Query

**File**: `MeterItProSync/mcp/src/data-sync/data-sync.ts`

**Change**: Replace the simple `SELECT FROM meter` query with a JOIN query:

```typescript
async getMeters(activeOnly: boolean = true): Promise<MeterEntity[]> {
  const query = activeOnly
    ? `SELECT 
         m.meter_id, 
         m.name, 
         m.active, 
         m.ip, 
         m.port, 
         me.meter_element_id, 
         TRIM(me.element) as element, 
         m.device_id 
       FROM meter m
       JOIN meter_element me ON me.meter_id = m.meter_id
       WHERE m.active = true 
       ORDER BY m.meter_id, me.meter_element_id`
    : `SELECT 
         m.meter_id, 
         m.name, 
         m.active, 
         m.ip, 
         m.port, 
         me.meter_element_id, 
         TRIM(me.element) as element, 
         m.device_id 
       FROM meter m
       JOIN meter_element me ON me.meter_id = m.meter_id
       ORDER BY m.meter_id, me.meter_element_id`;
  const result = await execQuery(this.pool, query);
  return result.rows;
}
```

**Why**: 
- The `meter` table doesn't have `meter_element_id` or `element` columns
- These columns are in the `meter_element` table
- The JOIN ensures we get one row per meter-element combination
- Ordering by both meter_id and meter_element_id ensures consistent ordering

## Data Flow

### Before Fix
```
Meter 1 (device_id=2, ip=10.10.10.22)
├── Element 2 (ac) → reads device 2 → gets value X
├── Element 3 (floor1) → reads device 2 → gets value X (SAME!)
├── Element 4 (main) → reads device 2 → gets value X (SAME!)
├── Element 7 (gggggg) → reads device 2 → gets value X (SAME!)
├── Element 8 (office) → reads device 2 → gets value X (SAME!)
└── Element 9 (element b) → reads device 2 → gets value X (SAME!)
```

### After Fix
```
Meter 1, Element 2 (device_id=2, ip=10.10.10.22) → reads device 2 → gets value X
Meter 1, Element 3 (device_id=2, ip=10.10.10.22) → reads device 2 → gets value Y
Meter 1, Element 4 (device_id=2, ip=10.10.10.22) → reads device 2 → gets value Z
Meter 1, Element 7 (device_id=2, ip=10.10.10.22) → reads device 2 → gets value W
Meter 1, Element 8 (device_id=2, ip=10.10.10.22) → reads device 2 → gets value V
Meter 1, Element 9 (device_id=2, ip=10.10.10.22) → reads device 2 → gets value U
```

**Note**: The values will still be the same if all elements are reading from the same BACnet registers. The next step would be to configure different registers per element if needed.

## Impact Analysis

### What Changes
- `getMeters()` now returns 6 rows instead of 1 (for your setup)
- Meter cache will have 6 entries instead of 1
- Collection cycle will process 6 separate meter objects

### What Stays the Same
- Collection cycle logic (already handles multiple meters)
- Reading batcher logic (already handles meter_element_id)
- Database insertion logic (already stores meter_element_id)
- BACnet client logic (no changes needed)

### Backward Compatibility
- If a meter has no elements, it won't be returned (this is correct)
- The query is more specific, so it's safer
- No breaking changes to the API

## Testing Strategy

### Unit Tests
1. Verify `getMeters()` returns correct number of rows
2. Verify each row has unique meter_element_id
3. Verify meter_element_id is not null

### Integration Tests
1. Run collection cycle and verify 6 separate readings are collected
2. Verify each element has unique meter_element_id in database
3. Verify readings are stored with correct meter_element_id

### Manual Testing
1. Check meter_reading table for unique values per element
2. Verify no duplicate readings across elements
3. Verify all 6 elements have readings

## Rollback Plan

If issues arise, revert the query to the original (though it will fail):
```typescript
const query = activeOnly
  ? 'SELECT meter_id, name, active, ip, port, meter_element_id, TRIM(element) as element, device_id FROM meter WHERE active = true ORDER BY name'
  : 'SELECT meter_id, name, active, ip, port, meter_element_id, TRIM(element) as element, device_id FROM meter ORDER BY name';
```

However, this will fail because the columns don't exist in the meter table.
