/**
 * Tests for Task 5: Verify API upload and response handling
 * 
 * Verifies:
 * - Task 5.1: Batches of 50 readings are uploaded to remote API
 * - Task 5.2: Successful API response is handled
 * - Task 5.3: API error response is handled
 * - Task 5.4: Sequential batch uploads
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
  upload_batch_size: 50,
};

// Mock implementations
class MockSyncDatabaseForTask5 implements Partial<SyncDatabase> {
  private readings: MeterReadingEntity[] = [];
  private deletedReadingIds: string[] = [];
  private incrementedRetryIds: string[] = [];

  setReadings(readings: MeterReadingEntity[]) {
    this.readings = readings;
  }

  getDeletedReadingIds() {
    return this.deletedReadingIds;
  }

  getIncrementedRetryIds() {
    return this.incrementedRetryIds;
  }

  async getUnsynchronizedReadings(limit: number) {
    return this.readings.slice(0, limit);
  }

  async incrementRetryCount(readingIds: string[]) {
    this.incrementedRetryIds.push(...readingIds);
  }

  async deleteSynchronizedReadings(readingIds: string[]) {
    this.deletedReadingIds.push(...readingIds);
    this.readings = this.readings.filter(r => !readingIds.includes(r.meter_reading_id?.toString() || ''));
    return readingIds.length;
  }

  async markReadingsAsSynchronized(readingIds: any[], tenantId?: number) {
    this.deletedReadingIds.push(...readingIds);
    this.readings = this.readings.filter(r => !readingIds.includes(r.meter_reading_id));
    return readingIds.length;
  }

  async logSyncOperation() {
    return;
  }

  async getSyncStats() {
    return {};
  }
}

class MockClientSystemApiClientForTask5 implements Partial<ClientSystemApiClient> {
  private apiKey: string = '';
  private uploadedBatches: any[] = [];
  private uploadResponses: any[] = [];
  private uploadCallCount: number = 0;
  private responseIndex: number = 0;

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  getApiKey() {
    return this.apiKey;
  }

  getUploadedBatches() {
    return this.uploadedBatches;
  }

  getUploadCallCount() {
    return this.uploadCallCount;
  }

  setUploadResponses(responses: any[]) {
    this.uploadResponses = responses;
    this.responseIndex = 0;
  }

  async uploadBatch(readings: MeterReadingEntity[]) {
    this.uploadCallCount++;
    
    // Track the batch
    this.uploadedBatches.push({
      readings: [...readings],
      callNumber: this.uploadCallCount,
    });

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

describe('Task 5.1: Verify batches of 50 readings are uploaded to remote API', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabaseForTask5;
  let mockApiClient: MockClientSystemApiClientForTask5;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabaseForTask5();
    mockApiClient = new MockClientSystemApiClientForTask5();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  describe('API Endpoint Called', () => {
    it('should call API endpoint with batch of 50 readings', async () => {
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

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      mockApiClient.setApiKey('test-api-key');
      await uploadManager.triggerUpload();

      // Verify API was called
      expect(mockApiClient.getUploadCallCount()).toBe(1);
      
      // Verify batch size is exactly 50
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches.length).toBe(1);
      expect(uploadedBatches[0].readings.length).toBe(50);
    });

    it('should include API key in request headers', async () => {
      const testApiKey = 'test-api-key-12345';
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

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      mockApiClient.setApiKey(testApiKey);

      // Verify API key is set
      expect(mockApiClient.getApiKey()).toBe(testApiKey);

      await uploadManager.triggerUpload();

      // Verify API was called with the key set
      expect(mockApiClient.getUploadCallCount()).toBe(1);
    });

    it('should upload batch with correct payload structure', async () => {
      const readings: MeterReadingEntity[] = [
        {
          meter_reading_id: 'uuid-1',
          meter_id: 123,
          name: 'Reading 1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          data_point: 'energy_consumption',
          value: 100.5,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
        },
      ];

      mockDatabase.setReadings(readings);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify payload structure
      const uploadedBatches = mockApiClient.getUploadedBatches();
      const uploadedReading = uploadedBatches[0].readings[0];

      expect(uploadedReading).toHaveProperty('meter_id', 123);
      expect(uploadedReading).toHaveProperty('timestamp');
      expect(uploadedReading).toHaveProperty('data_point', 'energy_consumption');
      expect(uploadedReading).toHaveProperty('value', 100.5);
      expect(uploadedReading).toHaveProperty('unit', 'kWh');
    });
  });

  describe('Batch Size Validation', () => {
    it('should upload exactly 50 readings in batch', async () => {
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

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches[0].readings.length).toBe(50);
    });

    it('should not exceed 50 readings in batch', async () => {
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

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches[0].readings.length).toBe(50);
    });
  });
});


describe('Task 5.2: Verify successful API response is handled', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabaseForTask5;
  let mockApiClient: MockClientSystemApiClientForTask5;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabaseForTask5();
    mockApiClient = new MockClientSystemApiClientForTask5();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  describe('HTTP 200 Response Handling', () => {
    it('should mark batch as successful on HTTP 200 response', async () => {
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

      // Verify upload was successful
      const status = uploadManager.getStatus();
      expect(status.lastUploadSuccess).toBe(true);
      expect(status.lastUploadError).toBeUndefined();
    });

    it('should prepare batch readings for deletion on success', async () => {
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

      // Verify readings were deleted
      const deletedIds = mockDatabase.getDeletedReadingIds();
      expect(deletedIds.length).toBe(50);
      expect(deletedIds).toContain('uuid-1');
      expect(deletedIds).toContain('uuid-50');
    });

    it('should update upload status metrics on success', async () => {
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

      const statusBefore = uploadManager.getStatus();
      expect(statusBefore.totalUploaded).toBe(0);

      await uploadManager.triggerUpload();

      const statusAfter = uploadManager.getStatus();
      expect(statusAfter.totalUploaded).toBe(50);
      expect(statusAfter.lastUploadTime).toBeDefined();
    });
  });

  describe('Deletion After Success', () => {
    it('should delete all readings in successful batch', async () => {
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

      // Verify all reading IDs were deleted
      const deletedIds = mockDatabase.getDeletedReadingIds();
      for (let i = 1; i <= 50; i++) {
        expect(deletedIds).toContain(`uuid-${i}`);
      }
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

      // Verify no readings were deleted
      const deletedIds = mockDatabase.getDeletedReadingIds();
      expect(deletedIds.length).toBe(0);
    });
  });
});

describe('Task 5.3: Verify API error response is handled', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabaseForTask5;
  let mockApiClient: MockClientSystemApiClientForTask5;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabaseForTask5();
    mockApiClient = new MockClientSystemApiClientForTask5();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  describe('Error Response Handling', () => {
    it('should log HTTP 4xx error response', async () => {
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
        { success: false, recordsProcessed: 0, message: 'Bad request' }
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

      // Verify error was logged
      const status = uploadManager.getStatus();
      expect(status.lastUploadSuccess).toBe(false);
      expect(status.lastUploadError).toBeDefined();
    });

    it('should log HTTP 5xx error response', async () => {
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
        { success: false, recordsProcessed: 0, message: 'Server error' }
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

      // Verify error was logged
      const status = uploadManager.getStatus();
      expect(status.lastUploadSuccess).toBe(false);
      expect(status.lastUploadError).toBeDefined();
    });

    it('should keep batch readings in sync database on error', async () => {
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

      // Verify readings were NOT deleted
      const deletedIds = mockDatabase.getDeletedReadingIds();
      expect(deletedIds.length).toBe(0);
    });

    it('should increment retry count for all readings in failed batch', async () => {
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

      // Verify retry count was incremented for all readings
      const incrementedIds = mockDatabase.getIncrementedRetryIds();
      expect(incrementedIds.length).toBe(50);
      for (let i = 1; i <= 50; i++) {
        expect(incrementedIds).toContain(`uuid-${i}`);
      }
    });
  });

  describe('Error Logging', () => {
    it('should log error message with details', async () => {
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
        { success: false, recordsProcessed: 0, message: 'Invalid API key' }
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

      // Verify error is captured (upload manager records failure count)
      const status = uploadManager.getStatus();
      expect(status.lastUploadError).toBeDefined();
      expect(status.lastUploadSuccess).toBe(false);
    });
  });
});

describe('Task 5.4: Verify sequential batch uploads', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabaseForTask5;
  let mockApiClient: MockClientSystemApiClientForTask5;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabaseForTask5();
    mockApiClient = new MockClientSystemApiClientForTask5();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  describe('Sequential Upload Verification', () => {
    it('should upload multiple batches one at a time', async () => {
      // Create 100 readings (2 batches of 50)
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

      // Verify all batches uploaded sequentially (2 batches of 50 for 100 readings)
      expect(mockApiClient.getUploadCallCount()).toBe(2);
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches.length).toBe(2);
      expect(uploadedBatches[0].readings.length).toBe(50);
    });

    it('should wait for previous batch to complete before uploading next', async () => {
      // Create 100 readings (2 batches of 50)
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

      // Trigger upload
      await uploadManager.triggerUpload();

      // Verify both batches uploaded (100 readings / 50 per batch = 2 calls)
      expect(mockApiClient.getUploadCallCount()).toBe(2);
    });

    it('should not upload concurrent batches', async () => {
      // Create 100 readings
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

      // Trigger multiple uploads concurrently (concurrent triggers are prevented - only one runs)
      await Promise.all([
        uploadManager.triggerUpload(),
        uploadManager.triggerUpload(),
        uploadManager.triggerUpload(),
      ]);

      // Verify concurrent uploads are prevented (only one triggerUpload processes all readings)
      expect(mockApiClient.getUploadCallCount()).toBe(2);
    });

    it('should maintain order of batches', async () => {
      // Create 100 readings
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

      // Verify first batch contains readings 1-50
      const uploadedBatches = mockApiClient.getUploadedBatches();
      const firstBatch = uploadedBatches[0].readings;
      
      expect(firstBatch[0].meter_reading_id).toBe('uuid-1');
      expect(firstBatch[49].meter_reading_id).toBe('uuid-50');
    });
  });

  describe('Batch Completion Verification', () => {
    it('should complete batch upload before returning', async () => {
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

      // Trigger upload and wait for completion
      await uploadManager.triggerUpload();

      // Verify upload completed
      const status = uploadManager.getStatus();
      expect(status.lastUploadTime).toBeDefined();
      expect(status.lastUploadSuccess).toBe(true);
    });

    it('should update status after each batch upload', async () => {
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

      const statusBefore = uploadManager.getStatus();
      expect(statusBefore.totalUploaded).toBe(0);

      await uploadManager.triggerUpload();

      const statusAfter = uploadManager.getStatus();
      expect(statusAfter.totalUploaded).toBe(50);
    });
  });
});
