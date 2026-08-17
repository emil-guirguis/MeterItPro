# Meter Sync - Composite Key Fix

## Problem

The meter sync was failing because the database schema changed from having a unique constraint on just `meter_id` to having a composite unique constraint on `(meter_id, meter_element_id)`.

This means:
- **Before:** Each meter could only appear once (unique by `meter_id`)
- **Now:** Each meter can have multiple elements, but each combination of `(meter_id, meter_element_id)` must be unique

## Solution

Updated the `performSync()` method in `MeterSyncAgent` to use a composite key for lookups instead of just `meter_id`.

### Changes Made

#### 1. Updated Map Keys (Line ~146-149)
**Before:**
```typescript
const remoteMap = new Map(remoteMeters.map((m: MeterEntity) => [m.meter_id, m]));
const localMap = new Map(localMeters.map((m: MeterEntity) => [m.meter_id, m]));
```

**After:**
```typescript
const remoteMap = new Map(
  remoteMeters.map((m: MeterEntity) => [`${m.meter_id}:${m.meter_element_id}`, m])
);
const localMap = new Map(
  localMeters.map((m: MeterEntity) => [`${m.meter_id}:${m.meter_element_id}`, m])
);
```

#### 2. Updated Insert Logic (Line ~155-170)
Now uses composite key to check if meter already exists:
```typescript
const compositeKey = `${remoteMeter.meter_id}:${remoteMeter.meter_element_id}`;
if (!localMap.has(compositeKey)) {
  // Insert new meter
}
```

#### 3. Updated Update Logic (Line ~178-205)
Now uses composite key to find existing meters:
```typescript
const compositeKey = `${remoteMeter.meter_id}:${remoteMeter.meter_element_id}`;
const localMeter = localMap.get(compositeKey);
if (localMeter) {
  // Update meter
}
```

#### 4. Updated Delete Logic (Line ~212-225)
Now uses composite key to find meters to deactivate:
```typescript
const compositeKey = `${localMeter.meter_id}:${localMeter.meter_element_id}`;
const remoteMeter = remoteMap.get(compositeKey);
if ((!remoteMeter || !remoteMeter.active) && localMeter.active) {
  // Deactivate meter
}
```

#### 5. Fixed SQL Query (Line ~240-250)
Added missing comma in SELECT statement:
```typescript
const query = `
  SELECT m.id as meter_id,
         m.name as name,
         m.ip as ip,
         m.port as port,
         m.active as active,
         me.meter_element_id as meter_element_id,
         me.element as element
    FROM meter m
         JOIN meter_element me ON me.meter_id = m.id
  WHERE m.tenant_id = $1
`;
```

## How It Works Now

### Composite Key Format
The composite key is created by combining `meter_id` and `meter_element_id` with a colon:
```
compositeKey = `${meter_id}:${meter_element_id}`
```

Example:
- Meter ID: 123, Element ID: 1 → Key: "123:1"
- Meter ID: 123, Element ID: 2 → Key: "123:2"
- Meter ID: 124, Element ID: 1 → Key: "124:1"

### Sync Logic

1. **Get Remote Meters:** Query remote database for all meters with their element IDs
2. **Get Local Meters:** Query local database for all meters with their element IDs
3. **Create Maps:** Create maps using composite keys for fast lookup
4. **Insert:** For each remote meter, if the composite key doesn't exist locally, insert it
5. **Update:** For each remote meter, if the composite key exists locally and has changes, update it
6. **Delete:** For each local meter, if the composite key doesn't exist remotely or is inactive, deactivate it

## Example Scenario

### Remote Database
```
meter_id | name      | element_id | element
---------|-----------|------------|--------
1        | Meter A   | 1          | Temperature
1        | Meter A   | 2          | Humidity
2        | Meter B   | 1          | Pressure
```

### Local Database (Before Sync)
```
meter_id | name      | element_id | element
---------|-----------|------------|--------
1        | Meter A   | 1          | Temperature
2        | Meter B   | 1          | Pressure
```

### Sync Operations
1. **Insert:** Meter 1, Element 2 (Humidity) - doesn't exist locally
2. **Update:** None (all existing combinations match)
3. **Delete:** None (all local combinations exist in remote)

### Local Database (After Sync)
```
meter_id | name      | element_id | element
---------|-----------|------------|--------
1        | Meter A   | 1          | Temperature
1        | Meter A   | 2          | Humidity
2        | Meter B   | 1          | Pressure
```

## Files Modified

- `MeterItProSync/mcp/src/sync-service/meter-sync-agent.ts` - Updated `performSync()` method
- `MeterItProSync/mcp/dist/sync-service/meter-sync-agent.js` - Compiled JavaScript (auto-generated)

## Testing

To test the meter sync with the new composite key logic:

1. Start the debugger: `VS Code → Run → "Debug Sync Backend"`
2. Open Sync Frontend: `http://localhost:3003`
3. Click "Trigger Meter Sync" button
4. Debugger will break at 3 locations:
   - API endpoint receives request
   - Sync operation starts
   - Remote database query executes
5. Inspect the composite keys being used in the maps

## Key Insight

The composite key approach allows the sync to properly handle:
- **Multiple elements per meter:** A meter can now have multiple elements (Temperature, Humidity, etc.)
- **Unique combinations:** Each `(meter_id, element_id)` combination is unique
- **Proper comparison:** The sync correctly identifies which combinations are new, updated, or deleted

This is more flexible than the previous approach which only allowed one element per meter.
