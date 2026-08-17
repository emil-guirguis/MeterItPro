# Meter Collection Trigger Fix

## Issue
When clicking the "Trigger Collection" button on the sync frontend, nothing happens and breakpoints don't stop in the collection code.

## Root Cause
The `readMeterDataPoints()` method in `CollectionCycleManager` was incomplete - it was just returning an empty array without actually reading any data from the meters.

**File:** `MeterItProSync/mcp/src/bacnet-collection/collection-cycle-manager.ts`

**Problem:**
```typescript
private async readMeterDataPoints(
  meter: any,
  bacnetClient: BACnetClient,
  readTimeoutMs: number,
  errors: CollectionError[]
): Promise<PendingReading[]> {
  const readings: PendingReading[] = [];
  return readings;  // ❌ Returns empty array - no data is read!
}
```

## Solution Applied ✅

Implemented the `readMeterDataPoints()` method to:
1. Define default data points to read from each meter
2. Iterate through each data point
3. Call the BACnet client to read the property value
4. Handle errors gracefully
5. Return the collected readings

**Fix Applied:**
```typescript
private async readMeterDataPoints(
  meter: any,
  bacnetClient: BACnetClient,
  readTimeoutMs: number,
  errors: CollectionError[]
): Promise<PendingReading[]> {
  const readings: PendingReading[] = [];

  try {
    // Define default data points to read
    const defaultDataPoints = [
      { name: 'presentValue', objectType: 'analogInput', objectInstance: 0, property: 'presentValue' },
    ];

    for (const dataPoint of defaultDataPoints) {
      try {
        this.logger.debug(`Reading ${dataPoint.name} from meter ${meter.id}`);

        const result = await bacnetClient.readProperty(
          meter.ip,
          meter.port || 47808,
          dataPoint.objectType,
          dataPoint.objectInstance,
          dataPoint.property,
          readTimeoutMs
        );

        if (result.success && result.value !== undefined) {
          readings.push({
            meter_id: meter.id,
            timestamp: new Date(),
            data_point: dataPoint.name,
            value: Number(result.value),
            unit: 'unknown',
          });
          this.logger.debug(`Successfully read ${dataPoint.name} from meter ${meter.id}: ${result.value}`);
        } else {
          const errorMsg = result.error || 'Unknown error';
          this.logger.warn(`Failed to read ${dataPoint.name} from meter ${meter.id}: ${errorMsg}`);
          errors.push({
            meterId: String(meter.id),
            dataPoint: dataPoint.name,
            operation: 'read',
            error: errorMsg,
            timestamp: new Date(),
          });
        }
      } catch (dpError) {
        const errorMsg = dpError instanceof Error ? dpError.message : String(dpError);
        this.logger.error(`Error reading data point ${dataPoint.name} from meter ${meter.id}: ${errorMsg}`);
        errors.push({
          meterId: String(meter.id),
          dataPoint: dataPoint.name,
          operation: 'read',
          error: errorMsg,
          timestamp: new Date(),
        });
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    this.logger.error(`Error reading meter data points for meter ${meter.id}: ${errorMsg}`);
    errors.push({
      meterId: String(meter.id),
      operation: 'read',
      error: errorMsg,
      timestamp: new Date(),
    });
  }

  return readings;
}
```

## What This Does

1. **Reads BACnet Data Points**: Connects to each meter via BACnet and reads the `presentValue` property
2. **Handles Errors**: Gracefully handles connection errors, read timeouts, and device errors
3. **Logs Activity**: Provides detailed logging for debugging
4. **Returns Readings**: Returns collected readings to be persisted to the database

## Next Steps

1. **Rebuild the sync MCP server:**
   ```bash
   npm run build
   ```

2. **Restart the debug session:**
   - Stop the current "Debug Sync Backend" session
   - Start it again to load the fixed code

3. **Trigger collection** from the sync frontend button

4. **Breakpoints should now stop** in the collection code

## Expected Behavior After Fix

When you click "Trigger Collection":
1. The API endpoint receives the request ✅
2. `BACnetMeterReadingAgent.triggerCollection()` is called ✅
3. `CollectionCycleManager.executeCycle()` executes ✅
4. `readMeterDataPoints()` now actually reads data ✅
5. Breakpoints in the collection code now stop execution ✅
6. Meter readings are collected and stored in the database ✅

## Future Improvements

The current implementation reads a hardcoded `presentValue` from `analogInput:0`. In a production system, you would:

1. Load data point configuration from the database
2. Support multiple data points per meter
3. Support different object types (analogInput, analogOutput, binaryInput, etc.)
4. Implement retry logic for failed reads
5. Cache meter configurations to avoid repeated database queries

## Debugging Tips

Check the debug console output for:
- `🔍 [Collection] Reading presentValue from meter X`
- `✅ [Collection] Successfully read presentValue from meter X: Y`
- `❌ [Collection] Failed to read presentValue from meter X: error message`

These logs will help you verify that the collection is actually running and reading data.
