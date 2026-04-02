import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ReadingBatcher } from './reading-batcher';

describe('ReadingBatcher', () => {
  let batcher: ReadingBatcher;

  beforeEach(() => {
    batcher = new ReadingBatcher();
  });

  describe('validateReadings', () => {
    it('should validate a single valid reading', () => {
      const reading = {
        meter_id: 1,
        meter_element_id: 1,
        created_at: new Date('2024-01-01T12:00:00Z'),
        field_name: 'kWh',
        value: 100.5,
        element: 'main',
        register: 1,
      };

      batcher.addReading(reading);
      const result = batcher.validateReadings();

      expect(result.valid).toBe(1);
      expect(result.invalid).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject reading with null meter_id', () => {
      const reading = {
        meter_id: null as any,
        meter_element_id: 1,
        created_at: new Date('2024-01-01T12:00:00Z'),
        field_name: 'kWh',
        value: 100.5,
        element: 'main',
        register: 1,
      };

      batcher.addReading(reading);
      const result = batcher.validateReadings();

      expect(result.valid).toBe(0);
      expect(result.invalid).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].errors).toContain('meter_id is null or undefined');
    });

    it('should reject reading with invalid timestamp', () => {
      const reading = {
        meter_id: 1,
        meter_element_id: 1,
        created_at: 'invalid-date' as any,
        field_name: 'kWh',
        value: 100.5,
        element: 'main',
        register: 1,
      };

      batcher.addReading(reading);
      const result = batcher.validateReadings();

      expect(result.valid).toBe(0);
      expect(result.invalid).toBe(1);
      expect(result.errors[0].errors[0]).toContain('timestamp is not a valid Date');
    });

    it('should reject reading with null value', () => {
      const reading = {
        meter_id: 1,
        meter_element_id: 1,
        created_at: new Date('2024-01-01T12:00:00Z'),
        field_name: 'kWh',
        value: null as any,
        element: 'main',
        register: 1,
      };

      batcher.addReading(reading);
      const result = batcher.validateReadings();

      expect(result.valid).toBe(0);
      expect(result.invalid).toBe(1);
      expect(result.errors[0].errors).toContain('value is null or undefined');
    });

    it('should reject reading with empty data_point', () => {
      const reading = {
        meter_id: 1,
        meter_element_id: 1,
        created_at: new Date('2024-01-01T12:00:00Z'),
        field_name: '',
        value: 100.5,
        element: 'main',
        register: 1,
      };

      batcher.addReading(reading);
      const result = batcher.validateReadings();

      expect(result.valid).toBe(0);
      expect(result.invalid).toBe(1);
      expect(result.errors[0].errors[0]).toContain('data_point (field_name) is empty or null');
    });
  });

  describe('getValidationErrors', () => {
    it('should return empty array when no validation errors', () => {
      const reading = {
        meter_id: 1,
        meter_element_id: 1,
        created_at: new Date('2024-01-01T12:00:00Z'),
        field_name: 'kWh',
        value: 100.5,
        element: 'main',
        register: 1,
      };

      batcher.addReading(reading);
      batcher.validateReadings();

      const errors = batcher.getValidationErrors();

      expect(errors).toHaveLength(0);
    });

    it('should return validation errors after validation', () => {
      const reading = {
        meter_id: null as any,
        meter_element_id: 1,
        created_at: new Date('2024-01-01T12:00:00Z'),
        field_name: 'kWh',
        value: 100.5,
        element: 'main',
        register: 1,
      };

      batcher.addReading(reading);
      batcher.validateReadings();

      const errors = batcher.getValidationErrors();

      expect(errors).toHaveLength(1);
      expect(errors[0].readingIndex).toBe(0);
      expect(errors[0].errors).toContain('meter_id is null or undefined');
    });
  });

  describe('flushBatch', () => {
    it('should include is_synchronized=false in INSERT statement', async () => {
      const reading = {
        meter_id: 1,
        meter_element_id: 1,
        created_at: new Date('2024-01-01T12:00:00Z'),
        field_name: 'kWh',
        value: 100.5,
        element: 'main',
        register: 1,
      };

      batcher.addReading(reading);

      let insertQueryCalled = false;
      const mockDatabase = {
        pool: {
          connect: async () => ({
            query: async (query: string, values?: any[]) => {
              if (query.includes('INSERT')) {
                insertQueryCalled = true;
                expect(query).toContain('is_synchronized');
                expect(values).toContain(false);
              }
              return { rows: [] };
            },
            release: () => {},
          }),
        },
      };

      const result = await batcher.flushBatch(mockDatabase);
      expect(insertQueryCalled).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should include retry_count=0 in INSERT statement', async () => {
      const reading = {
        meter_id: 1,
        meter_element_id: 1,
        created_at: new Date('2024-01-01T12:00:00Z'),
        field_name: 'kWh',
        value: 100.5,
        element: 'main',
        register: 1,
      };

      batcher.addReading(reading);

      let insertQueryCalled = false;
      const mockDatabase = {
        pool: {
          connect: async () => ({
            query: async (query: string, values?: any[]) => {
              if (query.includes('INSERT')) {
                insertQueryCalled = true;
                expect(query).toContain('retry_count');
                expect(values).toContain(0);
              }
              return { rows: [] };
            },
            release: () => {},
          }),
        },
      };

      const result = await batcher.flushBatch(mockDatabase);
      expect(insertQueryCalled).toBe(true);
      expect(result.success).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('should accumulate readings in memory without database operations', () => {
      const readings = [
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

      expect(batcher.getPendingCount()).toBe(3);
    });

    it('should clear cache after successful insertion', async () => {
      const reading = {
        meter_id: 1,
        meter_element_id: 1,
        created_at: new Date('2024-01-01T12:00:00Z'),
        field_name: 'kWh',
        value: 100.5,
        element: 'main',
        register: 1,
      };

      batcher.addReading(reading);
      expect(batcher.getPendingCount()).toBe(1);

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

      await batcher.flushBatch(mockDatabase);

      expect(batcher.getPendingCount()).toBe(0);
    });

    it('should maintain cache state for failed batches', async () => {
      const reading = {
        meter_id: 1,
        meter_element_id: 1,
        created_at: new Date('2024-01-01T12:00:00Z'),
        field_name: 'kWh',
        value: 100.5,
        element: 'main',
        register: 1,
      };

      batcher.addReading(reading);
      expect(batcher.getPendingCount()).toBe(1);

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

      expect(batcher.getPendingCount()).toBe(1);
      expect(result.success).toBe(false);
      expect(result.failedCount).toBe(1);
    });
  });

  describe('Property 4: Invalid Readings Are Excluded', () => {
    it('should exclude all invalid readings from validation result', async () => {
      // Feature: meter-reading-batch-insertion, Property 4: Invalid Readings Are Excluded
      // Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5

      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              meter_id: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 1000 })),
              created_at: fc.oneof(
                fc.constant(new Date('2024-01-01T12:00:00Z')),
                fc.constant(new Date())
              ),
              field_name: fc.oneof(fc.constant(''), fc.constant('kWh')),
              value: fc.oneof(fc.constant(NaN), fc.integer({ min: 0, max: 1000 })),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          async (readingsData) => {
            const batcher = new ReadingBatcher();

            const readings = readingsData.map((data) => ({
              meter_id: data.meter_id,
              meter_element_id: 1,
              created_at: data.created_at,
              field_name: data.field_name,
              value: data.value,
              element: 'main',
              register: 1,
            }));

            readings.forEach((r) => batcher.addReading(r as any));
            const result = batcher.validateReadings();

            expect(result.valid + result.invalid).toBe(readings.length);
            expect(result.errors.length).toBe(result.invalid);
            result.errors.forEach((error) => {
              expect(error.errors.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
