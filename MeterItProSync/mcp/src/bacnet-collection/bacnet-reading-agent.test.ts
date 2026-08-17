import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BACnetMeterReadingAgent } from './bacnet-reading-agent';
import { MeterCache, DeviceRegisterCache } from '../cache/index.js';
import { CollectionCycleResult, TimeoutEvent } from './types.js';

describe('BACnet Reading Agent Status', () => {
  let agent: BACnetMeterReadingAgent;
  let mockLogger: any;
  let mockDatabase: any;
  let mockMeterCache: any;
  let mockDeviceRegisterCache: any;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    // Create mock database
    mockDatabase = {};

    // Create mock meter cache
    mockMeterCache = {
      isValid: vi.fn().mockReturnValue(true),
      getMeters: vi.fn().mockReturnValue([]),
      reload: vi.fn(),
      clear: vi.fn(),
    };

    // Create mock device register cache
    mockDeviceRegisterCache = {
      isValid: vi.fn().mockReturnValue(true),
      initialize: vi.fn(),
      getDeviceRegisters: vi.fn().mockReturnValue([]),
    };

    // Create agent with mocked dependencies
    agent = new BACnetMeterReadingAgent(
      {
        syncDatabase: mockDatabase,
        collectionIntervalSeconds: 60,
        enableAutoStart: false,
        meterCache: mockMeterCache,
        deviceRegisterCache: mockDeviceRegisterCache,
      },
      mockLogger
    );
  });

  describe('Unit Tests for Agent Status Metrics', () => {
    it('should include timeout metrics in agent status', () => {
      // Test that timeout metrics are included in status
      const status = agent.getStatus();

      expect(status.timeoutMetrics).toBeDefined();
      expect(status.timeoutMetrics?.totalTimeouts).toBe(0);
      expect(status.timeoutMetrics?.timeoutsByMeter).toBeDefined();
      expect(status.timeoutMetrics?.averageTimeoutRecoveryMs).toBe(0);
      expect(Array.isArray(status.timeoutMetrics?.timeoutEvents)).toBe(true);
    });

    it('should include offline meters in agent status', () => {
      // Test that offline meters field is included in status
      const status = agent.getStatus();

      expect(status.offlineMeters).toBeDefined();
      expect(Array.isArray(status.offlineMeters)).toBe(true);
      expect(status.offlineMeters.length).toBe(0);
    });

    it('should track offline meter status with consecutive failures', () => {
      // Create a mock cycle result with connectivity error
      const cycleResult: CollectionCycleResult = {
        cycleId: 'test-cycle-1',
        startTime: new Date(),
        endTime: new Date(),
        metersProcessed: 1,
        readingsCollected: 0,
        errors: [
          {
            meterId: '1',
            operation: 'connectivity',
            error: 'Meter offline',
            timestamp: new Date(),
          },
        ],
        success: false,
        timeoutMetrics: {
          totalTimeouts: 0,
          timeoutsByMeter: {},
          averageTimeoutRecoveryMs: 0,
          timeoutEvents: [],
        },
      };

      // Simulate cycle execution by calling private method through reflection
      // We'll test this by checking the status after a cycle
      const agent2 = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          collectionIntervalSeconds: 60,
          enableAutoStart: false,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      // Access private method through type casting
      const agentAny = agent2 as any;
      agentAny.updateOfflineMetersFromCycle(cycleResult);

      const status = agent2.getStatus();

      expect(status.offlineMeters.length).toBe(1);
      expect(status.offlineMeters[0].meterId).toBe('1');
      expect(status.offlineMeters[0].consecutiveFailures).toBe(1);
      expect(status.offlineMeters[0].offlineSince).toBeDefined();
      expect(status.offlineMeters[0].lastCheckedAt).toBeDefined();
    });

    it('should increment consecutive failures for repeatedly offline meters', () => {
      const agent2 = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          collectionIntervalSeconds: 60,
          enableAutoStart: false,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent2 as any;

      // First cycle - meter goes offline
      const cycleResult1: CollectionCycleResult = {
        cycleId: 'test-cycle-1',
        startTime: new Date(),
        endTime: new Date(),
        metersProcessed: 1,
        readingsCollected: 0,
        errors: [
          {
            meterId: '1',
            operation: 'connectivity',
            error: 'Meter offline',
            timestamp: new Date(),
          },
        ],
        success: false,
        timeoutMetrics: {
          totalTimeouts: 0,
          timeoutsByMeter: {},
          averageTimeoutRecoveryMs: 0,
          timeoutEvents: [],
        },
      };

      agentAny.updateOfflineMetersFromCycle(cycleResult1);

      let status = agent2.getStatus();
      expect(status.offlineMeters[0].consecutiveFailures).toBe(1);

      // Second cycle - meter still offline
      const cycleResult2: CollectionCycleResult = {
        cycleId: 'test-cycle-2',
        startTime: new Date(),
        endTime: new Date(),
        metersProcessed: 1,
        readingsCollected: 0,
        errors: [
          {
            meterId: '1',
            operation: 'connectivity',
            error: 'Meter offline',
            timestamp: new Date(),
          },
        ],
        success: false,
        timeoutMetrics: {
          totalTimeouts: 0,
          timeoutsByMeter: {},
          averageTimeoutRecoveryMs: 0,
          timeoutEvents: [],
        },
      };

      agentAny.updateOfflineMetersFromCycle(cycleResult2);

      status = agent2.getStatus();
      expect(status.offlineMeters[0].consecutiveFailures).toBe(2);
    });

    it('should track offline meters from timeout events', () => {
      const agent2 = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          collectionIntervalSeconds: 60,
          enableAutoStart: false,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent2 as any;

      // Create a cycle result with offline timeout events
      const timeoutEvent: TimeoutEvent = {
        meterId: '2',
        timestamp: new Date(),
        registerCount: 0,
        batchSize: 0,
        timeoutMs: 5000,
        recoveryMethod: 'offline',
        success: false,
      };

      const cycleResult: CollectionCycleResult = {
        cycleId: 'test-cycle-1',
        startTime: new Date(),
        endTime: new Date(),
        metersProcessed: 1,
        readingsCollected: 0,
        errors: [],
        success: false,
        timeoutMetrics: {
          totalTimeouts: 1,
          timeoutsByMeter: { '2': 1 },
          averageTimeoutRecoveryMs: 5000,
          timeoutEvents: [timeoutEvent],
        },
      };

      agentAny.updateOfflineMetersFromCycle(cycleResult);

      const status = agent2.getStatus();

      expect(status.offlineMeters.length).toBe(1);
      expect(status.offlineMeters[0].meterId).toBe('2');
      expect(status.offlineMeters[0].consecutiveFailures).toBe(1);
    });

    it('should track multiple offline meters', () => {
      const agent2 = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          collectionIntervalSeconds: 60,
          enableAutoStart: false,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent2 as any;

      // Create a cycle result with multiple offline meters
      const cycleResult: CollectionCycleResult = {
        cycleId: 'test-cycle-1',
        startTime: new Date(),
        endTime: new Date(),
        metersProcessed: 2,
        readingsCollected: 0,
        errors: [
          {
            meterId: '1',
            operation: 'connectivity',
            error: 'Meter offline',
            timestamp: new Date(),
          },
          {
            meterId: '2',
            operation: 'connectivity',
            error: 'Meter offline',
            timestamp: new Date(),
          },
        ],
        success: false,
        timeoutMetrics: {
          totalTimeouts: 0,
          timeoutsByMeter: {},
          averageTimeoutRecoveryMs: 0,
          timeoutEvents: [],
        },
      };

      agentAny.updateOfflineMetersFromCycle(cycleResult);

      const status = agent2.getStatus();

      expect(status.offlineMeters.length).toBe(2);
      expect(status.offlineMeters.map((m) => m.meterId).sort()).toEqual(['1', '2']);
    });

    it('should maintain offline meter timestamps', () => {
      const agent2 = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          collectionIntervalSeconds: 60,
          enableAutoStart: false,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent2 as any;

      const beforeTime = new Date();

      const cycleResult: CollectionCycleResult = {
        cycleId: 'test-cycle-1',
        startTime: new Date(),
        endTime: new Date(),
        metersProcessed: 1,
        readingsCollected: 0,
        errors: [
          {
            meterId: '1',
            operation: 'connectivity',
            error: 'Meter offline',
            timestamp: new Date(),
          },
        ],
        success: false,
        timeoutMetrics: {
          totalTimeouts: 0,
          timeoutsByMeter: {},
          averageTimeoutRecoveryMs: 0,
          timeoutEvents: [],
        },
      };

      agentAny.updateOfflineMetersFromCycle(cycleResult);

      const afterTime = new Date();
      const status = agent2.getStatus();

      expect(status.offlineMeters[0].offlineSince).toBeDefined();
      expect(status.offlineMeters[0].offlineSince!.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      );
      expect(status.offlineMeters[0].offlineSince!.getTime()).toBeLessThanOrEqual(
        afterTime.getTime()
      );

      expect(status.offlineMeters[0].lastCheckedAt).toBeDefined();
      expect(status.offlineMeters[0].lastCheckedAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      );
      expect(status.offlineMeters[0].lastCheckedAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime()
      );
    });

    it('should return empty offline meters list when no meters are offline', () => {
      const status = agent.getStatus();

      expect(status.offlineMeters).toBeDefined();
      expect(Array.isArray(status.offlineMeters)).toBe(true);
      expect(status.offlineMeters.length).toBe(0);
    });

    it('should include all required fields in offline meter status', () => {
      const agent2 = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          collectionIntervalSeconds: 60,
          enableAutoStart: false,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent2 as any;

      const cycleResult: CollectionCycleResult = {
        cycleId: 'test-cycle-1',
        startTime: new Date(),
        endTime: new Date(),
        metersProcessed: 1,
        readingsCollected: 0,
        errors: [
          {
            meterId: '1',
            operation: 'connectivity',
            error: 'Meter offline',
            timestamp: new Date(),
          },
        ],
        success: false,
        timeoutMetrics: {
          totalTimeouts: 0,
          timeoutsByMeter: {},
          averageTimeoutRecoveryMs: 0,
          timeoutEvents: [],
        },
      };

      agentAny.updateOfflineMetersFromCycle(cycleResult);

      const status = agent2.getStatus();
      const offlineMeter = status.offlineMeters[0];

      expect(offlineMeter.meterId).toBeDefined();
      expect(typeof offlineMeter.meterId).toBe('string');
      expect(offlineMeter.lastCheckedAt).toBeDefined();
      expect(offlineMeter.lastCheckedAt instanceof Date).toBe(true);
      expect(offlineMeter.consecutiveFailures).toBeDefined();
      expect(typeof offlineMeter.consecutiveFailures).toBe('number');
      expect(offlineMeter.offlineSince).toBeDefined();
      expect(offlineMeter.offlineSince instanceof Date).toBe(true);
    });
  });
});


describe('BACnet Reading Agent Configuration', () => {
  let mockLogger: any;
  let mockDatabase: any;
  let mockMeterCache: any;
  let mockDeviceRegisterCache: any;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    // Create mock database
    mockDatabase = {};

    // Create mock meter cache
    mockMeterCache = {
      isValid: vi.fn().mockReturnValue(true),
      getMeters: vi.fn().mockReturnValue([]),
      reload: vi.fn(),
      clear: vi.fn(),
    };

    // Create mock device register cache
    mockDeviceRegisterCache = {
      isValid: vi.fn().mockReturnValue(true),
      initialize: vi.fn(),
      getDeviceRegisters: vi.fn().mockReturnValue([]),
    };
  });

  describe('Unit Tests for Configuration', () => {
    it('should apply default timeout configuration when not specified', () => {
      const agent = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent as any;
      const config = agentAny.config;

      expect(config.batchReadTimeoutMs).toBe(5000);
      expect(config.sequentialReadTimeoutMs).toBe(3000);
      expect(config.connectivityCheckTimeoutMs).toBe(2000);
      expect(config.connectionTimeoutMs).toBe(5000);
    });

    it('should apply custom timeout configuration when specified', () => {
      const agent = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          batchReadTimeoutMs: 7000,
          sequentialReadTimeoutMs: 4000,
          connectivityCheckTimeoutMs: 3000,
          connectionTimeoutMs: 6000,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent as any;
      const config = agentAny.config;

      expect(config.batchReadTimeoutMs).toBe(7000);
      expect(config.sequentialReadTimeoutMs).toBe(4000);
      expect(config.connectivityCheckTimeoutMs).toBe(3000);
      expect(config.connectionTimeoutMs).toBe(6000);
    });

    it('should apply default feature flags when not specified', () => {
      const agent = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent as any;
      const config = agentAny.config;

      expect(config.enableConnectivityCheck).toBe(true);
      expect(config.enableSequentialFallback).toBe(true);
      expect(config.adaptiveBatchSizing).toBe(true);
    });

    it('should apply custom feature flags when specified', () => {
      const agent = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          enableConnectivityCheck: false,
          enableSequentialFallback: false,
          adaptiveBatchSizing: false,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent as any;
      const config = agentAny.config;

      expect(config.enableConnectivityCheck).toBe(false);
      expect(config.enableSequentialFallback).toBe(false);
      expect(config.adaptiveBatchSizing).toBe(false);
    });

    it('should apply mixed feature flag configuration', () => {
      const agent = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          enableConnectivityCheck: true,
          enableSequentialFallback: false,
          adaptiveBatchSizing: true,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent as any;
      const config = agentAny.config;

      expect(config.enableConnectivityCheck).toBe(true);
      expect(config.enableSequentialFallback).toBe(false);
      expect(config.adaptiveBatchSizing).toBe(true);
    });

    it('should apply default collection configuration when not specified', () => {
      const agent = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent as any;
      const config = agentAny.config;

      expect(config.collectionIntervalSeconds).toBe(60);
      expect(config.enableAutoStart).toBe(true);
    });

    it('should apply custom collection configuration when specified', () => {
      const agent = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          collectionIntervalSeconds: 120,
          enableAutoStart: false,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent as any;
      const config = agentAny.config;

      expect(config.collectionIntervalSeconds).toBe(120);
      expect(config.enableAutoStart).toBe(false);
    });

    it('should apply default BACnet network configuration when not specified', () => {
      const agent = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent as any;
      const config = agentAny.config;

      expect(config.bacnetInterface).toBe('0.0.0.0');
      expect(config.bacnetPort).toBe(47808);
    });

    it('should apply custom BACnet network configuration when specified', () => {
      const agent = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          bacnetInterface: '192.168.1.100',
          bacnetPort: 47809,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent as any;
      const config = agentAny.config;

      expect(config.bacnetInterface).toBe('192.168.1.100');
      expect(config.bacnetPort).toBe(47809);
    });

    it('should merge partial configuration with defaults', () => {
      const agent = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          batchReadTimeoutMs: 8000,
          enableConnectivityCheck: false,
          collectionIntervalSeconds: 90,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent as any;
      const config = agentAny.config;

      // Custom values
      expect(config.batchReadTimeoutMs).toBe(8000);
      expect(config.enableConnectivityCheck).toBe(false);
      expect(config.collectionIntervalSeconds).toBe(90);

      // Default values
      expect(config.sequentialReadTimeoutMs).toBe(3000);
      expect(config.enableSequentialFallback).toBe(true);
      expect(config.bacnetInterface).toBe('0.0.0.0');
    });

    it('should pass timeout configuration to BACnet client', () => {
      const agent = new BACnetMeterReadingAgent(
        {
          syncDatabase: mockDatabase,
          batchReadTimeoutMs: 6000,
          sequentialReadTimeoutMs: 4000,
          connectivityCheckTimeoutMs: 2500,
          connectionTimeoutMs: 5500,
          meterCache: mockMeterCache,
          deviceRegisterCache: mockDeviceRegisterCache,
        },
        mockLogger
      );

      const agentAny = agent as any;
      const bacnetClient = agentAny.bacnetClient;

      // BACnet client should have received the timeout configuration
      expect(bacnetClient).toBeDefined();
      // The client stores these as private fields, so we can't directly verify
      // but we can verify the agent has the correct config
      const config = agentAny.config;
      expect(config.batchReadTimeoutMs).toBe(6000);
      expect(config.sequentialReadTimeoutMs).toBe(4000);
      expect(config.connectivityCheckTimeoutMs).toBe(2500);
      expect(config.connectionTimeoutMs).toBe(5500);
    });
  });
});
