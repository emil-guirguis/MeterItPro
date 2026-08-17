/**
 * useDashboard Hook
 * 
 * Provides dashboard state management, auto-refresh, and section collapse functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardConfig } from '../types/config';
import type { DashboardReturn } from '../types/dashboard';

/**
 * Configuration for useDashboard hook
 */
export interface UseDashboardConfig extends Omit<DashboardConfig, 'id'> {
  /** Dashboard unique identifier */
  id: string;
  /** Data fetching function */
  fetchData?: () => Promise<any>;
  /** Initial data */
  initialData?: any;
  /** Error handler */
  onError?: (error: Error) => void;
}

/**
 * Hook for managing dashboard state and behavior
 * 
 * @param config - Dashboard configuration
 * @returns Dashboard state and actions
 * 
 * @example
 * ```tsx
 * const dashboard = useDashboard({
 *   id: 'main-dashboard',
 *   layout: { columns: 3, gap: 16 },
 *   refreshInterval: 30000,
 *   persistState: true,
 *   fetchData: async () => {
 *     const response = await fetch('/api/dashboard-data');
 *     return response.json();
 *   }
 * });
 * 
 * return (
 *   <div>
 *     {dashboard.loading && <Spinner />}
 *     {dashboard.error && <Error message={dashboard.error} />}
 *     {dashboard.data && <DashboardContent data={dashboard.data} />}
 *     <button onClick={dashboard.refresh}>Refresh</button>
 *   </div>
 * );
 * ```
 */
export function useDashboard(config: UseDashboardConfig): DashboardReturn {
  const {
    id,
    layout,
    title,
    refreshInterval = 0,
    collapsible = false,
    defaultCollapsed = false,
    persistState = false,
    storageKey = `dashboard-${id}`,
    fetchData,
    initialData,
    onError
  } = config;

  // Load initial state from localStorage if persistence is enabled
  const loadPersistedState = useCallback(() => {
    if (!persistState) {
      return { collapsedSections: {} };
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load persisted dashboard state:', error);
    }

    return { collapsedSections: {} };
  }, [persistState, storageKey]);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(initialData);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(
    () => loadPersistedState().collapsedSections || {}
  );

  // Refs for cleanup
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Persist state to localStorage
  useEffect(() => {
    if (persistState) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ collapsedSections }));
      } catch (error) {
        console.error('Failed to persist dashboard state:', error);
      }
    }
  }, [collapsedSections, persistState, storageKey]);

  // Refresh function
  const refresh = useCallback(async () => {
    if (!fetchData) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await fetchData();

      if (isMountedRef.current) {
        setData(result);
        setLastUpdate(new Date());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      
      if (isMountedRef.current) {
        setError(errorMessage);
      }

      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchData, onError]);

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (fetchData) {
      refresh();
    }
  }, [fetchData, refresh]);

  // Auto-refresh setup
  useEffect(() => {
    if (refreshInterval > 0 && fetchData) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, fetchData, refresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    loading,
    error,
    data,
    lastUpdate,
    collapsedSections,

    // Actions
    refresh,
    toggleSection,
    setLoading,
    setError,
    setData,

    // Config
    config: {
      id,
      title,
      layout,
      refreshInterval,
      collapsible,
      defaultCollapsed,
      persistState,
      storageKey
    }
  };
}

/**
 * Hook for managing individual widget state
 * 
 * @param widgetId - Widget unique identifier
 * @param fetchData - Data fetching function
 * @param refreshInterval - Auto-refresh interval in milliseconds
 * @returns Widget state and actions
 * 
 * @example
 * ```tsx
 * const widget = useWidget('stats-widget', async () => {
 *   const response = await fetch('/api/stats');
 *   return response.json();
 * }, 10000);
 * ```
 */
export function useWidget(
  _widgetId: string,
  fetchData?: () => Promise<any>,
  refreshInterval?: number
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!fetchData) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await fetchData();

      if (isMountedRef.current) {
        setData(result);
        setLastUpdate(new Date());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch widget data';
      
      if (isMountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchData]);

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (fetchData) {
      refresh();
    }
  }, [fetchData, refresh]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0 && fetchData) {
      refreshIntervalRef.current = setInterval(refresh, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, fetchData, refresh]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    loading,
    error,
    data,
    lastUpdate,
    collapsed,
    refresh,
    toggleCollapse,
    setData,
    setLoading,
    setError
  };
}
