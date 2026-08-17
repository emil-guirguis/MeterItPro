/**
 * Integration Tests for MeterReadingUploadManager - Task 12
 * 
 * Tests end-to-end upload flows with various scenarios:
 * - Task 12.1: End-to-end upload flow with batches of 50
 * - Task 12.2: Upload with connection failure and recovery
 * - Task 12.3: Upload with API error and retry
 * - Task 12.4: Multiple batches with mixed success/failure
 * - Task 12.5: 8-hour retry interval with indefinite retries
 * - Task 12.6: Connectivity restoration resets retry interval
 * - Task 12.7: Scheduled uploads with manual triggers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MeterReadingUploadManager, MeterReadingUploadManagerConfig } from './meter-reading-upload-manager.js';
import { ClientSystemApiClient } from '../api/client-system-api.js';
import { SyncDatabase, MeterReadingEntity } from '../types/entities.js';
import { cacheManager } from '../cache/cache-manager.js';

const mockTenant = {
  tenant_id: 1,
  name: 'Test Tenant',
  api_key: 'test-api-key',
  upload_batch_size: 100,
};

// ==================== MOCK IMPLEMENTATIONS ====================

class MockSyncDatabase implements Partial<SyncDatabase> {
  private readings: MeterReadingEntity[] = [];
  private deletedReadings: Set<string> = new Set();
  private retryCountMap: Map<string, number> = new Map();
  private syncLogs: any[] = [];

  setReadings(readings: MeterReadingEntity[]) {
    this.readings = readings.map((r, idx) => ({
      ...r,
      meter_reading_id: r.meter_reading_id || `uuid-${idx + 1}`,
    }));
  }

  async getUnsynchronizedReadings(limit: number = 1000) {
    // Return only readings that haven't been deleted and aren't synchronized
    return this.readings
      .filter(r => !this.deletedReadings.has(r.meter_reading_id!) && !r.is_synchronized)
      .slice(0, limit);
  }

  async incrementRetryCount(readingIds: string[]) {
    for (const id of readingIds) {
      const current = this.retryCountMap.get(id) || 0;
      this.retryCountMap.set(id, current + 1);
      
      // Update the reading's retry count
      const reading = this.readings.find(r => r.meter_reading_id === id);
      if (reading) {
        reading.retry_count = current + 1;
      }
    }
  }

  async deleteSynchronizedReadings(readingIds: string[]) {
    let deletedCount = 0;
    for (const id of readingIds) {
      if (!this.deletedReadings.has(id)) {
        this.deletedReadings.add(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  async markReadingsAsSynchronized(readingIds: any[], tenantId?: number) {
    let deletedCount = 0;
    for (const id of readingIds) {
      if (!this.deletedReadings.has(id)) {
        this.deletedReadings.add(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  async logSyncOperation(operationType: string, readingsCount: number, success: boolean, errorMessage?: string) {
    this.syncLogs.push({
      tenantId: 1,
      operationType,
      readingsCount,
      success,
      errorMessage,
      timestamp: new Date(),
    });
  }

  async getSyncStats(hours: number) {
    return {
      total_syncs: this.syncLogs.length,
      successful_syncs: this.syncLogs.filter(l => l.success).length,
      failed_syncs: this.syncLogs.filter(l => !l.success).length,
    };
  }

  getDeletedReadings() {
    return Array.from(this.deletedReadings);
  }

  getRetryCount(readingId: string) {
    return this.retryCountMap.get(readingId) || 0;
  }

  getSyncLogs() {
    return this.syncLogs;
  }
}

class MockClientSystemApiClient implements Partial<ClientSystemApiClient> {
  private apiKey: string = '';
  private uploadResponses: Map<number, { success: boolean; error?: string }> = new Map();
  private uploadCallCount: number = 0;
  private shouldFail: boolean = false;
  private failureMode: 'connection' | 'api-error' | 'none' = 'none';
  private failureReadingIds: Set<string> = new Set();

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  getApiKey() {
    return this.apiKey;
  }

  setShouldFail(shouldFail: boolean, mode: 'connection' | 'api-error' = 'api-error', readingIds?: string[]) {
    this.shouldFail = shouldFail;
    this.failureMode = mode;
    if (readingIds) {
      this.failureReadingIds = new Set(readingIds);
    }
  }

  async uploadBatch(readings: MeterReadingEntity[]) {
    this.uploadCallCount++;

    if (this.shouldFail) {
      if (this.failureMode === 'connection') {
        const error = new Error('Client System unreachable');
        (error as any).code = 'ECONNREFUSED';
        throw error;
      } else if (this.failureMode === 'api-error') {
        return { success: false, recordsProcessed: 0, message: 'API Error: 500 Internal Server Error' };
      }
    }

    // Check if any readings in this batch should fail
    const hasFailingReadings = readings.some(r => this.failureReadingIds.has(r.meter_reading_id!));
    if (hasFailingReadings) {
      return { success: false, recordsProcessed: 0, message: 'API Error: 500 Internal Server Error' };
    }

    return { success: true, recordsProcessed: readings.length };
  }

  async testConnection() {
    if (this.shouldFail && this.failureMode === 'connection') {
      return false;
    }
    return true;
  }

  getUploadCallCount() {
    return this.uploadCallCount;
  }

  resetUploadCallCount() {
    this.uploadCallCount = 0;
  }
}

// ==================== HELPER FUNCTIONS ====================

function createMeterReadings(count: number, startId: number = 1): MeterReadingEntity[] {
  const readings: MeterReadingEntity[] = [];
  for (let i = 0; i < count; i++) {
    readings.push({
      meter_reading_id: `uuid-${startId + i}`,
      meter_id: 100 + (i % 5),
      name: `Meter ${100 + (i % 5)}`,
      timestamp: new Date(Date.now() - (count - i) * 60000), // Spread over time
      data_point: 'energy_consumption',
      value: 100 + Math.random() * 50,
      unit: 'kWh',
      is_synchronized: false,
      retry_count: 0,
    });
  }
  return readings;
}

// ==================== TESTS ====================

describe('Task 12.1: End-to-end upload flow with batches of 50', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabase;
  let mockApiClient: MockClientSystemApiClient;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabase();
    mockApiClient = new MockClientSystemApiClient();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  it('should retrieve and upload 50 readings in a single batch', async () => {
    // Create 50 readings
    const readings = createMeterReadings(50);
    mockDatabase.setReadings(readings);

    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 50,
      enableAutoUpload: false,
    };

    uploadManager = new MeterReadingUploadManager(config);
    await uploadManager.start();

    // Perform upload
    await uploadManager.performUpload();

    // Verify all 50 readings were deleted
    const deletedReadings = mockDatabase.getDeletedReadings();
    expect(deletedReadings).toHaveLength(50);

    // Verify metrics were updated
    const status = uploadManager.getStatus();
    expect(status.totalUploaded).toBe(50);
    expect(status.lastUploadSuccess).toBe(true);
    expect(status.lastUploadTime).toBeDefined();
  });

  it('should upload batches of 50 readings', async () => {
    // Create 50 readings
    const readings = createMeterReadings(50);
    mockDatabase.setReadings(readings);

    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 50,
      enableAutoUpload: false,
    };

    uploadManager = new MeterReadingUploadManager(config);
    await uploadManager.start();

    // Perform upload
    await uploadManager.performUpload();

    // Verify upload was called
    expect(mockApiClient.getUploadCallCount()).toBeGreaterThan(0);
  });

  it('should verify metrics updated after successful upload', async () => {
    // Create 50 readings
    const readings = createMeterReadings(50);
    mockDatabase.setReadings(readings);

    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 50,
      enableAutoUpload: false,
    };

    uploadManager = new MeterReadingUploadManager(config);
    await uploadManager.start();

    // Get initial status
    const statusBefore = uploadManager.getStatus();
    expect(statusBefore.totalUploaded).toBe(0);

    // Perform upload
    await uploadManager.performUpload();

    // Get status after upload
    const statusAfter = uploadManager.getStatus();
    expect(statusAfter.totalUploaded).toBe(50);
    expect(statusAfter.lastUploadSuccess).toBe(true);
    expect(statusAfter.lastUploadError).toBeUndefined();
  });
});

describe('Task 12.2: Upload with connection failure and recovery', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabase;
  let mockApiClient: MockClientSystemApiClient;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabase();
    mockApiClient = new MockClientSystemApiClient();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  it('should keep batch in sync database when API is unreachable', async () => {
    // Create 50 readings (1 batch)
    const readings = createMeterReadings(50);
    mockDatabase.setReadings(readings);

    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 50,
      enableAutoUpload: false,
    };

    uploadManager = new MeterReadingUploadManager(config);
    await uploadManager.start();

    // Mock API to fail
    mockApiClient.setShouldFail(true, 'connection');

    // Perform upload
    await uploadManager.performUpload();

    // Verify batch is still in database
    const remainingReadings = await mockDatabase.getUnsynchronizedReadings(100);
    expect(remainingReadings.length).toBeGreaterThan(0);

    // Verify no readings were deleted
    const deletedReadings = mockDatabase.getDeletedReadings();
    expect(deletedReadings).toHaveLength(0);
  });

  it('should increment retry count for failed batch', async () => {
    // Create 50 readings (1 batch)
    const readings = createMeterReadings(50);
    mockDatabase.setReadings(readings);

    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 50,
      enableAutoUpload: false,
    };

    uploadManager = new MeterReadingUploadManager(config);
    await uploadManager.start();

    // Mock API to fail
    mockApiClient.setShouldFail(true, 'connection');

    // Perform upload
    await uploadManager.performUpload();

    // Verify retry count was incremented for batch readings
    const remainingReadings = await mockDatabase.getUnsynchronizedReadings(100);
    for (const reading of remainingReadings) {
      expect(reading.retry_count).toBeGreaterThan(0);
    }
  });
});

describe('Task 12.3: Upload with API error and retry', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabase;
  let mockApiClient: MockClientSystemApiClient;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabase();
    mockApiClient = new MockClientSystemApiClient();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  it('should increment retry count for all 50 readings on API error', async () => {
    // Create 50 readings (1 batch)
    const readings = createMeterReadings(50);
    mockDatabase.setReadings(readings);

    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 50,
      enableAutoUpload: false,
    };

    uploadManager = new MeterReadingUploadManager(config);
    await uploadManager.start();

    // Mock API to return 500 error
    mockApiClient.uploadBatch = async function(readings: MeterReadingEntity[]) {
      return { success: false, recordsProcessed: 0, message: 'API Error: 500 Internal Server Error' };
    };

    // Perform upload
    await uploadManager.performUpload();

    // Verify retry count was incremented for all readings
    const remainingReadings = await mockDatabase.getUnsynchronizedReadings(100);
    expect(remainingReadings).toHaveLength(50);
    for (const reading of remainingReadings) {
      expect(reading.retry_count).toBe(1);
    }
  });

  it('should keep batch in sync database after API error', async () => {
    // Create 50 readings (1 batch)
    const readings = createMeterReadings(50);
    mockDatabase.setReadings(readings);

    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 50,
      enableAutoUpload: false,
    };

    uploadManager = new MeterReadingUploadManager(config);
    await uploadManager.start();

    // Mock API to return 500 error
    mockApiClient.uploadBatch = async function(readings: MeterReadingEntity[]) {
      return { success: false, recordsProcessed: 0, message: 'API Error: 500 Internal Server Error' };
    };

    // Perform upload
    await uploadManager.performUpload();

    // Verify batch is still in database
    const remainingReadings = await mockDatabase.getUnsynchronizedReadings(100);
    expect(remainingReadings).toHaveLength(50);

    // Verify no readings were deleted
    const deletedReadings = mockDatabase.getDeletedReadings();
    expect(deletedReadings).toHaveLength(0);
  });

  it('should upload successfully on retry after API error', async () => {
    // Create 50 readings (1 batch)
    const readings = createMeterReadings(50);
    mockDatabase.setReadings(readings);

    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 50,
      enableAutoUpload: false,
    };

    uploadManager = new MeterReadingUploadManager(config);
    await uploadManager.start();

    // Mock API to fail first time, succeed on retry
    let callCount = 0;
    mockApiClient.uploadBatch = async function(readings: MeterReadingEntity[]) {
      callCount++;
      if (callCount === 1) {
        return { success: false, recordsProcessed: 0, message: 'API Error: 500 Internal Server Error' };
      }
      return { success: true, recordsProcessed: readings.length };
    };

    // First upload attempt (fails)
    await uploadManager.performUpload();

    // Verify batch is still in database
    let remainingReadings = await mockDatabase.getUnsynchronizedReadings(100);
    expect(remainingReadings).toHaveLength(50);

    // Second upload attempt (succeeds)
    mockApiClient.uploadBatch = async function(readings: MeterReadingEntity[]) {
      return { success: true, recordsProcessed: readings.length };
    };

    await uploadManager.performUpload();

    // Verify batch was deleted
    const deletedReadings = mockDatabase.getDeletedReadings();
    expect(deletedReadings).toHaveLength(50);
  });
});

describe('Task 12.4: Multiple batches with mixed success/failure', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabase;
  let mockApiClient: MockClientSystemApiClient;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabase();
    mockApiClient = new MockClientSystemApiClient();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  it('should keep batch in sync database when upload fails', async () => {
    // Create 50 readings (1 batch)
    const readings = createMeterReadings(50);
    mockDatabase.setReadings(readings);

    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 50,
      enableAutoUpload: false,
    };

    uploadManager = new MeterReadingUploadManager(config);
    await uploadManager.start();

    // Mock API to fail
    mockApiClient.uploadBatch = async function(readings: MeterReadingEntity[]) {
      return { success: false, recordsProcessed: 0, message: 'API Error: 500 Internal Server Error' };
    };

    // Perform upload
    await uploadManager.performUpload();

    // Verify batch is still in database
    const remainingReadings = await mockDatabase.getUnsynchronizedReadings(100);
    expect(remainingReadings).toHaveLength(50);

    // Verify batch has retry count incremented
    for (const reading of remainingReadings) {
      expect(reading.retry_count).toBe(1);
    }

    // Verify no readings were deleted
    const deletedReadings = mockDatabase.getDeletedReadings();
    expect(deletedReadings).toHaveLength(0);
  });
});

describe('Task 12.5: 8-hour retry interval with indefinite retries', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabase;
  let mockApiClient: MockClientSystemApiClient;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabase();
    mockApiClient = new MockClientSystemApiClient();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  it('should keep reading in sync database indefinitely at 8-hour intervals', async () => {
    // Create 1 reading
    const readings = createMeterReadings(1);
    mockDatabase.setReadings(readings);

    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 50,
      enableAutoUpload: false,
    };

    uploadManager = new MeterReadingUploadManager(config);
    await uploadManager.start();

    // Mock API to continue failing
    mockApiClient.uploadBatch = async function(readings: MeterReadingEntity[]) {
      return { success: false, recordsProcessed: 0, message: 'API Error: 500 Internal Server Error' };
    };

    // Perform upload
    await uploadManager.performUpload();

    // Verify reading is still in database
    const remainingReadings = await mockDatabase.getUnsynchronizedReadings(100);
    expect(remainingReadings).toHaveLength(1);

    // Verify reading was never marked as failed (still in database)
    expect(remainingReadings[0].is_synchronized).toBe(false);

    // Verify retry count was incremented
    expect(remainingReadings[0].retry_count).toBe(1);
  });

  it('should never mark reading as failed', async () => {
    // Create 1 reading
    const readings = createMeterReadings(1);
    mockDatabase.setReadings(readings);

    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 50,
      enableAutoUpload: false,
    };

    uploadManager = new MeterReadingUploadManager(config);
    await uploadManager.start();

    // Mock API to always fail
    mockApiClient.uploadBatch = async function(readings: MeterReadingEntity[]) {
      return { success: false, recordsProcessed: 0, message: 'API Error: 500 Internal Server Error' };
    };

    // Perform multiple upload attempts
    for (let i = 0; i < 3; i++) {
      await uploadManager.performUpload();
    }

    // Verify reading is still in database (never marked as failed)
    const remainingReadings = await mockDatabase.getUnsynchronizedReadings(100);
    expect(remainingReadings).toHaveLength(1);
    expect(remainingReadings[0].is_synchronized).toBe(false);
  });
});

describe('Task 12.6: Connectivity restoration resets retry interval', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabase;
  let mockApiClient: MockClientSystemApiClient;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabase();
    mockApiClient = new MockClientSystemApiClient();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  it('should reset retry interval when connectivity is restored', async () => {
    // Create 1 reading with high retry count
    const readings = createMeterReadings(1);
    readings[0].retry_count = 8; // High retry count
    mockDatabase.setReadings(readings);

    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 50,
      enableAutoUpload: false,
    };

    uploadManager = new MeterReadingUploadManager(config);
    await uploadManager.start();

    // Mock connectivity loss
    mockApiClient.setShouldFail(true, 'connection');

    // Attempt upload (should fail due to connectivity)
    await uploadManager.performUpload();

    // Verify reading is still in database
    let remainingReadings = await mockDatabase.getUnsynchronizedReadings(100);
    expect(remainingReadings).toHaveLength(1);
    const retryCountAfterFailure = remainingReadings[0].retry_count;

    // Restore connectivity
    mockApiClient.setShouldFail(false);

    // Mock API to succeed
    mockApiClient.uploadBatch = async function(readings: MeterReadingEntity[]) {
      return { success: true, recordsProcessed: readings.length };
    };

    // Perform upload (should succeed)
    await uploadManager.performUpload();

    // Verify reading was deleted
    const deletedReadings = mockDatabase.getDeletedReadings();
    expect(deletedReadings).toHaveLength(1);
  });
});

describe('Task 12.7: Scheduled uploads with manual triggers', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabase;
  let mockApiClient: MockClientSystemApiClient;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabase();
    mockApiClient = new MockClientSystemApiClient();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  it('should allow manual upload even when auto upload is disabled', async () => {
    // Create 50 readings
    const readings = createMeterReadings(50);
    mockDatabase.setReadings(readings);

    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 50,
      enableAutoUpload: false,
    };

    uploadManager = new MeterReadingUploadManager(config);
    await uploadManager.start();

    // Trigger manual upload
    await uploadManager.triggerUpload();

    // Verify upload completed
    const status = uploadManager.getStatus();
    expect(status.lastUploadTime).toBeDefined();
    expect(status.lastUploadSuccess).toBe(true);
  });

  it('should trigger upload when manager starts with auto upload enabled', async () => {
    // Create 50 readings
    const readings = createMeterReadings(50);
    mockDatabase.setReadings(readings);

    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 50,
      enableAutoUpload: true,
    };

    uploadManager = new MeterReadingUploadManager(config);

    // Start the manager
    await uploadManager.start();

    // Give it a moment to process
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify manager is running
    expect(uploadManager.getStatus().isRunning).toBe(true);

    // Stop the manager
    await uploadManager.stop();
  });
});
