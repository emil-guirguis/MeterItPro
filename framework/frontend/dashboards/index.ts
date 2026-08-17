/**
 * Dashboard Framework
 *
 * Comprehensive framework for building responsive, accessible dashboards with React.
 *
 * Main Exports:
 * - Components: DashboardPage, DashboardCard, DashboardGrid, DashboardWidget, StatCard, etc.
 * - Hooks: useDashboard, useCardData, useLayout
 * - Types: DashboardCard, DashboardConfig, VisualizationType, etc.
 * - Utilities: formatNumber, formatCurrency, formatPercentage, layout helpers, validators
 * - Examples: Reference implementations for common dashboard patterns
 */

// Types - Generic interfaces and type definitions
export * from './types';

// Hooks - State management and data fetching
export * from './hooks';

// Components - Reusable UI components
export { DashboardPage } from './components/DashboardPage';
export { DashboardCard } from './components/DashboardCard';
export { DashboardCardForm } from './components/DashboardCardForm';
export { ExpandedCardModal } from './components/ExpandedCardModal';
export { DashboardGrid } from './components/DashboardGrid';
export { DashboardWidget } from './components/DashboardWidget';
export { StatCard } from './components/StatCard';
export { Visualization } from './components/Visualization';

// Utilities - Helper functions for formatting, layout, and validation
export { createResponsiveLayout, calculateColumns, getDeviceType } from './utils/layoutHelpers';
export { formatNumber, formatCurrency, formatPercentage } from './utils/formatters';
export {
  validateDashboardCard,
  validateAggregatedData,
  validateDashboardLayout,
  validateNumber,
  validateString,
  validateArray,
  validateRequiredKeys,
  validateDate,
  validateEmail,
  validateUrl,
  combineValidationResults
} from './utils/validators';

// Examples - Reference implementations (commented out - example files are not yet implemented)
// export * from './examples';
