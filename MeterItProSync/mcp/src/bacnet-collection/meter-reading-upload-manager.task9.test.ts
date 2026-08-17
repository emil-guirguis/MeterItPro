/**
 * Tests for MeterReadingUploadManager upload status and metrics tracking
 * 
 * Verifies:
 * - Task 9.1: Upload status is tracked correctly
 * - Task 9.2: Queue size is calculated correctly
 * - Task 9.3: Total counters are incremented correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MeterReadingUploadManager, MeterReadingUploadManagerConfig, UploadStatus } from './meter-reading-upload-manager.js';
import { ClientSystemApiClient } from '../api/client-system-api.js';
import { SyncDatabase, MeterReadingEntity } from '../types/entities.js';
import { cacheManager } from '../cache/cache-manager.js';

const mockTenant = {
  tenant_id: 1,
  name: 'Test Tenant',
  api_key: 'test-api-key',
  upload_batch_size: 100,
};

// Mock implementations
class MockSyncDatabase implements Partial<SyncDatabase> {
  private unsynchronizedReadings: MeterReadingEntity[] = [];

  setUnsynchronizedReadings(readings: MeterReadingEntity[]) {
    this.unsynchronizedReadings = readings;
  }

  async getUnsynchronizedReadings(limit: number = 1000): Promise<MeterReadingEntity[]> {
    return this.unsynchronizedReadings.slice(0, limit);
  }

  async incrementRetryCount(): Promise<void> {
    // Mock implementation
  }

  async deleteSynchronizedReadings(readingIds: string[]): Promise<number> {
    return readingIds.length;
  }

  async markReadingsAsSynchronized(readingIds: any[], tenantId?: number): Promise<number> {
    this.unsynchronizedReadings = this.unsynchronizedReadings.filter(r => !readingIds.includes(r.meter_reading_id));
    return readingIds.length;
  }

  async logSyncOperation(): Promise<void> {
    // Mock implementation
  }

  async getSyncStats(): Promise<any> {
    return {};
  }
}

class MockClientSystemApiClient implements Partial<ClientSystemApiClient> {
  private apiKey: string = '';
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

  async uploadBatch() {
    if (this.shouldFail) {
      return { success: false, recordsProcessed: 0, message: 'Upload failed' };
    }
    return { success: true, recordsProcessed: 0 };
  }

  async testConnection() {
    return true;
  }
}

describe('MeterReadingUploadManager - Task 9: Upload Status and Metrics Tracking', () => {
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

  describe('Task 9.1: Upload Status Tracking', () => {
    it('should initialize with correct status structure', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
      };

      uploadManager = new MeterReadingUploadManager(config);
      const status = uploadManager.getStatus();

      // Verify all required status fields exist
      expect(status).toHaveProperty('isRunning');
      expect(status.lastUploadTime).toBeUndefined();
      expect(status.lastUploadSuccess).toBeUndefined();
      expect(status.lastUploadError).toBeUndefined();
      expect(status).toHaveProperty('queueSize');
      expect(status).toHaveProperty('totalUploaded');
      expect(status).toHaveProperty('totalFailed');
      expect(status).toHaveProperty('isClientConnected');
    });

    it('should initialize with correct default values', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
      };

      uploadManager = new MeterReadingUploadManager(config);
      const status = uploadManager.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.lastUploadTime).toBeUndefined();
      expect(status.lastUploadSuccess).toBeUndefined();
      expect(status.lastUploadError).toBeUndefined();
      expect(status.queueSize).toBe(0);
      expect(status.totalUploaded).toBe(0);
      expect(status.totalFailed).toBe(0);
      expect(status.isClientConnected).toBe(false);
    });

    it('should update lastUploadTime after upload', async () => {
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Test Reading',
          timestamp: new Date(),
          data_point: 'field1',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
        maxRetries: 0,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      const timeBefore = new Date();

      await uploadManager.triggerUpload();

      const status = uploadManager.getStatus();
      expect(status.lastUploadTime).toBeDefined();
      expect(status.lastUploadTime!.getTime()).toBeGreaterThanOrEqual(timeBefore.getTime());
    });

    it('should set lastUploadSuccess to true on successful upload', async () => {
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Test Reading',
          timestamp: new Date(),
          data_point: 'field1',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
        maxRetries: 0,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      const status = uploadManager.getStatus();
      expect(status.lastUploadSuccess).toBe(true);
    });

    it('should set lastUploadSuccess to false on failed upload', async () => {
      mockApiClient.setShouldFail(true);
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Test Reading',
          timestamp: new Date(),
          data_point: 'field1',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
        maxRetries: 0,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      const status = uploadManager.getStatus();
      expect(status.lastUploadSuccess).toBe(false);
    });

    it('should set lastUploadError on failed upload', async () => {
      mockApiClient.setShouldFail(true);
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Test Reading',
          timestamp: new Date(),
          data_point: 'field1',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
        maxRetries: 0,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      const status = uploadManager.getStatus();
      expect(status.lastUploadError).toBeDefined();
      expect(typeof status.lastUploadError).toBe('string');
    });

    it('should clear lastUploadError on successful upload', async () => {
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Test Reading',
          timestamp: new Date(),
          data_point: 'field1',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
        maxRetries: 0,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      const status = uploadManager.getStatus();
      expect(status.lastUploadError).toBeUndefined();
    });
  });

  describe('Task 9.2: Queue Size Calculation', () => {
    it('should reflect zero when no unsynchronized readings exist', () => {
      mockDatabase.setUnsynchronizedReadings([]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
      };

      uploadManager = new MeterReadingUploadManager(config);
      const status = uploadManager.getStatus();

      expect(status.queueSize).toBe(0);
    });

    it('should reflect count of unsynchronized readings after upload', async () => {
      const readings: MeterReadingEntity[] = [
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Reading 1',
          timestamp: new Date(),
          data_point: 'field1',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-2',
          meter_id: 2,
          name: 'Reading 2',
          timestamp: new Date(),
          data_point: 'field2',
          value: 200,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-3',
          meter_id: 3,
          name: 'Reading 3',
          timestamp: new Date(),
          data_point: 'field3',
          value: 300,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ];

      mockDatabase.setUnsynchronizedReadings(readings);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      const status = uploadManager.getStatus();
      expect(status.queueSize).toBe(3);
    });

    it('should be updated after each upload', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      // First upload with 1 reading
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Reading 1',
          timestamp: new Date(),
          data_point: 'field1',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      await uploadManager.triggerUpload();
      let status = uploadManager.getStatus();
      expect(status.queueSize).toBe(1);
      expect(status.totalUploaded).toBe(1);

      // Second upload with 2 readings
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-2',
          meter_id: 1,
          name: 'Reading 2',
          timestamp: new Date(),
          data_point: 'field1',
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
          timestamp: new Date(),
          data_point: 'field1',
          value: 300,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);
      await uploadManager.triggerUpload();

      status = uploadManager.getStatus();
      expect(status.queueSize).toBe(2);
      expect(status.totalUploaded).toBe(3);
    });
  });

  describe('Task 9.3: Total Counters', () => {
    it('should start totalUploaded at zero', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
      };

      uploadManager = new MeterReadingUploadManager(config);
      const status = uploadManager.getStatus();

      expect(status.totalUploaded).toBe(0);
    });

    it('should increment totalUploaded on successful upload', async () => {
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Reading 1',
          timestamp: new Date(),
          data_point: 'field1',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      let status = uploadManager.getStatus();
      expect(status.totalUploaded).toBe(0);

      await uploadManager.triggerUpload();

      status = uploadManager.getStatus();
      expect(status.totalUploaded).toBe(1);
    });

    it('should accumulate totalUploaded across multiple uploads', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      // First upload with 2 readings
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Reading 1',
          timestamp: new Date(),
          data_point: 'field1',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-2',
          meter_id: 2,
          name: 'Reading 2',
          timestamp: new Date(),
          data_point: 'field2',
          value: 200,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      await uploadManager.triggerUpload();
      let status = uploadManager.getStatus();
      expect(status.totalUploaded).toBe(2);

      // Second upload with 3 readings
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-3',
          meter_id: 3,
          name: 'Reading 3',
          timestamp: new Date(),
          data_point: 'field3',
          value: 300,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-4',
          meter_id: 4,
          name: 'Reading 4',
          timestamp: new Date(),
          data_point: 'field4',
          value: 400,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-5',
          meter_id: 5,
          name: 'Reading 5',
          timestamp: new Date(),
          data_point: 'field5',
          value: 500,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      await uploadManager.triggerUpload();
      status = uploadManager.getStatus();
      expect(status.totalUploaded).toBe(5);
    });

    it('should not increment totalUploaded on failed upload', async () => {
      mockApiClient.setShouldFail(true);
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Reading 1',
          timestamp: new Date(),
          data_point: 'field1',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
        maxRetries: 0,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      let status = uploadManager.getStatus();
      expect(status.totalUploaded).toBe(0);

      await uploadManager.triggerUpload();

      status = uploadManager.getStatus();
      expect(status.totalUploaded).toBe(0);
    });

    it('should start totalFailed at zero', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
      };

      uploadManager = new MeterReadingUploadManager(config);
      const status = uploadManager.getStatus();

      expect(status.totalFailed).toBe(0);
    });

    it('should increment totalFailed on failed upload', async () => {
      mockApiClient.setShouldFail(true);
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Reading 1',
          timestamp: new Date(),
          data_point: 'field1',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
        maxRetries: 0,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      let status = uploadManager.getStatus();
      expect(status.totalFailed).toBe(0);

      await uploadManager.triggerUpload();

      status = uploadManager.getStatus();
      expect(status.totalFailed).toBe(1);
    });

    it('should accumulate totalFailed across multiple failed uploads', async () => {
      mockApiClient.setShouldFail(true);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
        maxRetries: 0,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      // First failed upload with 2 readings
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Reading 1',
          timestamp: new Date(),
          data_point: 'field1',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-2',
          meter_id: 2,
          name: 'Reading 2',
          timestamp: new Date(),
          data_point: 'field2',
          value: 200,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      await uploadManager.triggerUpload();
      let status = uploadManager.getStatus();
      expect(status.totalFailed).toBe(2);

      // Second failed upload with 3 readings
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-3',
          meter_id: 3,
          name: 'Reading 3',
          timestamp: new Date(),
          data_point: 'field3',
          value: 300,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-4',
          meter_id: 4,
          name: 'Reading 4',
          timestamp: new Date(),
          data_point: 'field4',
          value: 400,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-5',
          meter_id: 5,
          name: 'Reading 5',
          timestamp: new Date(),
          data_point: 'field5',
          value: 500,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      await uploadManager.triggerUpload();
      status = uploadManager.getStatus();
      expect(status.totalFailed).toBe(5);
    });

    it('should not increment totalFailed on successful upload', async () => {
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Reading 1',
          timestamp: new Date(),
          data_point: 'field1',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      let status = uploadManager.getStatus();
      expect(status.totalFailed).toBe(0);

      await uploadManager.triggerUpload();

      status = uploadManager.getStatus();
      expect(status.totalFailed).toBe(0);
    });

    it('should maintain accurate counters with mixed success and failure', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
        maxRetries: 0,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      // First upload: success with 2 readings
      mockApiClient.setShouldFail(false);
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-1',
          meter_id: 1,
          name: 'Reading 1',
          timestamp: new Date(),
          data_point: 'field1',
          value: 100,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-2',
          meter_id: 2,
          name: 'Reading 2',
          timestamp: new Date(),
          data_point: 'field2',
          value: 200,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      await uploadManager.triggerUpload();
      let status = uploadManager.getStatus();
      expect(status.totalUploaded).toBe(2);
      expect(status.totalFailed).toBe(0);

      // Second upload: failure with 3 readings
      mockApiClient.setShouldFail(true);
      mockDatabase.setUnsynchronizedReadings([
        {
          meter_reading_id: 'uuid-3',
          meter_id: 3,
          name: 'Reading 3',
          timestamp: new Date(),
          data_point: 'field3',
          value: 300,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-4',
          meter_id: 4,
          name: 'Reading 4',
          timestamp: new Date(),
          data_point: 'field4',
          value: 400,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
        {
          meter_reading_id: 'uuid-5',
          meter_id: 5,
          name: 'Reading 5',
          timestamp: new Date(),
          data_point: 'field5',
          value: 500,
          unit: 'kWh',
          is_synchronized: false,
          retry_count: 0,
          created_at: new Date(),
        },
      ]);

      await uploadManager.triggerUpload();
      status = uploadManager.getStatus();
      expect(status.totalUploaded).toBe(2);
      expect(status.totalFailed).toBe(3);
    });
  });
});
