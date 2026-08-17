# Design Document: Meter Reading Batch Insertion

## Overview

The Meter Reading Batch Insertion system is responsible for taking collected meter readings from the BACnet collection cycle and persisting them to the database in an efficient, transactional manner. The system builds an in-memory cache of readings during collection, maps each reading to its register's field_name, generates optimized batch INSERT statements, and executes them with proper error handling and retry logic.

The design leverages the existing `ReadingBatcher` class and extends it to support the full lifecycle: caching readings during collection, mapping register field names, validating data, generating batch INSERT statements, executing them, and providing comprehensive metrics.

## Architecture

### High-Level Flow

```
BACnet Collection Cycle
    ↓
Collect Readings (with register mapping)
    ↓
Add to ReadingBatcher Cache
    ↓
Collection Cycle Completes
    ↓
Validate All Readings
    ↓
Generate Batch INSERT Statements (100 readings per batch)
    ↓
Execute Batch INSERT Statements
    ↓
Handle Errors & Retries
    ↓
Return Insertion Metrics
```

### Component Interaction

```
BACnetMeterReadingAgent
    ├── Collects readings from meters
    ├── Maps register field_names
    └── Adds to ReadingBatcher

ReadingBatcher
    ├── Accumulates readings in memory
    ├── Validates readings
    ├── Generates batch INSERT statements
    └── Executes with transaction support

SyncDatabase
    ├── Executes INSERT statements
    ├── Manages transactions
    └── Returns insertion results

Caches (MeterCache, DeviceRegisterCache)
    ├── Provide meter metadata
    ├── Provide register field_name mappings
    └── Enable fast lookups during collection
```

## Components and Interfaces

### 1. ReadingBatcher (Enhanced)

**Location:** `MeterItProSync/mcp/src/bacnet-collection/reading-batcher.ts`

**Responsibilities:**
- Accumulate readings in memory during collection
- Validate readings before insertion
- Generate optimized batch INSERT statements
- Execute batches with transaction support
- Handle errors and retries
- Provide insertion metrics

**Key Methods:**

```typescript
class ReadingBatcher {
  // Add a reading to the batch queue
  addReading(reading: PendingReading): void

  // Validate all pending readings
  validateReadings(): ValidationResult

  // Flush all queued readings to database
  flushBatch(database: SyncDatabase): Promise<BatchInsertionResult>

  // Get count of pending readings
  getPendingCount(): number

  // Get validation errors
  getValidationErrors(): ValidationError[]

  // Clear batch without inserting
  clear(): void
}
```

### 2. PendingReading Type

**Location:** `MeterItProSync/mcp/src/bacnet-collection/types.ts`

**Current Definition:**
```typescript
export interface PendingReading {
  meter_id: number;
  timestamp: Date;
  data_point: string;      // field_name from register
  value: number;
  unit?: string;
}
```

**Note:** The `data_point` field stores the register's `field_name`, which becomes the column name in the meter_reading table.

### 3. Validation Result Type

**New Type to Add:**
```typescript
export interface ValidationResult {
  valid: number;
  invalid: number;
  skipped: number;
  errors: ValidationError[];
}

export interface ValidationError {
  readingIndex: number;
  reading: PendingReading;
  errors: string[];
}
```

### 4. Batch Insertion Result Type

**New Type to Add:**
```typescript
export interface BatchInsertionResult {
  success: boolean;
  totalReadings: number;
  insertedCount: number;
  failedCount: number;
  skippedCount: number;
  timestamp: Date;
  errors?: string[];
  retryAttempts: number;
}
```

### 5. SyncDatabase Integration

**Existing Methods Used:**
- `pool.connect()` - Get client from connection pool
- `client.query()` - Execute SQL queries
- `client.query('BEGIN')` - Start transaction
- `client.query('COMMIT')` - Commit transaction
- `client.query('ROLLBACK')` - Rollback transaction

**New Methods to Add:**
```typescript
class SyncDatabase {
  // Batch insert readings with validation
  async batchInsertReadings(
    readings: PendingReading[],
    batchSize?: number
  ): Promise<BatchInsertionResult>

  // Get insertion metrics
  async getInsertionMetrics(hours: number): Promise<InsertionMetrics>
}
```

## Data Models

### Meter Reading Table (Existing)

The meter_reading table already exists in the database. This feature uses the following columns:
- `meter_id`: VARCHAR(255) - Foreign key to meter table
- `timestamp`: TIMESTAMP - When the reading was collected
- `data_point`: VARCHAR(255) - The field_name from the register (column name)
- `value`: NUMERIC - The meter reading value
- `unit`: VARCHAR(50) - Unit of measurement (optional)
- `is_synchronized`: BOOLEAN - Whether reading has been synced (default: false)
- `retry_count`: INTEGER - Number of sync retry attempts (default: 0)

### Register Table (Existing)

The register table already exists and provides:
- `register_id`: Unique identifier for the register
- `field_name`: The column name where this register's value should be stored
- `unit`: Unit of measurement for this register

### Device Register Mapping (Existing)

The device_register table already exists and maps:
- `device_id`: Which device has this register
- `register_id`: Which register is configured for that device

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: All Valid Readings Are Inserted

**For any** collection of valid meter readings, after batch insertion completes successfully, the database should contain all readings with their original values and field_names intact.

**Validates: Requirements 3.1, 4.1, 4.2**

### Property 2: Field Names Map to Correct Columns

**For any** meter reading with a register field_name, the reading should be inserted with the field_name as the data_point column value, ensuring values are stored in the correct logical column.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Default Values Are Applied Consistently

**For any** meter reading inserted into the database, the is_synchronized field should default to false and retry_count should default to 0 for all readings in the batch.

**Validates: Requirements 5.3, 5.4**

### Property 4: Invalid Readings Are Excluded

**For any** collection of readings containing invalid data (null meter_id, invalid timestamp, null value, empty field_name), the batch insertion should exclude invalid readings and only insert valid ones, logging validation errors for excluded readings.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 5: Batch Insertion Is Atomic

**For any** batch of readings, either all readings in the batch are inserted successfully, or none are inserted (transaction atomicity). If any error occurs during insertion, the entire batch is rolled back.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Insertion Metrics Are Accurate

**For any** batch insertion operation, the returned metrics (insertedCount, failedCount, skippedCount) should sum to the total number of readings processed, and insertedCount should equal the number of rows actually inserted in the database.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 7: Retry Logic Respects Maximum Attempts

**For any** failed batch insertion, the system should retry up to 3 times before giving up. After 3 failed attempts, the batch should be marked as failed and not retried further.

**Validates: Requirements 4.5, 4.6**

### Property 8: Batch Size Optimization

**For any** collection of readings, if the total count exceeds 100, the system should split them into multiple batches of 100 or fewer readings each, with each batch executed as a separate transaction.

**Validates: Requirements 3.5, 3.6**

## Error Handling

### Validation Errors

Validation fails in these scenarios:

1. **Null meter_id**: Reading has no meter_id value
   - Action: Skip reading, log error
   - Example: `{ meter_id: null, timestamp: Date, data_point: "kWh", value: 100 }`

2. **Invalid timestamp**: Timestamp is not a valid Date object or is in the future
   - Action: Skip reading, log error
   - Example: `{ meter_id: 1, timestamp: "invalid-date", data_point: "kWh", value: 100 }`
   - Example: `{ meter_id: 1, timestamp: Date.now() + 86400000, data_point: "kWh", value: 100 }` (future date)

3. **Null or non-numeric value**: Value is null, undefined, NaN, or not a number
   - Action: Skip reading, log error
   - Example: `{ meter_id: 1, timestamp: Date, data_point: "kWh", value: null }`
   - Example: `{ meter_id: 1, timestamp: Date, data_point: "kWh", value: "not-a-number" }`
   - Example: `{ meter_id: 1, timestamp: Date, data_point: "kWh", value: NaN }`

4. **Empty or null field_name**: data_point (field_name) is empty string, null, or undefined
   - Action: Skip reading, log error
   - Example: `{ meter_id: 1, timestamp: Date, data_point: "", value: 100 }`
   - Example: `{ meter_id: 1, timestamp: Date, data_point: null, value: 100 }`

5. **Missing register mapping**: Reading has no corresponding register in device_register cache
   - Action: Skip reading, log warning
   - Example: Reading collected for register_id that doesn't exist in device_register table

### Database Errors

- **Connection failure**: Retry up to 3 times with exponential backoff
- **Transaction rollback**: Log error, mark batch as failed
- **Constraint violation**: Log error, skip affected reading, continue with batch
- **Timeout**: Retry up to 3 times with exponential backoff

### Retry Strategy

```
Attempt 1: Immediate
Attempt 2: Wait 1 second
Attempt 3: Wait 2 seconds
After 3 failures: Give up, log error, return failure metrics
```

## Testing Strategy

### Unit Tests

**Test Coverage:**
- Validation of individual readings (null checks, type checks)
- Batch generation with various reading counts
- Transaction commit/rollback behavior
- Error handling and retry logic
- Metrics calculation accuracy

**Example Tests:**
- `test_valid_reading_passes_validation`
- `test_null_meter_id_fails_validation`
- `test_invalid_timestamp_fails_validation`
- `test_batch_split_at_100_readings`
- `test_transaction_rollback_on_error`
- `test_retry_logic_respects_max_attempts`
- `test_metrics_sum_correctly`

### Property-Based Tests

**Property 1: All Valid Readings Are Inserted**
- Generate random valid readings
- Insert batch
- Query database to verify all readings present
- Verify values match original readings

**Property 2: Field Names Map to Correct Columns**
- Generate readings with various field_names
- Insert batch
- Query database and verify data_point column contains field_name
- Verify values are in correct logical columns

**Property 3: Default Values Are Applied Consistently**
- Generate readings without explicit is_synchronized or retry_count
- Insert batch
- Query database and verify all readings have is_synchronized=false and retry_count=0

**Property 4: Invalid Readings Are Excluded**
- Generate mix of valid and invalid readings
- Insert batch
- Verify only valid readings in database
- Verify validation errors logged for invalid readings

**Property 5: Batch Insertion Is Atomic**
- Generate batch with one invalid reading in middle
- Attempt insert
- Verify either all inserted or none inserted (no partial inserts)

**Property 6: Insertion Metrics Are Accurate**
- Generate batch of known size
- Insert and get metrics
- Verify insertedCount + failedCount + skippedCount = total
- Verify insertedCount matches database row count

**Property 7: Retry Logic Respects Maximum Attempts**
- Mock database to fail 4 times
- Attempt insert
- Verify only 3 retry attempts made
- Verify failure returned after 3 attempts

**Property 8: Batch Size Optimization**
- Generate 250 readings
- Insert batch
- Verify split into 3 batches (100, 100, 50)
- Verify all 250 readings inserted

### Integration Tests

- End-to-end collection → caching → insertion flow
- Multiple meters with multiple registers
- Error recovery and retry scenarios
- Database transaction isolation

## Implementation Notes

### Batch Size Optimization

The system should split large reading collections into batches of 100 readings each for optimal performance:

```typescript
const BATCH_SIZE = 100;
const batches = [];
for (let i = 0; i < readings.length; i += BATCH_SIZE) {
  batches.push(readings.slice(i, i + BATCH_SIZE));
}
```

### Transaction Management

Each batch is executed within its own transaction to ensure atomicity:

```typescript
await client.query('BEGIN');
try {
  await client.query(insertQuery, values);
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
}
```

### Field Name Mapping

The `data_point` field in PendingReading stores the register's `field_name`, which becomes the column name in the meter_reading table. This mapping is established during meter collection when readings are created.

### Metrics Tracking

All insertion operations should track:
- Total readings processed
- Readings successfully inserted
- Readings that failed
- Readings skipped due to validation errors
- Retry attempts made
- Timestamp of operation
- Any error messages

## Performance Considerations

- **Batch size of 100**: Balances memory usage with database efficiency
- **Transaction per batch**: Ensures atomicity without holding locks too long
- **Connection pooling**: Reuses database connections from pool
- **Exponential backoff**: Prevents overwhelming database on transient failures
- **Index on meter_id and is_synchronized**: Enables fast queries for sync operations

## Security Considerations

- **Parameterized queries**: All SQL uses parameterized queries to prevent SQL injection
- **Transaction isolation**: Each batch is isolated within its own transaction
- **Error logging**: Errors logged without exposing sensitive data
- **Connection pooling**: Credentials managed at pool initialization, not per query
