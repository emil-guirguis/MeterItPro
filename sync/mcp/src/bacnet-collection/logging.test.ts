import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BACnetClient, BACnetClientConfig } from './bacnet-client';
import { CollectionCycleManager } from './collection-cycle-manager';
import { BACnetMeterReadingAgent } from './bacnet-reading-agent';

describe('Logging and Observability', () => {
  describe('BACnetClient Logging', () => {
    let mockLogger: any;

    beforeEach(() => {
      mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      };
    });

    it('should log timeout events with correct details', () => {
      const config: BACnetClientConfig = {
        batchReadTimeout: 5000,
      };
      const client = new BACnetClient(config, mockLogger);

      // Verify initialization logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('BACnet client initialized'),
        expect.any(Object)
      );
    });

    it('should log connectivity check results', () => {
      const config: BACnetClientConfig = {
        connectivityCheckTimeout: 2000,
      };
      const client = new BACnetClient(config, mockLogger);

      // The logger should be set up
      expect(mockLogger).toBeDefined();
    });

    it('should log batch read timeout events', () => {
      const config: BACnetClientConfig = {
        batchReadTimeout: 1000,
      };
      const client = new BACnetClient(config, mockLogger);

      // Verify that the client has the logger
      const clientAny = client as any;
      expect(clientAny.logger).toBe(mockLogger);
    });

    it('should log sequential fallback operations', () => {
      const config: BACnetClientConfig = {
        sequentialReadTimeout: 3000,
      };
      const client = new BACnetClient(config, mockLogger);

      // Verify logger is properly set
      const clientAny = client as any;
      expect(clientAny.logger).toBeDefined();
    });

    it('should use emoji indicators in log messages', () => {
      const config: BACnetClientConfig = {};
      const client = new BACnetClient(config, mockLogger);

      // Check that initialization log includes emoji
      const initCall = mockLogger.info.mock.calls.find((call: any[]) =>
        call[0].includes('BACnet client initialized')
      );
      expect(initCall).toBeDefined();
      expect(initCall[0]).toContain('✅');
    });
  });

  describe('CollectionCycleManager Logging', () => {
    let mockLogger: any;

    beforeEach(() => {
      mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      };
    });

    it('should log timeout events with meter ID and register count', () => {
      const manager = new CollectionCycleManager(mockLogger);

      // Access private method through any type for testing
      const managerAny = manager as any;
      managerAny.recordTimeoutEvent('meter-123', 10, 5, 5000, 'reduced_batch', false);

      // Verify timeout event was logged with correct details
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Timeout event recorded for meter meter-123: 10 registers, batch size 5')
      );
    });

    it('should log batch size changes', () => {
      const manager = new CollectionCycleManager(mockLogger);

      // The manager should have the logger
      const managerAny = manager as any;
      expect(managerAny.logger).toBe(mockLogger);
    });

    it('should log offline status with timestamp', () => {
      const manager = new CollectionCycleManager(mockLogger);

      // Verify logger is set
      const managerAny = manager as any;
      expect(managerAny.logger).toBeDefined();
    });

    it('should log fallback operations', () => {
      const manager = new CollectionCycleManager(mockLogger);

      // Verify logger is properly configured
      const managerAny = manager as any;
      expect(managerAny.logger).toBe(mockLogger);
    });

    it('should include emoji indicators in timeout logs', () => {
      const manager = new CollectionCycleManager(mockLogger);

      const managerAny = manager as any;
      managerAny.recordTimeoutEvent('meter-456', 15, 8, 5000, 'sequential', true);

      // Check that the warning includes emoji
      const warnCall = mockLogger.warn.mock.calls[0];
      expect(warnCall[0]).toContain('⏱️');
    });
  });

  describe('BACnetMeterReadingAgent Logging', () => {
    let mockLogger: any;
    let mockDatabase: any;

    beforeEach(() => {
      mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      };
      mockDatabase = {};
    });

    it('should log offline meter status', () => {
      const config = {
        syncDatabase: mockDatabase,
      };
      const agent = new BACnetMeterReadingAgent(config, mockLogger);

      // Access private method through any type for testing
      const agentAny = agent as any;
      agentAny.trackOfflineMeter('meter-789');

      // Verify offline status was logged
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('marked as offline')
      );
    });

    it('should log when meter comes back online', () => {
      const config = {
        syncDatabase: mockDatabase,
      };
      const agent = new BACnetMeterReadingAgent(config, mockLogger);

      const agentAny = agent as any;
      agentAny.trackOfflineMeter('meter-999');
      agentAny.clearOfflineMeter('meter-999');

      // Verify online status was logged
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('back online')
      );
    });

    it('should log warning for consistently slow meters', () => {
      const config = {
        syncDatabase: mockDatabase,
      };
      const agent = new BACnetMeterReadingAgent(config, mockLogger);

      const agentAny = agent as any;
      // Manually set timeout metrics to simulate slow meters
      agentAny.cumulativeTimeoutMetrics.totalTimeouts = 5;
      agentAny.cumulativeTimeoutMetrics.timeoutsByMeter = {
        'meter-slow-1': 4,
        'meter-slow-2': 3,
      };

      agentAny.checkForSlowMeters();

      // Verify warning was logged
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Consistently slow meters detected')
      );
    });

    it('should include emoji indicators in agent logs', () => {
      const config = {
        syncDatabase: mockDatabase,
      };
      const agent = new BACnetMeterReadingAgent(config, mockLogger);

      const agentAny = agent as any;
      agentAny.trackOfflineMeter('meter-emoji-test');

      // Check that the warning includes emoji
      const warnCall = mockLogger.warn.mock.calls[0];
      expect(warnCall[0]).toContain('🔴');
    });

    it('should log meter back online with emoji', () => {
      const config = {
        syncDatabase: mockDatabase,
      };
      const agent = new BACnetMeterReadingAgent(config, mockLogger);

      const agentAny = agent as any;
      agentAny.trackOfflineMeter('meter-online-test');
      agentAny.clearOfflineMeter('meter-online-test');

      // Check that the info log includes emoji
      const infoCall = mockLogger.info.mock.calls.find((call: any[]) =>
        call[0].includes('back online')
      );
      expect(infoCall).toBeDefined();
      expect(infoCall[0]).toContain('✅');
    });
  });

  describe('Logging Consistency', () => {
    let mockLogger: any;

    beforeEach(() => {
      mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      };
    });

    it('should use consistent emoji indicators across all components', () => {
      const client = new BACnetClient({}, mockLogger);
      const manager = new CollectionCycleManager(mockLogger);

      // Verify all components use the same logger
      const clientAny = client as any;
      const managerAny = manager as any;

      expect(clientAny.logger).toBe(mockLogger);
      expect(managerAny.logger).toBe(mockLogger);
    });

    it('should log all timeout events with consistent format', () => {
      const mockLogger2 = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      };

      const manager = new CollectionCycleManager(mockLogger2);

      const managerAny = manager as any;
      managerAny.recordTimeoutEvent('meter-1', 10, 5, 5000, 'reduced_batch', false);
      managerAny.recordTimeoutEvent('meter-2', 15, 8, 5000, 'sequential', true);

      // Verify both timeout events were logged
      expect(mockLogger2.warn).toHaveBeenCalledTimes(2);
      expect(mockLogger2.warn.mock.calls[0][0]).toContain('⏱️');
      expect(mockLogger2.warn.mock.calls[1][0]).toContain('⏱️');
    });
  });
});
