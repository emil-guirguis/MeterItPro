/**
 * Dashboard layout type definitions
 * 
 * Defines types for dashboard grid layouts and responsive breakpoints
 */

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  /** Number of columns in the grid */
  columns: number;
  /** Number of rows in the grid (optional, can be auto) */
  rows?: number;
  /** Gap between grid items in pixels or CSS units */
  gap: number | string;
  /** Responsive breakpoints for layout adjustments */
  breakpoints?: DashboardBreakpoint[];
}

/**
 * Responsive breakpoint configuration
 */
export interface DashboardBreakpoint {
  /** Breakpoint name (e.g., 'mobile', 'tablet', 'desktop') */
  name: string;
  /** Maximum width for this breakpoint in pixels */
  maxWidth: number;
  /** Number of columns at this breakpoint */
  columns: number;
  /** Gap size at this breakpoint */
  gap?: number | string;
}

/**
 * Grid item position
 */
export interface GridPosition {
  /** Column start position (1-based) */
  column: number;
  /** Row start position (1-based) */
  row: number;
  /** Column span (default: 1) */
  columnSpan?: number;
  /** Row span (default: 1) */
  rowSpan?: number;
}

/**
 * Dashboard grid item
 */
export interface DashboardGridItem {
  /** Item unique identifier */
  id: string;
  /** Grid position */
  position?: GridPosition;
  /** Item content */
  content: React.ReactNode;
  /** Custom className */
  className?: string;
}
