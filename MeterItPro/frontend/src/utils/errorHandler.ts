// Comprehensive error handling utilities for the email template system

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userMessage: string;
}

export const ErrorCodes = {
  // Template errors
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  TEMPLATE_VALIDATION_FAILED: 'TEMPLATE_VALIDATION_FAILED',
  TEMPLATE_RENDER_FAILED: 'TEMPLATE_RENDER_FAILED',
  
  // Email errors
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  SMTP_CONNECTION_FAILED: 'SMTP_CONNECTION_FAILED',
  INVALID_EMAIL_ADDRESS: 'INVALID_EMAIL_ADDRESS',
  
  // Service errors
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // System errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  FILE_SYSTEM_ERROR: 'FILE_SYSTEM_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export class AppErrorHandler {
  private static errorMessages: Record<string, string> = {
    [ErrorCodes.TEMPLATE_NOT_FOUND]: 'The requested template could not be found.',
    [ErrorCodes.TEMPLATE_VALIDATION_FAILED]: 'Template validation failed. Please check your template syntax.',
    [ErrorCodes.TEMPLATE_RENDER_FAILED]: 'Failed to render template. Please check your variables and content.',
    [ErrorCodes.EMAIL_SEND_FAILED]: 'Failed to send email. Please try again later.',
    [ErrorCodes.SMTP_CONNECTION_FAILED]: 'Unable to connect to email server. Please check your SMTP settings.',
    [ErrorCodes.INVALID_EMAIL_ADDRESS]: 'Please provide a valid email address.',
    [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
    [ErrorCodes.NETWORK_ERROR]: 'Network connection error. Please check your internet connection.',
    [ErrorCodes.AUTHENTICATION_FAILED]: 'Authentication failed. Please log in again.',
    [ErrorCodes.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
    [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again.',
    [ErrorCodes.REQUIRED_FIELD_MISSING]: 'Please fill in all required fields.',
    [ErrorCodes.INVALID_FORMAT]: 'Invalid format. Please check your input.',
    [ErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
    [ErrorCodes.DATABASE_ERROR]: 'Database error occurred. Please try again later.',
    [ErrorCodes.FILE_SYSTEM_ERROR]: 'File system error occurred. Please try again.'
  };

  static createError(code: ErrorCode, details?: any, customMessage?: string): AppError {
    return {
      code,
      message: this.errorMessages[code] || 'An error occurred',
      details,
      timestamp: new Date(),
      userMessage: customMessage || this.errorMessages[code] || 'An error occurred'
    };
  }

  static handleApiError(error: any): AppError {
    // Handle different types of errors
    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          return this.createError(ErrorCodes.VALIDATION_ERROR, data);
        case 401:
          return this.createError(ErrorCodes.AUTHENTICATION_FAILED, data);
        case 403:
          return this.createError(ErrorCodes.PERMISSION_DENIED, data);
        case 404:
          return this.createError(ErrorCodes.TEMPLATE_NOT_FOUND, data);
        case 500:
          return this.createError(ErrorCodes.SERVICE_UNAVAILABLE, data);
        default:
          return this.createError(ErrorCodes.UNKNOWN_ERROR, data);
      }
    } else if (error.request) {
      // Network error
      return this.createError(ErrorCodes.NETWORK_ERROR, error);
    } else if (error.code) {
      // Known error code
      return this.createError(error.code as ErrorCode, error);
    } else {
      // Unknown error
      return this.createError(ErrorCodes.UNKNOWN_ERROR, error);
    }
  }

  static handleTemplateError(error: any): AppError {
    if (error.message?.includes('validation')) {
      return this.createError(ErrorCodes.TEMPLATE_VALIDATION_FAILED, error);
    } else if (error.message?.includes('render')) {
      return this.createError(ErrorCodes.TEMPLATE_RENDER_FAILED, error);
    } else {
      return this.createError(ErrorCodes.UNKNOWN_ERROR, error);
    }
  }

  static handleEmailError(error: any): AppError {
    if (error.message?.includes('SMTP')) {
      return this.createError(ErrorCodes.SMTP_CONNECTION_FAILED, error);
    } else if (error.message?.includes('email')) {
      return this.createError(ErrorCodes.INVALID_EMAIL_ADDRESS, error);
    } else {
      return this.createError(ErrorCodes.EMAIL_SEND_FAILED, error);
    }
  }

  static logError(error: AppError, context?: string): void {
    console.error(`[${error.timestamp.toISOString()}] ${context || 'Error'}:`, {
      code: error.code,
      message: error.message,
      details: error.details
    });
  }

  static getRetryableErrors(): ErrorCode[] {
    return [
      ErrorCodes.NETWORK_ERROR,
      ErrorCodes.SERVICE_UNAVAILABLE,
      ErrorCodes.SMTP_CONNECTION_FAILED,
      ErrorCodes.DATABASE_ERROR
    ];
  }

  static isRetryable(error: AppError): boolean {
    return this.getRetryableErrors().includes(error.code as ErrorCode);
  }
}

// Hook for error handling in React components
export const useErrorHandler = () => {
  const handleError = (error: any, context?: string): AppError => {
    const appError = AppErrorHandler.handleApiError(error);
    AppErrorHandler.logError(appError, context);
    return appError;
  };

  const handleTemplateError = (error: any, context?: string): AppError => {
    const appError = AppErrorHandler.handleTemplateError(error);
    AppErrorHandler.logError(appError, context);
    return appError;
  };

  const handleEmailError = (error: any, context?: string): AppError => {
    const appError = AppErrorHandler.handleEmailError(error);
    AppErrorHandler.logError(appError, context);
    return appError;
  };

  return {
    handleError,
    handleTemplateError,
    handleEmailError,
    isRetryable: AppErrorHandler.isRetryable
  };
};

// Graceful degradation utilities
export const GracefulDegradation = {
  withFallback: <T>(operation: () => Promise<T>, fallback: T): Promise<T> => {
    return operation().catch((error) => {
      AppErrorHandler.logError(AppErrorHandler.handleApiError(error), 'Graceful degradation');
      return fallback;
    });
  },

  withRetry: async <T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3, 
    delay: number = 1000
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const appError = AppErrorHandler.handleApiError(error);
        
        if (!AppErrorHandler.isRetryable(appError) || attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError;
  }
};