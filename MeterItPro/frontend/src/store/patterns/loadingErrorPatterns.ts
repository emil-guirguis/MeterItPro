// Loading and Error State Management Patterns

import React from 'react';
import { useUIStore } from '../slices/uiSlice';

// Loading state types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

export interface LoadingManager {
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  isAnyLoading: () => boolean;
  getLoadingKeys: () => string[];
  clearLoading: (key?: string) => void;
}

// Create async state
export const createAsyncState = <T = any>(initialData: T | null = null): AsyncState<T> => ({
  data: initialData,
  loading: false,
  error: null,
  lastFetch: null,
});

// Async state reducer
export const asyncStateReducer = <T>(
  state: AsyncState<T>,
  action: 
    | { type: 'LOADING' }
    | { type: 'SUCCESS'; payload: T }
    | { type: 'ERROR'; payload: string }
    | { type: 'RESET' }
): AsyncState<T> => {
  switch (action.type) {
    case 'LOADING':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        data: action.payload,
        lastFetch: Date.now(),
      };
    case 'ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'RESET':
      return createAsyncState(state.data);
    default:
      return state;
  }
};

// Loading manager implementation
export const createLoadingManager = (): LoadingManager => {
  const uiStore = useUIStore.getState();

  return {
    setLoading: (key: string, loading: boolean) => {
      uiStore.setGlobalLoading(key, loading);
    },

    isLoading: (key: string) => {
      return !!uiStore.loading[key];
    },

    isAnyLoading: () => {
      return Object.keys(uiStore.loading).length > 0;
    },

    getLoadingKeys: () => {
      return Object.keys(uiStore.loading);
    },

    clearLoading: (key?: string) => {
      if (key) {
        uiStore.setGlobalLoading(key, false);
      } else {
        // Clear all loading states
        Object.keys(uiStore.loading).forEach(loadingKey => {
          uiStore.setGlobalLoading(loadingKey, false);
        });
      }
    },
  };
};

// Global loading manager
export const globalLoadingManager = createLoadingManager();

// Async operation wrapper with loading states
export const withLoadingState = async <T>(
  operation: () => Promise<T>,
  loadingKey: string,
  options: {
    showNotification?: boolean;
    successMessage?: string;
    errorMessage?: string;
  } = {}
): Promise<T> => {
  const uiStore = useUIStore.getState();
  
  try {
    // Set loading state
    uiStore.setGlobalLoading(loadingKey, true);
    
    // Execute operation
    const result = await operation();
    
    // Clear loading state
    uiStore.setGlobalLoading(loadingKey, false);
    
    // Show success notification if requested
    if (options.showNotification && options.successMessage) {
      uiStore.addNotification({
        type: 'success',
        title: 'Success',
        message: options.successMessage,
        duration: 3000,
      });
    }
    
    return result;
  } catch (error) {
    // Clear loading state
    uiStore.setGlobalLoading(loadingKey, false);
    
    // Show error notification
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    
    if (options.showNotification !== false) {
      uiStore.addNotification({
        type: 'error',
        title: 'Error',
        message: options.errorMessage || errorMessage,
        duration: 0, // Don't auto-dismiss errors
      });
    }
    
    throw error;
  }
};

// Error handling patterns
export interface ErrorHandler {
  handleError: (error: unknown, context?: string) => void;
  clearError: (context?: string) => void;
  getError: (context?: string) => string | null;
}

export const createErrorHandler = (): ErrorHandler => {
  const errors = new Map<string, string>();
  
  return {
    handleError: (error: unknown, context = 'global') => {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      errors.set(context, errorMessage);
      
      // Also add to UI notifications
      const uiStore = useUIStore.getState();
      uiStore.addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 0,
      });
      
      console.error(`Error in ${context}:`, error);
    },

    clearError: (context?: string) => {
      if (context) {
        errors.delete(context);
      } else {
        errors.clear();
      }
    },

    getError: (context = 'global') => {
      return errors.get(context) || null;
    },
  };
};

// Global error handler
export const globalErrorHandler = createErrorHandler();

// React hooks for loading and error states
export const useAsyncOperation = <T>(
  operation: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [state, setState] = React.useState<AsyncState<T>>(createAsyncState<T>());
  
  const execute = React.useCallback(async () => {
    setState(prev => asyncStateReducer(prev, { type: 'LOADING' }));
    
    try {
      const result = await operation();
      setState(prev => asyncStateReducer(prev, { type: 'SUCCESS', payload: result }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(prev => asyncStateReducer(prev, { type: 'ERROR', payload: errorMessage }));
      throw error;
    }
  }, dependencies);

  const reset = React.useCallback(() => {
    setState(prev => asyncStateReducer(prev, { type: 'RESET' }));
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

export const useLoadingState = (key: string) => {
  const uiStore = useUIStore();
  
  return {
    isLoading: !!uiStore.loading[key],
    setLoading: (loading: boolean) => uiStore.setGlobalLoading(key, loading),
  };
};

// Retry patterns
export interface RetryConfig {
  maxRetries: number;
  delay: number;
  backoff: 'linear' | 'exponential';
  retryCondition?: (error: unknown) => boolean;
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 'exponential',
    retryCondition = () => true,
  } = config;

  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt or if retry condition fails
      if (attempt === maxRetries || !retryCondition(error)) {
        break;
      }
      
      // Calculate delay
      const currentDelay = backoff === 'exponential' 
        ? delay * Math.pow(2, attempt)
        : delay * (attempt + 1);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }
  
  throw lastError;
};

// Debounced operations
export const createDebouncedOperation = <T extends (...args: any[]) => Promise<any>>(
  operation: T,
  delay = 300
): T => {
  let timeoutId: any;
  let latestResolve: ((value: any) => void) | null = null;
  let latestReject: ((reason: any) => void) | null = null;
  
  return ((...args: Parameters<T>) => {
    return new Promise((resolve, reject) => {
      // Cancel previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
        // Reject previous promise
        if (latestReject) {
          latestReject(new Error('Debounced operation cancelled'));
        }
      }
      
      latestResolve = resolve;
      latestReject = reject;
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await operation(...args);
          if (latestResolve) {
            latestResolve(result);
          }
        } catch (error) {
          if (latestReject) {
            latestReject(error);
          }
        } finally {
          latestResolve = null;
          latestReject = null;
        }
      }, delay);
    });
  }) as T;
};

// Throttled operations
export const createThrottledOperation = <T extends (...args: any[]) => Promise<any>>(
  operation: T,
  delay = 1000
): T => {
  let lastExecution = 0;
  let pendingPromise: Promise<any> | null = null;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastExecution >= delay) {
      lastExecution = now;
      pendingPromise = operation(...args);
      return pendingPromise;
    } else {
      // Return the pending promise if one exists
      if (pendingPromise) {
        return pendingPromise;
      } else {
        // Create a new promise that waits for the throttle period
        return new Promise((resolve, reject) => {
          const remainingDelay = delay - (now - lastExecution);
          setTimeout(async () => {
            try {
              lastExecution = Date.now();
              const result = await operation(...args);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }, remainingDelay);
        });
      }
    }
  }) as T;
};