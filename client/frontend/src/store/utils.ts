// Store Utilities

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Deep merge utility
export const deepMerge = (target: any, source: any): any => {
  const output = Object.assign({}, target);
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
};

// Check if value is object
const isObject = (item: any): boolean => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

// Format error message
export const formatError = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  return 'An unexpected error occurred';
};

// Cache utilities
export const createCacheKey = (...parts: (string | number)[]): string => {
  return parts.join(':');
};

export const isCacheExpired = (timestamp: number, ttl: number): boolean => {
  return Date.now() - timestamp > ttl;
};

// Local storage utilities
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
};

// Session storage utilities
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  
  clear: (): boolean => {
    try {
      sessionStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
};

// Cache configuration utilities
export const createCacheConfig = (options?: Partial<CacheConfig>): CacheConfig => {
  return {
    ttl: 5 * 60 * 1000, // 5 minutes default
    maxAge: 30 * 60 * 1000, // 30 minutes default
    staleWhileRevalidate: true,
    ...options
  };
};

// List state utilities
export const createListState = (): ListState => {
  return {
    page: 1,
    pageSize: 20,
    total: 0,
    search: '',
    filters: {},
    sortBy: '',
    sortOrder: 'desc',
    loading: false,
    error: null
  };
};

// Entity state utilities
export const createEntityState = <T>(): EntityState<T> => {
  return {
    items: [],
    selectedItem: null,
    loading: false,
    error: null,
    lastFetch: null,
    hasMore: false,
    total: 0
  };
};

// Cache freshness check
export const isCacheFresh = (timestamp: number, ttl: number): boolean => {
  return Date.now() - timestamp < ttl;
};

// Cache configuration interface
interface CacheConfig {
  ttl: number;
  maxAge: number;
  staleWhileRevalidate: boolean;
}

// List state interface
interface ListState {
  page: number;
  pageSize: number;
  total: number;
  search: string;
  filters: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  loading: boolean;
  error: string | null;
}

// Entity state interface
interface EntityState<T> {
  items: T[];
  selectedItem: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  hasMore: boolean;
  total: number;
}