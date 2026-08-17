# Implementation Plan: Dashboard Framework Migration

## Overview

This implementation plan breaks down the dashboard framework migration into discrete, manageable tasks. The migration moves reusable dashboard components to the framework while keeping client-specific services and logic in the client application.

The approach follows this sequence:
1. Create framework types and interfaces
2. Move and refactor framework components
3. Create framework hooks for state management
4. Create framework utilities
5. Update framework index exports
6. Update client to use framework components
7. Create migration documentation

## Tasks

- [x] 1. Create Framework Dashboard Types and Interfaces
  - Create `framework/frontend/dashboards/types/dashboard.ts` with generic DashboardCard, AggregatedData, and VisualizationType
  - Create `framework/frontend/dashboards/types/config.ts` with DashboardConfig interface
  - Create `framework/frontend/dashboards/types/index.ts` to export all types
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ]* 1.1 Write property test for type extensibility
  - **Property 5: Type Safety**
  - **Validates: Requirements 4.1, 4.2, 4.5**

- [x] 2. Create Framework Dashboard Hooks
  - Create `framework/frontend/dashboards/hooks/useDashboard.ts` hook for state management
  - Create `framework/frontend/dashboards/hooks/useCardData.ts` hook for card-specific data
  - Create `framework/frontend/dashboards/hooks/useLayout.ts` hook for grid layout management
  - Create `framework/frontend/dashboards/hooks/index.ts` to export all hooks
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 2.1 Write property test for useDashboard hook state management
  - **Property 1: Component Isolation**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [x]* 2.2 Write property test for hook callback execution
  - **Property 6: Callback Execution**
  - **Validates: Requirements 3.2, 3.5**

- [x] 3. Refactor DashboardPage Component for Framework
  - Move `MeterItPro/frontend/src/pages/DashboardPage.tsx` logic to `framework/frontend/dashboards/components/DashboardPage.tsx`
  - Remove all API calls and business logic
  - Accept all data and callbacks through props
  - Update component to use framework types
  - _Requirements: 1.1, 1.2, 1.5, 5.1_

- [ ]* 3.1 Write property test for DashboardPage component isolation
  - **Property 1: Component Isolation**
  - **Validates: Requirements 1.5, 2.4**

- [ ]* 3.2 Write property test for DashboardPage data flow
  - **Property 2: Data Flow Consistency**
  - **Validates: Requirements 1.1, 1.2**

- [x] 4. Refactor DashboardCard Component for Framework
  - Move `MeterItPro/frontend/src/components/dashboard/DashboardCard.tsx` to framework
  - Remove all API calls and business logic
  - Accept all data and callbacks through props
  - Update component to use framework types
  - _Requirements: 1.1, 1.5, 5.1_

- [ ]* 4.1 Write property test for DashboardCard component isolation
  - **Property 1: Component Isolation**
  - **Validates: Requirements 1.5, 2.4**

- [ ]* 4.2 Write property test for DashboardCard callback execution
  - **Property 6: Callback Execution**
  - **Validates: Requirements 1.1, 1.2**

- [x] 5. Move Modal Components to Framework
  - Move `MeterItPro/frontend/src/components/dashboard/DashboardCardModal.tsx` to framework
  - Move `MeterItPro/frontend/src/components/dashboard/ExpandedCardModal.tsx` to framework
  - Remove all API calls and business logic
  - Accept all data and callbacks through props
  - _Requirements: 1.4, 1.5_

- [ ]* 5.1 Write property test for modal reusability
  - **Property 1: Component Isolation**
  - **Validates: Requirements 1.4, 1.5**

- [x] 6. Move Visualization Component to Framework
  - Move `MeterItPro/frontend/src/components/dashboard/VisualizationComponents.tsx` to framework
  - Ensure component works with generic data structures
  - Remove client-specific logic
  - _Requirements: 1.3, 1.5_

- [ ]* 6.1 Write property test for visualization genericity
  - **Property 1: Component Isolation**
  - **Validates: Requirements 1.3, 1.5**

- [x] 7. Create Framework Dashboard Utilities
  - Create `framework/frontend/dashboards/utils/formatters.ts` with formatNumber, formatCurrency, formatPercentage
  - Create `framework/frontend/dashboards/utils/layout.ts` with responsive layout calculations
  - Create `framework/frontend/dashboards/utils/validators.ts` with data validation functions
  - Create `framework/frontend/dashboards/utils/index.ts` to export all utilities
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 7.1 Write property test for utility purity
  - **Property 1: Component Isolation**
  - **Validates: Requirements 6.4**

- [x] 8. Update Framework Dashboard Index
  - Update `framework/frontend/dashboards/index.ts` to export all components, hooks, types, and utilities
  - Ensure all exports are available from single entry point
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 8.1 Write unit test for index exports
  - Verify all components, hooks, types, and utilities are exported
  - _Requirements: 7.2, 7.3_

- [x] 9. Update Client DashboardPage to Use Framework
  - Update `MeterItPro/frontend/src/pages/DashboardPage.tsx` to import framework components
  - Keep dashboardService for API communication
  - Pass data and callbacks to framework components
  - Maintain all existing functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 9.1 Write property test for service separation
  - **Property 4: Service Separation**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ]* 9.2 Write property test for data flow from service to framework
  - **Property 2: Data Flow Consistency**
  - **Validates: Requirements 2.4, 2.5, 5.2**

- [x] 10. Update Client Dashboard Components
  - Remove old DashboardCard, DashboardCardModal, ExpandedCardModal, VisualizationComponents from client
  - Update any client-specific overrides to use framework components
  - _Requirements: 5.1, 5.3_

- [ ] 11. Create Migration Documentation
  - Create `framework/frontend/dashboards/MIGRATION_GUIDE.md` with step-by-step instructions
  - Include before/after code examples
  - Document common patterns and best practices
  - Answer frequently asked questions
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Verify no breaking changes to client dashboard
  - Verify framework components work correctly

- [ ]* 12.1 Write integration test for client dashboard with framework components
  - Test data flow from service to framework components
  - Test user interactions and callbacks
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 13. Update Framework Dashboard Examples
  - Update `framework/frontend/dashboards/examples/` with new examples using refactored components
  - Include example of client-specific dashboard using framework components
  - _Requirements: 5.1, 5.2_

- [x] 14. Final Checkpoint - Verify Migration Complete
  - Verify all framework components are in framework directory
  - Verify client only has client-specific code
  - Verify dashboardService is in client
  - Verify all exports work correctly
  - Verify documentation is complete

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation
- Framework components should have no dependencies on client code
- Client code should only depend on framework components through props and callbacks

