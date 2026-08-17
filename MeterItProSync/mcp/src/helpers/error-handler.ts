/**
 * Error Handler Utility
 * 
 * Provides centralized error handling, retry logic with exponential backoff,
 * and error classification for the database sync process.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import winston from 'winston';

export enum ErrorType {
  CONNECTION = 'CONNECTION',
  QUERY = 'QUERY',
  UPLOAD = 'UPLOAD',
  DELETE = 'DELETE',
  DOWNLOAD = 'DOWNLOAD',
  UNKNOWN = 'UNKNOWN',
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface ErrorContext {
  operation: string;
  errorType: ErrorType;
  attempt?: number;
  maxAttempts?: number;
  details?: Record<string, any>;
}

export class ErrorHandler {
  private logger: winston.Logger;

  constructor(logger?: winston.Logger) {
    this.logger = logger || this.createDefaultLogger();
  }

  /**
   * Execute an operation with retry logic and exponential backoff
   * Requirements: 6.1, 6.2
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    context: ErrorContext
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const isLastAttempt = attempt === config.maxRetries;
        
        this.logError(lastError, {
          ...context,
          attempt: attempt + 1,
          maxAttempts: config.maxRetries + 1,
        });

        if (isLastAttempt) {
          this.logger.error(
            `Operation "${context.operation}" failed after ${config.maxRetries + 1} attempts`
          );
          throw lastError;
        }

        // Calculate backoff delay
        const delay = this.calculateBackoff(attempt, config.baseDelayMs, config.maxDelayMs);
        this.logger.info(
          `Retrying operation "${context.operation}" in ${delay}ms (attempt ${attempt + 2}/${config.maxRetries + 1})`
        );
        
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError || new Error('Operation failed with unknown error');
  }

  /**
   * Handle connection errors with retry logic
   * Requirement: 6.1
   */
  async handleConnectionError<T>(
    operation: () => Promise<T>,
    context: Omit<ErrorContext, 'errorType'>
  ): Promise<T> {
    return this.executeWithRetry(
      operation,
      {
        maxRetries: 5,
        baseDelayMs: 2000,
        maxDelayMs: 32000,
      },
      {
        ...context,
        errorType: ErrorType.CONNECTION,
      }
    );
  }

  /**
   * Handle query errors with retry logic
   * Requirement: 6.2
   */
  async handleQueryError<T>(
    operation: () => Promise<T>,
    context: Omit<ErrorContext, 'errorType'>
  ): Promise<T> {
    return this.executeWithRetry(
      operation,
      {
        maxRetries: 3,
        baseDelayMs: 2000,
        maxDelayMs: 8000,
      },
      {
        ...context,
        errorType: ErrorType.QUERY,
      }
    );
  }

  /**
   * Handle upload errors with data preservation
   * Requirement: 6.3
   */
  handleUploadError(error: Error, context: Omit<ErrorContext, 'errorType'>): void {
    this.logError(error, {
      ...context,
      errorType: ErrorType.UPLOAD,
    });
    
    this.logger.warn(
      `Upload failed for operation "${context.operation}". ` +
      'Data will be preserved in local database for next sync cycle.'
    );
  }

  /**
   * Handle delete errors with transaction rollback
   * Requirement: 6.4
   */
  handleDeleteError(error: Error, context: Omit<ErrorContext, 'errorType'>): void {
    this.logError(error, {
      ...context,
      errorType: ErrorType.DELETE,
    });
    
    this.logger.warn(
      `Delete failed for operation "${context.operation}". ` +
      'Transaction has been rolled back. Data remains in local database.'
    );
  }

  /**
   * Handle download errors with operation isolation
   * Requirement: 6.5 (via 9.5, 11.5)
   */
  handleDownloadError(error: Error, context: Omit<ErrorContext, 'errorType'>): void {
    this.logError(error, {
      ...context,
      errorType: ErrorType.DOWNLOAD,
    });
    
    this.logger.warn(
      `Download failed for operation "${context.operation}". ` +
      'Other sync operations will continue.'
    );
  }

  /**
   * Handle unhandled exceptions at top level
   * Requirement: 6.5
   */
  handleUnhandledException(error: Error, context: Omit<ErrorContext, 'errorType'>): void {
    this.logger.error('=== UNHANDLED EXCEPTION ===');
    this.logger.error(`Operation: ${context.operation}`);
    this.logger.error(`Error: ${error.message}`);
    
    if (error.stack) {
      this.logger.error('Stack trace:');
      this.logger.error(error.stack);
    }
    
    if (context.details) {
      this.logger.error('Context details:', context.details);
    }
    
    this.logger.error('=== END UNHANDLED EXCEPTION ===');
    
    this.logger.info('Attempting to continue operation after unhandled exception');
  }

  /**
   * Log error with context
   */
  private logError(error: Error, context: ErrorContext): void {
    const logMessage = [
      `Error in ${context.operation}`,
      context.attempt ? `(attempt ${context.attempt}/${context.maxAttempts})` : '',
      `- Type: ${context.errorType}`,
      `- Message: ${error.message}`,
    ]
      .filter(Boolean)
      .join(' ');

    this.logger.error(logMessage);

    if (context.details) {
      this.logger.error('Error details:', context.details);
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
    const delay = baseDelayMs * Math.pow(2, attempt);
    return Math.min(delay, maxDelayMs);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): winston.Logger {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }
}

/**
 * Wrap an async function with top-level exception handling
 * Requirement: 6.5
 */
export function withExceptionHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler: ErrorHandler,
  operationName: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errorHandler.handleUnhandledException(err, {
        operation: operationName,
        details: {
          arguments: args,
        },
      });
      throw err;
    }
  };
}
