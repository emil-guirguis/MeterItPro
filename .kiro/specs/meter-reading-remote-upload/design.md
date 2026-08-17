# Design Document: Meter Reading Remote Upload

## Overview

The Meter Reading Remote Upload system is responsible for uploading meter readings from the sync database to the remote client database. The system retrieves unsynchronized readings, formats them according to the remote API specification, uploads them in batches, handles connection failures gracefully, implements retry logic with exponential backoff, and deletes successfully uploaded readings from the sync database. The system continuously monitors connectivity and automatically resumes uploads when the remote system becomes available.

## Architecture

### High-Level Flow

```
Sync Database (Unsynchronized Readings)
    ↓
Retrieve Batch of 50 Readings
    ↓
Format for Remote API
    ↓
Check Connectivity to Remote Database
    ↓
Upload Batch of 50 via API
    ↓
Handle Response
    ├─ Success: Delete batch from Sync Database
    ├─ Failure: Increment Retry Count for batch, Keep in Sync Database
    └─ Connection Error: Keep batch in Sync Database, Wait for Connectivity
    ↓
If more batches exist, repeat from "Retrieve Batch of 50 Readings"
    ↓
Update Upload Status & Metrics
    ↓
Schedule Next Upload
```

### Component Interaction

```
MeterReadingUploadManager
    ├── Schedules uploads (cron)
    ├── Monitors connectivity (ConnectivityMonitor)
    ├── Retrieves readings (SyncDatabase)
    ├── Formats for API (APIFormatter)
    ├── Uploads via API (ClientSystemApiClient)
    └── Deletes after success (SyncDatabase)

SyncDatabase
    ├── getUnsynchronizedReadings(batchSize)
    ├── incrementRetryCount(readingIds)
    ├── deleteSynchronizedReadings(readingIds)
    └── logSyncOperation(count, success, error)

ClientSystemApiClient
    ├── uploadBatch(readings)
    └── setApiKey(key)

ConnectivityMonitor
    ├── start()
    ├── stop()
    ├── isConnected()
    └── Events: 'connected', 'disconnected'
```

## Components and Interfaces

### 1. MeterReadingUploadManager (Enhanced)

**Location:** `MeterItProSync/mcp/src/bacnet-collection/meter-reading-upload-manager.ts`

**Current Status:** Already implemented with most functionality

**Key Methods:**
```typescript
class MeterReadingUploadManager {
  // Start the upload manager with scheduled uploads
  async start(): Promise<void>

  // Stop the upload manager
  async stop(): Promise<void>

  // Perform a single upload operation (uploads all available batches of 50)
  async performUpload(): Promise<void>

  // Get current upload status
  getStatus(): UploadStatus

  // Manually trigger an upload operation
  async triggerUpload(): Promise<void>

  // Get upload statistics
  async getUploadStats(hours: number): Promise<any>
}
```

**Responsibilities:**
- Schedule automatic uploads at configurable intervals
- Monitor connectivity to remote database
- Retrieve unsynchronized readings in batches of 50
- Format readings for remote API
- Upload batches of 50 sequentially
- Handle connection failures and retries
- Delete successfully uploaded batches
- Track upload status and metrics

### 2. SyncDatabase Integration

**Existing Methods Used:**
- `getUnsynchronizedReadings(batchSize)` - Retrieve readings where is_synchronized = false (batchSize = 50)
- `incrementRetryCount(readingIds)` - Increment retry_count for failed readings
- `deleteSynchronizedReadings(readingIds)` - Delete readings after successful upload
- `logSyncOperation(count, success, error)` - Log upload operation

**New Methods to Add (if not present):**
```typescript
class SyncDatabase {
  // Get readings that haven't been uploaded yet (batch of 50)
  async getUnsynchronizedReadings(batchSize: number): Promise<MeterReadingEntity[]>

  // Increment retry count for readings
  async incrementRetryCount(readingIds: number[]): Promise<void>

  // Delete readings after successful upload
  async deleteSynchronizedReadings(readingIds: number[]): Promise<number>

  // Log sync operation for audit trail
  async logSyncOperation(
    count: number,
    success: boolean,
    error?: string
  ): Promise<void>

  // Get sync statistics
  async getSyncStats(hours: number): Promise<SyncStats>
}
```

### 3. ClientSystemApiClient

**Location:** `MeterItProSync/mcp/src/api/client-system-api.ts`

**Key Methods:**
```typescript
class ClientSystemApiClient {
  // Upload a batch of readings to remote API
  async uploadBatch(readings: MeterReadingEntity[]): Promise<UploadResponse>

  // Set API key for authentication
  setApiKey(key: string): void
}
```

### 4. ConnectivityMonitor

**Location:** `MeterItProSync/mcp/src/api/connectivity-monitor.ts`

**Key Methods:**
```typescript
class ConnectivityMonitor {
  // Start monitoring connectivity
  start(): void

  // Stop monitoring connectivity
  stop(): void

  // Check if remote API is currently reachable
  isConnected(): boolean

  // Get connectivity status
  getStatus(): ConnectivityStatus

  // Events: 'connected', 'disconnected'
  on(event: string, callback: Function): void
}
```

### 5. Data Types

**MeterReadingEntity:**
```typescript
interface MeterReadingEntity {
  meter_reading_id?: number;
  meter_id: number;
  timestamp: Date;
  data_point: string;      // field_name
  value: number;
  unit?: string;
  is_synchronized: boolean;
  retry_count: number;
}
```

**UploadStatus:**
```typescript
interface UploadStatus {
  isRunning: boolean;
  lastUploadTime?: Date;
  lastUploadSuccess?: boolean;
  lastUploadError?: string;
  queueSize: number;
  totalUploaded: number;
  totalFailed: number;
  isClientConnected: boolean;
}
```

**UploadResponse:**
```typescript
interface UploadResponse {
  success: boolean;
  message?: string;
  uploadedCount?: number;
  failedCount?: number;
}
```

### 6. Frontend Components

**Location:** `MeterItProSync/frontend/src/components/MeterReadingUploadCard.tsx`

**Responsibilities:**
- Display meter reading upload status
- Show queue size and upload statistics
- Display last upload time and next upload time
- Show connectivity status
- Display recent upload operation log
- Provide "Retry Upload" button
- Auto-refresh metrics every 30 seconds
- Show loading indicator during upload

**Key Data Displayed:**
- Queue Size: Count of unsynchronized readings in sync database
- Total Uploaded: Cumulative count of successfully uploaded readings
- Last Upload Time: Timestamp of most recent upload attempt
- Last Upload Status: Success or failure of last upload
- Next Upload Time: Calculated time of next scheduled upload
- Connectivity Status: Connected or disconnected to remote database
- Upload Log: Recent upload operations with timestamps and results
- Retry Button: Triggers manual upload operation

## Data Models

### Meter Reading Table (Existing)

The meter_reading table in the sync database:
- `meter_reading_id`: SERIAL PRIMARY KEY
- `meter_id`: VARCHAR(255) - Foreign key to meter table
- `timestamp`: TIMESTAMP - When the reading was collected
- `data_point`: VARCHAR(255) - The field_name from the register
- `value`: NUMERIC - The meter reading value
- `unit`: VARCHAR(50) - Unit of measurement (optional)
- `is_synchronized`: BOOLEAN - Whether reading has been uploaded (default: false)
- `retry_count`: INTEGER - Number of upload retry attempts (default: 0)
- `created_at`: TIMESTAMP - When the reading was inserted into sync database
- `updated_at`: TIMESTAMP - When the reading was last updated

### Sync Operation Log Table (Existing)

The sync_operation_log table tracks all upload operations:
- `sync_operation_id`: SERIAL PRIMARY KEY
- `tenant_id`: INTEGER - Which tenant this operation is for
- `operation_type`: VARCHAR(50) - 'upload', 'download', etc.
- `readings_count`: INTEGER - How many readings were processed
- `success`: BOOLEAN - Whether the operation succeeded
- `error_message`: TEXT - Error details if failed
- `created_at`: TIMESTAMP - When the operation occurred

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Successful Upload Deletes from Sync Database

**For any** batch of meter readings successfully uploaded to the remote database, those readings should be deleted from the sync database, ensuring no duplicate uploads occur.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 2: Failed Upload Preserves Readings in Sync Database

**For any** batch of meter readings that fails to upload due to connection error or API error, those readings should remain in the sync database with their retry_count incremented, ensuring no data loss.

**Validates: Requirements 4.1, 4.2, 4.3, 5.1, 5.2**

### Property 3: Retry Logic Respects 8-Hour Cap with Indefinite 8-Hour Intervals

**For any** meter reading that fails to upload, the system should retry with exponential backoff (in minutes) until reaching 8 hours, then continue retrying every 8 hours indefinitely. When connectivity is restored, the retry interval should reset to exponential backoff starting at 2 minutes.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**

### Property 4: Connectivity Restoration Triggers Upload

**For any** period where the remote API is unreachable, when connectivity is restored, the system should automatically trigger an upload of queued readings without manual intervention.

**Validates: Requirements 4.4, 8.4**

### Property 5: Unsynchronized Readings Are Retrieved in Order

**For any** query for unsynchronized readings, the system should return readings ordered by timestamp ascending, ensuring chronological consistency.

**Validates: Requirements 1.4**

### Property 6: Upload Status Metrics Are Accurate

**For any** upload operation, the returned metrics (totalUploaded, totalFailed, queueSize) should accurately reflect the actual state of the sync database and upload results.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

### Property 7: Scheduled Uploads Don't Overlap

**For any** scheduled upload interval, if an upload is already in progress when the next interval arrives, the system should skip the new upload and wait for the next interval, preventing concurrent uploads.

**Validates: Requirements 9.2, 9.3**

### Property 8: Manual Upload Doesn't Affect Schedule

**For any** manual upload trigger, the scheduled upload interval should remain unchanged, and the next scheduled upload should occur at the expected time.

**Validates: Requirements 10.5**

### Property 9: Frontend Card Displays Accurate Metrics

**For any** upload operation, the frontend card should display metrics that match the actual state of the sync database and upload manager, including queue size, total uploaded, last upload time, and connectivity status.

**Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.6, 11.7**

### Property 10: Frontend Card Auto-Refreshes Metrics

**For any** time interval of 30 seconds, the frontend card should refresh its displayed metrics to reflect the current state of the upload manager and sync database.

**Validates: Requirements 11.12**

## Error Handling

### Connection Errors

**Scenario:** Remote API is unreachable (network error, timeout, DNS failure)

**Handling:**
1. Catch connection error
2. Log error with details
3. Mark connectivity as inactive
4. Keep readings in sync database
5. Increment retry_count
6. Wait for connectivity restoration
7. On connectivity restoration, trigger immediate upload

**Example:**
```
Connection Error: ECONNREFUSED - Cannot reach remote API
→ Readings remain in sync database
→ Retry count incremented
→ Wait for connectivity
→ On reconnection: Automatic upload triggered
```

### API Errors

**Scenario:** Remote API returns error response (4xx, 5xx)

**Handling:**
1. Parse error response
2. Log error with HTTP status and message
3. Increment retry_count
4. Keep readings in sync database
5. Schedule retry with exponential backoff (in minutes)
6. If calculated delay exceeds 8 hours, cap at 8 hours and continue retrying every 8 hours indefinitely
7. When connectivity is restored, reset retry interval to exponential backoff starting at 2 minutes
8. Data is NEVER marked as failed - it remains available for manual intervention

**Example:**
```
API Error: 500 Internal Server Error
→ Readings remain in sync database
→ Retry count incremented
→ Retry in 2 seconds (exponential backoff)
→ After 5 retries: Stop and log warning
```

### Deletion Errors

**Scenario:** Deletion of successfully uploaded readings fails

**Handling:**
1. Log error
2. Don't retry deletion
3. Readings will be re-uploaded on next cycle (idempotent)
4. Continue with next batch

**Example:**
```
Deletion Error: Database connection lost
→ Log error
→ Continue with next batch
→ Readings will be re-uploaded (safe due to idempotency)
```

## Testing Strategy

### Unit Tests

**Test Coverage:**
- Formatting readings for API
- Retry logic and exponential backoff
- Connectivity monitoring
- Upload status tracking
- Metrics calculation

**Example Tests:**
- `test_format_reading_for_api`
- `test_retry_count_increments`
- `test_exponential_backoff_calculation`
- `test_connectivity_status_changes`
- `test_upload_metrics_accuracy`

### Property-Based Tests

**Property 1: Successful Upload Deletes from Sync Database**
- Generate random readings
- Mock successful API response
- Upload batch
- Query sync database to verify readings deleted
- Verify no duplicate uploads on next cycle

**Property 2: Failed Upload Preserves Readings in Sync Database**
- Generate random readings
- Mock API failure
- Attempt upload
- Query sync database to verify readings still present
- Verify retry_count incremented

**Property 3: Retry Count Respects Maximum Attempts**
- Generate reading with retry_count = 4
- Mock API failure
- Attempt upload
- Verify retry_count = 5
- Attempt upload again
- Verify no further retries

**Property 4: Connectivity Restoration Triggers Upload**
- Mock connectivity loss
- Attempt upload (should fail)
- Restore connectivity
- Verify automatic upload triggered
- Verify readings uploaded successfully

**Property 5: Unsynchronized Readings Are Retrieved in Order**
- Insert readings with various timestamps
- Query unsynchronized readings
- Verify returned in ascending timestamp order

**Property 6: Upload Status Metrics Are Accurate**
- Generate batch of readings
- Upload batch
- Get status
- Verify metrics match actual database state

**Property 7: Scheduled Uploads Don't Overlap**
- Start upload manager
- Trigger manual upload
- Verify scheduled upload skipped during manual upload
- Verify next scheduled upload occurs at expected time

**Property 8: Manual Upload Doesn't Affect Schedule**
- Start upload manager with 5-minute interval
- Trigger manual upload at 2 minutes
- Verify next scheduled upload at 5 minutes (not 7 minutes)

### Integration Tests

- End-to-end upload flow with successful completion
- Upload with connection failure and recovery
- Upload with API error and retry
- Multiple batches with mixed success/failure
- Connectivity monitoring and automatic resume
- Scheduled uploads with manual triggers

## Implementation Notes

### Batch Size

Default batch size is 1000 readings per upload. This can be configured via environment variable `BATCH_SIZE`.

### Retry Strategy

Readings are retried indefinitely with exponential backoff in minutes, capped at 8 hours, then continuing at 8-hour intervals:

```
Attempt 1: Immediate
Attempt 2: Wait 2 minutes (2^1)
Attempt 3: Wait 4 minutes (2^2)
Attempt 4: Wait 8 minutes (2^3)
Attempt 5: Wait 16 minutes (2^4)
Attempt 6: Wait 32 minutes (2^5)
Attempt 7: Wait 64 minutes (2^6)
Attempt 8: Wait 128 minutes (2^7)
Attempt 9+: Wait 480 minutes (8 hours) - continues indefinitely at 8-hour intervals
```

**Connectivity Reset:** When connectivity is restored after a failed upload, the retry interval resets to exponential backoff starting at 2 minutes.

**Important:** Data is NEVER marked as failed. It remains in the sync database for manual intervention if needed.

### Connectivity Monitoring

The ConnectivityMonitor checks connectivity at regular intervals (default 60 seconds). When connectivity changes from inactive to active, it emits a 'connected' event, which triggers an immediate upload attempt.

### Scheduled Uploads

Uploads are scheduled using node-cron at configurable intervals (default 5 minutes). The cron expression is `*/5 * * * *` for 5-minute intervals.

### API Key Management

The API key is loaded from the tenant cache when the upload manager starts. It's used for authentication on all API requests to the remote database.

### Idempotency

The upload process is idempotent: if a reading is uploaded but deletion fails, re-uploading the same reading should not cause issues in the remote database. The remote API should handle duplicate uploads gracefully.

## Performance Considerations

- **Batch size of 50**: Balances memory usage with API efficiency and retry granularity
- **Sequential batch uploads**: Ensures ordered processing and easier error tracking
- **Connectivity check interval of 60 seconds**: Detects outages without excessive overhead
- **Upload interval of 5 minutes**: Balances freshness with database load
- **Exponential backoff**: Prevents overwhelming remote API during transient failures
- **Connection pooling**: Reuses database connections for efficiency

## Security Considerations

- **API Key Management**: API key loaded from tenant cache, not hardcoded
- **HTTPS Only**: All API requests use HTTPS for encryption
- **Error Logging**: Errors logged without exposing sensitive data
- **Retry Limits**: Prevents infinite retry loops that could cause DoS
- **Tenant Isolation**: Each tenant's readings uploaded separately with their own API key

</content>
</invoke>
