import { describe, it, expect, beforeEach } from 'vitest';
import { ReadingBatcher } from './reading-batcher';
import { PendingReading } from './types';

describe('Integration Tests: Meter Reading Batch Insertion', () => {
  let batcher: ReadingBatcher;

  beforeEach(() => {
    batcher = new ReadingBatcher();
  });

  describe('10.1 End-to-End Collection → Caching → Insertion Flow', () => {
    it('should collect readings from multiple meters and cache them correctly', () => {
      // Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
      const meter1Readings: PendingReading[] = [
        {
          meter_id: 1,
          meter_element_id: 1,
          created_at: new Date('2024-01-01T12:00:00Z'),
          field_name: 'kWh',
          value: 100.5,
          element: 'main',
          register: 1,
        },
        {
          meter_id: 1,
          meter_element_id: 1,
          created_at: new Date('2024-01-01T12:01:00Z'),
          field_name: 'kVAr',
          value: 50.2,
          element: 'main',
          register: 2,
        },
      ];

      const meter2Readings: PendingReading[] = [
        {
          meter_id: 2,
          meter_element_id: 2,
          created_at: new Date('2024-01-01T12:00:00Z'),
          field_name: 'kWh',
          value: 200.3,
          element: 'secondary',
          register: 1,
        },
        {
          meter_id: 2,
          meter_element_id: 2,
          created_at: new Date('2024-01-01T12:01:00Z'),
          field_name: 'kVA',
          value: 150.8,
          element: 'secondary',
          register: 3,
        },
      ];

      const meter3Readings: PendingReading[] = [
        {
          meter_id: 3,
          meter_element_id: 3,
          created_at: new Date('2024-01-01T12:00:00Z'),
          field_name: 'kWh',
          value: 300.1,
          element: 'tertiary',
          register: 1,
        },
      ];

      [...meter1Readings, ...meter2Readings, ...meter3Readings].forEach((r) => {
        batcher.addReading(r);
      });

      expect(batcher.getPendingCount()).toBe(5);
      const validationResult = batcher.validateReadings();
      expect(validationResult.valid).toBe(5);
      expect(validationResult.invalid).toBe(0);
    });

    it('should verify batch insertion succeeds with valid readings', async () => {
      // Requirements: 3.1, 3.2, 4.1, 4.2
      const readings: PendingReading[] = [
        {
          meter_id: 1,
          meter_element_id: 1,
          created_at: new Date('2024-01-01T12:00:00Z'),
          field_name: 'kWh',
          value: 100.5,
          element: 'main',
          register: 1,
        },
        {
          meter_id: 2,
          meter_element_id: 2,
          created_at: new Date('2024-01-01T12:01:00Z'),
          field_name: 'kVAr',
          value: 50.2,
          element: 'secondary',
          register: 2,
        },
        {
          meter_id: 3,
          meter_element_id: 3,
          created_at: new Date('2024-01-01T12:02:00Z'),
          field_name: 'kVA',
          value: 75.8,
          element: 'tertiary',
          register: 3,
        },
      ];

      readings.forEach((r) => batcher.addReading(r));

      const mockDatabase = {
        pool: {
          connect: async () => ({
            query: async () => {
              return { rows: [] };
            },
            release: () => {},
          }),
        },
      };

      const result = await batcher.flushBatch(mockDatabase);

      expect(result.success).toBe(true);
      expect(result.insertedCount).toBe(3);
      expect(result.failedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(batcher.getPendingCount()).toBe(0);
    });

    it('should verify metrics are accurate after batch insertion', async () => {
      // Requirements: 7.1, 7.2, 7.3
      const readings: PendingReading[] = [
        {
          meter_id: 1,
          meter_element_id: 1,
          created_at: new Date('2024-01-01T12:00:00Z'),
          field_name: 'kWh',
          value: 100.5,
          element: 'main',
          register: 1,
        },
        {
          meter_id: 2,
          meter_element_id: 2,
          created_at: new Date('2024-01-01T12:01:00Z'),
          field_name: 'kVAr',
          value: 50.2,
          element: 'secondary',
          register: 2,
        },
        {
          meter_id: 3,
          meter_element_id: 3,
          created_at: new Date('2024-01-01T12:02:00Z'),
          field_name: 'kVA',
          value: 75.8,
          element: 'tertiary',
          register: 3,
        },
      ];

      readings.forEach((r) => batcher.addReading(r));

      const mockDatabase = {
        pool: {
          connect: async () => ({
            query: async () => {
              return { rows: [] };
            },
            release: () => {},
          }),
        },
      };

      const result = await batcher.flushBatch(mockDatabase);

      expect(result.totalReadings).toBe(3);
      expect(result.insertedCount).toBe(3);
      expect(result.failedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.retryAttempts).toBe(0);
      expect(result.insertedCount + result.failedCount + result.skippedCount).toBe(result.totalReadings);
    });
  });

  describe('10.2 Error Recovery and Retry Scenarios', () => {
    it('should retry failed batch insertion up to 3 times', async () => {
      // Requirements: 4.4, 4.5, 4.6
      const reading: PendingReading = {
        meter_id: 1,
        meter_element_id: 1,
        created_at: new Date('2024-01-01T12:00:00Z'),
        field_name: 'kWh',
        value: 100.5,
        element: 'main',
        register: 1,
      };

      batcher.addReading(reading);

      let attemptCount = 0;
      const mockDatabase = {
        pool: {
          connect: async () => ({
            query: async () => {
              attemptCount++;
              if (attemptCount < 3) {
                throw new Error('Database connection failed');
              }
              return { rows: [] };
            },
            release: () => {},
          }),
        },
      };

      const result = await batcher.flushBatch(mockDatabase);

      expect(result.success).toBe(true);
      expect(result.insertedCount).toBe(1);
      expect(result.retryAttempts).toBeGreaterThan(0);
    });

    it('should fail batch after 3 retry attempts', async () => {
      // Requirements: 4.5, 4.6
      const reading: PendingReading = {
        meter_id: 1,
        meter_element_id: 1,
        created_at: new Date('2024-01-01T12:00:00Z'),
        field_name: 'kWh',
        value: 100.5,
        element: 'main',
        register: 1,
      };

      batcher.addReading(reading);

      const mockDatabase = {
        pool: {
          connect: async () => ({
            query: async () => {
              throw new Error('Database connection failed');
            },
            release: () => {},
          }),
        },
      };

      const result = await batcher.flushBatch(mockDatabase);

      expect(result.success).toBe(false);
      expect(result.failedCount).toBe(1);
      expect(result.retryAttempts).toBe(3);
      expect(batcher.getPendingCount()).toBe(1);
    });

    it('should maintain cache state for failed batches', async () => {
      // Requirements: 4.4, 4.5, 4.6
      const readings: PendingReading[] = [
        {
          meter_id: 1,
          meter_element_id: 1,
          created_at: new Date('2024-01-01T12:00:00Z'),
          field_name: 'kWh',
          value: 100.5,
          element: 'main',
          register: 1,
        },
        {
          meter_id: 2,
          meter_element_id: 2,
          created_at: new Date('2024-01-01T12:01:00Z'),
          field_name: 'kVAr',
          value: 50.2,
          element: 'secondary',
          register: 2,
        },
      ];

      readings.forEach((r) => batcher.addReading(r));
      expect(batcher.getPendingCount()).toBe(2);

      const mockDatabase = {
        pool: {
          connect: async () => ({
            query: async () => {
              throw new Error('Database connection failed');
            },
            release: () => {},
          }),
        },
      };

      const result = await batcher.flushBatch(mockDatabase);

      expect(result.success).toBe(false);
      expect(batcher.getPendingCount()).toBe(2);
    });
  });

  describe('10.3 Validation Error Handling', () => {
    it('should skip invalid readings and insert only valid ones', async () => {
      // Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
      const readings: PendingReading[] = [
        {
          meter_id: 1,
          meter_element_id: 1,
          created_at: new Date('2024-01-01T12:00:00Z'),
          field_name: 'kWh',
          value: 100.5,
          element: 'main',
          register: 1,
        },
        {
          meter_id: null as any,
          meter_element_id: 2,
          created_at: new Date('2024-01-01T12:01:00Z'),
          field_name: 'kVAr',
          value: 50.2,
          element: 'secondary',
          register: 2,
        },
        {
          meter_id: 2,
          meter_element_id: 2,
          created_at: new Date('2024-01-01T12:02:00Z'),
          field_name: 'kVA',
          value: 75.8,
          element: 'secondary',
          register: 3,
        },
        {
          meter_id: 3,
          meter_element_id: 3,
          created_at: new Date('2024-01-01T12:03:00Z'),
          field_name: '',
          value: 60.0,
          element: 'tertiary',
          register: 1,
        },
        {
          meter_id: 4,
          meter_element_id: 4,
          created_at: new Date('2024-01-01T12:04:00Z'),
          field_name: 'kW',
          value: 120.3,
          element: 'quaternary',
          register: 4,
        },
      ];

      readings.forEach((r) => batcher.addReading(r));

      const mockDatabase = {
        pool: {
          connect: async () => ({
            query: async () => {
              return { rows: [] };
            },
            release: () => {},
          }),
        },
      };

      const result = await batcher.flushBatch(mockDatabase);

      expect(result.insertedCount).toBe(3);
      expect(result.skippedCount).toBe(2);
      expect(result.failedCount).toBe(0);
    });

    it('should log validation errors for excluded readings', async () => {
      // Requirements: 6.5, 6.6
      const readings: PendingReading[] = [
        {
          meter_id: null as any,
          meter_element_id: 1,
          created_at: new Date('2024-01-01T12:00:00Z'),
          field_name: 'kWh',
          value: 100.5,
          element: 'main',
          register: 1,
        },
        {
          meter_id: 1,
          meter_element_id: 1,
          created_at: new Date('2024-01-01T12:01:00Z'),
          field_name: 'kVAr',
          value: NaN,
          element: 'main',
          register: 2,
        },
      ];

      readings.forEach((r) => batcher.addReading(r));

      const mockDatabase = {
        pool: {
          connect: async () => ({
            query: async () => {
              return { rows: [] };
            },
            release: () => {},
          }),
        },
      };

      const result = await batcher.flushBatch(mockDatabase);

      expect(result.skippedCount).toBe(2);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should handle mix of valid and invalid readings correctly', async () => {
      // Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
      const readings: PendingReading[] = [
        {
          meter_id: 1,
          meter_element_id: 1,
          created_at: new Date('2024-01-01T12:00:00Z'),
          field_name: 'kWh',
          value: 100.5,
          element: 'main',
          register: 1,
        },
        {
          meter_id: 2,
          meter_element_id: 2,
          created_at: new Date(Date.now() + 86400000),
          field_name: 'kVAr',
          value: 50.2,
          element: 'secondary',
          register: 2,
        },
        {
          meter_id: 3,
          meter_element_id: 3,
          created_at: new Date('2024-01-01T12:02:00Z'),
          field_name: 'kVA',
          value: 75.8,
          element: 'tertiary',
          register: 3,
        },
        {
          meter_id: 4,
          meter_element_id: 4,
          created_at: new Date('2024-01-01T12:03:00Z'),
          field_name: 'kW',
          value: null as any,
          element: 'quaternary',
          register: 4,
        },
        {
          meter_id: 5,
          meter_element_id: 5,
          created_at: new Date('2024-01-01T12:04:00Z'),
          field_name: 'kVAh',
          value: 200.0,
          element: 'quinary',
          register: 5,
        },
      ];

      readings.forEach((r) => batcher.addReading(r));

      const validationResult = batcher.validateReadings();

      expect(validationResult.valid).toBe(3);
      expect(validationResult.invalid).toBe(2);
      expect(validationResult.errors).toHaveLength(2);

      const errorMessages = validationResult.errors.flatMap((e) => e.errors);
      expect(errorMessages).toContain('timestamp is in the future');
      expect(errorMessages).toContain('value is null or undefined');
    });
  });
});
