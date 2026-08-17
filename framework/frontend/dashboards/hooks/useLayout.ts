/**
 * useLayout Hook
 * 
 * Provides grid layout management and responsive layout calculations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardLayout, GridPosition } from '../types/layout';

/**
 * Layout item configuration
 */
export interface LayoutItem {
  /** Item unique identifier */
  id: string | number;
  /** Grid position */
  position: GridPosition;
}

/**
 * Configuration for useLayout hook
 */
export interface UseLayoutConfig {
  /** Dashboard layout configuration */
  layout: DashboardLayout;
  /** Initial layout items */
  initialItems?: LayoutItem[];
  /** Whether to persist layout to localStorage */
  persistLayout?: boolean;
  /** localStorage key for layout persistence */
  storageKey?: string;
  /** Callback when layout changes */
  onLayoutChange?: (items: LayoutItem[]) => void;
}

/**
 * Layout state
 */
export interface LayoutState {
  /** Current layout items */
  items: LayoutItem[];
  /** Current number of columns */
  columns: number;
  /** Current gap size */
  gap: number | string;
  /** Viewport width */
  viewportWidth: number;
}

/**
 * Layout actions
 */
export interface LayoutActions {
  /** Update item position */
  updateItemPosition: (itemId: string | number, position: GridPosition) => void;
  /** Add new layout item */
  addItem: (item: LayoutItem) => void;
  /** Remove layout item */
  removeItem: (itemId: string | number) => void;
  /** Reset layout to initial state */
  resetLayout: () => void;
  /** Update all items */
  setItems: (items: LayoutItem[]) => void;
}

/**
 * Hook for managing dashboard grid layout
 * 
 * @param config - Layout configuration
 * @returns Layout state and actions
 */
export function useLayout(config: UseLayoutConfig): LayoutState & LayoutActions {
  const {
    layout,
    initialItems = [],
    persistLayout = false,
    storageKey = 'dashboard-layout',
    onLayoutChange
  } = config;

  // Load persisted layout
  const loadPersistedLayout = useCallback(() => {
    if (!persistLayout) {
      return initialItems;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load persisted layout:', error);
    }

    return initialItems;
  }, [persistLayout, storageKey, initialItems]);

  // State
  const [items, setItems] = useState<LayoutItem[]>(() => loadPersistedLayout());
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  // Refs
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialItemsRef = useRef(initialItems);

  // Calculate responsive columns based on viewport width
  const getResponsiveColumns = useCallback(() => {
    if (!layout.breakpoints || layout.breakpoints.length === 0) {
      return layout.columns;
    }

    // Sort breakpoints by maxWidth in descending order
    const sortedBreakpoints = [...layout.breakpoints].sort(
      (a, b) => b.maxWidth - a.maxWidth
    );

    // Find the first breakpoint that matches the current viewport
    for (const breakpoint of sortedBreakpoints) {
      if (viewportWidth <= breakpoint.maxWidth) {
        return breakpoint.columns;
      }
    }

    // Default to layout columns if no breakpoint matches
    return layout.columns;
  }, [layout.columns, layout.breakpoints, viewportWidth]);

  const currentColumns = getResponsiveColumns();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        setViewportWidth(window.innerWidth);
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Persist layout changes
  useEffect(() => {
    if (persistLayout) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(items));
      } catch (error) {
        console.error('Failed to persist layout:', error);
      }
    }

    if (onLayoutChange) {
      onLayoutChange(items);
    }
  }, [items, persistLayout, storageKey, onLayoutChange]);

  // Update item position
  const updateItemPosition = useCallback((itemId: string | number, position: GridPosition) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, position } : item
      )
    );
  }, []);

  // Add new item
  const addItem = useCallback((item: LayoutItem) => {
    setItems(prevItems => [...prevItems, item]);
  }, []);

  // Remove item
  const removeItem = useCallback((itemId: string | number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);

  // Reset layout
  const resetLayout = useCallback(() => {
    setItems(initialItemsRef.current);
  }, []);

  return {
    // State
    items,
    columns: currentColumns,
    gap: layout.gap,
    viewportWidth,

    // Actions
    updateItemPosition,
    addItem,
    removeItem,
    resetLayout,
    setItems
  };
}
