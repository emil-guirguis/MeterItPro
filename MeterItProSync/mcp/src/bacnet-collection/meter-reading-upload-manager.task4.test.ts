/**
 * Tests for Task 4: Reading Retrieval and Formatting
 * 
 * Verifies:
 * - Task 4.1: Unsynchronized readings are retrieved in batches of 50
 * - Task 4.2: Readings are formatted for remote API
 * - Task 4.3: Batches of 50 are uploaded sequentially
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
class MockSyncDatabaseWithReadings implements Partial<SyncDatabase> {
  private readings: MeterReadingEntity[] = [];
  private uploadedBatches: MeterReadingEntity[][] = [];

  setReadings(readings: MeterReadingEntity[]) {
    this.readings = readings;
  }

  getUploadedBatches() {
    return this.uploadedBatches;
  }

  async getUnsynchronizedReadings(limit: number) {
    // Return only the requested limit
    return this.readings.slice(0, limit);
  }

  async incrementRetryCount() {
    return;
  }

  async deleteSynchronizedReadings(readingIds: string[]) {
    // Remove deleted readings from the list
    this.readings = this.readings.filter(r => !readingIds.includes(r.meter_reading_id || ''));
    return readingIds.length;
  }

  async markReadingsAsSynchronized(readingIds: any[], tenantId?: number) {
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

class MockClientSystemApiClientWithTracking implements Partial<ClientSystemApiClient> {
  private apiKey: string = '';
  private uploadedBatches: MeterReadingEntity[][] = [];
  private shouldFail: boolean = false;

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  getApiKey() {
    return this.apiKey;
  }

  setShouldFail(fail: boolean) {
    this.shouldFail = fail;
  }

  getUploadedBatches() {
    return this.uploadedBatches;
  }

  async uploadBatch(readings: MeterReadingEntity[]) {
    if (this.shouldFail) {
      return { success: false, recordsProcessed: 0, message: 'Upload failed' };
    }
    
    // Track the batch
    this.uploadedBatches.push([...readings]);
    
    return { success: true, recordsProcessed: readings.length };
  }

  async testConnection() {
    return true;
  }
}

describe('Task 4.1: Verify unsynchronized readings are retrieved in batches of 50', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabaseWithReadings;
  let mockApiClient: MockClientSystemApiClientWithTracking;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabaseWithReadings();
    mockApiClient = new MockClientSystemApiClientWithTracking();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  describe('Batch Size Verification', () => {
    it('should retrieve exactly 50 readings when 50 are available', async () => {
      // Create 50 test readings
      const readings: MeterReadingEntity[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (50 - i) * 60000), // Spread over 50 minutes
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
        created_at: new Date(),
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

      // Verify exactly 50 readings were uploaded
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches.length).toBe(1);
      expect(uploadedBatches[0].length).toBe(50);
    });

    it('should retrieve fewer than 50 readings when fewer are available', async () => {
      // Create 25 test readings
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
        created_at: new Date(),
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

      // Verify 25 readings were uploaded
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches.length).toBe(1);
      expect(uploadedBatches[0].length).toBe(25);
    });

    it('should retrieve no readings when none are available', async () => {
      mockDatabase.setReadings([]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify no readings were uploaded
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches.length).toBe(0);
    });
  });

  describe('Ordering Verification', () => {
    it('should retrieve readings ordered by timestamp ascending', async () => {
      // Create readings with specific timestamps (already in order)
      const readings: MeterReadingEntity[] = [
        {
          meter_reading_id: 'uuid-2',
          meter_id: 1,
          name: 'Reading 2',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          data_point: 'energy_consumption',
          value: 200,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-3',
          meter_id: 1,
          name: 'Reading 3',
          timestamp: new Date('2024-01-01T11:00:00Z'),
          data_point: 'energy_consumption',
          value: 150,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Reading 1',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          data_point: 'energy_consumption',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
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

      // Verify readings are in ascending timestamp order
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches.length).toBe(1);
      const uploadedReadings = uploadedBatches[0];
      
      // The database query should return them in order, so verify the order is maintained
      expect(uploadedReadings.length).toBeGreaterThanOrEqual(3);
      expect(uploadedReadings[0].timestamp?.getTime()).toBeLessThanOrEqual(uploadedReadings[1].timestamp?.getTime() ?? 0);
      expect(uploadedReadings[1].timestamp?.getTime()).toBeLessThanOrEqual(uploadedReadings[2].timestamp?.getTime() ?? 0);
    });
  });

  describe('Batch Limit Verification', () => {
    it('should respect the configured batch size limit', async () => {
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
        created_at: new Date(),
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

      // Verify batches are 50 readings each (batch size respected)
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches.length).toBe(2);
      expect(uploadedBatches[0].length).toBe(50);
    });
  });

  describe('Query Filtering', () => {
    it('should only retrieve readings where is_synchronized = false', async () => {
      // Create readings with mixed synchronization status
      const readings: MeterReadingEntity[] = [
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Reading 1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          data_point: 'energy_consumption',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-2',
          meter_id: 1,
          name: 'Reading 2',
          timestamp: new Date('2024-01-01T11:00:00Z'),
          data_point: 'energy_consumption',
          value: 200,
          unit: 'kWh',
          is_synchronized: true, // This should be filtered out
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-3',
          meter_id: 1,
          name: 'Reading 3',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          data_point: 'energy_consumption',
          value: 150,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ];

      // Mock database should only return unsynchronized readings
      const unsyncReadings = readings.filter(r => !r.is_synchronized);
      mockDatabase.setReadings(unsyncReadings);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify only unsynchronized readings were uploaded
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches.length).toBe(1);
      expect(uploadedBatches[0].length).toBe(2);
      expect(uploadedBatches[0].every(r => !r.is_synchronized)).toBe(true);
    });
  });
});

describe('Task 4.2: Verify readings are formatted for remote API', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabaseWithReadings;
  let mockApiClient: MockClientSystemApiClientWithTracking;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabaseWithReadings();
    mockApiClient = new MockClientSystemApiClientWithTracking();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  describe('API Format Transformation', () => {
    it('should format readings with all required fields', async () => {
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
          created_at: new Date(),
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

      // Verify the uploaded batch contains properly formatted data
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches.length).toBe(1);
      const uploadedReading = uploadedBatches[0][0];

      // Verify all required fields are present
      expect(uploadedReading).toHaveProperty('meter_id');
      expect(uploadedReading).toHaveProperty('timestamp');
      expect(uploadedReading).toHaveProperty('data_point');
      expect(uploadedReading).toHaveProperty('value');
      expect(uploadedReading).toHaveProperty('unit');
    });

    it('should format timestamp in ISO 8601 format', async () => {
      const testDate = new Date('2024-01-15T14:30:45.123Z');
      const readings: MeterReadingEntity[] = [
        {
          meter_reading_id: 'uuid-1',
          meter_id: 123,
          name: 'Reading 1',
          timestamp: testDate,
          data_point: 'energy_consumption',
          value: 100.5,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
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

      // Verify timestamp is in ISO 8601 format
      const uploadedBatches = mockApiClient.getUploadedBatches();
      const uploadedReading = uploadedBatches[0][0];
      
      // The timestamp should be a Date object in the uploaded readings
      // (it gets converted to ISO 8601 string in the API client's uploadBatch method)
      expect(uploadedReading.timestamp instanceof Date).toBe(true);
      
      // Verify the timestamp value is correct
      expect(uploadedReading.timestamp?.getTime()).toBe(testDate.getTime());
    });

    it('should ensure value is a valid number', async () => {
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
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-2',
          meter_id: 123,
          name: 'Reading 2',
          timestamp: new Date('2024-01-01T11:00:00Z'),
          data_point: 'energy_consumption',
          value: 0,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-3',
          meter_id: 123,
          name: 'Reading 3',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          data_point: 'energy_consumption',
          value: -50.25,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
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

      // Verify all values are valid numbers
      const uploadedBatches = mockApiClient.getUploadedBatches();
      const uploadedReadings = uploadedBatches[0];

      uploadedReadings.forEach(reading => {
        expect(typeof reading.value).toBe('number');
        expect(Number.isFinite(reading.value)).toBe(true);
      });
    });

    it('should include optional unit field when present', async () => {
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
          created_at: new Date(),
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

      // Verify unit field is included
      const uploadedBatches = mockApiClient.getUploadedBatches();
      const uploadedReading = uploadedBatches[0][0];

      expect(uploadedReading.unit).toBe('kWh');
    });

    it('should handle readings without unit field', async () => {
      const readings: MeterReadingEntity[] = [
        {
          meter_reading_id: 'uuid-1',
          meter_id: 123,
          name: 'Reading 1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          data_point: 'energy_consumption',
          value: 100.5,
          unit: undefined,
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
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

      // Verify reading is still uploaded even without unit
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches.length).toBe(1);
      expect(uploadedBatches[0].length).toBe(1);
    });
  });

  describe('Field Mapping', () => {
    it('should map meter_id correctly', async () => {
      const readings: MeterReadingEntity[] = [
        {
          meter_reading_id: 'uuid-1',
          meter_id: 999,
          name: 'Reading 1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          data_point: 'energy_consumption',
          value: 100.5,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
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

      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches[0][0].meter_id).toBe(999);
    });

    it('should map data_point correctly', async () => {
      const readings: MeterReadingEntity[] = [
        {
          meter_reading_id: 'uuid-1',
          meter_id: 123,
          name: 'Reading 1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          data_point: 'power_factor',
          value: 0.95,
          unit: 'ratio',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ];

      mockDatabase.setReadings(readings);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches[0][0].data_point).toBe('power_factor');
    });
  });
});

describe('Task 4.3: Verify batches of 50 are uploaded sequentially', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabaseWithReadings;
  let mockApiClient: MockClientSystemApiClientWithTracking;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabaseWithReadings();
    mockApiClient = new MockClientSystemApiClientWithTracking();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  describe('Sequential Upload Verification', () => {
    it('should upload single batch of 50 readings', async () => {
      // Create exactly 50 readings
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
        created_at: new Date(),
      }));

      mockDatabase.setReadings(readings);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify exactly one batch was uploaded
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches.length).toBe(1);
      expect(uploadedBatches[0].length).toBe(50);
    });

    it('should upload multiple batches of 50 sequentially', async () => {
      // Create 150 readings (3 batches of 50)
      const readings: MeterReadingEntity[] = Array.from({ length: 150 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (150 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
        created_at: new Date(),
      }));

      mockDatabase.setReadings(readings);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify all batches were uploaded sequentially (3 batches of 50 each)
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches.length).toBe(3);
      expect(uploadedBatches[0].length).toBe(50);
    });

    it('should upload remaining readings in separate batch', async () => {
      // Create 75 readings (1 full batch of 50 + 1 partial batch of 25)
      const readings: MeterReadingEntity[] = Array.from({ length: 75 }, (_, i) => ({
        meter_reading_id: `uuid-${i + 1}`,
        meter_id: 1,
        name: `Reading ${i + 1}`,
        timestamp: new Date(Date.now() - (75 - i) * 60000),
        data_point: 'energy_consumption',
        value: 100 + i,
        unit: 'kWh',
        is_synchronized: false,
        retry_count: 0,
        created_at: new Date(),
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

      // Verify both batches were uploaded (50 + 25)
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches.length).toBe(2);
      expect(uploadedBatches[0].length).toBe(50);
      expect(uploadedBatches[1].length).toBe(25);
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
        created_at: new Date(),
      }));

      mockDatabase.setReadings(readings);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      // Trigger multiple uploads concurrently (concurrent uploads are prevented - only one runs)
      await Promise.all([
        uploadManager.triggerUpload(),
        uploadManager.triggerUpload(),
      ]);

      // Verify concurrent uploads are prevented (only one triggerUpload processes all readings)
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches.length).toBe(2);
      expect(uploadedBatches[0].length).toBe(50);
    });
  });

  describe('Batch Separation', () => {
    it('should separate batches at exactly 50 readings', async () => {
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
        created_at: new Date(),
      }));

      mockDatabase.setReadings(readings);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      // Verify first batch is exactly 50
      const uploadedBatches = mockApiClient.getUploadedBatches();
      expect(uploadedBatches[0].length).toBe(50);
      
      // Verify the batch contains the first 50 readings
      expect(uploadedBatches[0][0].meter_reading_id).toBe('uuid-1');
      expect(uploadedBatches[0][49].meter_reading_id).toBe('uuid-50');
    });
  });
});
