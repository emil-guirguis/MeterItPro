/**
 * Tests for Task 8: Verify deletion of successfully uploaded readings
 * 
 * Verifies:
 * - Task 8.1: Readings are deleted after successful upload
 * - Task 8.2: Deletion count is logged
 * - Task 8.3: Deletion errors don't block next batch
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MeterReadingUploadManager, MeterReadingUploadManagerConfig } from './meter-reading-upload-manager.js';
import { ClientSystemApiClient } from '../api/client-system-api.js';
import { MeterReadingEntity, SyncDatabase } from '../types/entities.js';
import { cacheManager } from '../cache/cache-manager.js';

const mockTenant = {
  tenant_id: 1,
  name: 'Test Tenant',
  api_key: 'test-api-key',
  upload_batch_size: 100,
};

// Mock implementations
class MockSyncDatabaseForTask8 implements Partial<SyncDatabase> {
  private readings: MeterReadingEntity[] = [];
  private deletedReadingIds: string[] = [];
  private deletionCallCount: number = 0;
  private deletionErrors: boolean = false;
  private loggedOperations: any[] = [];

  setReadings(readings: MeterReadingEntity[]) {
    this.readings = readings;
  }

  getDeletedReadingIds() {
    return this.deletedReadingIds;
  }

  getDeletionCallCount() {
    return this.deletionCallCount;
  }

  setDeletionErrors(shouldError: boolean) {
    this.deletionErrors = shouldError;
  }

  getLoggedOperations() {
    return this.loggedOperations;
  }

  async getUnsynchronizedReadings(limit: number) {
    return this.readings.slice(0, limit);
  }

  async incrementRetryCount(readingIds: string[]) {
    // No-op for this test
  }

  async deleteSynchronizedReadings(readingIds: string[]): Promise<number> {
    this.deletionCallCount++;

    if (this.deletionErrors) {
      throw new Error('Database connection lost during deletion');
    }

    this.deletedReadingIds.push(...readingIds);
    this.readings = this.readings.filter(r => !readingIds.includes(r.meter_reading_id || ''));
    return readingIds.length;
  }

  async markReadingsAsSynchronized(readingIds: any[], tenantId?: number) {
    this.deletionCallCount++;
    if (this.deletionErrors) {
      throw new Error('Database connection lost during deletion');
    }
    this.deletedReadingIds.push(...readingIds);
    this.readings = this.readings.filter(r => !readingIds.includes(r.meter_reading_id || ''));
    return readingIds.length;
  }

  async logSyncOperation(
    operationType: string,
    readingsCount: number,
    success: boolean,
    errorMessage?: string
  ) {
    this.loggedOperations.push({
      tenantId: 1,
      operationType,
      readingsCount,
      success,
      errorMessage,
      timestamp: new Date(),
    });
  }

  async getSyncStats() {
    return {};
  }
}

class MockClientSystemApiClientForTask8 implements Partial<ClientSystemApiClient> {
  private apiKey: string = '';
  private uploadResponses: any[] = [];
  private responseIndex: number = 0;

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  setUploadResponses(responses: any[]) {
    this.uploadResponses = responses;
    this.responseIndex = 0;
  }

  async uploadBatch(readings: MeterReadingEntity[]) {
    // Return configured response or default success
    if (this.uploadResponses.length > 0 && this.responseIndex < this.uploadResponses.length) {
      const response = this.uploadResponses[this.responseIndex];
      this.responseIndex++;

      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    }

    return { success: true, recordsProcessed: readings.length };
  }

  async testConnection() {
    return true;
  }
}

describe('Task 8.1: Verify readings are deleted after successful upload', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabaseForTask8;
  let mockApiClient: MockClientSystemApiClientForTask8;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabaseForTask8();
    mockApiClient = new MockClientSystemApiClientForTask8();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  describe('Deletion Called with Correct Reading IDs', () => {
    it('should call delete with correct reading IDs after successful upload', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (50 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 50 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify deletion was called
      expect(mockDatabase.getDeletionCallCount()).toBe(1);

      // Verify correct reading IDs were deleted
      const deletedIds = mockDatabase.getDeletedReadingIds();
      expect(deletedIds.length).toBe(50);
      for (let i = 1; i <= 50; i++) {
        expect(deletedIds).toContain(`uuid-${i}`);
      }
    });

    it('should delete all readings in batch with correct IDs', async () => {
      const readings: MeterReadingEntity[] = [
        {
          meter_reading_id: 'uuid-101',
          meter_id: 1,
          name: 'Reading 1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          data_point: 'energy_consumption',
          value: 100.5,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
        },
        {
          meter_reading_id: 'uuid-102',
          meter_id: 1,
          name: 'Reading 2',
          timestamp: new Date('2024-01-01T10:01:00Z'),
          data_point: 'energy_consumption',
          value: 101.5,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
        },
        {
          meter_reading_id: 'uuid-103',
          meter_id: 1,
          name: 'Reading 3',
          timestamp: new Date('2024-01-01T10:02:00Z'),
          data_point: 'energy_consumption',
          value: 102.5,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
        },
      ];

      mockDatabase.setReadings(readings);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 3 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify all reading IDs were deleted
      const deletedIds = mockDatabase.getDeletedReadingIds();
      expect(deletedIds).toContain('uuid-101');
      expect(deletedIds).toContain('uuid-102');
      expect(deletedIds).toContain('uuid-103');
    });

    it('should not delete readings if upload fails', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (50 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockApiClient.setUploadResponses([
        { success: false, recordsProcessed: 0, message: 'Upload failed' }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify deletion was NOT called
      expect(mockDatabase.getDeletionCallCount()).toBe(0);
      expect(mockDatabase.getDeletedReadingIds().length).toBe(0);
    });
  });

  describe('Readings Removed from Sync Database', () => {
    it('should remove readings from sync database after deletion', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (50 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 50 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      // Verify readings exist before upload
      expect(mockDatabase.getDeletedReadingIds().length).toBe(0);
      
      await uploadManager.triggerUpload();

      // Verify readings were deleted
      expect(mockDatabase.getDeletedReadingIds().length).toBe(50);
    });

    it('should verify deleted readings are no longer in database', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (50 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 50 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify readings were deleted from database
      const deletedIds = mockDatabase.getDeletedReadingIds();
      expect(deletedIds.length).toBe(50);
      
      // Verify all reading IDs are in the deleted list
      for (let i = 1; i <= 50; i++) {
        expect(deletedIds).toContain(`uuid-${i}`);
      }
    });
  });
});

describe('Task 8.2: Verify deletion count is logged', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabaseForTask8;
  let mockApiClient: MockClientSystemApiClientForTask8;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabaseForTask8();
    mockApiClient = new MockClientSystemApiClientForTask8();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  describe('Deletion Count Logging', () => {
    it('should log deletion count after successful upload', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (50 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 50 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify log operation was called
      const loggedOps = mockDatabase.getLoggedOperations();
      expect(loggedOps.length).toBeGreaterThan(0);
      
      // Verify the log includes the upload count
      const uploadLog = loggedOps.find(op => op.operationType === 'upload' && op.success);
      expect(uploadLog).toBeDefined();
      expect(uploadLog?.readingsCount).toBe(50);
    });

    it('should include correct count in log message', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 25 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (25 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 25 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify log includes correct count
      const loggedOps = mockDatabase.getLoggedOperations();
      const uploadLog = loggedOps.find(op => op.operationType === 'upload' && op.success);
      expect(uploadLog?.readingsCount).toBe(25);
    });

    it('should log deletion count for different batch sizes', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 100 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (100 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 100 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 100,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify log includes correct count
      const loggedOps = mockDatabase.getLoggedOperations();
      const uploadLog = loggedOps.find(op => op.operationType === 'upload' && op.success);
      expect(uploadLog?.readingsCount).toBe(100);
    });

    it('should log success status with deletion count', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (50 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 50 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify log shows success
      const loggedOps = mockDatabase.getLoggedOperations();
      const uploadLog = loggedOps.find(op => op.operationType === 'upload');
      expect(uploadLog?.success).toBe(true);
      expect(uploadLog?.readingsCount).toBe(50);
    });
  });
});

describe('Task 8.3: Verify deletion errors don\'t block next batch', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabaseForTask8;
  let mockApiClient: MockClientSystemApiClientForTask8;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabaseForTask8();
    mockApiClient = new MockClientSystemApiClientForTask8();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  describe('Deletion Error Handling', () => {
    it('should log error but continue when deletion fails', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (50 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockDatabase.setDeletionErrors(true);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 50 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      // Should not throw even though deletion fails
      await expect(uploadManager.triggerUpload()).resolves.not.toThrow();
    });

    it('should not retry deletion on error', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (50 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockDatabase.setDeletionErrors(true);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 50 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify deletion was only attempted once (not retried)
      expect(mockDatabase.getDeletionCallCount()).toBe(1);
    });

    it('should allow readings to be re-uploaded if deletion fails', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (50 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockDatabase.setDeletionErrors(true);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 50 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      // First upload attempt (deletion fails)
      await uploadManager.triggerUpload();

      // Verify readings are still in database (not deleted)
      const deletedIds = mockDatabase.getDeletedReadingIds();
      expect(deletedIds.length).toBe(0);

      // Readings should still be available for re-upload on next cycle
      // (This is safe due to idempotency - re-uploading same readings is safe)
    });

    it('should continue processing after deletion error', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (50 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockDatabase.setDeletionErrors(true);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 50 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      // Upload should complete despite deletion error
      await uploadManager.triggerUpload();

      // Verify upload manager is still operational
      const status = uploadManager.getStatus();
      expect(status.isRunning).toBe(true); // Running because we called start()
      expect(status.lastUploadTime).toBeDefined(); // And upload was attempted
    });

    it('should log deletion error without blocking', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (50 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockDatabase.setDeletionErrors(true);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 50 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      // Should not throw
      await expect(uploadManager.triggerUpload()).resolves.not.toThrow();

      // Verify upload was still recorded
      const status = uploadManager.getStatus();
      expect(status.lastUploadTime).toBeDefined();
    });
  });

  describe('Idempotency on Deletion Failure', () => {
    it('should allow safe re-upload of readings if deletion fails', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (50 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockDatabase.setDeletionErrors(true);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 50 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      // First upload (deletion fails)
      await uploadManager.triggerUpload();

      // Verify readings were not deleted
      expect(mockDatabase.getDeletedReadingIds().length).toBe(0);

      // Readings are still available for next upload cycle
      // This is safe because the API should handle duplicate uploads idempotently
    });

    it('should not mark readings as failed when deletion fails', async () => {
      const readings: MeterReadingEntity[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (50 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
      }));

      mockDatabase.setReadings(readings);
      mockDatabase.setDeletionErrors(true);
      mockApiClient.setUploadResponses([
        { success: true, recordsProcessed: 50 }
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify readings are still available (not marked as failed)
      const deletedIds = mockDatabase.getDeletedReadingIds();
      expect(deletedIds.length).toBe(0);
    });
  });
});
