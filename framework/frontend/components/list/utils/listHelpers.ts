/**
 * List Component Framework - Helper Utilities
 * Provides utility functions for common list operations including
 * filter building, search debouncing, and unique value extraction.
 */

import type { FilterOption } from '../types/ui';

/**
 * Build a filter object from individual filter values.
 * Removes empty/null/undefined values to avoid sending unnecessary filters to the API.
 * 
 * @param filters - Record of filter key-value pairs
 * @returns Cleaned filter object with only non-empty values
 * 
 * @example
 * buildFilters({ status: 'active', role: '', search: 'john' })
 * // Returns: { status: 'active', search: 'john' }
 */
export const buildFilters = (filters: Record<string, any>): Record<string, any> => {
  const cleanedFilters: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(filters)) {
    // Skip empty, null, or undefined values
    if (value !== '' && value !== null && value !== undefined) {
      // For arrays, only include if not empty
      if (Array.isArray(value)) {
        if (value.length > 0) {
          cleanedFilters[key] = value;
        }
      } else {
        cleanedFilters[key] = value;
      }
    }
  }
  
  return cleanedFilters;
};

/**
 * Extract unique values from an array of items for a specific property.
 * Useful for generating filter options dynamically from data.
 * 
 * @param items - Array of items to extract values from
 * @param key - Property key to extract values from
 * @param labelFormatter - Optional function to format the label
 * @returns Array of FilterOption objects with unique values
 * 
 * @example
 * const items = [
 *   { status: 'active', name: 'John' },
 *   { status: 'inactive', name: 'Jane' },
 *   { status: 'active', name: 'Bob' }
 * ];
 * extractUniqueValues(items, 'status')
 * // Returns: [
 * //   { label: 'active', value: 'active' },
 * //   { label: 'inactive', value: 'inactive' }
 * // ]
 */
export const extractUniqueValues = <T extends Record<string, any>>(
  items: T[],
  key: keyof T,
  labelFormatter?: (value: any) => string
): FilterOption[] => {
  // Use Set to get unique values
  const uniqueValues = new Set<any>();
  
  items.forEach(item => {
    const value = item[key];
    if (value !== null && value !== undefined && value !== '') {
      uniqueValues.add(value);
    }
  });
  
  // Convert to FilterOption array
  return Array.from(uniqueValues)
    .sort() // Sort alphabetically
    .map(value => ({
      label: labelFormatter ? labelFormatter(value) : String(value),
      value: value
    }));
};

/**
 * Create a debounced version of a search handler function.
 * Delays execution until after the specified wait time has elapsed
 * since the last time the function was invoked.
 * 
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced function
 * 
 * @example
 * const debouncedSearch = debounceSearch((query) => {
 *   store.setSearch(query);
 * }, 300);
 * 
 * // User types quickly
 * debouncedSearch('a');
 * debouncedSearch('ab');
 * debouncedSearch('abc');
 * // Only the last call executes after 300ms
 */
export const debounceSearch = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Set new timeout
    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  };
};

/**
 * Format a filter value for display in the UI.
 * Handles arrays, booleans, and other types appropriately.
 * 
 * @param value - Filter value to format
 * @returns Formatted string representation
 */
export const formatFilterValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  return String(value);
};

/**
 * Check if any filters are currently active.
 * 
 * @param filters - Filter object to check
 * @returns True if any filters have non-empty values
 */
export const hasActiveFilters = (filters: Record<string, any>): boolean => {
  return Object.keys(buildFilters(filters)).length > 0;
};
