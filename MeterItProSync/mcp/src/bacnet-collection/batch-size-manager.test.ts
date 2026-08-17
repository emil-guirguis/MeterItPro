import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { BatchSizeManager, BatchSizeConfig } from './batch-size-manager';

describe('BatchSizeManager', () => {
  describe('Constructor and Configuration', () => {
    it('should use default configuration values', () => {
      const manager = new BatchSizeManager();
      const managerAny = manager as any;

      expect(managerAny.initialBatchSize).toBe('all');
      expect(managerAny.minBatchSize).toBe(1);
      expect(managerAny.reductionFactor).toBe(0.5);
    });

    it('should accept custom configuration values', () => {
      const config: BatchSizeConfig = {
        initialBatchSize: 10,
        minBatchSize: 2,
        reductionFactor: 0.6,
      };
      const manager = new BatchSizeManager(config);
      const managerAny = manager as any;

      expect(managerAny.initialBatchSize).toBe(10);
      expect(managerAny.minBatchSize).toBe(2);
      expect(managerAny.reductionFactor).toBe(0.6);
    });

    it('should accept "all" as initialBatchSize', () => {
      const config: BatchSizeConfig = {
        initialBatchSize: 'all',
      };
      const manager = new BatchSizeManager(config);
      const managerAny = manager as any;

      expect(managerAny.initialBatchSize).toBe('all');
    });

    it('should throw error if minBatchSize is less than 1', () => {
      const config: BatchSizeConfig = {
        minBatchSize: 0,
      };

      expect(() => new BatchSizeManager(config)).toThrow('minBatchSize must be at least 1');
    });

    it('should throw error if reductionFactor is 0 or less', () => {
      const config: BatchSizeConfig = {
        reductionFactor: 0,
      };

      expect(() => new BatchSizeManager(config)).toThrow('reductionFactor must be between 0 and 1');
    });

    it('should throw error if reductionFactor is 1 or greater', () => {
      const config: BatchSizeConfig = {
        reductionFactor: 1,
      };

      expect(() => new BatchSizeManager(config)).toThrow('reductionFactor must be between 0 and 1');
    });

    it('should accept valid reductionFactor values', () => {
      const validFactors = [0.1, 0.25, 0.5, 0.75, 0.99];

      validFactors.forEach((factor) => {
        const config: BatchSizeConfig = {
          reductionFactor: factor,
        };
        expect(() => new BatchSizeManager(config)).not.toThrow();
      });
    });
  });

  describe('getBatchSize', () => {
    it('should initialize meter with "all" batch size when initialBatchSize is "all"', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 'all' });

      const batchSize = manager.getBatchSize(1, 20);

      expect(batchSize).toBe(20);
    });

    it('should initialize meter with configured initialBatchSize', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      const batchSize = manager.getBatchSize(1, 20);

      expect(batchSize).toBe(10);
    });

    it('should respect minBatchSize when initializing', () => {
      const manager = new BatchSizeManager({
        initialBatchSize: 2,
        minBatchSize: 5,
      });

      const batchSize = manager.getBatchSize(1, 20);

      expect(batchSize).toBe(5);
    });

    it('should return same batch size on subsequent calls for same meter', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 'all' });

      const batchSize1 = manager.getBatchSize(1, 20);
      const batchSize2 = manager.getBatchSize(1, 20);

      expect(batchSize1).toBe(batchSize2);
      expect(batchSize1).toBe(20);
    });

    it('should handle different batch sizes for different meters', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 'all' });

      const batchSize1 = manager.getBatchSize(1, 20);
      const batchSize2 = manager.getBatchSize(2, 30);

      expect(batchSize1).toBe(20);
      expect(batchSize2).toBe(30);
    });

    it('should initialize each meter only once', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 'all' });

      manager.getBatchSize(1, 20);
      manager.recordTimeout(1);
      const batchSize = manager.getBatchSize(1, 20);

      // Should be reduced due to timeout, not re-initialized
      expect(batchSize).toBeLessThan(20);
    });
  });

  describe('recordSuccess', () => {
    it('should maintain batch size on success', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      const initialSize = manager.getBatchSize(1, 20);
      manager.recordSuccess(1);
      const sizeAfterSuccess = manager.getBatchSize(1, 20);

      expect(sizeAfterSuccess).toBe(initialSize);
    });

    it('should increment consecutive successes counter', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      manager.recordSuccess(1);
      manager.recordSuccess(1);

      const state = manager.getMeterState(1);
      expect(state?.consecutiveSuccesses).toBe(2);
    });

    it('should reset consecutive timeouts counter on success', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      manager.recordTimeout(1);
      manager.recordTimeout(1);
      manager.recordSuccess(1);

      const state = manager.getMeterState(1);
      expect(state?.consecutiveTimeouts).toBe(0);
      expect(state?.consecutiveSuccesses).toBe(1);
    });

    it('should record last successful batch size', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      manager.recordSuccess(1);

      const state = manager.getMeterState(1);
      expect(state?.lastSuccessfulBatchSize).toBe(10);
    });

    it('should update lastUpdated timestamp', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      const beforeSuccess = new Date();
      manager.recordSuccess(1);
      const afterSuccess = new Date();

      const state = manager.getMeterState(1);
      expect(state?.lastUpdated.getTime()).toBeGreaterThanOrEqual(beforeSuccess.getTime());
      expect(state?.lastUpdated.getTime()).toBeLessThanOrEqual(afterSuccess.getTime());
    });

    it('should warn when recording success for unknown meter', () => {
      const mockLogger = { warn: vi.fn(), debug: vi.fn(), info: vi.fn() };
      const manager = new BatchSizeManager({}, mockLogger);

      manager.recordSuccess(999);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('unknown meter 999')
      );
    });
  });

  describe('recordTimeout', () => {
    it('should reduce batch size by reduction factor on timeout', () => {
      const manager = new BatchSizeManager({
        initialBatchSize: 100,
        reductionFactor: 0.5,
      });

      const initialSize = manager.getBatchSize(1, 200);
      manager.recordTimeout(1);
      const sizeAfterTimeout = manager.getBatchSize(1, 200);

      expect(sizeAfterTimeout).toBe(50);
    });

    it('should respect minBatchSize when reducing', () => {
      const manager = new BatchSizeManager({
        initialBatchSize: 2,
        minBatchSize: 1,
        reductionFactor: 0.5,
      });

      manager.getBatchSize(1, 20);
      manager.recordTimeout(1);
      manager.recordTimeout(1);
      const finalSize = manager.getBatchSize(1, 20);

      expect(finalSize).toBe(1);
    });

    it('should increment consecutive timeouts counter', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      manager.recordTimeout(1);
      manager.recordTimeout(1);
      manager.recordTimeout(1);

      const state = manager.getMeterState(1);
      expect(state?.consecutiveTimeouts).toBe(3);
    });

    it('should reset consecutive successes counter on timeout', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      manager.recordSuccess(1);
      manager.recordSuccess(1);
      manager.recordTimeout(1);

      const state = manager.getMeterState(1);
      expect(state?.consecutiveSuccesses).toBe(0);
      expect(state?.consecutiveTimeouts).toBe(1);
    });

    it('should update lastUpdated timestamp', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      const beforeTimeout = new Date();
      manager.recordTimeout(1);
      const afterTimeout = new Date();

      const state = manager.getMeterState(1);
      expect(state?.lastUpdated.getTime()).toBeGreaterThanOrEqual(beforeTimeout.getTime());
      expect(state?.lastUpdated.getTime()).toBeLessThanOrEqual(afterTimeout.getTime());
    });

    it('should warn when recording timeout for unknown meter', () => {
      const mockLogger = { warn: vi.fn(), debug: vi.fn(), info: vi.fn() };
      const manager = new BatchSizeManager({}, mockLogger);

      manager.recordTimeout(999);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('unknown meter 999')
      );
    });

    it('should handle multiple consecutive timeouts', () => {
      const manager = new BatchSizeManager({
        initialBatchSize: 100,
        reductionFactor: 0.5,
        minBatchSize: 1,
      });

      manager.getBatchSize(1, 200);
      manager.recordTimeout(1); // 100 -> 50
      manager.recordTimeout(1); // 50 -> 25
      manager.recordTimeout(1); // 25 -> 12
      manager.recordTimeout(1); // 12 -> 6
      manager.recordTimeout(1); // 6 -> 3
      manager.recordTimeout(1); // 3 -> 1
      manager.recordTimeout(1); // 1 -> 1 (at minimum)

      const state = manager.getMeterState(1);
      expect(state?.currentBatchSize).toBe(1);
      expect(state?.consecutiveTimeouts).toBe(7);
    });
  });

  describe('getMeterState', () => {
    it('should return undefined for unknown meter', () => {
      const manager = new BatchSizeManager();

      const state = manager.getMeterState(999);

      expect(state).toBeUndefined();
    });

    it('should return state for known meter', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      const state = manager.getMeterState(1);

      expect(state).toBeDefined();
      expect(state?.meterId).toBe(1);
      expect(state?.currentBatchSize).toBe(10);
    });

    it('should return updated state after timeout', () => {
      const manager = new BatchSizeManager({
        initialBatchSize: 10,
        reductionFactor: 0.5,
      });

      manager.getBatchSize(1, 20);
      manager.recordTimeout(1);
      const state = manager.getMeterState(1);

      expect(state?.currentBatchSize).toBe(5);
      expect(state?.consecutiveTimeouts).toBe(1);
    });
  });

  describe('getAllMeterStates', () => {
    it('should return empty array when no meters tracked', () => {
      const manager = new BatchSizeManager();

      const states = manager.getAllMeterStates();

      expect(states).toEqual([]);
    });

    it('should return all tracked meter states', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      manager.getBatchSize(2, 30);
      manager.getBatchSize(3, 40);

      const states = manager.getAllMeterStates();

      expect(states).toHaveLength(3);
      expect(states.map((s) => s.meterId)).toEqual([1, 2, 3]);
    });

    it('should return states with current batch sizes', () => {
      const manager = new BatchSizeManager({
        initialBatchSize: 10,
        reductionFactor: 0.5,
      });

      manager.getBatchSize(1, 20);
      manager.getBatchSize(2, 30);
      manager.recordTimeout(1);

      const states = manager.getAllMeterStates();

      expect(states.find((s) => s.meterId === 1)?.currentBatchSize).toBe(5);
      expect(states.find((s) => s.meterId === 2)?.currentBatchSize).toBe(10);
    });
  });

  describe('clearMeterState', () => {
    it('should remove meter state', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      manager.clearMeterState(1);

      const state = manager.getMeterState(1);
      expect(state).toBeUndefined();
    });

    it('should not affect other meters', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      manager.getBatchSize(2, 30);
      manager.clearMeterState(1);

      const state1 = manager.getMeterState(1);
      const state2 = manager.getMeterState(2);

      expect(state1).toBeUndefined();
      expect(state2).toBeDefined();
    });
  });

  describe('clearAllStates', () => {
    it('should remove all meter states', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      manager.getBatchSize(2, 30);
      manager.getBatchSize(3, 40);
      manager.clearAllStates();

      const states = manager.getAllMeterStates();

      expect(states).toHaveLength(0);
    });
  });

  describe('getMetersWithTimeouts', () => {
    it('should return empty array when no timeouts', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      manager.getBatchSize(2, 30);

      const metersWithTimeouts = manager.getMetersWithTimeouts();

      expect(metersWithTimeouts).toEqual([]);
    });

    it('should return meters that have experienced timeouts', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      manager.getBatchSize(2, 30);
      manager.getBatchSize(3, 40);
      manager.recordTimeout(1);
      manager.recordTimeout(3);

      const metersWithTimeouts = manager.getMetersWithTimeouts();

      expect(metersWithTimeouts).toEqual([1, 3]);
    });

    it('should not include meters after success resets timeout counter', () => {
      const manager = new BatchSizeManager({ initialBatchSize: 10 });

      manager.getBatchSize(1, 20);
      manager.recordTimeout(1);
      manager.recordSuccess(1);

      const metersWithTimeouts = manager.getMetersWithTimeouts();

      expect(metersWithTimeouts).toEqual([]);
    });
  });

  describe('getMetersAtMinBatchSize', () => {
    it('should return empty array when no meters at minimum', () => {
      const manager = new BatchSizeManager({
        initialBatchSize: 10,
        minBatchSize: 1,
      });

      manager.getBatchSize(1, 20);
      manager.getBatchSize(2, 30);

      const metersAtMin = manager.getMetersAtMinBatchSize();

      expect(metersAtMin).toEqual([]);
    });

    it('should return meters at minimum batch size', () => {
      const manager = new BatchSizeManager({
        initialBatchSize: 4,
        minBatchSize: 1,
        reductionFactor: 0.5,
      });

      manager.getBatchSize(1, 20);
      manager.getBatchSize(2, 30);
      manager.recordTimeout(1); // 4 -> 2
      manager.recordTimeout(1); // 2 -> 1
      manager.recordTimeout(2); // 4 -> 2

      const metersAtMin = manager.getMetersAtMinBatchSize();

      expect(metersAtMin).toEqual([1]);
    });
  });

  describe('getSummary', () => {
    it('should return zero values when no meters tracked', () => {
      const manager = new BatchSizeManager();

      const summary = manager.getSummary();

      expect(summary.totalMeters).toBe(0);
      expect(summary.metersWithTimeouts).toBe(0);
      expect(summary.metersAtMinBatchSize).toBe(0);
      expect(summary.averageBatchSize).toBe(0);
      expect(summary.averageConsecutiveTimeouts).toBe(0);
    });

    it('should calculate summary statistics correctly', () => {
      const manager = new BatchSizeManager({
        initialBatchSize: 10,
        minBatchSize: 1,
        reductionFactor: 0.5,
      });

      manager.getBatchSize(1, 20);
      manager.getBatchSize(2, 30);
      manager.getBatchSize(3, 40);
      manager.recordTimeout(1); // 10 -> 5
      manager.recordTimeout(1); // 5 -> 2
      manager.recordTimeout(2); // 10 -> 5

      const summary = manager.getSummary();

      expect(summary.totalMeters).toBe(3);
      expect(summary.metersWithTimeouts).toBe(2);
      expect(summary.metersAtMinBatchSize).toBe(0);
      expect(summary.averageBatchSize).toBeCloseTo((2 + 5 + 10) / 3, 1);
      expect(summary.averageConsecutiveTimeouts).toBeCloseTo((2 + 1 + 0) / 3, 1);
    });

    it('should include meters at minimum batch size in summary', () => {
      const manager = new BatchSizeManager({
        initialBatchSize: 2,
        minBatchSize: 1,
        reductionFactor: 0.5,
      });

      manager.getBatchSize(1, 20);
      manager.getBatchSize(2, 30);
      manager.recordTimeout(1); // 2 -> 1
      manager.recordTimeout(2); // 2 -> 1

      const summary = manager.getSummary();

      expect(summary.metersAtMinBatchSize).toBe(2);
    });
  });

  describe('Property 3: Batch Size Reduction on Timeout', () => {
    it('should reduce batch size by configured factor on timeout', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 3: Batch Size Reduction on Timeout
      // Validates: Requirements 3.1, 3.3

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10, max: 1000 }),
          fc.integer({ min: 2, max: 10 }),
          async (initialBatchSize, totalRegisters) => {
            const manager = new BatchSizeManager({
              initialBatchSize: Math.min(initialBatchSize, totalRegisters),
              reductionFactor: 0.5,
              minBatchSize: 1,
            });

            const meterId = 1;
            const beforeSize = manager.getBatchSize(meterId, totalRegisters);
            manager.recordTimeout(meterId);
            const afterSize = manager.getBatchSize(meterId, totalRegisters);

            // Property: Batch size should be reduced by 50% on timeout
            const expectedSize = Math.max(Math.floor(beforeSize * 0.5), 1);
            expect(afterSize).toBe(expectedSize);
            expect(afterSize).toBeLessThanOrEqual(beforeSize);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should split batch into multiple requests after reduction', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 3: Batch Size Reduction on Timeout
      // Validates: Requirements 3.1, 3.3

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 20, max: 200 }),
          async (totalRegisters) => {
            const manager = new BatchSizeManager({
              initialBatchSize: totalRegisters,
              reductionFactor: 0.5,
              minBatchSize: 1,
            });

            const meterId = 1;
            const initialSize = manager.getBatchSize(meterId, totalRegisters);

            // Simulate multiple timeouts
            manager.recordTimeout(meterId);
            const sizeAfter1 = manager.getBatchSize(meterId, totalRegisters);

            manager.recordTimeout(meterId);
            const sizeAfter2 = manager.getBatchSize(meterId, totalRegisters);

            // Property: Each timeout should reduce batch size
            expect(sizeAfter1).toBeLessThan(initialSize);
            expect(sizeAfter2).toBeLessThan(sizeAfter1);

            // Property: Multiple batches can be formed from total registers
            const numBatches1 = Math.ceil(totalRegisters / sizeAfter1);
            const numBatches2 = Math.ceil(totalRegisters / sizeAfter2);

            expect(numBatches1).toBeGreaterThan(1);
            expect(numBatches2).toBeGreaterThan(numBatches1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain batch size on successful reads', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 3: Batch Size Reduction on Timeout
      // Validates: Requirements 3.1, 3.3

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10, max: 100 }),
          fc.integer({ min: 1, max: 5 }),
          async (initialBatchSize, numSuccesses) => {
            const manager = new BatchSizeManager({
              initialBatchSize,
              reductionFactor: 0.5,
              minBatchSize: 1,
            });

            const meterId = 1;
            const initialSize = manager.getBatchSize(meterId, 200);

            // Record multiple successes
            for (let i = 0; i < numSuccesses; i++) {
              manager.recordSuccess(meterId);
            }

            const sizeAfterSuccesses = manager.getBatchSize(meterId, 200);

            // Property: Batch size should be maintained on success
            expect(sizeAfterSuccesses).toBe(initialSize);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect minimum batch size constraint', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 3: Batch Size Reduction on Timeout
      // Validates: Requirements 3.1, 3.3

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (minBatchSize) => {
            const manager = new BatchSizeManager({
              initialBatchSize: 100,
              reductionFactor: 0.5,
              minBatchSize,
            });

            const meterId = 1;
            manager.getBatchSize(meterId, 200);

            // Record many timeouts to drive batch size down
            for (let i = 0; i < 20; i++) {
              manager.recordTimeout(meterId);
            }

            const finalSize = manager.getBatchSize(meterId, 200);

            // Property: Batch size should never go below minimum
            expect(finalSize).toBeGreaterThanOrEqual(minBatchSize);
            expect(finalSize).toBe(minBatchSize);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
