// Simplified Store Implementation

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Simple state interfaces
interface SimpleState {
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  cache: Record<string, any>;
}

interface SimpleActions {
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
  clearError: (key: string) => void;
  setCache: (key: string, data: any) => void;
  clearCache: (key?: string) => void;
}

// Simple store
export const useSimpleStore = create<SimpleState & SimpleActions>()(
  persist(
    (set) => ({
      // State
      loading: {},
      errors: {},
      cache: {},

      // Actions
      setLoading: (key, loading) => {
        set((state) => ({
          loading: loading 
            ? { ...state.loading, [key]: true }
            : { ...state.loading, [key]: false }
        }));
      },

      setError: (key, error) => {
        set((state) => ({
          errors: { ...state.errors, [key]: error }
        }));
      },

      clearError: (key) => {
        set((state) => {
          const { [key]: removed, ...rest } = state.errors;
          return { errors: rest };
        });
      },

      setCache: (key, data) => {
        set((state) => ({
          cache: { ...state.cache, [key]: data }
        }));
      },

      clearCache: (key) => {
        if (key) {
          set((state) => {
            const { [key]: removed, ...rest } = state.cache;
            return { cache: rest };
          });
        } else {
          set({ cache: {} });
        }
      },
    }),
    {
      name: 'simple-store',
      partialize: (state) => ({ cache: state.cache }),
    }
  )
);

// Simple hooks
export const useLoading = (key: string) => {
  const loading = useSimpleStore((state) => state.loading[key] || false);
  const setLoading = useSimpleStore((state) => state.setLoading);
  
  return {
    loading,
    setLoading: (isLoading: boolean) => setLoading(key, isLoading),
  };
};

export const useError = (key: string) => {
  const error = useSimpleStore((state) => state.errors[key] || null);
  const setError = useSimpleStore((state) => state.setError);
  const clearError = useSimpleStore((state) => state.clearError);
  
  return {
    error,
    setError: (errorMessage: string | null) => setError(key, errorMessage),
    clearError: () => clearError(key),
  };
};

export const useCache = (key: string) => {
  const data = useSimpleStore((state) => state.cache[key] || null);
  const setCache = useSimpleStore((state) => state.setCache);
  const clearCache = useSimpleStore((state) => state.clearCache);
  
  return {
    data,
    setCache: (cacheData: any) => setCache(key, cacheData),
    clearCache: () => clearCache(key),
  };
};