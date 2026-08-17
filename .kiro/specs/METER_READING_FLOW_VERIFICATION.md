# Meter Reading Flow - Verification Guide

## Complete Flow (Now Fixed)

### 1. Collection Phase
```
BACnetMeterReadingAgent.executeCycleInternal()
  ↓
CollectionCycleManager.executeCycle()
  ↓
For each meter:
  - Check connectivity
  - Read all configured registers
  - Create PendingReading objects
```

### 2. Batching Phase
```
ReadingBatcher.addReading() - Add each reading to queue
  ↓
ReadingBatcher.validateReadings() - Validate all readings
  ↓
Filter out invalid readings
```

### 3. Database Insertion Phase (NOW FIXED)
```
ReadingBatcher.flushBatch(database)
  ↓
Get pool: database.getPool() ← NEW PUBLIC METHOD
  ↓
Split readings into batches of 100
  ↓
For each batch:
  - Acquire connection from pool
  - Build INSERT statement
  - Log INSERT statement to console ← YOU WILL SEE THIS
  - Execute INSERT
  - Commit transaction
  ↓
Clear readings from queue
```

### 4. Upload Phase
```
MeterReadingUploadManager.performUpload()
  ↓
Query unsynchronized readings
  ↓
Upload to Client System API
  ↓
Mark as synchronized
```

## What You Should See in Console

When a meter reading collection cycle completes:

```
🔍 Processing Meter: ID=METER-001, Name=Main Meter, Device ID=1, IP=192.168.1.100:47808
📋 Device 1 Registers:
  [1] Register ID: 1, Register #: 0, Field: Temperature, Unit: °C
  [2] Register ID: 2, Register #: 1, Field: Humidity, Unit: %
✅ Successfully read register 0 (Temperature) from meter METER-001: value=22.5
✅ Successfully read register 1 (Humidity) from meter METER-001: value=65

📊 [BATCH INSERT] Starting batch insertion process
   Total readings in queue: 2
📋 [BATCH INSERT] Validating 2 readings...
   ✓ Validation complete:
     - Valid readings: 2
     - Invalid readings: 0
📦 [BATCH INSERT] Split into 1 batch(es) of max 100 readings
🔄 [BATCH INSERT] Processing batch 1/1 (2 readings)
   📝 Full INSERT statement:
   INSERT INTO meter_reading (meter_id, timestamp, data_point, value, unit, is_synchronized, retry_count)
   VALUES ($1, $2, $3, $4, $5, $6, $7), ($8, $9, $10, $11, $12, $13, $14)
   📊 Parameters (14 total):
     Row 1: ["METER-001", "2024-01-15T10:30:00.000Z", "Temperature", 22.5, "°C", false, 0]
     Row 2: ["METER-001", "2024-01-15T10:30:00.000Z", "Humidity", 65, "%", false, 0]
   Executing INSERT statement...
   ✓ INSERT completed in 45ms
   ✅ Successfully inserted batch 1/1 (2 readings)

📊 [BATCH INSERT] Final Summary:
   Total duration: 50ms
   Total readings processed: 2
   Successfully inserted: 2
   Failed: 0
   Skipped (invalid): 0
   Total retry attempts: 0
   Overall success: ✅ YES
```

## Verification Steps

1. **Check logs for INSERT statements**
   - Look for "📝 Full INSERT statement:" in console
   - Verify the SQL is correct
   - Check parameters are being logged

2. **Verify database has readings**
   ```sql
   SELECT COUNT(*) FROM meter_reading;
   SELECT * FROM meter_reading ORDER BY created_at DESC LIMIT 10;
   ```

3. **Check for errors**
   - Look for "❌ [BATCH INSERT]" messages
   - Check error messages for database connection issues
   - Verify pool is available

4. **Monitor metrics**
   - Check `totalReadingsCollected` in agent status
   - Verify `insertedCount` matches readings collected
   - Ensure `failedCount` is 0

## Troubleshooting

### Issue: INSERT statement not appearing in logs
**Solution**: Check that logger is configured to INFO level or higher
```
LOG_LEVEL=info
```

### Issue: "Database pool is not available" error
**Solution**: Verify SyncDatabase is initialized before calling flushBatch
- Check that `initializePools()` was called
- Verify `syncPool` is created
- Ensure database connection is working

### Issue: Readings collected but not inserted
**Solution**: Check for transaction errors
- Look for "ROLLBACK" messages
- Check database connection limits
- Verify meter_reading table exists

### Issue: Partial batch failures
**Solution**: Check retry logic
- Batch will retry up to 3 times
- Look for "⏱️ Timeout" or "❌ Batch failed" messages
- Check database performance

## Key Files

- `MeterItProSync/mcp/src/bacnet-collection/reading-batcher.ts` - Handles batching and insertion
- `MeterItProSync/mcp/src/data-sync/data-sync.ts` - Database service with pool access
- `MeterItProSync/mcp/src/bacnet-collection/collection-cycle-manager.ts` - Orchestrates collection
- `MeterItProSync/mcp/src/bacnet-collection/bacnet-reading-agent.ts` - Main agent with scheduling

## Next Steps

1. ✅ Meter readings are now being inserted into the database
2. Next: Verify upload to Client System API is working
3. Then: Monitor sync status and error handling
