import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MeterReadingUploadManager, MeterReadingUploadManagerConfig } from './meter-reading-upload-manager.js';
import { MeterReadingEntity, SyncDatabase } from '../types/entities.js';
import { cacheManager } from '../cache/cache-manager.js';

const mockTenant = {
  tenant_id: 1,
  name: 'Test Tenant',
  api_key: 'test-api-key',
  upload_batch_size: 100,
};

class MockSyncDatabaseForTask6 implements Partial<SyncDatabase> {
  private readings: MeterReadingEntity[] = [];
  private deletedReadingIds: string[] = [];
  private incrementedRetryIds: number[] = [];

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
    this.incrementedRetryIds.push(...readingIds.map(id => Number(id)));
  }

  async deleteSynchronizedReadings(readingIds: string[]) {
    this.deletedReadingIds.push(...readingIds);
    this.readings = this.readings.filter(r => !readingIds.includes(r.meter_reading_id as any));
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

class MockClientSystemApiClientForTask6 {
  private apiKey: string = '';
  private uploadedBatches: any[] = [];
  private shouldThrowError: boolean = false;
  private errorToThrow: Error | null = null;
  private connectionStatus: boolean = true;

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  getApiKey() {
    return this.apiKey;
  }

  getUploadedBatches() {
    return this.uploadedBatches;
  }

  setShouldThrowError(shouldThrow: boolean, error?: Error) {
    this.shouldThrowError = shouldThrow;
    this.errorToThrow = error || new Error('Client System unreachable');
  }

  setConnectionStatus(connected: boolean) {
    this.connectionStatus = connected;
  }

  async uploadBatch(readings: MeterReadingEntity[]) {
    if (this.shouldThrowError) {
      throw this.errorToThrow;
    }
    
    this.uploadedBatches.push([...readings]);
    return { success: true, recordsProcessed: readings.length };
  }

  async testConnection() {
    return this.connectionStatus;
  }
}

describe('Task 6: Connection Failure Handling', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabaseForTask6;
  let mockApiClient: MockClientSystemApiClientForTask6;

  beforeEach(() => {
    process.env.METER_READING_VALIDATION_BEFORE_UPLOAD = 'false';
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
    mockDatabase = new MockSyncDatabaseForTask6();
    mockApiClient = new MockClientSystemApiClientForTask6();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    delete process.env.METER_READING_VALIDATION_BEFORE_UPLOAD;
    vi.restoreAllMocks();
  });

  describe('Task 6.1: Connection errors are caught and handled', () => {
    it('should catch connection errors and log them', async () => {
      const readings: any[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: i + 1,
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
      mockApiClient.setShouldThrowError(true, new Error('Client System unreachable'));

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        maxRetries: 0,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      const status = uploadManager.getStatus();
      expect(status.lastUploadSuccess).toBe(false);
      expect(status.lastUploadError).toBeDefined();
    });

    it('should keep batch readings in sync database on connection error', async () => {
      const readings: any[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: i + 1,
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
      mockApiClient.setShouldThrowError(true, new Error('Client System unreachable'));

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        maxRetries: 0,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      const deletedIds = mockDatabase.getDeletedReadingIds();
      expect(deletedIds.length).toBe(0);
    });
  });

  describe('Task 6.2: Connectivity monitoring detects outages', () => {
    it('should detect when API is unreachable', async () => {
      mockApiClient.setConnectionStatus(false);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        connectivityCheckIntervalMs: 100,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      await new Promise(resolve => setTimeout(resolve, 200));

      const status = uploadManager.getStatus();
      expect(status.isClientConnected).toBe(false);
    });

    it('should detect when API is reachable', async () => {
      mockApiClient.setConnectionStatus(true);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        connectivityCheckIntervalMs: 100,
        enableAutoUpload: false,
        maxRetries: 0,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      await new Promise(resolve => setTimeout(resolve, 200));

      // Trigger upload to force connectivity status refresh
      await uploadManager.triggerUpload();

      const status = uploadManager.getStatus();
      expect(status.isClientConnected).toBe(true);
    });
  });

  describe('Task 6.3: Automatic resume on connectivity restoration', () => {
    it('should detect when API becomes reachable again', async () => {
      mockApiClient.setConnectionStatus(false);

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        connectivityCheckIntervalMs: 100,
        enableAutoUpload: false,
        maxRetries: 0,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();

      await new Promise(resolve => setTimeout(resolve, 200));

      let status = uploadManager.getStatus();
      expect(status.isClientConnected).toBe(false);

      mockApiClient.setConnectionStatus(true);

      await new Promise(resolve => setTimeout(resolve, 200));

      status = uploadManager.getStatus();
      expect(status.isClientConnected).toBe(true);
    });
  });

  describe('Task 6.4: Retry count incremented for failed batches', () => {
    it('should increment retry count when batch fails', async () => {
      const readings: any[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: i + 1,
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
      mockApiClient.setShouldThrowError(true, new Error('Client System unreachable'));

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        maxRetries: 0,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      const incrementedIds = mockDatabase.getIncrementedRetryIds();
      expect(incrementedIds.length).toBeGreaterThan(0);
    });

    it('should preserve readings in database when retry count is incremented', async () => {
      const readings: any[] = Array.from({ length: 50 }, (_, i) => ({
        meter_reading_id: i + 1,
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
      mockApiClient.setShouldThrowError(true, new Error('Client System unreachable'));

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 50,
        maxRetries: 0,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      await uploadManager.triggerUpload();

      const deletedIds = mockDatabase.getDeletedReadingIds();
      expect(deletedIds.length).toBe(0);

      const incrementedIds = mockDatabase.getIncrementedRetryIds();
      expect(incrementedIds.length).toBeGreaterThan(0);
    });
  });
});
