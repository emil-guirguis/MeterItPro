/**
 * Unit tests for ThreadManager
 */

import { ThreadManager } from '../ThreadManager.js';
import { jest } from '@jest/globals';

// Mock worker_threads module
const mockWorker = {
  postMessage: jest.fn(),
  terminate: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn()
};

const mockMessageChannel = {
  port1: {
    on: jest.fn(),
    postMessage: jest.fn(),
    close: jest.fn()
  },
  port2: {
    on: jest.fn(),
    postMessage: jest.fn(),
    close: jest.fn()
  }
};

jest.mock('worker_threads', () => ({
  Worker: jest.fn(() => mockWorker),
  MessageChannel: jest.fn(() => mockMessageChannel)
}));

describe('ThreadManager', () => {
  let threadManager;
  let mockConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    mockConfig = {
      maxRestartAttempts: 3,
      restartDelay: 1000,
      healthCheckInterval: 5000,
      messageTimeout: 10000
    };

    threadManager = new ThreadManager(mockConfig);
  });

  afterEach(async () => {
    // Clean up any running workers
    if (threadManager) {
      await threadManager.stopWorker();
    }
  });

  describe('constructor', () => {
    test('should initialize with default configuration', () => {
      const manager = new ThreadManager();
      expect(manager).toBeDefined();
    });

    test('should initialize with custom configuration', () => {
      const customConfig = {
        maxRestartAttempts: 5,
        restartDelay: 2000,
        healthCheckInterval: 10000,
        messageTimeout: 15000
      };
      
      const manager = new ThreadManager(customConfig);
      expect(manager).toBeDefined();
    });
  });

  describe('startWorker', () => {
    test('should start worker thread successfully', async () => {
      // Mock successful worker startup
      mockWorker.on.mockImplementation((event, callback) => {
        if (event === 'online') {
          setTimeout(() => callback(), 10);
        }
      });

      mockMessageChannel.port1.on.mockImplementation((event, callback) => {
        if (event === 'message') {
          setTimeout(() => callback(JSON.stringify({
            type: 'success',
            payload: { status: 'ready' }
          })), 20);
        }
      });

      await threadManager.startWorker();
      
      expect(threadManager.isWorkerRunning()).toBe(true);
    });

    test('should not start worker if already running', async () => {
      // Mock worker as already running
      threadManager._isRunning = true;
      
      await threadManager.startWorker();
      
      // Should not create a new worker
      expect(mockWorker.postMessage).not.toHaveBeenCalled();
    });

    test('should handle worker startup failure', async () => {
      // Mock worker startup failure
      mockWorker.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Worker startup failed')), 10);
        }
      });

      await expect(threadManager.startWorker()).rejects.toThrow('Worker startup failed');
    });
  });

  describe('stopWorker', () => {
    test('should stop worker thread successfully', async () => {
      // Start worker first
      threadManager._isRunning = true;
      threadManager._worker = mockWorker;
      threadManager._messagePort = mockMessageChannel.port1;

      await threadManager.stopWorker();
      
      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(threadManager.isWorkerRunning()).toBe(false);
    });

    test('should handle stopping when worker is not running', async () => {
      await threadManager.stopWorker();
      
      expect(mockWorker.terminate).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      // Setup worker as running
      threadManager._isRunning = true;
      threadManager._worker = mockWorker;
      threadManager._messagePort = mockMessageChannel.port1;
    });

    test('should send message and receive response', async () => {
      const testMessage = {
        type: 'ping',
        requestId: 'test-123'
      };

      const expectedResponse = {
        type: 'pong',
        requestId: 'test-123',
        payload: { timestamp: '2023-01-01T00:00:00.000Z' }
      };

      // Mock response
      mockMessageChannel.port1.postMessage.mockImplementation(() => {
        // Simulate async response
        setTimeout(() => {
          const callback = mockMessageChannel.port1.on.mock.calls
            .find(call => call[0] === 'message')[1];
          callback(JSON.stringify(expectedResponse));
        }, 10);
      });

      const response = await threadManager.sendMessage(testMessage);
      
      expect(mockMessageChannel.port1.postMessage).toHaveBeenCalledWith(
        JSON.stringify(testMessage)
      );
      expect(response).toEqual(expectedResponse);
    });

    test('should handle message timeout', async () => {
      const testMessage = {
        type: 'ping',
        requestId: 'test-timeout'
      };

      // Set short timeout for test
      threadManager._config.messageTimeout = 50;

      // Don't mock any response (timeout scenario)
      
      await expect(threadManager.sendMessage(testMessage))
        .rejects.toThrow('Message timeout');
    });

    test('should reject when worker is not running', async () => {
      threadManager._isRunning = false;

      const testMessage = {
        type: 'ping',
        requestId: 'test-not-running'
      };

      await expect(threadManager.sendMessage(testMessage))
        .rejects.toThrow('Worker thread is not running');
    });
  });

  describe('getWorkerStatus', () => {
    test('should return worker status when running', async () => {
      // Setup worker as running
      threadManager._isRunning = true;
      threadManager._worker = mockWorker;
      threadManager._messagePort = mockMessageChannel.port1;

      const expectedStatus = {
        isRunning: true,
        memoryUsage: { rss: 1000, heapUsed: 500, heapTotal: 800 },
        uptime: 123.45
      };

      // Mock status response
      mockMessageChannel.port1.postMessage.mockImplementation(() => {
        setTimeout(() => {
          const callback = mockMessageChannel.port1.on.mock.calls
            .find(call => call[0] === 'message')[1];
          callback(JSON.stringify({
            type: 'status',
            payload: expectedStatus,
            requestId: expect.any(String)
          }));
        }, 10);
      });

      const status = await threadManager.getWorkerStatus();
      
      expect(status).toEqual(expectedStatus);
    });

    test('should return not running status when worker is stopped', async () => {
      const status = await threadManager.getWorkerStatus();
      
      expect(status).toEqual({
        isRunning: false,
        error: 'Worker thread is not running'
      });
    });
  });

  describe('isWorkerRunning', () => {
    test('should return true when worker is running', () => {
      threadManager._isRunning = true;
      expect(threadManager.isWorkerRunning()).toBe(true);
    });

    test('should return false when worker is not running', () => {
      threadManager._isRunning = false;
      expect(threadManager.isWorkerRunning()).toBe(false);
    });
  });

  describe('error handling', () => {
    test('should handle worker error events', async () => {
      threadManager._isRunning = true;
      threadManager._worker = mockWorker;

      const errorCallback = mockWorker.on.mock.calls
        .find(call => call[0] === 'error')[1];

      const testError = new Error('Worker error');
      
      // Trigger error
      if (errorCallback) {
        errorCallback(testError);
      }

      // Should log error and potentially restart worker
      expect(mockWorker.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    test('should handle worker exit events', async () => {
      threadManager._isRunning = true;
      threadManager._worker = mockWorker;

      const exitCallback = mockWorker.on.mock.calls
        .find(call => call[0] === 'exit')[1];

      // Trigger exit
      if (exitCallback) {
        exitCallback(1); // Exit with error code
      }

      expect(mockWorker.on).toHaveBeenCalledWith('exit', expect.any(Function));
    });
  });

  describe('message handling', () => {
    test('should handle unsolicited messages from worker', async () => {
      threadManager._isRunning = true;
      threadManager._messagePort = mockMessageChannel.port1;

      const messageCallback = mockMessageChannel.port1.on.mock.calls
        .find(call => call[0] === 'message')[1];

      const unsolicitedMessage = {
        type: 'status',
        payload: {
          type: 'health_update',
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      };

      // Trigger unsolicited message
      if (messageCallback) {
        messageCallback(JSON.stringify(unsolicitedMessage));
      }

      // Should handle the message without throwing
      expect(mockMessageChannel.port1.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });
});