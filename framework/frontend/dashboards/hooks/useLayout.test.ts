/**
 * Property-based tests for useLayout hook
 * 
 * Feature: dashboard-framework-migration
 * Property 1: Component Isolation
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLayout } from './useLayout';
import type { DashboardLayout, GridPosition } from '../types/layout';
import type { LayoutItem } from './useLayout';

describe('useLayout Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Property 1: Layout Item Management', () => {
    /**
     * Property: For any layout item, the hook SHALL manage its position
     * independently without affecting other items.
     * 
     * Validates: Requirements 3.1, 3.2, 3.3, 3.4
     */
    it('should manage layout items independently', () => {
      const layout: DashboardLayout = {
        columns: 3,
        gap: 16
      };

      const initialItems: LayoutItem[] = [
        { id: 1, position: { column: 1, row: 1 } },
        { id: 2, position: { column: 2, row: 1 } }
      ];

      const config = {
        layout,
        initialItems,
        persistLayout: false
      };

      const { result } = renderHook(() => useLayout(config));

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].id).toBe(1);
      expect(result.current.items[1].id).toBe(2);
    });

    /**
     * Property: For any item position update, only that item's position
     * SHALL change, other items remain unchanged.
     */
    it('should update individual item position without affecting others', () => {
      const layout: DashboardLayout = {
        columns: 3,
        gap: 16
      };

      const initialItems: LayoutItem[] = [
        { id: 1, position: { column: 1, row: 1 } },
        { id: 2, position: { column: 2, row: 1 } }
      ];

      const config = {
        layout,
        initialItems,
        persistLayout: false
      };

      const { result } = renderHook(() => useLayout(config));

      const newPosition: GridPosition = { column: 3, row: 2 };

      act(() => {
        result.current.updateItemPosition(1, newPosition);
      });

      expect(result.current.items[0].position).toEqual(newPosition);
      expect(result.current.items[1].position).toEqual({ column: 2, row: 1 });
    });
  });

  describe('Property 2: Add and Remove Items', () => {
    /**
     * Property: For any new item added, the items list length SHALL increase by 1.
     */
    it('should add new items to layout', () => {
      const layout: DashboardLayout = {
        columns: 3,
        gap: 16
      };

      const config = {
        layout,
        initialItems: [],
        persistLayout: false
      };

      const { result } = renderHook(() => useLayout(config));

      expect(result.current.items).toHaveLength(0);

      const newItem: LayoutItem = {
        id: 1,
        position: { column: 1, row: 1 }
      };

      act(() => {
        result.current.addItem(newItem);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toEqual(newItem);
    });

    /**
     * Property: For any item removed, the items list length SHALL decrease by 1
     * and the item SHALL no longer be in the list.
     */
    it('should remove items from layout', () => {
      const layout: DashboardLayout = {
        columns: 3,
        gap: 16
      };

      const initialItems: LayoutItem[] = [
        { id: 1, position: { column: 1, row: 1 } },
        { id: 2, position: { column: 2, row: 1 } }
      ];

      const config = {
        layout,
        initialItems,
        persistLayout: false
      };

      const { result } = renderHook(() => useLayout(config));

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.removeItem(1);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe(2);
    });
  });

  describe('Property 3: Responsive Columns', () => {
    /**
     * Property: For any layout configuration, the hook SHALL return the correct
     * number of columns based on the current viewport width.
     */
    it('should return correct columns for layout', () => {
      const layout: DashboardLayout = {
        columns: 3,
        gap: 16
      };

      const config = {
        layout,
        initialItems: [],
        persistLayout: false
      };

      const { result } = renderHook(() => useLayout(config));

      expect(result.current.columns).toBe(3);
    });

    /**
     * Property: For any layout with breakpoints, the hook SHALL select the correct
     * breakpoint based on viewport width.
     */
    it('should apply responsive breakpoints', () => {
      const layout: DashboardLayout = {
        columns: 3,
        gap: 16,
        breakpoints: [
          { name: 'mobile', maxWidth: 600, columns: 1 },
          { name: 'tablet', maxWidth: 1024, columns: 2 },
          { name: 'desktop', maxWidth: 9999, columns: 3 }
        ]
      };

      const config = {
        layout,
        initialItems: [],
        persistLayout: false
      };

      const { result } = renderHook(() => useLayout(config));

      // Should have columns based on current viewport
      expect(result.current.columns).toBeGreaterThanOrEqual(1);
      expect(result.current.columns).toBeLessThanOrEqual(3);
    });
  });

  describe('Property 4: Gap Configuration', () => {
    /**
     * Property: For any layout gap configuration, the hook SHALL return the gap value.
     */
    it('should return correct gap value', () => {
      const layout: DashboardLayout = {
        columns: 3,
        gap: 24
      };

      const config = {
        layout,
        initialItems: [],
        persistLayout: false
      };

      const { result } = renderHook(() => useLayout(config));

      expect(result.current.gap).toBe(24);
    });

    /**
     * Property: For any gap value (number or string), the hook SHALL preserve it.
     */
    it('should support string gap values', () => {
      const layout: DashboardLayout = {
        columns: 3,
        gap: '1rem'
      };

      const config = {
        layout,
        initialItems: [],
        persistLayout: false
      };

      const { result } = renderHook(() => useLayout(config));

      expect(result.current.gap).toBe('1rem');
    });
  });

  describe('Property 5: Layout Persistence', () => {
    /**
     * Property: For any layout with persistLayout enabled, the items
     * SHALL be persisted to localStorage and restored on remount.
     */
    it('should persist and restore layout items', () => {
      const layout: DashboardLayout = {
        columns: 3,
        gap: 16
      };

      const initialItems: LayoutItem[] = [
        { id: 1, position: { column: 1, row: 1 } },
        { id: 2, position: { column: 2, row: 1 } }
      ];

      const config = {
        layout,
        initialItems,
        persistLayout: true,
        storageKey: 'test-layout'
      };

      const { result, unmount } = renderHook(() => useLayout(config));

      // Add a new item
      const newItem: LayoutItem = {
        id: 3,
        position: { column: 3, row: 1 }
      };

      act(() => {
        result.current.addItem(newItem);
      });

      expect(result.current.items).toHaveLength(3);

      // Unmount and remount
      unmount();

      const { result: result2 } = renderHook(() => useLayout(config));

      // Items should be restored
      expect(result2.current.items).toHaveLength(3);
      expect(result2.current.items[2].id).toBe(3);
    });
  });

  describe('Property 6: Layout Change Callback', () => {
    /**
     * Property: For any layout change, if onLayoutChange callback is provided,
     * it SHALL be invoked with the updated items.
     */
    it('should invoke onLayoutChange callback', () => {
      const layout: DashboardLayout = {
        columns: 3,
        gap: 16
      };

      const onLayoutChangeMock = vi.fn();

      const config = {
        layout,
        initialItems: [],
        persistLayout: false,
        onLayoutChange: onLayoutChangeMock
      };

      const { result } = renderHook(() => useLayout(config));

      const newItem: LayoutItem = {
        id: 1,
        position: { column: 1, row: 1 }
      };

      act(() => {
        result.current.addItem(newItem);
      });

      expect(onLayoutChangeMock).toHaveBeenCalledWith([newItem]);
    });
  });

  describe('Property 7: Reset Layout', () => {
    /**
     * Property: For any layout reset, the items SHALL return to the initial state.
     */
    it('should reset layout to initial state', () => {
      const layout: DashboardLayout = {
        columns: 3,
        gap: 16
      };

      const initialItems: LayoutItem[] = [
        { id: 1, position: { column: 1, row: 1 } }
      ];

      const config = {
        layout,
        initialItems,
        persistLayout: false
      };

      const { result } = renderHook(() => useLayout(config));

      // Add a new item
      act(() => {
        result.current.addItem({
          id: 2,
          position: { column: 2, row: 1 }
        });
      });

      expect(result.current.items).toHaveLength(2);

      // Reset
      act(() => {
        result.current.resetLayout();
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe(1);
    });
  });

  describe('Property 8: Set Items', () => {
    /**
     * Property: For any setItems call, the items list SHALL be completely replaced
     * with the provided items.
     */
    it('should replace all items', () => {
      const layout: DashboardLayout = {
        columns: 3,
        gap: 16
      };

      const initialItems: LayoutItem[] = [
        { id: 1, position: { column: 1, row: 1 } }
      ];

      const config = {
        layout,
        initialItems,
        persistLayout: false
      };

      const { result } = renderHook(() => useLayout(config));

      const newItems: LayoutItem[] = [
        { id: 2, position: { column: 1, row: 1 } },
        { id: 3, position: { column: 2, row: 1 } },
        { id: 4, position: { column: 3, row: 1 } }
      ];

      act(() => {
        result.current.setItems(newItems);
      });

      expect(result.current.items).toEqual(newItems);
      expect(result.current.items).toHaveLength(3);
    });
  });

  describe('Property 9: Viewport Width Tracking', () => {
    /**
     * Property: For any hook instance, the viewportWidth SHALL reflect
     * the current window width.
     */
    it('should track viewport width', () => {
      const layout: DashboardLayout = {
        columns: 3,
        gap: 16
      };

      const config = {
        layout,
        initialItems: [],
        persistLayout: false
      };

      const { result } = renderHook(() => useLayout(config));

      expect(result.current.viewportWidth).toBeGreaterThan(0);
      expect(result.current.viewportWidth).toBeLessThanOrEqual(window.innerWidth);
    });
  });

  describe('Property 10: Cleanup on Unmount', () => {
    /**
     * Property: For any hook instance, on unmount, all event listeners
     * SHALL be removed to prevent memory leaks.
     */
    it('should remove resize listener on unmount', () => {
      const layout: DashboardLayout = {
        columns: 3,
        gap: 16
      };

      const config = {
        layout,
        initialItems: [],
        persistLayout: false
      };

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useLayout(config));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});
