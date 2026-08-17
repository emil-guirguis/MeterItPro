/**
 * Common Types
 * 
 * Shared type definitions used across multiple framework domains.
 */

/**
 * Generic pagination result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Generic API response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Generic filter definition
 */
export interface FilterOption {
  label: string;
  value: string | number | boolean;
}

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort configuration
 */
export interface SortConfig {
  field: string;
  order: SortOrder;
}

/**
 * Generic loading state
 */
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

/**
 * Generic form field error
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Breakpoint types for responsive design
 */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'large';

/**
 * Generic callback types
 */
export type VoidCallback = () => void;
export type AsyncVoidCallback = () => Promise<void>;
export type Callback<T> = (value: T) => void;
export type AsyncCallback<T> = (value: T) => Promise<void>;
