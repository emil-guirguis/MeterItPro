/**
 * Tests for SyncDatabase batch configuration methods
 * 
 * Feature: batch-size-configuration
 * Property 1: Batch Size Configuration Persistence
 * Property 2: Batch Size Defaults Applied
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { SyncDatabase } from './data-sync.js';
import { Pool } from 'pg';

describe('SyncDatabase Batch Configuration', () => {
  let db: SyncDatabase;
  let mockPool: any;

  // Setup before each test
  beforeEach(() => {
    // Create a mock pool
    mockPool = {
      query: vi.fn(),
      connect: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
    };

    // Create database instance with mock pool
    db = new SyncDatabase({
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'test',
      password: 'test',
    });

    // Replace the pool with our mock
    (db as any).pool = mockPool;
  });

  describe('getTenantBatchConfig', () => {
    it('should retrieve batch configuration for an existing tenant', async () => {
      // Mock the pool.query to return batch config
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            download_batch_size: 2000,
            upload_batch_size: 200,
          },
        ],
      });

      const config = await db.getTenantBatchConfig(999);

      expect(config.downloadBatchSize).toBe(2000);
      expect(config.uploadBatchSize).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT download_batch_size, upload_batch_size FROM tenant'),
        [999]
      );
    });

    it('should return default batch sizes when tenant is not found', async () => {
      // Mock the pool.query to return empty result
      mockPool.query.mockResolvedValueOnce({
        rows: [],
      });

      const config = await db.getTenantBatchConfig(99999);

      expect(config.downloadBatchSize).toBe(1000);
      expect(config.uploadBatchSize).toBe(100);
    });

    it('should return default batch sizes when columns do not exist', async () => {
      // Mock the pool.query to throw an error about missing column
      mockPool.query.mockRejectedValueOnce(
        new Error('column "download_batch_size" does not exist')
      );

      const config = await db.getTenantBatchConfig(1);

      expect(config.downloadBatchSize).toBe(1000);
      expect(config.uploadBatchSize).toBe(100);
    });

    /**
     * Property 1: Batch Size Configuration Persistence
     * For any tenant, when batch sizes are loaded from the database, 
     * they should match the values stored in the tenant table.
     * 
     * Validates: Requirements 1.1, 2.1
     */
    it('Property 1: Batch sizes should persist and be retrievable', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 100, max: 10000 }),
          fc.integer({ min: 10, max: 1000 }),
          async (downloadSize, uploadSize) => {
            // Mock the pool.query to return the specific batch sizes
            mockPool.query.mockResolvedValueOnce({
              rows: [
                {
                  download_batch_size: downloadSize,
                  upload_batch_size: uploadSize,
                },
              ],
            });

            const config = await db.getTenantBatchConfig(1);

            expect(config.downloadBatchSize).toBe(downloadSize);
            expect(config.uploadBatchSize).toBe(uploadSize);
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Property 2: Batch Size Defaults Applied
     * For any tenant without explicit batch size configuration, 
     * the system should use default values (download_batch_size=1000, upload_batch_size=100).
     * 
     * Validates: Requirements 1.2, 2.2
     */
    it('Property 2: Default batch sizes should be applied for missing tenants', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 50000, max: 60000 }),
          async (nonExistentTenantId) => {
            // Mock the pool.query to return empty result
            mockPool.query.mockResolvedValueOnce({
              rows: [],
            });

            const config = await db.getTenantBatchConfig(nonExistentTenantId);

            expect(config.downloadBatchSize).toBe(1000);
            expect(config.uploadBatchSize).toBe(100);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('markReadingsAsSynchronized', () => {
    it('should mark readings as synchronized with both flags updated', async () => {
      const readingIds = [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
      ];

      // Mock the pool.query to return 2 rows updated
      mockPool.query.mockResolvedValueOnce({
        rowCount: 2,
      });

      const updatedCount = await db.markReadingsAsSynchronized(readingIds);

      expect(updatedCount).toBe(2);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE meter_reading'),
        expect.arrayContaining([readingIds])
      );
    });

    it('should handle empty reading list gracefully', async () => {
      const updatedCount = await db.markReadingsAsSynchronized([]);
      expect(updatedCount).toBe(0);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('should support tenant filtering when tenantId is provided', async () => {
      const readingIds = ['550e8400-e29b-41d4-a716-446655440003'];

      // Mock the pool.query to return 1 row updated
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
      });

      const updatedCount = await db.markReadingsAsSynchronized(readingIds, 1);

      expect(updatedCount).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('tenant_id = $2'),
        expect.arrayContaining([readingIds, 1])
      );
    });

    /**
     * Property 3: Readings Marked as Synchronized After Upload
     * For any batch of readings successfully uploaded to the remote database, 
     * all readings in that batch should have is_synchronized=true and sync_status='synchronized'.
     * 
     * Validates: Requirements 6.1, 6.2
     */
    it('Property 3: All marked readings should have synchronized flags set', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
          async (readingIds) => {
            // Mock the pool.query to return the correct number of rows updated
            mockPool.query.mockResolvedValueOnce({
              rowCount: readingIds.length,
            });

            const updatedCount = await db.markReadingsAsSynchronized(readingIds);

            expect(updatedCount).toBe(readingIds.length);
            expect(mockPool.query).toHaveBeenCalledWith(
              expect.stringContaining('is_synchronized = true'),
              expect.arrayContaining([readingIds])
            );
          }
        ),
        { numRuns: 5 }
      );
    });

    /**
     * Property 4: Failed Uploads Do Not Update Sync Status
     * For any batch upload that fails, the is_synchronized flag should remain false 
     * for all readings in that batch.
     * 
     * Validates: Requirements 6.3
     */
    it('Property 4: Failed uploads should not update sync status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
          async (readingIds) => {
            // Mock the pool.query to return 0 rows updated (simulating failed update)
            mockPool.query.mockResolvedValueOnce({
              rowCount: 0,
            });

            const updatedCount = await db.markReadingsAsSynchronized(readingIds);

            // Should return 0 since no rows were updated
            expect(updatedCount).toBe(0);
          }
        ),
        { numRuns: 5 }
      );
    });
  });
});
