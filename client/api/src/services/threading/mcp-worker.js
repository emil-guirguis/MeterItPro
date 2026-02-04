/**
 * MCP Worker Thread
 * This file runs in a worker thread and wraps the MCP server functionality
 */

const { parentPort, workerData } = require('worker_threads');
const { createLogger } = require('./worker-logger.js');

class MCPWorkerThread {
  constructor() {
    this.config = workerData?.config || {};
    this.logger = createLogger('mcp-worker');
    this.isRunning = false;
    this.mcpServer = null;
    this.messagePort = null;
    
    this.setupMessageHandling();
    this.setupErrorHandling();
    
    this.logger.info('MCP Worker Thread initialized');
  }

  setupMessageHandling() {
    // Handle messages from MessagePort (preferred) or parentPort (fallback)
    const messageHandler = (message) => {
      this.handleMessage(message).catch(error => {
        this.logger.error('Error handling message:', error);
        this.sendResponse({
          type: 'error',
          error: error.message,
          requestId: message.requestId
        });
      });
    };

    // Check if we have a MessagePort in the transfer list
    if (parentPort) {
      parentPort.on('message', (data) => {
        if (data && typeof data === 'object' && 'port2' in data) {
          // We received the MessagePort
          this.messagePort = data.port2;
          this.messagePort.on('message', messageHandler);
          this.messagePort.start();
          
          this.logger.info('MessagePort communication established');
          
          // Send ready signal
          this.sendResponse({
            type: 'ready',
            payload: { threadId: process.pid }
          });
        } else {
          // Regular message via parentPort
          messageHandler(data);
        }
      });
    }
  }

  setupErrorHandling() {
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception in worker thread:', error);
      this.sendResponse({
        type: 'error',
        error: `Uncaught exception: ${error.message}`
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection in worker thread:', reason);
      this.sendResponse({
        type: 'error',
        error: `Unhandled rejection: ${reason}`
      });
    });
  }

  async handleMessage(message) {
    this.logger.debug(`Received message: ${message.type}`, { requestId: message.requestId });

    switch (message.type) {
      case 'start':
        await this.handleStart(message);
        break;
        
      case 'stop':
        await this.handleStop(message);
        break;
        
      case 'status':
        await this.handleStatus(message);
        break;
        
      case 'config':
        await this.handleConfig(message);
        break;
        
      case 'ping':
        await this.handlePing(message);
        break;
        
      case 'health-check':
        await this.handleHealthCheck(message);
        break;
        
      default:
        this.logger.warn(`Unknown message type: ${message.type}`);
        this.sendResponse({
          type: 'error',
          error: `Unknown message type: ${message.type}`,
          requestId: message.requestId
        });
    }
  }

  async handleStart(message) {
    try {
      if (this.isRunning) {
        this.sendResponse({
          type: 'success',
          payload: { message: 'MCP server is already running' },
          requestId: message.requestId
        });
        return;
      }

      // Initialize MCP server (placeholder for now)
      // In a real implementation, this would initialize the actual MCP server
      this.mcpServer = {
        status: 'running',
        startTime: new Date(),
        pid: process.pid
      };
      
      this.isRunning = true;
      
      this.logger.info('MCP server started in worker thread');
      
      this.sendResponse({
        type: 'success',
        payload: { 
          message: 'MCP server started successfully',
          pid: process.pid,
          startTime: new Date()
        },
        requestId: message.requestId
      });
      
    } catch (error) {
      this.logger.error('Failed to start MCP server:', error);
      this.sendResponse({
        type: 'error',
        error: `Failed to start MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requestId: message.requestId
      });
    }
  }

  async handleStop(message) {
    try {
      if (!this.isRunning) {
        this.sendResponse({
          type: 'success',
          payload: { message: 'MCP server is not running' },
          requestId: message.requestId
        });
        return;
      }

      // Shutdown MCP server
      if (this.mcpServer) {
        // In a real implementation, this would properly shutdown the MCP server
        this.mcpServer = null;
      }
      
      this.isRunning = false;
      
      this.logger.info('MCP server stopped in worker thread');
      
      this.sendResponse({
        type: 'success',
        payload: { 
          message: 'MCP server stopped successfully',
          stopTime: new Date()
        },
        requestId: message.requestId
      });
      
    } catch (error) {
      this.logger.error('Failed to stop MCP server:', error);
      this.sendResponse({
        type: 'error',
        error: `Failed to stop MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requestId: message.requestId
      });
    }
  }

  async handleStatus(message) {
    const memoryUsage = process.memoryUsage();
    
    const status = {
      isRunning: this.isRunning,
      pid: process.pid,
      memoryUsage: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal
      },
      uptime: process.uptime(),
      mcpServer: this.mcpServer ? {
        status: this.mcpServer.status,
        startTime: this.mcpServer.startTime
      } : null
    };

    this.sendResponse({
      type: 'status',
      payload: status,
      requestId: message.requestId
    });
  }

  async handleConfig(message) {
    try {
      if (message.payload) {
        // Update configuration
        Object.assign(this.config, message.payload);
        this.logger.info('Configuration updated', { config: this.config });
      }

      this.sendResponse({
        type: 'success',
        payload: { 
          message: 'Configuration updated',
          config: this.config
        },
        requestId: message.requestId
      });
      
    } catch (error) {
      this.logger.error('Failed to update configuration:', error);
      this.sendResponse({
        type: 'error',
        error: `Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requestId: message.requestId
      });
    }
  }

  async handlePing(message) {
    this.sendResponse({
      type: 'pong',
      payload: { 
        timestamp: new Date(),
        pid: process.pid
      },
      requestId: message.requestId
    });
  }

  async handleHealthCheck(message) {
    const memoryUsage = process.memoryUsage();
    
    const healthStatus = {
      healthy: true,
      timestamp: new Date(),
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal
      },
      mcpServerRunning: this.isRunning
    };

    this.sendResponse({
      type: 'health-status',
      payload: healthStatus,
      requestId: message.requestId
    });
  }

  sendResponse(response) {
    try {
      const responseWithTimestamp = {
        ...response,
        timestamp: new Date().toISOString()
      };

      if (this.messagePort) {
        this.messagePort.postMessage(responseWithTimestamp);
      } else if (parentPort) {
        parentPort.postMessage(responseWithTimestamp);
      } else {
        this.logger.error('No communication channel available to send response');
      }
    } catch (error) {
      this.logger.error('Failed to send response:', error);
    }
  }

  async shutdown() {
    this.logger.info('Shutting down MCP worker thread...');
    
    if (this.isRunning) {
      await this.handleStop({ type: 'stop' });
    }
    
    if (this.messagePort) {
      this.messagePort.close();
    }
    
    this.logger.info('MCP worker thread shutdown complete');
  }
}

// Initialize the worker thread
const worker = new MCPWorkerThread();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await worker.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await worker.shutdown();
  process.exit(0);
});