/**
 * ThreadManager handles the lifecycle of MCP worker threads
 * Provides methods to start, stop, and communicate with worker threads
 */

const { Worker, MessageChannel } = require('worker_threads');
const { EventEmitter } = require('events');
const path = require('path');
const { MessageHandler } = require('./MessageHandler.js');

class ThreadManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Default configuration
    this.config = {
      maxRestartAttempts: 5,
      restartDelay: 1000,
      healthCheckInterval: 30000,
      messageTimeout: 10000,
      ...config
    };

    // Initialize status
    this.status = {
      isRunning: false,
      startTime: null,
      lastHealthCheck: null,
      restartCount: 0,
      errorCount: 0
    };

    this.worker = null;
    this.messageChannel = null;

    // Initialize message handler
    this.messageHandler = new MessageHandler(this.config.messageTimeout);
    this.setupMessageHandlerEvents();
    this.setupCleanupHandlers();
  }

  /**
   * Start the MCP worker thread
   */
  async startWorker() {
    if (this.worker && !this.worker.threadId) {
      await this.stopWorker();
    }

    try {
      // Get the worker script path
      const workerScriptPath = this.getWorkerScriptPath();
      
      // Create MessageChannel for bidirectional communication
      this.messageChannel = new MessageChannel();
      
      // Create new worker thread
      this.worker = new Worker(workerScriptPath, {
        workerData: {
          config: this.config
        }
      });

      // Send the MessagePort to the worker after creation
      this.worker.postMessage({ port2: this.messageChannel.port2 }, [this.messageChannel.port2]);

      // Setup worker event handlers
      this.setupWorkerEventHandlers();

      // Update status
      this.status.isRunning = true;
      this.status.startTime = new Date();
      this.status.lastHealthCheck = new Date();

      this.emit('workerStarted', this.worker.threadId);
      
      return true;
    } catch (error) {
      this.status.errorCount++;
      this.emit('workerError', error);
      return false;
    }
  }

  /**
   * Stop the MCP worker thread gracefully
   */
  async stopWorker() {
    if (!this.worker) {
      return;
    }

    try {
      // Send stop message to worker
      await this.sendMessage({ type: 'stop' });
      
      // Wait for worker to terminate gracefully
      await this.worker.terminate();
      
      this.worker = null;
      this.status.isRunning = false;
      this.status.startTime = null;
      
      // Close message channel
      if (this.messageChannel) {
        this.messageChannel.port1.close();
        this.messageChannel = null;
      }
      
      // Clear pending messages
      this.messageHandler.clearPendingMessages('Worker stopped');
      
      this.emit('workerStopped');
    } catch (error) {
      // Force terminate if graceful shutdown fails
      if (this.worker) {
        await this.worker.terminate();
        this.worker = null;
      }
      
      // Close message channel
      if (this.messageChannel) {
        this.messageChannel.port1.close();
        this.messageChannel = null;
      }
      
      this.status.isRunning = false;
      this.status.startTime = null;
      
      this.emit('workerError', error);
    }
  }

  /**
   * Get current worker thread status
   */
  getStatus() {
    return { ...this.status };
  }

  /**
   * Send message to worker thread
   */
  async sendMessage(message) {
    if (!this.worker || !this.status.isRunning || !this.messageChannel) {
      throw new Error('Worker thread is not running or message channel not available');
    }

    return this.messageHandler.sendMessage(message, (msg) => {
      this.messageChannel.port1.postMessage(msg);
    });
  }

  /**
   * Check if worker is running
   */
  isWorkerRunning() {
    return this.status.isRunning && this.worker !== null;
  }

  /**
   * Get worker thread ID
   */
  getWorkerThreadId() {
    return this.worker?.threadId || null;
  }

  /**
   * Send a fire-and-forget message to worker thread
   */
  sendFireAndForgetMessage(message) {
    if (!this.worker || !this.status.isRunning || !this.messageChannel) {
      throw new Error('Worker thread is not running or message channel not available');
    }

    this.messageHandler.sendFireAndForgetMessage(message, (msg) => {
      this.messageChannel.port1.postMessage(msg);
    });
  }

  /**
   * Get message communication statistics
   */
  getMessageStats() {
    const stats = this.messageHandler.getPendingMessageStats();
    return {
      pendingMessages: stats.count,
      oldestPendingMessage: stats.oldestTimestamp,
      averageMessageAge: stats.averageAge
    };
  }

  /**
   * Cleanup expired messages
   */
  cleanupExpiredMessages() {
    return this.messageHandler.cleanupExpiredMessages();
  }

  /**
   * Setup worker event handlers
   */
  setupWorkerEventHandlers() {
    if (!this.worker || !this.messageChannel) return;

    // Setup MessagePort communication
    this.messageChannel.port1.on('message', (data) => {
      this.messageHandler.handleIncomingMessage(data);
    });

    this.messageChannel.port1.on('close', () => {
      this.emit('messagePortClosed');
    });

    // Setup worker process event handlers
    this.worker.on('error', (error) => {
      this.status.errorCount++;
      this.emit('workerError', error);
    });

    this.worker.on('exit', (code) => {
      this.status.isRunning = false;
      this.status.startTime = null;
      this.worker = null;
      
      // Close message channel
      if (this.messageChannel) {
        this.messageChannel.port1.close();
        this.messageChannel = null;
      }
      
      this.messageHandler.clearPendingMessages('Worker exited');
      this.emit('workerExit', code);
    });

    // Start listening on the message port
    this.messageChannel.port1.start();
  }

  /**
   * Setup message handler event listeners
   */
  setupMessageHandlerEvents() {
    this.messageHandler.on('unsolicitedMessage', (message) => {
      // Update health check timestamp for any message
      this.status.lastHealthCheck = new Date();
      this.emit('workerMessage', message);
    });

    this.messageHandler.on('messageError', (error) => {
      this.emit('messageError', error);
    });
  }

  /**
   * Get the path to the worker script
   */
  getWorkerScriptPath() {
    // Return the JavaScript worker script
    return path.join(__dirname, 'mcp-worker.js');
  }

  /**
   * Setup cleanup handlers for graceful shutdown
   */
  setupCleanupHandlers() {
    const cleanup = async () => {
      if (this.isWorkerRunning()) {
        await this.stopWorker();
      }
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('beforeExit', cleanup);
  }
}

module.exports = { ThreadManager };