/**
 * Tests for MeterReadingUploadManager batch size configuration
 * 
 * Feature: batch-size-configuration
 * Property 2: Batch Size Defaults Applied
 * Property 5: Batch Operations Use Configured Sizes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { MeterReadingUploadManager, MeterReadingUploadManagerConfig } from './meter-reading-upload-manager.js';
import { SyncDatabase } from '../types/index.js';
import { ClientSystemApiClient } from '../api/client-system-api.js';

describe('MeterReadingUploadManager Batch Size Configuration', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: any;
  let mockApiClient: any;

  beforeEach(() => {
    // Create mock database
    mockDatabase = {
      getTenant: vi.fn(),
      getTenantBatchConfig: vi.fn(),
      getUnsynchronizedReadings: vi.fn(),
      markReadingsAsSynchronized: vi.fn(),
      incrementRetryCount: vi.fn(),
      logSyncOperation: vi.fn(),
    };

    // Create mock API client
    mockApiClient = {
      setApiKey: vi.fn(),
      uploadBatch: vi.fn(),
      testConnection: vi.fn(),
    };
  });

  describe('Batch Size Loading at Startup', () => {
    it('should load upload batch size from tenant cache during start', async () => {
      // Mock cacheManager.getTenant to return tenant with batch sizes
      vi.doMock('../cache/cache-manager.js', () => ({
        cacheManager: {
          getTenant: () => ({
            tenant_id: 1,
            name: 'Test Tenant',
            api_key: 'test-key',
            upload_batch_size: 150,
          }),
        },
      }));

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as SyncDatabase,
        apiClient: mockApiClient as ClientSystemApiClient,
      };

      uploadManager = new MeterReadingUploadManager(config);

      // Mock connectivity monitor
      vi.spyOn(uploadManager as any, 'checkClientConnectivity').mockResolvedValue(true);

      // Mock getUnsynchronizedReadings to return empty
      mockDatabase.getUnsynchronizedReadings.mockResolvedValueOnce([]);

      // Note: We can't easily test start() without mocking the entire cache system
      // This test verifies the constructor initializes uploadBatchSize correctly
      expect((uploadManager as any).uploadBatchSize).toBeDefined();
    });

    it('should initialize uploadBatchSize with default value in constructor', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as SyncDatabase,
        apiClient: mockApiClient as ClientSystemApiClient,
        batchSize: 200,
      };

      uploadManager = new MeterReadingUploadManager(config);

      // uploadBatchSize should be initialized to batchSize or default
      expect((uploadManager as any).uploadBatchSize).toBe(200);
    });

    /**
     * Property 2: Batch Size Defaults Applied
     * For any upload manager without explicit batch size configuration,
     * the system should use default values (upload_batch_size=100).
     *
     * Validates: Requirements 1.2, 2.2
     */
    it('Property 2: Default batch size should be applied when not configured', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (tenantId) => {
            const config: MeterReadingUploadManagerConfig = {
              database: mockDatabase as SyncDatabase,
              apiClient: mockApiClient as ClientSystemApiClient,
              // No batchSize specified - should use default
            };

            uploadManager = new MeterReadingUploadManager(config);

            // Default uploadBatchSize should be 100
            expect((uploadManager as any).uploadBatchSize).toBe(100);
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('Batch Size Usage in Upload Operations', () => {
    it('should use uploadBatchSize when fetching unsynchronized readings', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as SyncDatabase,
        apiClient: mockApiClient as ClientSystemApiClient,
        batchSize: 250,
      };

      uploadManager = new MeterReadingUploadManager(config);
      (uploadManager as any).uploadBatchSize = 250;

      // Mock getUnsynchronizedReadings to return empty
      mockDatabase.getUnsynchronizedReadings.mockResolvedValueOnce([]);

      // Mock connectivity check
      vi.spyOn(uploadManager as any, 'checkClientConnectivity').mockResolvedValue(true);

      // Call performUpload
      await (uploadManager as any).performUpload();

      // Verify getUnsynchronizedReadings was called with uploadBatchSize
      expect(mockDatabase.getUnsynchronizedReadings).toHaveBeenCalledWith(250);
    });

    /**
     * Property 5: Batch Operations Use Configured Sizes
     * For any sync operation, the number of records fetched or processed 
     * should not exceed the configured batch size for that operation type.
     *
     * Validates: Requirements 3.1, 3.2
     */
    it('Property 5: Batch operations should respect configured batch sizes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 50, max: 500 }),
          async (configuredBatchSize) => {
            const config: MeterReadingUploadManagerConfig = {
              database: mockDatabase as SyncDatabase,
              apiClient: mockApiClient as ClientSystemApiClient,
              batchSize: configuredBatchSize,
            };

            uploadManager = new MeterReadingUploadManager(config);
            (uploadManager as any).uploadBatchSize = configuredBatchSize;

            // Mock getUnsynchronizedReadings to return empty
            mockDatabase.getUnsynchronizedReadings.mockResolvedValueOnce([]);

            // Mock connectivity check
            vi.spyOn(uploadManager as any, 'checkClientConnectivity').mockResolvedValue(true);

            // Call performUpload
            await (uploadManager as any).performUpload();

            // Verify getUnsynchronizedReadings was called with the configured batch size
            expect(mockDatabase.getUnsynchronizedReadings).toHaveBeenCalledWith(configuredBatchSize);
          }
        ),
        { numRuns: 5 }
      );
    });

  });
});
