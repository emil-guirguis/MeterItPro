/**
 * Dashboard Components
 * 
 * Reusable React components for building dashboards.
 * All components are generic and accept data through props.
 * 
 * Exports:
 * - DashboardPage: Main dashboard page component
 * - DashboardCard: Individual card component
 * - DashboardGrid: Responsive grid layout
 * - DashboardWidget: Widget container with loading/error states
 * - StatCard: Statistics display component
 * - DashboardCardForm: Form for creating/editing cards
 * - ExpandedCardModal: Fullscreen card view modal
 * - Visualization: Generic chart component
 */

// Main dashboard page component
export * from './DashboardPage';

// Card components
export * from './DashboardCard';
export * from './DashboardCardForm';
export * from './ExpandedCardModal';

// Layout components
export * from './DashboardGrid';
export * from './DashboardWidget';

// Display components
export * from './StatCard';
export * from './Visualization';
