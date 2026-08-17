/**
 * useCardData Hook
 * 
 * Provides card-specific data management and refresh functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardCard, AggregatedData } from '../types/dashboard';

/**
 * Configuration for useCardData hook
 */
export interface UseCardDataConfig {
  /** Card configuration */
  card: DashboardCard;
  /** Data fetching function */
  fetchData?: (card: DashboardCard) => Promise<AggregatedData>;
  /** Initial data */
  initialData?: AggregatedData | null;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** Error handler */
  onError?: (error: Error) => void;
}

/**
 * Card data state
 */
export interface CardDataState {
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Card data */
  data: AggregatedData | null;
  /** Last update timestamp */
  lastUpdate: Date | null;
}

/**
 * Card data actions
 */
export interface CardDataActions {
  /** Refresh card data */
  refresh: () => Promise<void>;
  /** Update card data */
  setData: (data: AggregatedData | null) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error state */
  setError: (error: string | null) => void;
}

/**
 * Hook for managing individual card data
 * 
 * @param config - Card data configuration
 * @returns Card data state and actions
 * 
 * @example
 * ```tsx
 * const cardData = useCardData({
 *   card: { id: 1, title: 'Sales', visualization_type: 'line' },
 *   fetchData: async (card) => {
 *     const response = await fetch(`/api/cards/${card.id}/data`);
 *     return response.json();
 *   },
 *   refreshInterval: 30000
 * });
 * 
 * return (
 *   <div>
 *     {cardData.loading && <Spinner />}
 *     {cardData.error && <Error message={cardData.error} />}
 *     {cardData.data && <Chart data={cardData.data} />}
 *     <button onClick={cardData.refresh}>Refresh</button>
 *   </div>
 * );
 * ```
 */
export function useCardData(config: UseCardDataConfig): CardDataState & CardDataActions {
  const {
    card,
    fetchData,
    initialData = null,
    refreshInterval = 0,
    onError
  } = config;

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AggregatedData | null>(initialData);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Refs for cleanup
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Refresh function
  const refresh = useCallback(async () => {
    if (!fetchData) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await fetchData(card);

      if (isMountedRef.current) {
        setData(result);
        setLastUpdate(new Date());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch card data';
      
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
  }, [card, fetchData, onError]);

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

    // Actions
    refresh,
    setData,
    setLoading,
    setError
  };
}
