/**
 * Dashboard Types
 * 
 * Generic type definitions for dashboard components and utilities.
 * These types are designed to be extended by client applications.
 * 
 * Exports:
 * - DashboardCard: Generic card interface
 * - DashboardConfig: Dashboard configuration
 * - VisualizationType: Supported chart types
 * - AggregatedData: Data structure for aggregated metrics
 * - WidgetConfig: Widget configuration
 * - DashboardLayout: Layout configuration
 */

// Core dashboard types
export * from './dashboard';

// Layout types (re-export to avoid conflicts)
export type { DashboardLayout, DashboardBreakpoint, GridPosition, DashboardGridItem } from './layout';

// Layout item type from hook
export type { LayoutItem } from '../hooks/useLayout';

// Widget types
export * from './widget';

// Configuration types
export type { DashboardConfig } from './config';