# Dashboard Framework Migration Requirements

## Introduction

This feature involves migrating the dashboard implementation from the client application to the framework, while keeping only client-specific data and services in the client. The goal is to create a reusable, framework-level dashboard system that can be used across multiple applications.

## Glossary

- **Framework Dashboard**: Reusable dashboard components and utilities in `framework/frontend/dashboards`
- **Client Dashboard**: Application-specific dashboard implementation in `MeterItPro/frontend`
- **Dashboard Card**: A configurable widget displaying aggregated meter data
- **Visualization**: Chart/graph component (line, bar, pie, area, candlestick)
- **Aggregated Data**: Processed meter readings grouped by time period
- **Client-Specific Data**: Tenant ID, authentication, API endpoints, business logic
- **Framework-Level Code**: Generic, reusable components and utilities

## Requirements

### Requirement 1: Move Dashboard Components to Framework

**User Story:** As a framework maintainer, I want dashboard components to be in the framework, so that they can be reused across multiple applications.

#### Acceptance Criteria

1. WHEN the DashboardCard component is moved to the framework, THEN it SHALL be a generic component that accepts data and callbacks
2. WHEN the DashboardPage component is moved to the framework, THEN it SHALL manage layout and card orchestration without business logic
3. WHEN visualization components are moved to the framework, THEN they SHALL be generic chart components that work with any data structure
4. WHEN modal components are moved to the framework, THEN they SHALL be reusable dialog components for card creation/editing
5. THE framework dashboard components SHALL NOT contain tenant-specific logic or API calls

### Requirement 2: Keep Client-Specific Services in Client

**User Story:** As a client developer, I want client-specific services to remain in the client, so that business logic stays separate from framework code.

#### Acceptance Criteria

1. WHEN the dashboardService is kept in the client, THEN it SHALL handle all API communication with tenant-specific headers
2. WHEN the dashboardService makes API calls, THEN it SHALL include authentication tokens and tenant context
3. THE dashboardService SHALL remain the single source of truth for dashboard data operations
4. WHEN framework components need data, THEN they SHALL receive it through props, not direct API calls
5. THE client SHALL pass data and callbacks to framework components, maintaining separation of concerns

### Requirement 3: Create Framework Dashboard Hooks

**User Story:** As a framework developer, I want reusable hooks for dashboard state management, so that client applications can easily manage dashboard state.

#### Acceptance Criteria

1. WHEN a client uses the useDashboard hook, THEN it SHALL manage loading, error, and data states
2. WHEN the useDashboard hook is configured with a fetchData callback, THEN it SHALL handle auto-refresh and manual refresh
3. WHEN the useDashboard hook is used, THEN it SHALL provide a consistent interface for dashboard state
4. THE useDashboard hook SHALL NOT contain business logic or API calls
5. THE useDashboard hook SHALL accept a generic fetchData callback for flexibility

### Requirement 4: Create Framework Dashboard Types

**User Story:** As a framework developer, I want well-defined types for dashboard components, so that client applications have type safety.

#### Acceptance Criteria

1. WHEN framework dashboard types are defined, THEN they SHALL be generic and not tied to specific data structures
2. WHEN a client uses framework dashboard types, THEN they SHALL extend them with client-specific properties
3. THE framework types SHALL define the contract between framework components and client code
4. WHEN types are exported from the framework, THEN they SHALL be available for client applications to import
5. THE framework types SHALL support extensibility through generics and interfaces

### Requirement 5: Update Client Dashboard to Use Framework

**User Story:** As a client developer, I want the client dashboard to use framework components, so that I benefit from framework improvements.

#### Acceptance Criteria

1. WHEN the client DashboardPage is updated, THEN it SHALL import and use framework components
2. WHEN the client uses framework components, THEN it SHALL pass data through props and handle callbacks
3. WHEN the client dashboard is updated, THEN it SHALL maintain all existing functionality
4. THE client dashboard SHALL use the dashboardService for all data operations
5. WHEN the client dashboard is refactored, THEN it SHALL have no breaking changes to the API

### Requirement 6: Create Framework Dashboard Utilities

**User Story:** As a framework developer, I want utility functions for common dashboard operations, so that client applications can reuse them.

#### Acceptance Criteria

1. WHEN a client needs to format numbers for display, THEN the framework SHALL provide formatNumber utility
2. WHEN a client needs to calculate responsive layouts, THEN the framework SHALL provide layout utilities
3. WHEN a client needs to handle time formatting, THEN the framework SHALL provide time utilities
4. THE framework utilities SHALL be pure functions without side effects
5. WHEN utilities are exported from the framework, THEN they SHALL be available for client applications to import

### Requirement 7: Update Framework Dashboard Index

**User Story:** As a framework user, I want all dashboard exports to be available from a single entry point, so that imports are clean and organized.

#### Acceptance Criteria

1. WHEN a client imports from the framework dashboards, THEN they SHALL import from the index file
2. WHEN the framework dashboard index is updated, THEN it SHALL export all components, hooks, types, and utilities
3. THE framework dashboard index SHALL be the single source of truth for what's exported
4. WHEN new dashboard features are added, THEN they SHALL be added to the index
5. THE framework dashboard index SHALL maintain backward compatibility

### Requirement 8: Create Migration Documentation

**User Story:** As a framework maintainer, I want clear documentation on how to migrate to the new framework dashboard, so that client applications can adopt it easily.

#### Acceptance Criteria

1. WHEN a client reads the migration guide, THEN it SHALL understand what changed and why
2. WHEN a client follows the migration guide, THEN they SHALL be able to update their code step-by-step
3. THE migration guide SHALL include before/after code examples
4. WHEN a client has questions, THEN the migration guide SHALL answer common questions
5. THE migration guide SHALL be kept up-to-date as the framework evolves

