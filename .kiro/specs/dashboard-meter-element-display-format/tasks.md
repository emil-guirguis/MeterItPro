# Implementation Plan: Dashboard Meter Element Display Format

## Overview

Update the dashboard card form to display meter elements in a user-friendly format showing both the element letter and description (e.g., "A - Phase A"), sorted alphabetically by element letter. Changes are minimal and focused on the backend API response and frontend display logic.

## Tasks

- [ ] 1. Update backend endpoint to return element letter and sort by element
  - Modify `/api/dashboard/meters/:meterId/elements` endpoint in `client/backend/src/routes/dashboard.js`
  - Update the query to select both `element` and `name` fields
  - Change sort order from `[['name', 'ASC']]` to `[['element', 'ASC']]`
  - Verify response includes `element` field in the returned data
  - _Requirements: 2.1, 2.2_

- [ ]* 1.1 Write unit tests for backend endpoint
  - Test that elements are returned with both `element` and `name` fields
  - Test that elements are sorted by `element` field in ascending order
  - Test that only elements for the specified meter are returned
  - Test that only elements for the user's tenant are returned
  - _Requirements: 2.1, 2.2_

- [ ] 2. Update frontend service to handle new response format
  - Modify `getMeterElementsByMeter()` in `MeterItPro/frontend/src/services/dashboardService.ts`
  - Ensure the method returns elements with `element` and `name` fields
  - No transformation needed if backend returns correct format
  - _Requirements: 2.1_

- [ ]* 2.1 Write unit tests for frontend service
  - Test that service correctly handles response with `element` field
  - Test that service returns elements in correct order
  - _Requirements: 2.1_

- [ ] 3. Update frontend component to display elements in new format
  - Modify `DashboardCardModal.tsx` meter element dropdown rendering
  - Change display from `{element.meter_element_name}` to `{element.element} - {element.name}`
  - Update the MeterElement interface to include `element` field
  - _Requirements: 1.1, 1.3_

- [ ]* 3.1 Write unit tests for frontend component display
  - Test that meter elements are displayed in "LETTER - DESCRIPTION" format
  - Test that selecting an element stores the correct ID
  - Test that form submission validates the selected element correctly
  - _Requirements: 1.1, 1.3, 1.4_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Verify backend endpoint returns correct format
  - Verify frontend displays elements correctly
  - Ask the user if questions arise

- [ ]* 5. Write property-based tests
  - **Property 1: Meter Elements Sorted by Letter**
    - Generate random meter IDs with multiple elements and verify all returned elements are sorted by `element` field
  - **Property 2: Element Letter and Description Present**
    - Generate random meter elements and verify each has both `element` and `name` fields
  - **Property 3: Frontend Display Format Correct**
    - Generate random meter elements and verify frontend displays them in "LETTER - DESCRIPTION" format
  - **Property 4: Selection Stores Correct ID**
    - Generate random meter element selections and verify the form stores the correct ID value
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_

- [ ] 6. Final checkpoint - Verify implementation
  - Ensure all tests pass (unit and property-based)
  - Verify meter elements display correctly in the dashboard card form
  - Verify sorting is correct (A, B, C, etc.)
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases

