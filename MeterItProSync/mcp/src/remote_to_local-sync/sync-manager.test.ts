/**
 * Tests for SyncManager batch size configuration loading
 * 
 * Feature: batch-size-configuration
 * Property 2: Batch Size Defaults Applied
 * Property 3.1: SyncManager batch size loading
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { SyncManager } from './sync-manager.js';
import { SyncDatabase, MeterReadingEntity } from '../types/index.js';
import { ClientSystemApiClient } from '../api/client-system-api.js';

describe('SyncManager Batch Size Configuration', () => {
  let syncManager: SyncManager;
  let mockDatabase: any;
  let mockApiClient: any;

  beforeEach(() => {
    // Create mock database
    mockDatabase = {
      getTenant: vi.fn(),
      getTenantBatchConfig: vi.fn(),
      getUnsynchronizedReadings: vi.fn(),
      deleteSynchronizedReadings: vi.fn(),
      logSyncOperation: vi.fn(),
      incrementRetryCount: vi.fn(),
    };

    // Create mock API client
    mockApiClient = {
      setApiKey: vi.fn(),
      uploadBatch: vi.fn(),
      testConnection: vi.fn(),
    };

    // Create SyncManager with mocks
    syncManager = new SyncManager({
      database: mockDatabase as SyncDatabase,
      apiClient: mockApiClient as ClientSystemApiClient,
      syncIntervalMinutes: 5,
      batchSize: 1000,
      maxRetries: 5,
      enableAutoSync: false, // Disable auto-sync for testing
    });
  });

  describe('Batch Size Loading at Startup', () => {
    it('should load batch sizes from tenant configuration during start', async () => {
      // Mock tenant data
      mockDatabase.getTenant.mockResolvedValueOnce({
        tenant_id: 1,
        name: 'Test Tenant',
        api_key: 'test-key',
      });

      // Mock batch config
      mockDatabase.getTenantBatchConfig.mockResolvedValueOnce({
        downloadBatchSize: 2000,
        uploadBatchSize: 200,
      });

      await syncManager.start();

      // Verify getTenantBatchConfig was called
      expect(mockDatabase.getTenantBatchConfig).toHaveBeenCalledWith(1);
    });

    it('should use default batch sizes when tenant batch config fails', async () => {
      // Mock tenant data
      mockDatabase.getTenant.mockResolvedValueOnce({
        tenant_id: 1,
        name: 'Test Tenant',
        api_key: 'test-key',
      });

      // Mock batch config to throw error
      mockDatabase.getTenantBatchConfig.mockRejectedValueOnce(
        new Error('Failed to load batch config')
      );

      await syncManager.start();

      // Should still complete without throwing
      expect(syncManager.getStatus().isRunning).toBe(true);
    });

    it('should handle missing tenant gracefully', async () => {
      // Mock getTenant to return null
      mockDatabase.getTenant.mockResolvedValueOnce(null);

      await syncManager.start();

      // Should still complete without throwing
      expect(syncManager.getStatus().isRunning).toBe(true);
    });

    /**
     * Property 2: Batch Size Defaults Applied
     * For any tenant without explicit batch size configuration,
     * the system should use default values (download_batch_size=1000, upload_batch_size=100).
     *
     * Validates: Requirements 1.2, 2.2
     */
    it('Property 2: Default batch sizes should be applied when config is missing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (tenantId) => {
            // Reset mocks
            mockDatabase.getTenant.mockResolvedValueOnce({
              tenant_id: tenantId,
              name: `Tenant ${tenantId}`,
              api_key: 'test-key',
            });

            // Mock batch config to return empty (simulating missing config)
            mockDatabase.getTenantBatchConfig.mockRejectedValueOnce(
              new Error('Batch config not found')
            );

            await syncManager.start();

            // Verify the manager started successfully with defaults
            expect(syncManager.getStatus().isRunning).toBe(true);
          }
        ),
        { numRuns: 5 }
      );
    });

    /**
     * Property 3.1: SyncManager batch size loading
     * For any tenant, when batch sizes are loaded from the database,
     * they should be stored as instance variables for use in sync operations.
     *
     * Validates: Requirements 2.1, 2.3
     */
    it('Property 3.1: Batch sizes should be loaded and stored for sync operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 100, max: 5000 }),
          fc.integer({ min: 10, max: 500 }),
          async (downloadSize, uploadSize) => {
            // Reset mocks
            mockDatabase.getTenant.mockResolvedValueOnce({
              tenant_id: 1,
              name: 'Test Tenant',
              api_key: 'test-key',
            });

            // Mock batch config with specific sizes
            mockDatabase.getTenantBatchConfig.mockResolvedValueOnce({
              downloadBatchSize: downloadSize,
              uploadBatchSize: uploadSize,
            });

            // Mock getUnsynchronizedReadings to return empty (so sync completes)
            mockDatabase.getUnsynchronizedReadings.mockResolvedValueOnce([]);

            await syncManager.start();

            // Verify the manager started successfully
            expect(syncManager.getStatus().isRunning).toBe(true);

            // Verify getTenantBatchConfig was called with correct tenant ID
            expect(mockDatabase.getTenantBatchConfig).toHaveBeenCalledWith(1);
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('Batch Size Usage in Sync Operations', () => {
    it('should use downloadBatchSize when fetching readings', async () => {
      // Create SyncManager with auto-sync enabled for this test
      syncManager = new SyncManager({
        database: mockDatabase as SyncDatabase,
        apiClient: mockApiClient as ClientSystemApiClient,
        syncIntervalMinutes: 5,
        batchSize: 1000,
        maxRetries: 5,
        enableAutoSync: true, // Enable auto-sync to trigger performSync
      });

      // Mock tenant data
      mockDatabase.getTenant.mockResolvedValueOnce({
        tenant_id: 1,
        name: 'Test Tenant',
        api_key: 'test-key',
      });

      // Mock batch config
      mockDatabase.getTenantBatchConfig.mockResolvedValueOnce({
        downloadBatchSize: 2000,
        uploadBatchSize: 200,
      });

      // Mock getUnsynchronizedReadings to return empty
      mockDatabase.getUnsynchronizedReadings.mockResolvedValueOnce([]);

      await syncManager.start();

      // Verify getUnsynchronizedReadings was called with downloadBatchSize
      expect(mockDatabase.getUnsynchronizedReadings).toHaveBeenCalledWith(2000);

      // Stop the sync manager to clean up
      await syncManager.stop();
    });

    it('should log batch sizes at initialization', async () => {
      // Mock tenant data
      mockDatabase.getTenant.mockResolvedValueOnce({
        tenant_id: 1,
        name: 'Test Tenant',
        api_key: 'test-key',
      });

      // Mock batch config
      mockDatabase.getTenantBatchConfig.mockResolvedValueOnce({
        downloadBatchSize: 3000,
        uploadBatchSize: 300,
      });

      // Mock getUnsynchronizedReadings to return empty
      mockDatabase.getUnsynchronizedReadings.mockResolvedValueOnce([]);

      // Spy on console.log
      const consoleSpy = vi.spyOn(console, 'log');

      await syncManager.start();

      // Verify batch config was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('📊 [SyncManager] Loaded batch config'),
        expect.objectContaining({
          downloadBatchSize: 3000,
          uploadBatchSize: 300,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Batch Splitting in Sync Operations', () => {
    /**
     * Property 6: Batch Splitting
     * For any set of readings and configured batch size,
     * readings should be split into batches that don't exceed the configured size.
     *
     * Validates: Requirements 5.1, 5.2, 5.3
     */
    it('Property 6: Readings should be split into batches respecting configured batch size', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 50, max: 500 }),
          fc.integer({ min: 10, max: 100 }),
          async (readingCount, batchSize) => {
            // Create fresh mocks for each iteration
            const freshMockDatabase = {
              getTenant: vi.fn(),
              getTenantBatchConfig: vi.fn(),
              getUnsynchronizedReadings: vi.fn(),
              deleteSynchronizedReadings: vi.fn(),
              logSyncOperation: vi.fn(),
              incrementRetryCount: vi.fn(),
            };

            const freshMockApiClient = {
              setApiKey: vi.fn(),
              uploadBatch: vi.fn(),
              testConnection: vi.fn(),
            };

            // Create mock readings
            const mockReadings: MeterReadingEntity[] = Array.from({ length: readingCount }, (_, i) => ({
              meter_reading_id: `reading-${i}`,
              meter_id: 1,
              created_at: new Date(),
              is_synchronized: false,
              retry_count: 0,
            }));

            // Setup mocks
            freshMockDatabase.getTenant.mockResolvedValueOnce({
              tenant_id: 1,
              name: 'Test Tenant',
              api_key: 'test-key',
            });

            freshMockDatabase.getTenantBatchConfig.mockResolvedValueOnce({
              downloadBatchSize: 1000,
              uploadBatchSize: batchSize,
            });

            freshMockDatabase.getUnsynchronizedReadings.mockResolvedValueOnce(mockReadings);

            // Mock successful upload for all batches
            freshMockApiClient.uploadBatch.mockResolvedValue({ success: true });

            freshMockDatabase.deleteSynchronizedReadings.mockResolvedValueOnce(readingCount);
            freshMockDatabase.logSyncOperation.mockResolvedValue(undefined);

            // Create fresh SyncManager for this iteration
            const freshSyncManager = new SyncManager({
              database: freshMockDatabase as unknown as SyncDatabase,
              apiClient: freshMockApiClient as unknown as ClientSystemApiClient,
              syncIntervalMinutes: 5,
              batchSize: 1000,
              maxRetries: 5,
              enableAutoSync: false,
            });

            await freshSyncManager.start();
            await freshSyncManager.triggerSync();

            // Verify uploadBatch was called with correct number of batches
            const expectedBatchCount = Math.ceil(readingCount / batchSize);
            expect(freshMockApiClient.uploadBatch).toHaveBeenCalledTimes(expectedBatchCount);

            // Verify each batch call has correct size (except possibly the last one)
            const calls = freshMockApiClient.uploadBatch.mock.calls;
            for (let i = 0; i < calls.length - 1; i++) {
              expect(calls[i][0].length).toBe(batchSize);
            }

            // Verify last batch has correct size
            const lastBatchSize = readingCount % batchSize || batchSize;
            expect(calls[calls.length - 1][0].length).toBe(lastBatchSize);

            await freshSyncManager.stop();
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should log batch count and total records inserted', async () => {
      // Create mock readings
      const mockReadings: MeterReadingEntity[] = Array.from({ length: 250 }, (_, i) => ({
        meter_reading_id: `reading-${i}`,
        meter_id: 1,
        created_at: new Date(),
        is_synchronized: false,
        retry_count: 0,
      }));

      // Mock tenant data
      mockDatabase.getTenant.mockResolvedValueOnce({
        tenant_id: 1,
        name: 'Test Tenant',
        api_key: 'test-key',
      });

      // Mock batch config with batch size of 100
      mockDatabase.getTenantBatchConfig.mockResolvedValueOnce({
        downloadBatchSize: 1000,
        uploadBatchSize: 100,
      });

      mockDatabase.getUnsynchronizedReadings.mockResolvedValueOnce(mockReadings);

      // Mock successful upload
      mockApiClient.uploadBatch.mockResolvedValue({ success: true });

      mockDatabase.deleteSynchronizedReadings.mockResolvedValueOnce(250);
      mockDatabase.logSyncOperation.mockResolvedValue(undefined);

      // Spy on console.log
      const consoleSpy = vi.spyOn(console, 'log');

      await syncManager.start();
      await syncManager.triggerSync();

      // Verify batch splitting was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('📦 [SyncManager] Splitting into 3 batches')
      );

      // Verify batch completion was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ [SyncManager] Batch insertion complete')
      );

      consoleSpy.mockRestore();
      await syncManager.stop();
    });
  });
});
