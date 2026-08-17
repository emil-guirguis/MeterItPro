/**
 * Widget type definitions
 * 
 * Defines types for dashboard widgets and stat cards
 */

/**
 * Widget size variants
 */
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

/**
 * Widget status variants
 */
export type WidgetStatus = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * Base widget configuration
 */
export interface WidgetConfig {
  /** Widget unique identifier */
  id: string;
  /** Widget type */
  type: string;
  /** Widget title */
  title?: string;
  /** Widget size */
  size?: WidgetSize;
  /** Widget position in grid */
  position?: {
    x: number;
    y: number;
  };
  /** Widget dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
  /** Widget props/data */
  props?: Record<string, any>;
  /** Whether widget can be refreshed */
  refreshable?: boolean;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** Whether widget is collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
}

/**
 * Stat card configuration
 */
export interface StatCardConfig {
  /** Stat unique identifier */
  id: string;
  /** Stat title */
  title: string;
  /** Stat value */
  value: string | number;
  /** Stat subtitle or description */
  subtitle?: string;
  /** Icon (emoji or icon name) */
  icon?: string;
  /** Color variant */
  variant?: WidgetStatus;
  /** Custom color for border/accent */
  color?: string;
  /** Trend indicator */
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  /** Click handler */
  onClick?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Format function for value */
  formatValue?: (value: any) => string;
}

/**
 * Widget state
 */
export interface WidgetState {
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Widget data */
  data: any;
  /** Last update timestamp */
  lastUpdate: Date | null;
  /** Collapsed state */
  collapsed: boolean;
}

/**
 * Widget actions
 */
export interface WidgetActions {
  /** Refresh widget data */
  refresh: () => Promise<void>;
  /** Toggle collapsed state */
  toggleCollapse: () => void;
  /** Update widget data */
  setData: (data: any) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error state */
  setError: (error: string | null) => void;
}

/**
 * Widget component props
 */
export interface WidgetProps extends WidgetConfig {
  /** Widget content */
  children?: React.ReactNode;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Refresh handler */
  onRefresh?: () => void | Promise<void>;
  /** Collapse handler */
  onToggleCollapse?: () => void;
}

/**
 * Stat card component props
 */
export interface StatCardProps extends StatCardConfig {
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Whether to show hover effects */
  hoverable?: boolean;
  /** Whether to show loading skeleton */
  loading?: boolean;
}

/**
 * Chart widget data point
 */
export interface ChartDataPoint {
  /** X-axis value (timestamp, label, etc.) */
  x: string | number | Date;
  /** Y-axis value */
  y: number;
  /** Optional label */
  label?: string;
  /** Optional color */
  color?: string;
}

/**
 * Chart widget configuration
 */
export interface ChartWidgetConfig extends WidgetConfig {
  /** Chart type */
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  /** Chart data */
  data: ChartDataPoint[] | ChartDataPoint[][];
  /** X-axis label */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Chart colors */
  colors?: string[];
  /** Show legend */
  showLegend?: boolean;
  /** Show grid */
  showGrid?: boolean;
}

/**
 * Metric widget configuration
 */
export interface MetricWidgetConfig extends WidgetConfig {
  /** Current value */
  value: number;
  /** Previous value for comparison */
  previousValue?: number;
  /** Target value */
  targetValue?: number;
  /** Unit of measurement */
  unit?: string;
  /** Format function */
  formatValue?: (value: number) => string;
  /** Show progress bar */
  showProgress?: boolean;
  /** Progress percentage (0-100) */
  progress?: number;
}
