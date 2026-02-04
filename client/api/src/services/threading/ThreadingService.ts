import { EventEmitter } from 'events';
import winston from 'winston';
import { ThreadManager } from './ThreadManager.js';
import { HealthMonitor } from './HealthMonitor.js';
import { RestartManager } from './RestartManager.js';
import { ErrorHandler } from './ErrorHandler.js';
import { MessageQueue } from './MessageQueue.js';
import { ConfigurationManager, ThreadingSystemConfig } from './ConfigurationManager.js';
import { 
  ThreadManagerConfig, 
  WorkerMessage, 
  WorkerResponse, 
  MessagePriority,
  EnhancedWorkerMessage 
} from './types.js';

/**
 * Threading service status
 */
export interface ThreadingServiceStatus {
  worker: {
    isRunning: boolean;
    threadId: number | null;
    startTime: Date | null;
    uptime: number;
    restartCount: number;
    errorCount: number;
  };
  health: {
    isHealthy: boolean;
    lastCheck: Date | null;
    consecutiveMissedChecks: number;
    memoryUsage?: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
    };
  };
  restart: {
    canRestart: boolean;
    currentAttempts: number;
    maxAttempts: number;
    circuitBreakerState: string;
  };
  messages: {
    pendingCount: number;
    totalSent: number;
    totalReceived: number;
    averageResponseTime: number;
  };
  errors: {
    totalErrors: number;
    recentErrorRate: number;
    mostCommonErrorType: string | null;
  };
}

/**
 * Message sending options
 */
export interface MessageOptions {
  type: string;
  payload?: any;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  timeout?: number;
  maxRetries?: number;
  correlationId?: string;
}

/**
 * ThreadingService provides a unified interface for managing the MCP threading system
 */
export class ThreadingService extends EventEmitter {
  private logger: winston.Logger;
  private threadManager: ThreadManager;
  private healthMonitor: HealthMonitor;
  private restartManager: RestartManager;
  private errorHandler: ErrorHandler;
  private messageQueue: MessageQueue;
  private configManager: ConfigurationManager;
  
  private isInitialized = false;
  private isStarted = false;

  constructor(config?: Partial<ThreadingSystemConfig>, logger?: winston.Logger) {
    super();
    
    // Initialize logger
    this.logger = logger || winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    // Initialize configuration manager
    this.configManager = new ConfigurationManager(config);
    
    // Initialize components
    this.initializeComponents();
    
    // Setup event handlers
    this.setupEventHandlers();
    
    this.isInitialized = true;
    this.logger.info('ThreadingService initialized');
  }

  /**
   * Start the threading service
   */
  public async start(): Promise<{ success: boolean; threadId?: number; startTime?: Date; error?: string }> {
    if (this.isStarted) {
      return { success: true, threadId: this.threadManager.getWorkerThreadId() || undefined };
    }

    try {
      this.logger.info('Starting threading service...');
      
      // Start message queue
      this.messageQueue.start();
      
      // Start health monitoring
      this.healthMonitor.startMonitoring();
      
      // Start restart management
      this.restartManager.startManagement();
      
      // Start worker thread
      const workerStarted = await this.threadManager.startWorker();
      
      if (workerStarted) {
        this.isStarted = true;
        const threadId = this.threadManager.getWorkerThreadId();
        const status = this.threadManager.getStatus();
        
        this.logger.info('Threading service started successfully', { threadId });
        this.emit('serviceStarted', { threadId, startTime: status.startTime });
        
        return { 
          success: true, 
          threadId: threadId || undefined, 
          startTime: status.startTime || undefined 
        };
      } else {
        throw new Error('Failed to start worker thread');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to start threading service', { error: errorMessage });
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Stop the threading service
   */
  public async stop(graceful: boolean = true): Promise<{ success: boolean; stopTime: Date; error?: string }> {
    if (!this.isStarted) {
      return { success: true, stopTime: new Date() };
    }

    try {
      this.logger.info('Stopping threading service...', { graceful });
      
      // Stop restart management
      this.restartManager.stopManagement();
      
      // Stop health monitoring
      this.healthMonitor.stopMonitoring();
      
      // Stop message queue
      this.messageQueue.stop();
      
      // Stop worker thread
      await this.threadManager.stopWorker();
      
      this.isStarted = false;
      const stopTime = new Date();
      
      this.logger.info('Threading service stopped successfully');
      this.emit('serviceStopped', { graceful, stopTime });
      
      return { success: true, stopTime };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error stopping threading service', { error: errorMessage });
      
      return { success: false, stopTime: new Date(), error: errorMessage };
    }
  }

  /**
   * Restart the worker thread
   */
  public async restartWorker(
    reason: string = 'Manual restart', 
    config?: Partial<ThreadingSystemConfig>
  ): Promise<{ success: boolean; threadId?: number; restartTime?: Date; restartCount?: number; error?: string }> {
    try {
      this.logger.info('Restarting worker thread', { reason });
      
      // Update configuration if provided
      if (config) {
        await this.updateConfig(config);
      }
      
      // Trigger restart
      const success = await this.restartManager.triggerRestart(reason);
      
      if (success) {
        const threadId = this.threadManager.getWorkerThreadId();
        const restartStats = this.restartManager.getRestartStats();
        
        return {
          success: true,
          threadId: threadId || undefined,
          restartTime: new Date(),
          restartCount: restartStats.currentRestartCount
        };
      } else {
        throw new Error('Restart was blocked or failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to restart worker thread', { error: errorMessage, reason });
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get comprehensive status of the threading system
   */
  public async getStatus(): Promise<ThreadingServiceStatus> {
    const threadStatus = this.threadManager.getStatus();
    const healthStatus = this.healthMonitor.getHealthStatus();
    const restartStats = this.restartManager.getRestartStats();
    const messageStats = this.threadManager.getMessageStats();
    const errorStats = this.errorHandler.getErrorStats();

    const uptime = threadStatus.startTime 
      ? Date.now() - threadStatus.startTime.getTime() 
      : 0;

    return {
      worker: {
        isRunning: threadStatus.isRunning,
        threadId: this.threadManager.getWorkerThreadId(),
        startTime: threadStatus.startTime,
        uptime,
        restartCount: threadStatus.restartCount,
        errorCount: threadStatus.errorCount
      },
      health: {
        isHealthy: healthStatus.isHealthy,
        lastCheck: healthStatus.lastHealthCheck,
        consecutiveMissedChecks: healthStatus.consecutiveMissedChecks,
        memoryUsage: healthStatus.memoryUsage
      },
      restart: {
        canRestart: restartStats.canRestart,
        currentAttempts: restartStats.currentRestartCount,
        maxAttempts: this.configManager.getSectionConfig('restartManager').maxRestartAttempts,
        circuitBreakerState: restartStats.circuitBreakerState
      },
      messages: {
        pendingCount: messageStats.pendingMessages,
        totalSent: 0, // Will be implemented with enhanced message handler
        totalReceived: 0,
        averageResponseTime: messageStats.averageMessageAge
      },
      errors: {
        totalErrors: errorStats.totalErrors,
        recentErrorRate: errorStats.errorRate,
        mostCommonErrorType: errorStats.mostCommonError?.type || null
      }
    };
  }

  /**
   * Get detailed health status
   */
  public async getHealthStatus(): Promise<any> {
    const healthStatus = this.healthMonitor.getHealthStatus();
    const threadStatus = this.threadManager.getStatus();
    
    return {
      isHealthy: healthStatus.isHealthy && threadStatus.isRunning,
      worker: {
        isRunning: threadStatus.isRunning,
        threadId: this.threadManager.getWorkerThreadId()
      },
      health: healthStatus,
      memory: healthStatus.memoryUsage,
      uptime: healthStatus.uptime,
      lastCheck: healthStatus.lastHealthCheck
    };
  }

  /**
   * Send message to worker thread
   */
  public async sendMessage(options: MessageOptions): Promise<{
    requestId: string;
    response: WorkerResponse;
    processingTime: number;
  }> {
    if (!this.isStarted || !this.threadManager.isWorkerRunning()) {
      throw new Error('Worker thread is not running');
    }

    // Convert priority string to enum
    const priorityMap: Record<string, MessagePriority> = {
      'low': MessagePriority.LOW,
      'normal': MessagePriority.NORMAL,
      'high': MessagePriority.HIGH,
      'critical': MessagePriority.CRITICAL
    };

    const message: EnhancedWorkerMessage = {
      type: options.type as any,
      payload: options.payload,
      priority: priorityMap[options.priority || 'normal'],
      timeout: options.timeout,
      maxRetries: options.maxRetries,
      correlationId: options.correlationId
    };

    const startTime = Date.now();
    
    try {
      const response = await this.threadManager.sendMessage(message);
      const processingTime = Date.now() - startTime;
      
      return {
        requestId: message.requestId || 'unknown',
        response,
        processingTime
      };
    } catch (error) {
      // Handle error through error handler
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error('Unknown message error'),
        { source: 'message_sending', messageType: options.type }
      );
      throw error;
    }
  }

  /**
   * Get configuration
   */
  public async getConfig(): Promise<ThreadingSystemConfig> {
    return this.configManager.getConfig();
  }

  /**
   * Update configuration
   */
  public async updateConfig(
    config: Partial<ThreadingSystemConfig>, 
    section?: keyof ThreadingSystemConfig
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[]; config?: ThreadingSystemConfig }> {
    const result = section 
      ? this.configManager.updateSectionConfig(section, config[section] as any)
      : this.configManager.updateConfig(config);

    if (result.isValid) {
      // Apply configuration changes to components
      await this.applyConfigurationChanges();
      
      return {
        ...result,
        config: this.configManager.getConfig()
      };
    }

    return result;
  }

  /**
   * Perform immediate health check
   */
  public async performHealthCheck(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    timestamp: Date;
    details: any;
  }> {
    const startTime = Date.now();
    const timestamp = new Date();
    
    try {
      const isHealthy = await this.healthMonitor.performHealthCheck();
      const responseTime = Date.now() - startTime;
      const healthStatus = this.healthMonitor.getHealthStatus();
      
      return {
        isHealthy,
        responseTime,
        timestamp,
        details: healthStatus
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        isHealthy: false,
        responseTime,
        timestamp,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Get comprehensive statistics
   */
  public async getStats(): Promise<any> {
    const messageStats = this.threadManager.getMessageStats();
    const queueStats = this.messageQueue.getStats();
    const errorStats = this.errorHandler.getErrorStats();
    const healthStatus = this.healthMonitor.getHealthStatus();
    
    return {
      messages: messageStats,
      queue: queueStats,
      errors: errorStats,
      performance: {
        uptime: healthStatus.uptime,
        memoryUsage: healthStatus.memoryUsage
      },
      uptime: healthStatus.uptime
    };
  }

  /**
   * Get pending messages information
   */
  public async getPendingMessages(): Promise<any> {
    const stats = this.threadManager.getMessageStats();
    
    return {
      count: stats.pendingMessages,
      messages: [], // Would need to implement detailed message listing
      oldestAge: stats.averageMessageAge,
      averageAge: stats.averageMessageAge
    };
  }

  /**
   * Clear pending messages
   */
  public async clearPendingMessages(reason: string): Promise<{ clearedCount: number }> {
    // This would need to be implemented in ThreadManager
    // For now, return 0
    return { clearedCount: 0 };
  }

  /**
   * Get error information
   */
  public async getErrors(options: { limit?: number; severity?: string; type?: string }): Promise<any> {
    const errorStats = this.errorHandler.getErrorStats();
    
    return {
      history: errorStats.recentErrors.slice(0, options.limit || 50),
      stats: errorStats
    };
  }

  /**
   * Clear error history
   */
  public async clearErrors(): Promise<{ clearedCount: number }> {
    const stats = this.errorHandler.getErrorStats();
    const clearedCount = stats.totalErrors;
    
    this.errorHandler.clearErrorHistory();
    
    return { clearedCount };
  }

  /**
   * Get logs (placeholder - would need proper log management)
   */
  public async getLogs(options: { limit?: number; level?: string; since?: Date }): Promise<any> {
    // This would need to be implemented with proper log aggregation
    return {
      entries: [],
      count: 0
    };
  }

  /**
   * Initialize all threading components
   */
  private initializeComponents(): void {
    const config = this.configManager.getConfig();
    
    // Initialize ThreadManager
    this.threadManager = new ThreadManager(config.threadManager);
    
    // Initialize HealthMonitor
    this.healthMonitor = new HealthMonitor(this.threadManager, config.healthMonitor);
    
    // Initialize RestartManager
    this.restartManager = new RestartManager(
      this.threadManager, 
      this.healthMonitor, 
      config.restartManager
    );
    
    // Initialize ErrorHandler
    this.errorHandler = new ErrorHandler(this.logger, config.errorHandler);
    
    // Initialize MessageQueue
    this.messageQueue = new MessageQueue(config.messageQueue);
  }

  /**
   * Setup event handlers for all components
   */
  private setupEventHandlers(): void {
    // ThreadManager events
    this.threadManager.on('workerStarted', (threadId) => {
      this.logger.info('Worker thread started', { threadId });
      this.emit('workerStarted', { threadId });
    });

    this.threadManager.on('workerStopped', () => {
      this.logger.info('Worker thread stopped');
      this.emit('workerStopped');
    });

    this.threadManager.on('workerError', (error) => {
      this.logger.error('Worker thread error', { error: error.message });
      this.errorHandler.handleError(error, { source: 'worker' });
      this.emit('workerError', { error });
    });

    // HealthMonitor events
    this.healthMonitor.on('workerUnhealthy', (data) => {
      this.logger.warn('Worker thread unhealthy', data);
      this.emit('workerUnhealthy', data);
    });

    this.healthMonitor.on('memoryThresholdExceeded', (data) => {
      this.logger.warn('Memory threshold exceeded', data);
      this.emit('memoryThresholdExceeded', data);
    });

    // RestartManager events
    this.restartManager.on('restartSuccess', (data) => {
      this.logger.info('Worker restart successful', data);
      this.emit('restartSuccess', data);
    });

    this.restartManager.on('restartFailed', (data) => {
      this.logger.error('Worker restart failed', data);
      this.emit('restartFailed', data);
    });

    // ErrorHandler events
    this.errorHandler.on('error', (errorInfo) => {
      this.emit('error', errorInfo);
    });

    // Configuration events
    this.configManager.on('configUpdated', (data) => {
      this.logger.info('Configuration updated', { source: data.source });
      this.emit('configUpdated', data);
    });
  }

  /**
   * Apply configuration changes to components
   */
  private async applyConfigurationChanges(): Promise<void> {
    const config = this.configManager.getConfig();
    
    // Update component configurations
    this.healthMonitor.updateConfig(config.healthMonitor);
    this.restartManager.updateConfig(config.restartManager);
    this.errorHandler.updateConfig(config.errorHandler);
    this.messageQueue.updateConfig(config.messageQueue);
    
    this.logger.info('Configuration changes applied to all components');
  }
}