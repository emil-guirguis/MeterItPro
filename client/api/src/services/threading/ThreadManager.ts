import { Worker, MessageChannel } from 'worker_threads';
import { EventEmitter } from 'events';
import path from 'path';
import { 
  ThreadManagerConfig, 
  WorkerMessage, 
  WorkerResponse, 
  ThreadStatus
} from './types.js';
import { MessageHandler } from './MessageHandler.js';

/**
 * ThreadManager handles the lifecycle of MCP worker threads
 * Provides methods to start, stop, and communicate with worker threads
 */
export class ThreadManager extends EventEmitter {
  private worker: Worker | null = null;
  private config: ThreadManagerConfig;
  private status: ThreadStatus;
  private messageHandler: MessageHandler;
  private messageChannel: MessageChannel | null = null;

  constructor(config: Partial<ThreadManagerConfig> = {}) {
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

    // Initialize message handler
    this.messageHandler = new MessageHandler(this.config.messageTimeout);
    this.setupMessageHandlerEvents();
    this.setupCleanupHandlers();
  }

  /**
   * Start the MCP worker thread
   */
  public async startWorker(): Promise<boolean> {
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
  public async stopWorker(): Promise<void> {
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
  public getStatus(): ThreadStatus {
    return { ...this.status };
  }

  /**
   * Send message to worker thread
   */
  public async sendMessage(message: WorkerMessage): Promise<WorkerResponse> {
    if (!this.worker || !this.status.isRunning || !this.messageChannel) {
      throw new Error('Worker thread is not running or message channel not available');
    }

    return this.messageHandler.sendMessage(message, (msg) => {
      this.messageChannel!.port1.postMessage(msg);
    });
  }

  /**
   * Check if worker is running
   */
  public isWorkerRunning(): boolean {
    return this.status.isRunning && this.worker !== null;
  }

  /**
   * Get worker thread ID
   */
  public getWorkerThreadId(): number | null {
    return this.worker?.threadId || null;
  }

  /**
   * Send a fire-and-forget message to worker thread
   */
  public sendFireAndForgetMessage(message: WorkerMessage): void {
    if (!this.worker || !this.status.isRunning || !this.messageChannel) {
      throw new Error('Worker thread is not running or message channel not available');
    }

    this.messageHandler.sendFireAndForgetMessage(message, (msg) => {
      this.messageChannel!.port1.postMessage(msg);
    });
  }

  /**
   * Get message communication statistics
   */
  public getMessageStats(): {
    pendingMessages: number;
    oldestPendingMessage: Date | null;
    averageMessageAge: number;
  } {
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
  public cleanupExpiredMessages(): number {
    return this.messageHandler.cleanupExpiredMessages();
  }

  /**
   * Setup worker event handlers
   */
  private setupWorkerEventHandlers(): void {
    if (!this.worker || !this.messageChannel) return;

    // Setup MessagePort communication
    this.messageChannel.port1.on('message', (data: any) => {
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
   * Get the path to the worker script
   */
  private getWorkerScriptPath(): string {
    // In production, this would be the compiled JavaScript file
    // For development, we need to handle TypeScript compilation
    const workerScript = path.join(__dirname, 'mcp-worker.js');
    
    // Check if compiled version exists, otherwise use TypeScript version
    try {
      require.resolve(workerScript);
      return workerScript;
    } catch {
      // Fallback to TypeScript file (requires ts-node or similar)
      return path.join(__dirname, 'mcp-worker.ts');
    }
  }

  /**
   * Setup message handler event listeners
   */
  private setupMessageHandlerEvents(): void {
    this.messageHandler.on('unsolicitedMessage', (message: WorkerResponse) => {
      // Update health check timestamp for any message
      this.status.lastHealthCheck = new Date();
      this.emit('workerMessage', message);
    });

    this.messageHandler.on('messageError', (error: Error) => {
      this.emit('messageError', error);
    });
  }

  /**
   * Setup cleanup handlers for graceful shutdown
   */
  private setupCleanupHandlers(): void {
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