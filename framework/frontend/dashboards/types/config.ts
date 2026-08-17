/**
 * Dashboard configuration type definitions
 * 
 * Defines types for dashboard configuration and settings
 */

import type { DashboardLayout } from './layout';

/**
 * Dashboard configuration interface
 * Defines the overall configuration for a dashboard instance
 */
export interface DashboardConfig {
  /** Dashboard unique identifier */
  id: string;
  /** Dashboard title */
  title?: string;
  /** Dashboard layout configuration */
  layout: DashboardLayout;
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  refreshInterval?: number;
  /** Whether to persist state in localStorage */
  persistState?: boolean;
  /** localStorage key for state persistence */
  storageKey?: string;
  /** Whether sections can be collapsed */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
}

/**
 * Dashboard state configuration
 * Represents the runtime state of a dashboard
 */
export interface DashboardStateConfig {
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Last update timestamp */
  lastUpdate: Date | null;
  /** Collapsed sections map (sectionId -> isCollapsed) */
  collapsedSections: Record<string, boolean>;
  /** Custom state data */
  data?: any;
}

/**
 * Dashboard actions configuration
 * Defines available actions for dashboard state management
 */
export interface DashboardActionsConfig {
  /** Refresh dashboard data */
  refresh: () => Promise<void>;
  /** Toggle section collapse state */
  toggleSection: (sectionId: string) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error state */
  setError: (error: string | null) => void;
  /** Update dashboard data */
  setData: (data: any) => void;
}

/**
 * Dashboard hook return type
 * Combines configuration, state, and actions
 */
export interface DashboardReturn extends DashboardStateConfig, DashboardActionsConfig {
  /** Dashboard configuration */
  config: DashboardConfig;
}
