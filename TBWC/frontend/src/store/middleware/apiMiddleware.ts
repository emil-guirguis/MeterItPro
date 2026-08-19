// API Middleware for Store Actions

import { authService } from '../../services/authService';
import { useUIStore } from '../slices/uiSlice';

// API call wrapper with error handling and loading states
export interface ApiCallOptions {
  loadingKey?: string;
  showErrorNotification?: boolean;
  showSuccessNotification?: boolean;
  successMessage?: string;
  retryCount?: number;
  retryDelay?: number;
}

export const withApiCall = async <T>(
  apiCall: () => Promise<T>,
  options: ApiCallOptions = {}
): Promise<T> => {
  const {
    loadingKey,
    showErrorNotification = true,
    showSuccessNotification = false,
    successMessage,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const uiStore = useUIStore.getState();

  // Set loading state
  if (loadingKey) {
    uiStore.setGlobalLoading(loadingKey, true);
  }

  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts <= retryCount) {
    try {
      const result = await apiCall();

      // Clear loading state
      if (loadingKey) {
        uiStore.setGlobalLoading(loadingKey, false);
      }

      // Show success notification
      if (showSuccessNotification && successMessage) {
        uiStore.addNotification({
          type: 'success',
          title: 'Success',
          message: successMessage,
          duration: 3000,
        });
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      attempts++;

      // Handle authentication errors
      if (isAuthError(error)) {
        // Auth is handled by AuthContext, redirect to login
        authService.setLogoutFlag();
        authService.clearStoredToken();
        window.location.href = '/login';
        throw error;
      }

      // Retry logic
      if (attempts <= retryCount && isRetryableError(error)) {
        await delay(retryDelay * attempts); // Exponential backoff
        continue;
      }

      // Clear loading state
      if (loadingKey) {
        uiStore.setGlobalLoading(loadingKey, false);
      }

      // Show error notification
      if (showErrorNotification) {
        uiStore.addNotification({
          type: 'error',
          title: 'Error',
          message: lastError.message,
          duration: 0, // Don't auto-dismiss errors
        });
      }

      throw lastError;
    }
  }

  throw lastError;
};

// Check if error is authentication related
const isAuthError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const msg = error.message;
    return msg.includes('401') ||
           msg.includes('Unauthorized') ||
           msg.includes('Token expired') ||
           msg.includes('Invalid token') ||
           msg.includes('Access token required') ||
           msg.includes('Authentication required');
  }
  return false;
};

// Check if error is retryable
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    // Retry on network errors, 5xx errors, timeouts
    return error.message.includes('Network') ||
           error.message.includes('500') ||
           error.message.includes('502') ||
           error.message.includes('503') ||
           error.message.includes('504') ||
           error.message.includes('timeout');
  }
  return false;
};

// Delay utility
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Middleware for automatic token refresh
export const withTokenRefresh = <T>(
  apiCall: () => Promise<T>
): Promise<T> => {
  return new Promise(async (resolve, reject) => {
    // Token refresh is now handled by authService interceptors
    // This middleware is kept for compatibility but delegates to authService
    
    try {
      const result = await apiCall();
      resolve(result);
    } catch (error) {
      // If API call fails with auth error, authService will handle it
      if (isAuthError(error)) {
        authService.setLogoutFlag();
        authService.clearStoredToken();
        window.location.href = '/login';
      }
      reject(error);
    }
  });
};

// Middleware for optimistic updates
export interface OptimisticUpdateOptions<T> {
  updateFn: (state: T) => T;
  rollbackFn: (state: T) => T;
  apiCall: () => Promise<any>;
}

export const withOptimisticUpdate = <T>(
  store: any,
  options: OptimisticUpdateOptions<T>
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    const { updateFn, rollbackFn, apiCall } = options;

    // Apply optimistic update
    store.setState(updateFn);

    try {
      const result = await apiCall();
      resolve(result);
    } catch (error) {
      // Rollback on error
      store.setState(rollbackFn);
      reject(error);
    }
  });
};

// Middleware for caching
export interface CacheMiddlewareOptions {
  key: string;
  ttl: number;
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

const memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const withCache = <T>(
  apiCall: () => Promise<T>,
  options: CacheMiddlewareOptions
): Promise<T> => {
  return new Promise(async (resolve, reject) => {
    const { key, ttl, storage = 'memory' } = options;
    const now = Date.now();

    // Try to get from cache
    let cached: { data: any; timestamp: number; ttl: number } | null = null;

    switch (storage) {
      case 'memory':
        cached = memoryCache.get(key) || null;
        break;
      case 'localStorage':
        try {
          const item = localStorage.getItem(`cache_${key}`);
          cached = item ? JSON.parse(item) : null;
        } catch (e) {
          cached = null;
        }
        break;
      case 'sessionStorage':
        try {
          const item = sessionStorage.getItem(`cache_${key}`);
          cached = item ? JSON.parse(item) : null;
        } catch (e) {
          cached = null;
        }
        break;
    }

    // Check if cache is still valid
    if (cached && (now - cached.timestamp) < cached.ttl) {
      resolve(cached.data);
      return;
    }

    try {
      const result = await apiCall();
      
      // Store in cache
      const cacheEntry = { data: result, timestamp: now, ttl };
      
      switch (storage) {
        case 'memory':
          memoryCache.set(key, cacheEntry);
          break;
        case 'localStorage':
          try {
            localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
          } catch (e) {
            // Storage full or disabled, continue without caching
          }
          break;
        case 'sessionStorage':
          try {
            sessionStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
          } catch (e) {
            // Storage full or disabled, continue without caching
          }
          break;
      }

      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

// Clear cache utility
export const clearCache = (pattern?: string) => {
  // Clear memory cache
  if (pattern) {
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    }
  } else {
    memoryCache.clear();
  }

  // Clear localStorage cache
  if (typeof window !== 'undefined') {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_')) {
        if (!pattern || key.includes(pattern)) {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Clear sessionStorage cache
  if (typeof window !== 'undefined') {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('cache_')) {
        if (!pattern || key.includes(pattern)) {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  }
};