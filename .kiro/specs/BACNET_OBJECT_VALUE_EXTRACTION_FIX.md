# BACnet Object Value Extraction Fix

## Problem

BACnet is returning values as objects instead of plain numbers:

```
value=[object Object]
```

When logged, it shows:
```json
{
  "value": "[object Object]"
}
```

The code was trying to extract the numeric value from the object, but the extraction logic wasn't working correctly.

## Root Cause

BACnet library wraps values in objects with various property names:
- `.value` - Common wrapper
- `._value` - Private property wrapper
- `.realValue` - Alternative wrapper
- Other custom properties

The old extraction logic wasn't checking if the extracted value was actually a number before using it.

## The Fix

### Enhanced Value Extraction Logic

**File: `MeterItProSync/mcp/src/bacnet-collection/collection-cycle-manager.ts`**

1. **Check if value is an object**
   ```typescript
   if (typeof readValue === 'object' && readValue !== null) {
   ```

2. **Try common property names in order**
   ```typescript
   if ('value' in readValue && typeof readValue.value === 'number') {
     readValue = readValue.value;
   } else if ('_value' in readValue && typeof readValue._value === 'number') {
     readValue = readValue._value;
   } else if ('realValue' in readValue && typeof readValue.realValue === 'number') {
     readValue = readValue.realValue;
   }
   ```

3. **Search for any numeric property**
   ```typescript
   for (const [key, val] of Object.entries(readValue)) {
     if (typeof val === 'number' && !isNaN(val)) {
       foundValue = val;
       break;
     }
   }
   ```

4. **Validate before adding**
   ```typescript
   if (readValue !== null && typeof readValue === 'number' && !isNaN(readValue)) {
     readings.push({...});
   }
   ```

5. **Enhanced logging**
   - Logs raw BACnet value
   - Logs extraction method used
   - Logs warnings for failed extractions

## Expected Output

### Before
```
✅ Successfully read register 1207 (active_energy) from meter 1: value=[object Object]
[BATCH INSERT] No valid readings to insert after validation
Meter 1: inserted 0 readings (40 skipped, 0 failed)
```

### After
```
✅ Successfully read register 1207 (active_energy) from meter 1: value=1234.56
✅ Successfully read register 1199 (active_energy_export) from meter 1: value=5678.90
✅ Successfully read register 1223 (apparent_energy) from meter 1: value=9012.34

✓ Validation complete:
  - Valid readings: 40
  - Invalid readings: 0

📝 Full INSERT statement:
   INSERT INTO meter_reading (meter_id, timestamp, data_point, value, unit, is_synchronized, retry_count)
   VALUES (...)
✓ INSERT completed in 45ms
✅ Successfully inserted batch 1/1 (40 readings)

Meter 1: inserted 40 readings (0 skipped, 0 failed)
```

## Debug Logging

When LOG_LEVEL=debug, you'll see:

```
Raw BACnet value for register 1207: {"value":1234.56} (type: object)
Extracted from .value: 1234.56
```

This helps diagnose if the extraction is working correctly.

## Supported BACnet Value Formats

The code now handles:

1. **Simple number**
   ```javascript
   1234.56
   ```

2. **Wrapped in .value**
   ```javascript
   { value: 1234.56 }
   ```

3. **Wrapped in ._value**
   ```javascript
   { _value: 1234.56 }
   ```

4. **Wrapped in .realValue**
   ```javascript
   { realValue: 1234.56 }
   ```

5. **Any numeric property**
   ```javascript
   { someProperty: 1234.56, otherProperty: "text" }
   ```

## Files Changed

✅ `MeterItProSync/mcp/src/bacnet-collection/collection-cycle-manager.ts`
- Enhanced value extraction logic
- Added type checking for extracted values
- Added debug logging for extraction process
- Improved error handling

## Verification

File compiles without errors:
- ✅ `MeterItProSync/mcp/src/bacnet-collection/collection-cycle-manager.ts`

## Next Steps

1. **Restart the sync MCP server**
2. **Trigger a meter reading collection**
3. **Check the logs** for:
   - `✅ Successfully read register` with numeric values (not [object Object])
   - `✓ Validation complete` showing valid readings
   - `✅ Successfully inserted batch` with reading count

## Expected Result

All 40 readings should now be valid and inserted into the database:

```
Meter 1: inserted 40 readings (0 skipped, 0 failed)
Collection cycle completed: 6 meters, 40 readings, 0 errors
```

Instead of:

```
Meter 1: inserted 0 readings (40 skipped, 0 failed)
Collection cycle completed: 6 meters, 0 readings, 0 errors
```
