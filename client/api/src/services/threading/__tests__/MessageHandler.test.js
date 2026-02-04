/**
 * Unit tests for MessageHandler
 */

import { MessageHandler } from '../MessageHandler.js';
import { jest } from '@jest/globals';

describe('MessageHandler', () => {
  let messageHandler;

  beforeEach(() => {
    messageHandler = new MessageHandler();
  });

  describe('constructor', () => {
    test('should initialize with default configuration', () => {
      expect(messageHandler).toBeDefined();
    });

    test('should initialize with custom configuration', () => {
      const customConfig = {
        maxQueueSize: 200,
        defaultTimeout: 15000
      };
      
      const handler = new MessageHandler(customConfig);
      expect(handler).toBeDefined();
    });
  });

  describe('generateRequestId', () => {
    test('should generate unique request IDs', () => {
      const id1 = messageHandler.generateRequestId();
      const id2 = messageHandler.generateRequestId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    test('should generate IDs with correct format', () => {
      const id = messageHandler.generateRequestId();
      
      // Should be a UUID-like format or timestamp-based
      expect(id.length).toBeGreaterThan(10);
    });
  });

  describe('createMessage', () => {
    test('should create message with required fields', () => {
      const messageData = {
        type: 'ping',
        payload: { test: 'data' }
      };

      const message = messageHandler.createMessage(messageData);
      
      expect(message).toHaveProperty('type', 'ping');
      expect(message).toHaveProperty('payload', { test: 'data' });
      expect(message).toHaveProperty('requestId');
      expect(message).toHaveProperty('timestamp');
    });

    test('should create message without payload', () => {
      const messageData = {
        type: 'status'
      };

      const message = messageHandler.createMessage(messageData);
      
      expect(message).toHaveProperty('type', 'status');
      expect(message).toHaveProperty('requestId');
      expect(message).toHaveProperty('timestamp');
      expect(message.payload).toBeUndefined();
    });

    test('should use provided requestId if given', () => {
      const messageData = {
        type: 'ping',
        requestId: 'custom-id-123'
      };

      const message = messageHandler.createMessage(messageData);
      
      expect(message.requestId).toBe('custom-id-123');
    });
  });

  describe('serializeMessage', () => {
    test('should serialize message to JSON string', () => {
      const message = {
        type: 'ping',
        requestId: 'test-123',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const serialized = messageHandler.serializeMessage(message);
      
      expect(typeof serialized).toBe('string');
      expect(JSON.parse(serialized)).toEqual(message);
    });

    test('should handle complex payload serialization', () => {
      const message = {
        type: 'data',
        payload: {
          nested: {
            array: [1, 2, 3],
            object: { key: 'value' }
          }
        },
        requestId: 'test-complex'
      };

      const serialized = messageHandler.serializeMessage(message);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized).toEqual(message);
    });

    test('should handle serialization errors gracefully', () => {
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
  });

  describe('deserializeMessage', () => {
    test('should deserialize JSON string to message object', () => {
      const originalMessage = {
        type: 'pong',
        requestId: 'test-456',
        timestamp: '2023-01-01T00:00:00.000Z',
        payload: { data: 'test' }
      };

      const serialized = JSON.stringify(originalMessage);
      const deserialized = messageHandler.deserializeMessage(serialized);
      
      expect(deserialized).toEqual(originalMessage);
    });

    test('should handle already deserialized objects', () => {
      const message = {
        type: 'status',
        requestId: 'test-789'
      };

      const result = messageHandler.deserializeMessage(message);
      
      expect(result).toEqual(message);
    });

    test('should handle invalid JSON gracefully', () => {
      const invalidJson = '{ invalid json }';
      
      expect(() => {
        messageHandler.deserializeMessage(invalidJson);
      }).toThrow();
    });
  });

  describe('validateMessage', () => {
    test('should validate correct message structure', () => {
      const validMessage = {
        type: 'ping',
        requestId: 'test-123',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const isValid = messageHandler.validateMessage(validMessage);
      
      expect(isValid).toBe(true);
    });

    test('should reject message without type', () => {
      const invalidMessage = {
        requestId: 'test-123',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const isValid = messageHandler.validateMessage(invalidMessage);
      
      expect(isValid).toBe(false);
    });

    test('should reject message without requestId', () => {
      const invalidMessage = {
        type: 'ping',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const isValid = messageHandler.validateMessage(invalidMessage);
      
      expect(isValid).toBe(false);
    });

    test('should accept message with valid payload', () => {
      const validMessage = {
        type: 'data',
        requestId: 'test-456',
        timestamp: '2023-01-01T00:00:00.000Z',
        payload: { key: 'value' }
      };

      const isValid = messageHandler.validateMessage(validMessage);
      
      expect(isValid).toBe(true);
    });
  });

  describe('addPendingMessage', () => {
    test('should add message to pending queue', () => {
      const requestId = 'test-pending-123';
      const resolve = jest.fn();
      const reject = jest.fn();

      messageHandler.addPendingMessage(requestId, resolve, reject);
      
      expect(messageHandler.hasPendingMessage(requestId)).toBe(true);
    });

    test('should handle queue size limits', () => {
      // Set small queue size for testing
      messageHandler._config = { maxQueueSize: 2, defaultTimeout: 5000 };
      
      // Add messages up to limit
      messageHandler.addPendingMessage('msg1', jest.fn(), jest.fn());
      messageHandler.addPendingMessage('msg2', jest.fn(), jest.fn());
      
      // Adding third message should handle queue full scenario
      expect(() => {
        messageHandler.addPendingMessage('msg3', jest.fn(), jest.fn());
      }).not.toThrow(); // Should handle gracefully
    });
  });

  describe('resolvePendingMessage', () => {
    test('should resolve pending message with response', () => {
      const requestId = 'test-resolve-123';
      const resolve = jest.fn();
      const reject = jest.fn();
      const response = { type: 'success', data: 'test' };

      messageHandler.addPendingMessage(requestId, resolve, reject);
      messageHandler.resolvePendingMessage(requestId, response);
      
      expect(resolve).toHaveBeenCalledWith(response);
      expect(reject).not.toHaveBeenCalled();
      expect(messageHandler.hasPendingMessage(requestId)).toBe(false);
    });

    test('should handle resolving non-existent message', () => {
      const response = { type: 'success', data: 'test' };
      
      // Should not throw when resolving non-existent message
      expect(() => {
        messageHandler.resolvePendingMessage('non-existent', response);
      }).not.toThrow();
    });
  });

  describe('rejectPendingMessage', () => {
    test('should reject pending message with error', () => {
      const requestId = 'test-reject-123';
      const resolve = jest.fn();
      const reject = jest.fn();
      const error = new Error('Test error');

      messageHandler.addPendingMessage(requestId, resolve, reject);
      messageHandler.rejectPendingMessage(requestId, error);
      
      expect(reject).toHaveBeenCalledWith(error);
      expect(resolve).not.toHaveBeenCalled();
      expect(messageHandler.hasPendingMessage(requestId)).toBe(false);
    });
  });

  describe('hasPendingMessage', () => {
    test('should return true for existing pending message', () => {
      const requestId = 'test-exists-123';
      messageHandler.addPendingMessage(requestId, jest.fn(), jest.fn());
      
      expect(messageHandler.hasPendingMessage(requestId)).toBe(true);
    });

    test('should return false for non-existent pending message', () => {
      expect(messageHandler.hasPendingMessage('non-existent')).toBe(false);
    });
  });

  describe('clearPendingMessages', () => {
    test('should clear all pending messages', () => {
      messageHandler.addPendingMessage('msg1', jest.fn(), jest.fn());
      messageHandler.addPendingMessage('msg2', jest.fn(), jest.fn());
      
      expect(messageHandler.hasPendingMessage('msg1')).toBe(true);
      expect(messageHandler.hasPendingMessage('msg2')).toBe(true);
      
      messageHandler.clearPendingMessages();
      
      expect(messageHandler.hasPendingMessage('msg1')).toBe(false);
      expect(messageHandler.hasPendingMessage('msg2')).toBe(false);
    });

    test('should reject all pending messages when clearing', () => {
      const reject1 = jest.fn();
      const reject2 = jest.fn();
      
      messageHandler.addPendingMessage('msg1', jest.fn(), reject1);
      messageHandler.addPendingMessage('msg2', jest.fn(), reject2);
      
      messageHandler.clearPendingMessages();
      
      expect(reject1).toHaveBeenCalledWith(expect.any(Error));
      expect(reject2).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('timeout handling', () => {
    test('should handle message timeouts', (done) => {
      const requestId = 'test-timeout-123';
      const resolve = jest.fn();
      const reject = jest.fn();
      
      // Set short timeout for testing
      messageHandler._config = { maxQueueSize: 100, defaultTimeout: 50 };
      
      messageHandler.addPendingMessage(requestId, resolve, reject, 50);
      
      setTimeout(() => {
        expect(reject).toHaveBeenCalledWith(expect.any(Error));
        expect(messageHandler.hasPendingMessage(requestId)).toBe(false);
        done();
      }, 100);
    });
  });
});