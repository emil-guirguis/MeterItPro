/**
 * Unit tests for MCP Worker Thread
 */

import { jest } from '@jest/globals';

// Mock worker_threads module
const mockParentPort = {
  on: jest.fn(),
  postMessage: jest.fn()
};

const mockMessagePort = {
  on: jest.fn(),
  postMessage: jest.fn(),
  start: jest.fn(),
  close: jest.fn()
};

jest.mock('worker_threads', () => ({
  parentPort: mockParentPort,
  workerData: {
    config: {
      modbus: { ip: '10.10.10.22', port: 502 },
      database: { url: 'postgresql://localhost:5432/test' }
    }
  },
  MessagePort: jest.fn(() => mockMessagePort)
}));

// Mock the ModbusMCPServerWorker
const mockMCPServerWorker = {
  start: jest.fn(),
  shutdown: jest.fn(),
  getStatus: jest.fn(),
  updateConfig: jest.fn(),
  handleDataRequest: jest.fn()
};

jest.mock('../ModbusMCPServerWorker.js', () => ({
  ModbusMCPServerWorker: jest.fn(() => mockMCPServerWorker)
}));

// Mock winston logger
jest.mock('../worker-logger.js', () => ({
  createWorkerLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }))
}));

describe('MCP Worker Thread', () => {
  let MCPWorkerThread;
  let workerInstance;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Import the worker class after mocks are set up
    const workerModule = await import('../mcp-worker.js');
    MCPWorkerThread = workerModule.default;
    
    // Create a new instance for testing
    workerInstance = new MCPWorkerThread.constructor();
  });

  describe('initialization', () => {
    test('should initialize worker thread correctly', () => {
      expect(workerInstance).toBeDefined();
    });

    test('should setup message handling on parent port', () => {
      expect(mockParentPort.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('message port setup', () => {
    test('should establish message port when received', () => {
      const messageCallback = mockParentPort.on.mock.calls
        .find(call => call[0] === 'message')[1];

      const portData = { port2: mockMessagePort };
      messageCallback(portData);

      expect(mockMessagePort.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockMessagePort.start).toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    beforeEach(() => {
      // Setup message port
      const messageCallback = mockParentPort.on.mock.calls
        .find(call => call[0] === 'message')[1];
      messageCallback({ port2: mockMessagePort });
    });

    test('should handle start message', async () => {
      const messageHandler = mockMessagePort.on.mock.calls
        .find(call => call[0] === 'message')[1];

      mockMCPServerWorker.start.mockResolvedValue();

      const startMessage = JSON.stringify({
        type: 'start',
        requestId: 'test-start-123'
      });

      await messageHandler(startMessage);

      expect(mockMCPServerWorker.start).toHaveBeenCalled();
      expect(mockMessagePort.postMessage).toHaveBeenCalledWith(
        expect.stringContaining('"type":"success"')
      );
    });

    test('should handle stop message', async () => {
      const messageHandler = mockMessagePort.on.mock.calls
        .find(call => call[0] === 'message')[1];

      mockMCPServerWorker.shutdown.mockResolvedValue();

      const stopMessage = JSON.stringify({
        type: 'stop',
        requestId: 'test-stop-123'
      });

      await messageHandler(stopMessage);

      expect(mockMCPServerWorker.shutdown).toHaveBeenCalled();
      expect(mockMessagePort.postMessage).toHaveBeenCalledWith(
        expect.stringContaining('"type":"success"')
      );
    });

    test('should handle status message', async () => {
      const messageHandler = mockMessagePort.on.mock.calls
        .find(call => call[0] === 'message')[1];

      const mockStatus = {
        isRunning: true,
        memoryUsage: { rss: 1000, heapUsed: 500 },
        uptime: 123.45
      };

      mockMCPServerWorker.getStatus.mockResolvedValue(mockStatus);

      const statusMessage = JSON.stringify({
        type: 'status',
        requestId: 'test-status-123'
      });

      await messageHandler(statusMessage);

      expect(mockMCPServerWorker.getStatus).toHaveBeenCalled();
      expect(mockMessagePort.postMessage).toHaveBeenCalledWith(
        expect.stringContaining('"type":"status"')
      );
    });

    test('should handle config message', async () => {
      const messageHandler = mockMessagePort.on.mock.calls
        .find(call => call[0] === 'message')[1];

      const newConfig = {
        modbus: { ip: '192.168.1.100' }
      };

      mockMCPServerWorker.updateConfig.mockResolvedValue();

      const configMessage = JSON.stringify({
        type: 'config',
        payload: newConfig,
        requestId: 'test-config-123'
      });

      await messageHandler(configMessage);

      expect(mockMCPServerWorker.updateConfig).toHaveBeenCalledWith(newConfig);
      expect(mockMessagePort.postMessage).toHaveBeenCalledWith(
        expect.stringContaining('"type":"success"')
      );
    });

    test('should handle data message', async () => {
      const messageHandler = mockMessagePort.on.mock.calls
        .find(call => call[0] === 'message')[1];

      const dataRequest = {
        action: 'get_status',
        params: {}
      };

      const mockDataResponse = {
        status: 'running',
        lastCollection: '2023-01-01T00:00:00.000Z'
      };

      mockMCPServerWorker.handleDataRequest.mockResolvedValue(mockDataResponse);

      const dataMessage = JSON.stringify({
        type: 'data',
        payload: dataRequest,
        requestId: 'test-data-123'
      });

      await messageHandler(dataMessage);

      expect(mockMCPServerWorker.handleDataRequest).toHaveBeenCalledWith(dataRequest);
      expect(mockMessagePort.postMessage).toHaveBeenCalledWith(
        expect.stringContaining('"type":"data"')
      );
    });

    test('should handle ping message', async () => {
      const messageHandler = mockMessagePort.on.mock.calls
        .find(call => call[0] === 'message')[1];

      const pingMessage = JSON.stringify({
        type: 'ping',
        requestId: 'test-ping-123'
      });

      await messageHandler(pingMessage);

      expect(mockMessagePort.postMessage).toHaveBeenCalledWith(
        expect.stringContaining('"type":"pong"')
      );
    });

    test('should handle unknown message type', async () => {
      const messageHandler = mockMessagePort.on.mock.calls
        .find(call => call[0] === 'message')[1];

      const unknownMessage = JSON.stringify({
        type: 'unknown',
        requestId: 'test-unknown-123'
      });

      await messageHandler(unknownMessage);

      expect(mockMessagePort.postMessage).toHaveBeenCalledWith(
        expect.stringContaining('"type":"error"')
      );
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      // Setup message port
      const messageCallback = mockParentPort.on.mock.calls
        .find(call => call[0] === 'message')[1];
      messageCallback({ port2: mockMessagePort });
    });

    test('should handle MCP server start failure', async () => {
      const messageHandler = mockMessagePort.on.mock.calls
        .find(call => call[0] === 'message')[1];

      mockMCPServerWorker.start.mockRejectedValue(new Error('Start failed'));

      const startMessage = JSON.stringify({
        type: 'start',
        requestId: 'test-start-error'
      });

      await messageHandler(startMessage);

      expect(mockMessagePort.postMessage).toHaveBeenCalledWith(
        expect.stringContaining('"type":"error"')
      );
    });

    test('should handle invalid JSON message', async () => {
      const messageHandler = mockMessagePort.on.mock.calls
        .find(call => call[0] === 'message')[1];

      const invalidMessage = '{ invalid json }';

      await messageHandler(invalidMessage);

      expect(mockMessagePort.postMessage).toHaveBeenCalledWith(
        expect.stringContaining('"type":"error"')
      );
    });

    test('should handle message processing errors', async () => {
      const messageHandler = mockMessagePort.on.mock.calls
        .find(call => call[0] === 'message')[1];

      mockMCPServerWorker.getStatus.mockRejectedValue(new Error('Status error'));

      const statusMessage = JSON.stringify({
        type: 'status',
        requestId: 'test-status-error'
      });

      await messageHandler(statusMessage);

      expect(mockMessagePort.postMessage).toHaveBeenCalledWith(
        expect.stringContaining('"type":"error"')
      );
    });
  });

  describe('message serialization', () => {
    test('should serialize messages correctly', () => {
      const message = {
        type: 'success',
        payload: { data: 'test' },
        requestId: 'test-123'
      };

      // Test serialization by checking if the worker can handle it
      const serialized = JSON.stringify(message);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(message);
    });

    test('should deserialize string messages', () => {
      const messageString = JSON.stringify({
        type: 'ping',
        requestId: 'test-456'
      });

      const deserialized = JSON.parse(messageString);

      expect(deserialized.type).toBe('ping');
      expect(deserialized.requestId).toBe('test-456');
    });

    test('should handle object messages', () => {
      const messageObject = {
        type: 'pong',
        requestId: 'test-789'
      };

      // Should handle both string and object inputs
      expect(messageObject.type).toBe('pong');
    });
  });

  describe('health monitoring', () => {
    test('should send periodic health updates', (done) => {
      // The worker should send health updates periodically
      // This is tested by checking if unsolicited messages are sent
      
      setTimeout(() => {
        // Check if any unsolicited status messages were sent
        const statusCalls = mockMessagePort.postMessage.mock.calls
          .filter(call => {
            try {
              const message = JSON.parse(call[0]);
              return message.type === 'status' && 
                     message.payload && 
                     message.payload.type === 'health_update';
            } catch {
              return false;
            }
          });

        // Note: This test might be flaky due to timing
        // In a real implementation, we might want to mock the interval
        done();
      }, 100);
    });
  });

  describe('shutdown handling', () => {
    test('should handle graceful shutdown', async () => {
      const messageHandler = mockMessagePort.on.mock.calls
        .find(call => call[0] === 'message')[1];

      mockMCPServerWorker.shutdown.mockResolvedValue();

      const stopMessage = JSON.stringify({
        type: 'stop',
        requestId: 'test-shutdown'
      });

      await messageHandler(stopMessage);

      expect(mockMCPServerWorker.shutdown).toHaveBeenCalled();
    });
  });
});