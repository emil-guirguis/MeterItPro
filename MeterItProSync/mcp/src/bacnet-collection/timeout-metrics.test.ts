import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CollectionCycleManager } from './collection-cycle-manager';
import { DeviceRegisterCache } from '../cache/index.js';
import { TimeoutMetrics } from './types.js';
import { cacheManager } from '../cache/cache-manager.js';

describe('Timeout Metrics Collection', () => {
  let manager: CollectionCycleManager;
  let mockDeviceRegisterCache: any;
  let mockLogger: any;
  let getMeterCacheSpy: any;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    // Create mock device register cache
    mockDeviceRegisterCache = {
      getDeviceRegisters: vi.fn(),
    };

    // Spy on cacheManager.getMeterCache with an empty cache by default
    getMeterCacheSpy = vi.spyOn(cacheManager, 'getMeterCache').mockReturnValue({
      isValid: vi.fn().mockReturnValue(false),
      getMeters: vi.fn().mockReturnValue([]),
      reload: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn(),
    } as any);

    // Spy on cacheManager.getDeviceRegisterCache with mock data
    // Note: register must be non-zero (0 is skipped as a calculated field)
    vi.spyOn(cacheManager, 'getDeviceRegisterCache').mockReturnValue({
      isValid: vi.fn().mockReturnValue(true),
      getDeviceRegisters: vi.fn().mockReturnValue([
        { register_id: 1, register: 1, field_name: 'power_a', unit: 'W' },
      ]),
      reload: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn(),
    } as any);

    manager = new CollectionCycleManager(mockLogger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property 7: Timeout Metrics Recording', () => {
    it('should include timeout metrics in collection cycle result', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 7: Timeout Metrics Recording
      // Validates: Requirements 4.1, 4.2, 4.3

      const mockBACnetClient = {
        checkConnectivity: vi.fn().mockResolvedValue(false),
        readPropertyMultiple: vi.fn(),
      } as any;

      const mockDatabase = {};

      mockDeviceRegisterCache.getDeviceRegisters.mockReturnValue([
        { register_id: 1, register: 0, field_name: 'power_a', unit: 'W' },
      ]);

      const result = await manager.executeCycle(
        mockBACnetClient,
        mockDatabase,
        5000
      );

      // Verify timeout metrics are included in result
      expect(result.timeoutMetrics).toBeDefined();
      expect(result.timeoutMetrics?.totalTimeouts).toBeGreaterThanOrEqual(0);
      expect(result.timeoutMetrics?.timeoutsByMeter).toBeDefined();
      expect(result.timeoutMetrics?.averageTimeoutRecoveryMs).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.timeoutMetrics?.timeoutEvents)).toBe(true);
    });

    it('should track timeout events per meter', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 7: Timeout Metrics Recording
      // Validates: Requirements 4.1, 4.2, 4.3

      const mockBACnetClient = {
        checkConnectivity: vi.fn().mockResolvedValue(true), // meters are online
        readPropertyMultiple: vi.fn().mockResolvedValue([
          { success: false, error: 'Batch read timeout after 5000ms', fieldName: 'power_a' },
        ]),
      } as any;

      const mockDatabase = {};

      // Configure cacheManager to return 2 meters (must include element field for PowerScout 48 HD)
      getMeterCacheSpy.mockReturnValue({
        isValid: vi.fn().mockReturnValue(true),
        getMeters: vi.fn().mockReturnValue([
          { meter_id: 1, device_id: 10, ip: '192.168.1.1', port: 47808, name: 'Meter 1', element: 'A', meter_element_id: 1 },
          { meter_id: 2, device_id: 11, ip: '192.168.1.2', port: 47808, name: 'Meter 2', element: 'A', meter_element_id: 2 },
        ]),
        reload: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn(),
      } as any);

      const result = await manager.executeCycle(
        mockBACnetClient,
        mockDatabase,
        5000
      );

      // Verify timeout metrics track each meter
      expect(result.timeoutMetrics).toBeDefined();
      expect(result.timeoutMetrics?.timeoutsByMeter).toBeDefined();
      expect(result.timeoutMetrics?.timeoutsByMeter['1']).toBeGreaterThan(0);
      expect(result.timeoutMetrics?.timeoutsByMeter['2']).toBeGreaterThan(0);
    });

    it('should calculate average timeout recovery time', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 7: Timeout Metrics Recording
      // Validates: Requirements 4.1, 4.2, 4.3

      const mockBACnetClient = {
        checkConnectivity: vi.fn().mockResolvedValue(false),
        readPropertyMultiple: vi.fn(),
      } as any;

      const mockDatabase = {};

      mockDeviceRegisterCache.getDeviceRegisters.mockReturnValue([
        { register_id: 1, register: 0, field_name: 'power_a', unit: 'W' },
      ]);

      const result = await manager.executeCycle(
        mockBACnetClient,
        mockDatabase,
        5000
      );

      // Verify average timeout recovery time is calculated
      expect(result.timeoutMetrics).toBeDefined();
      expect(result.timeoutMetrics?.averageTimeoutRecoveryMs).toBeGreaterThanOrEqual(0);
      expect(result.timeoutMetrics?.averageTimeoutRecoveryMs).toBeLessThanOrEqual(5000);
    });

    it('should record last timeout time', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 7: Timeout Metrics Recording
      // Validates: Requirements 4.1, 4.2, 4.3

      const mockBACnetClient = {
        checkConnectivity: vi.fn().mockResolvedValue(true), // meter is online
        readPropertyMultiple: vi.fn().mockResolvedValue([
          { success: false, error: 'Batch read timeout after 5000ms', fieldName: 'power_a' },
        ]),
      } as any;

      const mockDatabase = {};

      // Configure cacheManager to return a meter so a timeout event is recorded
      getMeterCacheSpy.mockReturnValue({
        isValid: vi.fn().mockReturnValue(true),
        getMeters: vi.fn().mockReturnValue([
          { meter_id: 1, device_id: 10, ip: '192.168.1.1', port: 47808, name: 'Meter 1', element: 'A', meter_element_id: 1 },
        ]),
        reload: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn(),
      } as any);

      const beforeTime = new Date();

      const result = await manager.executeCycle(
        mockBACnetClient,
        mockDatabase,
        5000
      );

      const afterTime = new Date();

      // Verify last timeout time is recorded
      expect(result.timeoutMetrics).toBeDefined();
      expect(result.timeoutMetrics?.lastTimeoutTime).toBeDefined();

      if (result.timeoutMetrics?.lastTimeoutTime) {
        expect(result.timeoutMetrics.lastTimeoutTime.getTime()).toBeGreaterThanOrEqual(
          beforeTime.getTime()
        );
        expect(result.timeoutMetrics.lastTimeoutTime.getTime()).toBeLessThanOrEqual(
          afterTime.getTime()
        );
      }
    });

    it('should include timeout events in metrics', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 7: Timeout Metrics Recording
      // Validates: Requirements 4.1, 4.2, 4.3

      const mockBACnetClient = {
        checkConnectivity: vi.fn().mockResolvedValue(false),
        readPropertyMultiple: vi.fn(),
      } as any;

      const mockDatabase = {};

      mockDeviceRegisterCache.getDeviceRegisters.mockReturnValue([
        { register_id: 1, register: 0, field_name: 'power_a', unit: 'W' },
      ]);

      const result = await manager.executeCycle(
        mockBACnetClient,
        mockDatabase,
        5000
      );

      // Verify timeout events are included
      expect(result.timeoutMetrics).toBeDefined();
      expect(result.timeoutMetrics?.timeoutEvents).toBeDefined();
      expect(Array.isArray(result.timeoutMetrics?.timeoutEvents)).toBe(true);

      if (result.timeoutMetrics?.timeoutEvents && result.timeoutMetrics.timeoutEvents.length > 0) {
        const event = result.timeoutMetrics.timeoutEvents[0];
        expect(event.meterId).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.registerCount).toBeGreaterThanOrEqual(0);
        expect(event.batchSize).toBeGreaterThanOrEqual(0);
        expect(event.timeoutMs).toBeGreaterThan(0);
        expect(['sequential', 'reduced_batch', 'offline']).toContain(event.recoveryMethod);
        expect(typeof event.success).toBe('boolean');
      }
    });

    it('should record timeout events when batch read fails', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 7: Timeout Metrics Recording
      // Validates: Requirements 4.1, 4.2, 4.3

      const mockBACnetClient = {
        checkConnectivity: vi.fn().mockResolvedValue(true), // meter is online
        readPropertyMultiple: vi.fn().mockResolvedValue([
          { success: false, error: 'Batch read timeout after 5000ms', fieldName: 'power_a' },
        ]),
      } as any;

      const mockDatabase = {};

      // Configure cacheManager to return a meter so timeout events are recorded
      getMeterCacheSpy.mockReturnValue({
        isValid: vi.fn().mockReturnValue(true),
        getMeters: vi.fn().mockReturnValue([
          { meter_id: 1, device_id: 10, ip: '192.168.1.1', port: 47808, name: 'Meter 1', element: 'A', meter_element_id: 1 },
        ]),
        reload: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn(),
      } as any);

      const result = await manager.executeCycle(
        mockBACnetClient,
        mockDatabase,
        5000
      );

      // Verify timeout events are recorded when batch read fails
      expect(result.timeoutMetrics).toBeDefined();
      expect(result.timeoutMetrics?.timeoutEvents).toBeDefined();

      const failedEvents = result.timeoutMetrics?.timeoutEvents?.filter(
        (e) => e.recoveryMethod === 'reduced_batch'
      );
      expect(failedEvents?.length).toBeGreaterThan(0);

      if (failedEvents && failedEvents.length > 0) {
        const event = failedEvents[0];
        expect(event.success).toBe(false);
        expect(event.registerCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Timeout Metrics Accumulation', () => {
    it('should clear timeout events between cycles', async () => {
      const mockBACnetClient = {
        checkConnectivity: vi.fn().mockResolvedValue(false),
        readPropertyMultiple: vi.fn(),
      } as any;

      const mockDatabase = {};

      mockDeviceRegisterCache.getDeviceRegisters.mockReturnValue([
        { register_id: 1, register: 0, field_name: 'power_a', unit: 'W' },
      ]);

      // Execute first cycle
      const result1 = await manager.executeCycle(
        mockBACnetClient,
        mockDatabase,
        5000
      );

      const firstCycleTimeouts = result1.timeoutMetrics?.totalTimeouts || 0;

      // Execute second cycle
      const result2 = await manager.executeCycle(
        mockBACnetClient,
        mockDatabase,
        5000
      );

      const secondCycleTimeouts = result2.timeoutMetrics?.totalTimeouts || 0;

      // Second cycle should have same number of timeouts (not accumulated)
      expect(secondCycleTimeouts).toBe(firstCycleTimeouts);
    });
  });
});
