/**
 * Integration tests for threading infrastructure
 * These tests verify that the components work together correctly
 */

import { ThreadManager } from '../ThreadManager.js';
import { MessageHandler } from '../MessageHandler.js';
import { createWorkerLogger } from '../worker-logger.js';

describe('Threading Infrastructure Integration', () => {
  let threadManager;
  let messageHandler;
  let logger;

  beforeAll(() => {
    logger = createWorkerLogger('integration-test');
  });

  beforeEach(() => {
    messageHandler = new MessageHandler();
    threadManager = new ThreadManager({
      maxRestartAttempts: 2,
      restartDelay: 500,
      healthCheckInterval: 2000,
      messageTimeout: 5000
    });
  });

  afterEach(async () => {
    if (threadManager && threadManager.isWorkerRunning()) {
      await threadManager.stopWorker();
    }
  });

  describe('Message Handler Integration', () => {
    test('should create and validate messages correctly', () => {
      const messageData = {
        type: 'ping',
        payload: { test: 'data' }
      };

      const message = messageHandler.createMessage(messageData);
      
      expect(messageHandler.validateMessage(message)).toBe(true);
      expect(message).toHaveProperty('type', 'ping');
      expect(message).toHaveProperty('requestId');
      expect(message).toHaveProperty('timestamp');
    });

    test('should serialize and deserialize messages', () => {
      const originalMessage = {
        type: 'status',
        requestId: 'test-123',
        payload: { data: { nested: 'value' } }
      };

      const serialized = messageHandler.serializeMessage(originalMessage);
      const deserialized = messageHandler.deserializeMessage(serialized);

      expect(deserialized).toEqual(originalMessage);
    });

    test('should handle pending message lifecycle', (done) => {
      const requestId = 'test-pending-123';
      const expectedResponse = { type: 'success', data: 'test' };

      messageHandler.addPendingMessage(
        requestId,
        (response) => {
          expect(response).toEqual(expectedResponse);
          done();
        },
        (error) => {
          done(error);
        }
      );

      // Simulate response
      setTimeout(() => {
        messageHandler.resolvePendingMessage(requestId, expectedResponse);
      }, 10);
    });
  });

  describe('Thread Manager Configuration', () => {
    test('should initialize with custom configuration', () => {
      const customConfig = {
        maxRestartAttempts: 5,
        restartDelay: 2000,
        healthCheckInterval: 10000,
        messageTimeout: 15000
      };

      const customManager = new ThreadManager(customConfig);
      expect(customManager).toBeDefined();
    });

    test('should handle worker status when not running', async () => {
      const status = await threadManager.getWorkerStatus();
      
      expect(status).toHaveProperty('isRunning', false);
      expect(status).toHaveProperty('error');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle invalid message gracefully', () => {
      const invalidMessage = { type: 'invalid' }; // Missing requestId

      expect(messageHandler.validateMessage(invalidMessage)).toBe(false);
    });

    test('should handle serialization errors', () => {
      const circularObj = {};
      circularObj.self = circularObj;

      const message = {
        type: 'error',
        payload: circularObj,
        requestId: 'test-circular'
      };

      expect(() => {
        messageHandler.serializeMessage(message);
      }).toThrow();
    });

    test('should handle message timeout', (done) => {
      const requestId = 'test-timeout-123';

      messageHandler.addPendingMessage(
        requestId,
        () => {
          done(new Error('Should not resolve'));
        },
        (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('timeout');
          done();
        },
        50 // Short timeout for test
      );

      // Don't resolve the message - let it timeout
    });
  });

  describe('Component Interaction', () => {
    test('should create compatible messages between components', () => {
      // Create message with MessageHandler
      const messageData = {
        type: 'ping',
        payload: { timestamp: Date.now() }
      };

      const message = messageHandler.createMessage(messageData);
      
      // Serialize for transmission
      const serialized = messageHandler.serializeMessage(message);
      
      // Deserialize as if received
      const received = messageHandler.deserializeMessage(serialized);
      
      // Validate received message
      expect(messageHandler.validateMessage(received)).toBe(true);
      expect(received.type).toBe('ping');
      expect(received.requestId).toBe(message.requestId);
    });

    test('should handle message queue operations', () => {
      const requestId1 = 'req-1';
      const requestId2 = 'req-2';

      messageHandler.addPendingMessage(requestId1, jest.fn(), jest.fn());
      messageHandler.addPendingMessage(requestId2, jest.fn(), jest.fn());

      expect(messageHandler.hasPendingMessage(requestId1)).toBe(true);
      expect(messageHandler.hasPendingMessage(requestId2)).toBe(true);

      messageHandler.clearPendingMessages();

      expect(messageHandler.hasPendingMessage(requestId1)).toBe(false);
      expect(messageHandler.hasPendingMessage(requestId2)).toBe(false);
    });
  });

  describe('Logging Integration', () => {
    test('should create worker logger successfully', () => {
      const testLogger = createWorkerLogger('test-logger');
      
      expect(testLogger).toBeDefined();
      expect(typeof testLogger.info).toBe('function');
      expect(typeof testLogger.error).toBe('function');
      expect(typeof testLogger.debug).toBe('function');
      expect(typeof testLogger.warn).toBe('function');
    });

    test('should log messages without errors', () => {
      const testLogger = createWorkerLogger('test-logger-2');
      
      expect(() => {
        testLogger.info('Test info message');
        testLogger.error('Test error message');
        testLogger.debug('Test debug message');
        testLogger.warn('Test warning message');
      }).not.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    test('should handle missing configuration gracefully', () => {
      const defaultManager = new ThreadManager();
      expect(defaultManager).toBeDefined();
      expect(defaultManager.isWorkerRunning()).toBe(false);
    });

    test('should handle partial configuration', () => {
      const partialConfig = {
        maxRestartAttempts: 3
        // Missing other config options
      };

      const partialManager = new ThreadManager(partialConfig);
      expect(partialManager).toBeDefined();
    });
  });

  describe('Resource Management', () => {
    test('should clean up resources properly', async () => {
      const manager = new ThreadManager();
      
      // Should not throw when stopping non-running worker
      await expect(manager.stopWorker()).resolves.not.toThrow();
    });

    test('should handle multiple cleanup calls', async () => {
      const manager = new ThreadManager();
      
      await manager.stopWorker();
      await manager.stopWorker(); // Second call should be safe
      
      expect(manager.isWorkerRunning()).toBe(false);
    });
  });
});