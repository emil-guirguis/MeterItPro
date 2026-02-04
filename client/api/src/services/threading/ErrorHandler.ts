import { EventEmitter } from 'events';
import winston from 'winston';

/**
 * Error types for categorization
 */
export enum ErrorType {
  WORKER_STARTUP = 'worker_startup',
  WORKER_RUNTIME = 'worker_runtime',
  COMMUNICATION = 'communication',
  MEMORY = 'memory',
  TIMEOUT = 'timeout',
  CONFIGURATION = 'configuration',
  EXTERNAL_SERVICE = 'external_service',
  UNKNOWN = 'unknown'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Recovery strategy types
 */
export enum RecoveryStrategy {
  IGNORE = 'ignore',
  RETRY = 'retry',
  RESTART_WORKER = 'restart_worker',
  ESCALATE = 'escalate',
  CIRCUIT_BREAKER = 'circuit_breaker'
}

/**
 * Error information structure
 */
export interface ErrorInfo {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError: Error;
  timestamp: Date;
  context?: Record<string, any>;
  stackTrace?: string;
  recoveryStrategy: RecoveryStrategy;
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
}

/**
 * Error handling configuration
 */
export interface ErrorHandlerConfig {
  maxErrorHistory: number;
  errorReportingInterval: number;
  enableErrorAggregation: boolean;
  aggregationWindow: number;
  retryDelays: Record<ErrorType, number[]>;
  maxRecoveryAttempts: Record<ErrorType, number>;
  severityThresholds: Record<ErrorType, ErrorSeverity>;
}

/**
 * Error statistics
 */
export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recentErrors: ErrorInfo[];
  errorRate: number; // errors per minute
  mostCommonError: { type: ErrorType; count: number } | null;
}

/**
 * ErrorHandler provides comprehensive error handling and recovery strategies
 */
export class ErrorHandler extends EventEmitter {
  private logger: winston.Logger;
  private config: ErrorHandlerConfig;
  private errorHistory: ErrorInfo[] = [];
  private errorIdCounter = 0;
  private errorReportingInterval: NodeJS.Timeout | null = null;

  constructor(logger: winston.Logger, config: Partial<ErrorHandlerConfig> = {}) {
    super();
    
    this.logger = logger;
    
    // Default configuration
    this.config = {
      maxErrorHistory: 1000,
      errorReportingInterval: 60000, // 1 minute
      enableErrorAggregation: true,
      aggregationWindow: 300000, // 5 minutes
      retryDelays: {
        [ErrorType.WORKER_STARTUP]: [1000, 2000, 5000, 10000],
        [ErrorType.WORKER_RUNTIME]: [500, 1000, 2000],
        [ErrorType.COMMUNICATION]: [100, 500, 1000, 2000],
        [ErrorType.MEMORY]: [5000, 10000],
        [ErrorType.TIMEOUT]: [1000, 2000, 5000],
        [ErrorType.CONFIGURATION]: [0], // No retry for config errors
        [ErrorType.EXTERNAL_SERVICE]: [1000, 5000, 15000, 30000],
        [ErrorType.UNKNOWN]: [1000, 2000, 5000]
      },
      maxRecoveryAttempts: {
        [ErrorType.WORKER_STARTUP]: 5,
        [ErrorType.WORKER_RUNTIME]: 3,
        [ErrorType.COMMUNICATION]: 5,
        [ErrorType.MEMORY]: 2,
        [ErrorType.TIMEOUT]: 3,
        [ErrorType.CONFIGURATION]: 1,
        [ErrorType.EXTERNAL_SERVICE]: 5,
        [ErrorType.UNKNOWN]: 3
      },
      severityThresholds: {
        [ErrorType.WORKER_STARTUP]: ErrorSeverity.HIGH,
        [ErrorType.WORKER_RUNTIME]: ErrorSeverity.MEDIUM,
        [ErrorType.COMMUNICATION]: ErrorSeverity.MEDIUM,
        [ErrorType.MEMORY]: ErrorSeverity.HIGH,
        [ErrorType.TIMEOUT]: ErrorSeverity.MEDIUM,
        [ErrorType.CONFIGURATION]: ErrorSeverity.HIGH,
        [ErrorType.EXTERNAL_SERVICE]: ErrorSeverity.MEDIUM,
        [ErrorType.UNKNOWN]: ErrorSeverity.MEDIUM
      },
      ...config
    };

    this.startErrorReporting();
  }

  /**
   * Handle an error with automatic categorization and recovery
   */
  public async handleError(
    error: Error, 
    context?: Record<string, any>
  ): Promise<ErrorInfo> {
    const errorType = this.categorizeError(error, context);
    const severity = this.config.severityThresholds[errorType];
    const recoveryStrategy = this.determineRecoveryStrategy(errorType, severity);
    
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      type: errorType,
      severity,
      message: error.message,
      originalError: error,
      timestamp: new Date(),
      context,
      stackTrace: error.stack,
      recoveryStrategy,
      recoveryAttempts: 0,
      maxRecoveryAttempts: this.config.maxRecoveryAttempts[errorType]
    };

    // Add to error history
    this.addToErrorHistory(errorInfo);

    // Log the error
    this.logError(errorInfo);

    // Emit error event
    this.emit('error', errorInfo);

    // Attempt recovery if strategy is not ignore
    if (recoveryStrategy !== RecoveryStrategy.IGNORE) {
      await this.attemptRecovery(errorInfo);
    }

    return errorInfo;
  }

  /**
   * Attempt recovery for a specific error
   */
  public async attemptRecovery(errorInfo: ErrorInfo): Promise<boolean> {
    if (errorInfo.recoveryAttempts >= errorInfo.maxRecoveryAttempts) {
      this.emit('recoveryExhausted', errorInfo);
      return false;
    }

    errorInfo.recoveryAttempts++;

    this.emit('recoveryAttemptStarted', {
      errorId: errorInfo.id,
      attempt: errorInfo.recoveryAttempts,
      strategy: errorInfo.recoveryStrategy
    });

    try {
      let success = false;

      switch (errorInfo.recoveryStrategy) {
        case RecoveryStrategy.RETRY:
          success = await this.retryOperation(errorInfo);
          break;
        
        case RecoveryStrategy.RESTART_WORKER:
          success = await this.restartWorker(errorInfo);
          break;
        
        case RecoveryStrategy.ESCALATE:
          success = await this.escalateError(errorInfo);
          break;
        
        case RecoveryStrategy.CIRCUIT_BREAKER:
          success = await this.activateCircuitBreaker(errorInfo);
          break;
        
        default:
          success = false;
      }

      if (success) {
        this.emit('recoverySuccess', {
          errorId: errorInfo.id,
          attempt: errorInfo.recoveryAttempts,
          strategy: errorInfo.recoveryStrategy
        });
      } else {
        this.emit('recoveryFailed', {
          errorId: errorInfo.id,
          attempt: errorInfo.recoveryAttempts,
          strategy: errorInfo.recoveryStrategy
        });
      }

      return success;
    } catch (recoveryError) {
      this.logger.error('Recovery attempt failed:', {
        errorId: errorInfo.id,
        recoveryError: recoveryError instanceof Error ? recoveryError.message : recoveryError
      });

      this.emit('recoveryError', {
        errorId: errorInfo.id,
        recoveryError
      });

      return false;
    }
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): ErrorStats {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const recentErrors = this.errorHistory.filter(
      error => error.timestamp.getTime() > oneMinuteAgo
    );

    const errorsByType: Record<ErrorType, number> = {} as Record<ErrorType, number>;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as Record<ErrorSeverity, number>;

    // Initialize counters
    Object.values(ErrorType).forEach(type => {
      errorsByType[type] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      errorsBySeverity[severity] = 0;
    });

    // Count errors
    this.errorHistory.forEach(error => {
      errorsByType[error.type]++;
      errorsBySeverity[error.severity]++;
    });

    // Find most common error
    let mostCommonError: { type: ErrorType; count: number } | null = null;
    Object.entries(errorsByType).forEach(([type, count]) => {
      if (!mostCommonError || count > mostCommonError.count) {
        mostCommonError = { type: type as ErrorType, count };
      }
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorHistory.slice(-10),
      errorRate: recentErrors.length, // errors per minute
      mostCommonError: mostCommonError && mostCommonError.count > 0 ? mostCommonError : null
    };
  }

  /**
   * Clear error history
   */
  public clearErrorHistory(): void {
    this.errorHistory = [];
    this.emit('errorHistoryCleared');
  }

  /**
   * Update error handler configuration
   */
  public updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Categorize error based on error message and context
   */
  private categorizeError(error: Error, context?: Record<string, any>): ErrorType {
    const message = error.message.toLowerCase();
    
    // Worker startup errors
    if (message.includes('worker') && (message.includes('start') || message.includes('spawn'))) {
      return ErrorType.WORKER_STARTUP;
    }
    
    // Communication errors
    if (message.includes('timeout') || message.includes('message') || message.includes('port')) {
      if (message.includes('timeout')) {
        return ErrorType.TIMEOUT;
      }
      return ErrorType.COMMUNICATION;
    }
    
    // Memory errors
    if (message.includes('memory') || message.includes('heap') || error.name === 'RangeError') {
      return ErrorType.MEMORY;
    }
    
    // Configuration errors
    if (message.includes('config') || message.includes('invalid') || message.includes('missing')) {
      return ErrorType.CONFIGURATION;
    }
    
    // External service errors (database, modbus, etc.)
    if (message.includes('connection') || message.includes('database') || message.includes('modbus')) {
      return ErrorType.EXTERNAL_SERVICE;
    }
    
    // Context-based categorization
    if (context) {
      if (context.source === 'worker') {
        return ErrorType.WORKER_RUNTIME;
      }
      if (context.source === 'communication') {
        return ErrorType.COMMUNICATION;
      }
    }
    
    return ErrorType.UNKNOWN;
  }

  /**
   * Determine recovery strategy based on error type and severity
   */
  private determineRecoveryStrategy(type: ErrorType, severity: ErrorSeverity): RecoveryStrategy {
    // Critical errors always escalate
    if (severity === ErrorSeverity.CRITICAL) {
      return RecoveryStrategy.ESCALATE;
    }
    
    // Strategy based on error type
    switch (type) {
      case ErrorType.WORKER_STARTUP:
      case ErrorType.WORKER_RUNTIME:
        return RecoveryStrategy.RESTART_WORKER;
      
      case ErrorType.COMMUNICATION:
      case ErrorType.TIMEOUT:
        return RecoveryStrategy.RETRY;
      
      case ErrorType.MEMORY:
        return RecoveryStrategy.RESTART_WORKER;
      
      case ErrorType.CONFIGURATION:
        return RecoveryStrategy.ESCALATE;
      
      case ErrorType.EXTERNAL_SERVICE:
        return RecoveryStrategy.CIRCUIT_BREAKER;
      
      default:
        return RecoveryStrategy.RETRY;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation(errorInfo: ErrorInfo): Promise<boolean> {
    const delays = this.config.retryDelays[errorInfo.type];
    const delayIndex = Math.min(errorInfo.recoveryAttempts - 1, delays.length - 1);
    const delay = delays[delayIndex];

    if (delay > 0) {
      await this.sleep(delay);
    }

    // Emit retry event for external handling
    this.emit('retryRequested', {
      errorId: errorInfo.id,
      attempt: errorInfo.recoveryAttempts,
      delay
    });

    // Return true to indicate retry was initiated
    // Actual success/failure will be determined by the calling code
    return true;
  }

  /**
   * Request worker restart
   */
  private async restartWorker(errorInfo: ErrorInfo): Promise<boolean> {
    this.emit('workerRestartRequested', {
      errorId: errorInfo.id,
      reason: errorInfo.message
    });

    // Return true to indicate restart was requested
    // Actual success/failure will be determined by the restart manager
    return true;
  }

  /**
   * Escalate error to higher level handling
   */
  private async escalateError(errorInfo: ErrorInfo): Promise<boolean> {
    this.emit('errorEscalated', {
      errorId: errorInfo.id,
      type: errorInfo.type,
      severity: errorInfo.severity,
      message: errorInfo.message
    });

    // Log critical error
    this.logger.error('Error escalated:', {
      errorId: errorInfo.id,
      type: errorInfo.type,
      severity: errorInfo.severity,
      message: errorInfo.message,
      context: errorInfo.context
    });

    return true;
  }

  /**
   * Activate circuit breaker for external services
   */
  private async activateCircuitBreaker(errorInfo: ErrorInfo): Promise<boolean> {
    this.emit('circuitBreakerActivated', {
      errorId: errorInfo.id,
      type: errorInfo.type,
      service: errorInfo.context?.service || 'unknown'
    });

    return true;
  }

  /**
   * Add error to history with size management
   */
  private addToErrorHistory(errorInfo: ErrorInfo): void {
    this.errorHistory.push(errorInfo);
    
    // Maintain maximum history size
    if (this.errorHistory.length > this.config.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.config.maxErrorHistory);
    }
  }

  /**
   * Log error with appropriate level
   */
  private logError(errorInfo: ErrorInfo): void {
    const logData = {
      errorId: errorInfo.id,
      type: errorInfo.type,
      severity: errorInfo.severity,
      message: errorInfo.message,
      context: errorInfo.context,
      recoveryStrategy: errorInfo.recoveryStrategy
    };

    switch (errorInfo.severity) {
      case ErrorSeverity.CRITICAL:
        this.logger.error('Critical error occurred:', logData);
        break;
      case ErrorSeverity.HIGH:
        this.logger.error('High severity error:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn('Medium severity error:', logData);
        break;
      case ErrorSeverity.LOW:
        this.logger.info('Low severity error:', logData);
        break;
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${++this.errorIdCounter}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Start periodic error reporting
   */
  private startErrorReporting(): void {
    if (this.config.errorReportingInterval > 0) {
      this.errorReportingInterval = setInterval(() => {
        const stats = this.getErrorStats();
        this.emit('errorReport', stats);
      }, this.config.errorReportingInterval);
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.errorReportingInterval) {
      clearInterval(this.errorReportingInterval);
      this.errorReportingInterval = null;
    }
    
    this.removeAllListeners();
  }
}