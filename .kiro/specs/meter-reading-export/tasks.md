# Implementation Plan: Meter Reading Export Buttons

## Overview

This implementation plan breaks down the meter reading export feature into discrete coding tasks. The approach starts with utility functions (CSV generation, filename formatting), then implements the export handlers, integrates the buttons into the MeterReadingList component, and finishes with comprehensive testing. Each task builds on previous work with no orphaned code.

## Tasks

- [x] 1. Create CSV generator utility
  - Create `MeterItPro/frontend/src/utils/csvGenerator.ts`
  - Implement `generateCSV(readings: MeterReading[]): string` function
  - Include all meter reading columns in output
  - Add header row with column names
  - Properly escape special characters (commas, quotes, newlines)
  - Sort data by created_at in descending order
  - Use UTF-8 encoding
  - _Requirements: 1.2, 4.1, 4.2, 4.3, 4.4_

- [ ]* 1.1 Write property tests for CSV generator
  - **Property 2: CSV Includes All Columns**
  - **Property 4: CSV Special Character Escaping**
  - **Property 5: CSV Header Row Present**
  - **Property 6: CSV UTF-8 Encoding**
  - **Property 7: CSV Sort Order**
  - **Property 10: CSV Round Trip**
  - _Requirements: 1.2, 4.1, 4.2, 4.3, 4.4_

- [x] 2. Create filename formatter utility
  - Create `MeterItPro/frontend/src/utils/filenameFormatter.ts`
  - Implement `formatExportFilename(elementName: string, currentDate?: Date): string` function
  - Format as `[YYYY-MM-DD]_Meter_Readings_[elementName].csv`
  - Handle special characters in element names
  - Ensure filesystem-safe output
  - _Requirements: 1.3_

- [ ]* 2.1 Write property tests for filename formatter
  - **Property 3: Filename Format Correctness**
  - _Requirements: 1.3_

- [x] 3. Create export handler utility
  - Create `MeterItPro/frontend/src/utils/exportHandler.ts`
  - Implement `handleExport(options: ExportOptions): Promise<void>` function
  - Validate data exists before export
  - Generate CSV using csvGenerator utility
  - Generate filename using filenameFormatter utility
  - Trigger browser file download dialog
  - Handle user cancellation gracefully
  - Display success notification on completion
  - Display error notification on failure
  - Manage loading state via callback
  - _Requirements: 1.1, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 5.4_

- [ ]* 3.1 Write unit tests for export handler
  - Test successful export flow
  - Test empty data handling
  - Test cancellation handling
  - Test error scenarios
  - Test loading state management
  - _Requirements: 1.1, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 5.4_

- [x] 4. Create email handler utility
  - Create `MeterItPro/frontend/src/utils/emailHandler.ts`
  - Implement `handleEmail(options: EmailOptions): Promise<void>` function
  - Validate data exists before email
  - Generate CSV using csvGenerator utility
  - Generate filename using filenameFormatter utility
  - Create temporary file in browser temp directory
  - Generate mailto URL with CSV attachment
  - Pre-populate subject line with meter information
  - Open default email client
  - Clean up temporary file after email client closes
  - Handle email client errors and cleanup
  - Display success notification on completion
  - Display error notification on failure
  - Manage loading state via callback
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 5.5, 7.1, 7.2, 7.4_

- [ ]* 4.1 Write unit tests for email handler
  - Test successful email flow
  - Test empty data handling
  - Test temporary file creation and cleanup
  - Test error scenarios
  - Test loading state management
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 5.5, 7.1, 7.2, 7.4_

- [x] 5. Create export buttons component
  - Create `MeterItPro/frontend/src/components/MeterReadingExportButtons.tsx`
  - Render Export Excel button with icon
  - Render Email button with icon
  - Display tooltips on hover
  - Manage loading state for both buttons
  - Disable buttons when data is loading or empty
  - Handle click events and call export/email handlers
  - Display loading indicator during export
  - _Requirements: 6.1, 6.4, 6.5_

- [ ]* 5.1 Write unit tests for export buttons component
  - Test button rendering
  - Test button disabled state during loading
  - Test button click handlers
  - Test tooltip display
  - Test loading indicator display
  - _Requirements: 6.1, 6.4, 6.5_

- [x] 6. Integrate export buttons into MeterReadingList
  - Update `MeterItPro/frontend/src/features/meterReadings/MeterReadingList.tsx`
  - Import MeterReadingExportButtons component
  - Pass filteredData to export buttons
  - Pass selectedElementName for filename generation
  - Pass loading state to disable buttons appropriately
  - Position buttons in header next to title
  - Wire up export and email handlers
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.5_

- [ ]* 6.1 Write integration tests for MeterReadingList with export buttons
  - Test buttons appear in header
  - Test buttons are disabled when loading
  - Test buttons are disabled when no data
  - Test export button triggers export flow
  - Test email button triggers email flow
  - Test filters are respected in export
  - **Property 1: CSV Contains Filtered Data**
  - **Property 9: Buttons Disabled During Loading**
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.5_

- [x] 7. Add notification system integration
  - Ensure success notifications display after export
  - Ensure error notifications display on failure
  - Use existing notification system from application
  - Display user-friendly messages
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 7.1 Write unit tests for notification integration
  - Test success notification displays
  - Test error notification displays
  - Test notification messages are user-friendly
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Add email subject line formatting
  - Create utility function to format email subject with meter info
  - Include meter name and element name in subject
  - Ensure subject is descriptive and user-friendly
  - _Requirements: 2.4_

- [ ]* 8.1 Write property tests for email subject formatting
  - **Property 8: Email Subject Line Includes Meter Info**
  - _Requirements: 2.4_

- [x] 9. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property-based tests and verify they pass
  - Verify no console errors or warnings
  - Ask the user if questions arise

- [x] 10. Add CSS styling for export buttons
  - Create `MeterItPro/frontend/src/components/MeterReadingExportButtons.css`
  - Style buttons to match dashboard design
  - Add hover states and transitions
  - Add disabled state styling
  - Add loading indicator animation
  - Ensure buttons are positioned consistently with other controls
  - _Requirements: 6.1, 6.2, 6.3_

- [ ]* 10.1 Write visual regression tests for button styling
  - Test button appearance in normal state
  - Test button appearance in disabled state
  - Test button appearance in loading state
  - Test button appearance on hover
  - _Requirements: 6.2, 6.3_

- [x] 11. Add accessibility features
  - Add ARIA labels to buttons
  - Add keyboard navigation support
  - Add screen reader support for tooltips
  - Ensure buttons are keyboard accessible
  - _Requirements: 6.1, 6.4_

- [ ]* 11.1 Write accessibility tests
  - Test ARIA labels are present
  - Test keyboard navigation works
  - Test screen reader compatibility
  - _Requirements: 6.1, 6.4_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property-based tests and verify they pass
  - Run integration tests and verify they pass
  - Verify no console errors or warnings
  - Test export flow end-to-end
  - Test email flow end-to-end
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify the feature works with existing components
- All code should follow existing project conventions and style
- Ensure backward compatibility with existing MeterReadingList functionality
