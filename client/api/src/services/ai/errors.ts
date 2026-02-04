/**
 * AI-Powered Meter Insights - Error Handling
 * Defines custom error classes and error handling utilities
 */

import { ErrorCode, ErrorResponse } from './types';

/**
 * Custom error class for AI service errors
 */
export class AIServiceError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AIServiceError';
    Object.setPrototypeOf(this, AIServiceError.prototype);
  }

  toResponse(): ErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Error for invalid queries
 */
export class InvalidQueryError extends AIServiceError {
  constructor(message: string, details?: Record<string, any>) {
    super('INVALID_QUERY', message, 400, details);
    Object.setPrototypeOf(this, InvalidQueryError.prototype);
  }
}

/**
 * Error for insufficient data
 */
export class InsufficientDataError extends AIServiceError {
  constructor(message: string = 'Insufficient historical data available', details?: Record<string, any>) {
    super('INSUFFICIENT_DATA', message, 400, details);
    Object.setPrototypeOf(this, InsufficientDataError.prototype);
  }
}

/**
 * Error for permission denied
 */
export class PermissionDeniedError extends AIServiceError {
  constructor(message: string = 'Permission denied', details?: Record<string, any>) {
    super('PERMISSION_DENIED', message, 403, details);
    Object.setPrototypeOf(this, PermissionDeniedError.prototype);
  }
}

/**
 * Error for AI service unavailability
 */
export class AIServiceUnavailableError extends AIServiceError {
  constructor(message: string = 'AI service is temporarily unavailable', details?: Record<string, any>) {
    super('AI_SERVICE_UNAVAILABLE', message, 503, details);
    Object.setPrototypeOf(this, AIServiceUnavailableError.prototype);
  }
}

/**
 * Error for timeout
 */
export class TimeoutError extends AIServiceError {
  constructor(message: string = 'Operation timed out', details?: Record<string, any>) {
    super('TIMEOUT', message, 504, details);
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error for rate limit exceeded
 */
export class RateLimitExceededError extends AIServiceError {
  constructor(message: string = 'Rate limit exceeded', details?: Record<string, any>) {
    super('RATE_LIMIT_EXCEEDED', message, 429, details);
    Object.setPrototypeOf(this, RateLimitExceededError.prototype);
  }
}

/**
 * Error for internal errors
 */
export class InternalError extends AIServiceError {
  constructor(message: string = 'Internal server error', details?: Record<string, any>) {
    super('INTERNAL_ERROR', message, 500, details);
    Object.setPrototypeOf(this, InternalError.prototype);
  }
}

/**
 * Converts a generic error to an AIServiceError
 */
export function toAIServiceError(error: any): AIServiceError {
  if (error instanceof AIServiceError) {
    return error;
  }

  if (error.code === 'ECONNREFUSED') {
    return new AIServiceUnavailableError('Cannot connect to AI service', { originalError: error.message });
  }

  if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
    return new TimeoutError('Request to AI service timed out', { originalError: error.message });
  }

  if (error.message && error.message.includes('timeout')) {
    return new TimeoutError(error.message);
  }

  if (error.message && error.message.includes('permission')) {
    return new PermissionDeniedError(error.message);
  }

  return new InternalError('An unexpected error occurred', { originalError: error.message });
}

/**
 * Logs an error with context
 */
export function logError(
  error: any,
  context: {
    requestId: string;
    tenantId: string;
    operation: string;
    userId?: string;
  }
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error({
    timestamp: new Date().toISOString(),
    requestId: context.requestId,
    tenantId: context.tenantId,
    operation: context.operation,
    userId: context.userId,
    error: errorMessage,
    stack: errorStack,
    code: error.code,
    statusCode: error.statusCode,
  });
}

/**
 * Creates a user-friendly error message
 */
export function getUserFriendlyMessage(error: AIServiceError): string {
  const messages: Record<ErrorCode, string> = {
    INVALID_QUERY: 'Your query could not be understood. Please try rephrasing it.',
    INSUFFICIENT_DATA: 'Not enough historical data available. Insights will be available once sufficient data is collected.',
    PERMISSION_DENIED: 'You do not have permission to access this data.',
    AI_SERVICE_UNAVAILABLE: 'The AI service is temporarily unavailable. Please try again later.',
    TIMEOUT: 'The operation took too long. Please try again.',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',
    INTERNAL_ERROR: 'An unexpected error occurred. Please try again later.',
  };

  return messages[error.code] || 'An error occurred. Please try again.';
}
