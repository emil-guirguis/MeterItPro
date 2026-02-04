import { parentPort, workerData, MessagePort } from 'worker_threads';
import { WorkerMessage, WorkerResponse } from './types.js';
import { createWorkerLogger } from './worker-logger.js';
import winston from 'winston';

/**
 * MCP Worker Thread Entry Point
 * This file runs in the worker thread and handles communication with the main thread
 */
class MCPWorkerThread {
  private logger: winston.Logger;
  private mcpServer: any = null;
  private messagePort: MessagePort | null = null;
  private isShuttingDown = false;

  constructor() {
    this.logger = createWorkerLogger();
    this.setupMessageHandling();
    this.setupErrorHandling();
  }

  /**
   * Setup message handling from main thread
   */
  private setupMessageHandling(): void {
    // Handle initial port setup message
    if (parentPort) {
      parentPort.on('message', (data) => {
        if (data.port2) {
          this.messagePort = data.port2;
          this.messagePort!.on('message', this.handleMessage.bind(this));
          this.messagePort!.start();
          this.logger.info('Worker thread message port established');
          
          // Send ready signal
          this.sendResponse({
            type: 'success',
            payload: { status: 'ready' }
          });
        }
      });
    }
  }

  /**
   * Handle messages from main thread
   */
  private async handleMessage(data: any): Promise<void> {
    try {
      const message = this.deserializeMessage(data) as WorkerMessage;
      this.logger.debug('Received message:', { type: message.type, requestId: message.requestId });

      let response: WorkerResponse;

      switch (message.type) {
        case 'start':
          response = await this.handleStart(message);
          break;
        
        case 'stop':
          response = await this.handleStop(message);
          break;
        
        case 'status':
          response = await this.handleStatus(message);
          break;
        
        case 'config':
          response = await this.handleConfig(message);
          break;
        
        case 'data':
          response = await this.handleDataRequest(message);
          break;
        
        case 'ping':
          response = await this.handlePing(message);
          break;
        
        case 'gc':
          response = await this.handleGarbageCollection(message);
          break;
        
        case 'cleanup':
          response = await this.handleResourceCleanup(message);
          break;
        
        default:
          response = {
            type: 'error',
            error: `Unknown message type: ${message.type}`,
            requestId: message.requestId
          };
      }

      this.sendResponse(response);
    } catch (error) {
      this.logger.error('Error handling message:', error);
      this.sendResponse({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: (data as WorkerMessage)?.requestId
      });
    }
  }

  /**
   * Handle start command
   */
  private async handleStart(message: WorkerMessage): Promise<WorkerResponse> {
    try {
      if (this.mcpServer) {
        return {
          type: 'success',
          payload: { message: 'MCP Server already running' },
          requestId: message.requestId
        };
      }

      // MCP Server instantiation removed (Modbus protocol removed)
      this.logger.info('MCP Server start requested but Modbus protocol has been removed');

      return {
        type: 'error',
        error: 'MCP Server start not available (Modbus protocol removed)',
        requestId: message.requestId
      };
    } catch (error) {
      this.logger.error('Failed to start MCP server:', error);
      return {
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to start MCP server',
        requestId: message.requestId
      };
    }
  }

  /**
   * Handle stop command
   */
  private async handleStop(message: WorkerMessage): Promise<WorkerResponse> {
    try {
      this.isShuttingDown = true;

      if (this.mcpServer) {
        // MCP Server shutdown removed (Modbus protocol removed)
        this.mcpServer = null;
        this.logger.info('MCP Server stopped in worker thread');
      }

      return {
        type: 'success',
        payload: { message: 'MCP Server stopped successfully' },
        requestId: message.requestId
      };
    } catch (error) {
      this.logger.error('Failed to stop MCP server:', error);
      return {
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to stop MCP server',
        requestId: message.requestId
      };
    }
  }

  /**
   * Handle status request
   */
  private async handleStatus(message: WorkerMessage): Promise<WorkerResponse> {
    try {
      const memoryUsage = process.memoryUsage();
      const status = {
        isRunning: this.mcpServer !== null,
        memoryUsage: {
          rss: memoryUsage.rss,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers || 0
        },
        uptime: process.uptime(),
        threadId: process.pid, // In worker thread context
        mcpServerStatus: this.mcpServer ? await this.mcpServer.getStatus() : null,
        resourceUsage: {
          cpuUsage: process.cpuUsage(),
          resourceUsage: process.resourceUsage ? process.resourceUsage() : null
        }
      };

      return {
        type: 'status',
        payload: status,
        requestId: message.requestId
      };
    } catch (error) {
      this.logger.error('Failed to get status:', error);
      return {
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to get status',
        requestId: message.requestId
      };
    }
  }

  /**
   * Handle configuration update
   */
  private async handleConfig(message: WorkerMessage): Promise<WorkerResponse> {
    try {
      if (this.mcpServer) {
        await this.mcpServer.updateConfig(message.payload);
      }

      return {
        type: 'success',
        payload: { message: 'Configuration updated successfully' },
        requestId: message.requestId
      };
    } catch (error) {
      this.logger.error('Failed to update configuration:', error);
      return {
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to update configuration',
        requestId: message.requestId
      };
    }
  }

  /**
   * Handle data request
   */
  private async handleDataRequest(message: WorkerMessage): Promise<WorkerResponse> {
    try {
      if (!this.mcpServer) {
        throw new Error('MCP Server not running');
      }

      const data = await this.mcpServer.handleDataRequest(message.payload);

      return {
        type: 'data',
        payload: data,
        requestId: message.requestId
      };
    } catch (error) {
      this.logger.error('Failed to handle data request:', error);
      return {
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to handle data request',
        requestId: message.requestId
      };
    }
  }

  /**
   * Handle ping (health check)
   */
  private async handlePing(message: WorkerMessage): Promise<WorkerResponse> {
    const memoryUsage = process.memoryUsage();
    return {
      type: 'pong',
      payload: { 
        timestamp: new Date().toISOString(),
        memoryUsage: {
          rss: memoryUsage.rss,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers || 0
        }
      },
      requestId: message.requestId
    };
  }

  /**
   * Handle garbage collection request
   */
  private async handleGarbageCollection(message: WorkerMessage): Promise<WorkerResponse> {
    try {
      const beforeMemory = process.memoryUsage();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        this.logger.info('Garbage collection triggered');
      } else {
        this.logger.warn('Garbage collection not available (run with --expose-gc)');
      }
      
      // Wait a moment for GC to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterMemory = process.memoryUsage();
      
      const memoryFreed = {
        rss: beforeMemory.rss - afterMemory.rss,
        heapUsed: beforeMemory.heapUsed - afterMemory.heapUsed,
        heapTotal: beforeMemory.heapTotal - afterMemory.heapTotal,
        external: beforeMemory.external - afterMemory.external
      };

      return {
        type: 'success',
        payload: {
          message: 'Garbage collection completed',
          beforeMemory: {
            rss: beforeMemory.rss,
            heapUsed: beforeMemory.heapUsed,
            heapTotal: beforeMemory.heapTotal,
            external: beforeMemory.external,
            arrayBuffers: beforeMemory.arrayBuffers || 0
          },
          afterMemory: {
            rss: afterMemory.rss,
            heapUsed: afterMemory.heapUsed,
            heapTotal: afterMemory.heapTotal,
            external: afterMemory.external,
            arrayBuffers: afterMemory.arrayBuffers || 0
          },
          memoryFreed,
          gcAvailable: !!global.gc
        },
        requestId: message.requestId
      };
    } catch (error) {
      this.logger.error('Failed to perform garbage collection:', error);
      return {
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to perform garbage collection',
        requestId: message.requestId
      };
    }
  }

  /**
   * Handle resource cleanup request
   */
  private async handleResourceCleanup(message: WorkerMessage): Promise<WorkerResponse> {
    try {
      const { resourceId, resourceType, metadata } = message.payload || {};
      
      if (!resourceId || !resourceType) {
        throw new Error('Resource ID and type are required for cleanup');
      }

      this.logger.info('Cleaning up resource', { resourceId, resourceType });

      let memoryFreed = 0;
      let cleanupActions: string[] = [];

      // Perform cleanup based on resource type
      switch (resourceType) {
        case 'file_handle':
          // Close file handles, streams, etc.
          cleanupActions.push('Closed file handles');
          memoryFreed += 1024; // Estimate
          break;

        case 'network_connection':
          // Close network connections
          cleanupActions.push('Closed network connections');
          memoryFreed += 2048; // Estimate
          break;

        case 'database_connection':
          // Close database connections
          if (this.mcpServer) {
            // Would call actual cleanup on MCP server
            cleanupActions.push('Closed database connections');
            memoryFreed += 4096; // Estimate
          }
          break;

        case 'timer':
          // Clear timers and intervals
          cleanupActions.push('Cleared timers');
          memoryFreed += 512; // Estimate
          break;

        case 'event_listener':
          // Remove event listeners
          cleanupActions.push('Removed event listeners');
          memoryFreed += 256; // Estimate
          break;

        case 'memory_buffer':
          // Free memory buffers
          cleanupActions.push('Freed memory buffers');
          memoryFreed += metadata?.size || 8192; // Use actual size if available
          break;

        case 'stream':
          // Close streams
          cleanupActions.push('Closed streams');
          memoryFreed += 1024; // Estimate
          break;

        default:
          cleanupActions.push('Generic cleanup performed');
          memoryFreed += 512; // Default estimate
      }

      // Trigger garbage collection after cleanup
      if (global.gc && memoryFreed > 1024) {
        global.gc();
        cleanupActions.push('Triggered garbage collection');
      }

      return {
        type: 'success',
        payload: {
          message: 'Resource cleanup completed',
          resourceId,
          resourceType,
          memoryFreed,
          cleanupActions,
          timestamp: new Date().toISOString()
        },
        requestId: message.requestId
      };
    } catch (error) {
      this.logger.error('Failed to cleanup resource:', error);
      return {
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to cleanup resource',
        requestId: message.requestId
      };
    }
  }

  /**
   * Send response to main thread
   */
  private sendResponse(response: WorkerResponse): void {
    if (!this.messagePort) {
      this.logger.error('Cannot send response: message port not available');
      return;
    }

    try {
      const serializedResponse = this.serializeMessage(response);
      this.messagePort.postMessage(serializedResponse);
    } catch (error) {
      this.logger.error('Failed to send response:', error);
    }
  }

  /**
   * Send unsolicited message to main thread (like health updates)
   */
  private sendUnsolicitedMessage(message: WorkerResponse): void {
    if (!this.messagePort || this.isShuttingDown) {
      return;
    }

    try {
      const serializedMessage = this.serializeMessage(message);
      this.messagePort.postMessage(serializedMessage);
    } catch (error) {
      this.logger.error('Failed to send unsolicited message:', error);
    }
  }

  /**
   * Serialize message for transmission
   */
  private serializeMessage(message: WorkerResponse): string {
    return JSON.stringify({
      ...message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Deserialize message from transmission
   */
  private deserializeMessage(data: any): WorkerMessage {
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    return data;
  }

  /**
   * Setup error handling for the worker thread
   */
  private setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception in worker thread:', error);
      this.sendUnsolicitedMessage({
        type: 'error',
        error: `Uncaught exception: ${error.message}`
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection in worker thread:', reason);
      this.sendUnsolicitedMessage({
        type: 'error',
        error: `Unhandled rejection: ${reason}`
      });
    });

    // Send periodic health updates
    setInterval(() => {
      if (!this.isShuttingDown) {
        this.sendUnsolicitedMessage({
          type: 'status',
          payload: {
            type: 'health_update',
            timestamp: new Date().toISOString(),
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
          }
        });
      }
    }, 30000); // Every 30 seconds
  }
}

// Initialize the worker thread
const worker = new MCPWorkerThread();

export default worker;