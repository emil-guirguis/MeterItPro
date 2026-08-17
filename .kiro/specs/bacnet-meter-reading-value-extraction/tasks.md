# Implementation Plan: BACnet Meter Reading Value Extraction Fix

## Overview

Fix the BACnet meter reading value extraction logic to properly handle various response structures and ensure numeric values are correctly extracted, validated, and logged. The fix involves creating a robust value extraction utility and updating the collection cycle manager to use it.

## Tasks

- [ ] 1. Create value extraction utility function
  - Create a new utility file `MeterItProSync/mcp/src/bacnet-collection/value-extractor.ts`
  - Implement `extractNumericValue()` function to handle all BACnet response structures
  - Handle primitive numbers, objects with value property, arrays with objects
  - Return null for invalid/non-numeric values
  - Add comprehensive logging for debugging
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [ ]* 1.1 Write unit tests for value extraction utility
  - Test extraction with primitive numbers
  - Test extraction with objects containing value property
  - Test extraction with arrays containing objects
  - Test extraction with null/undefined values
  - Test extraction with non-numeric values
  - Test extraction with nested structures
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [ ]* 1.2 Write property test for numeric value extraction
  - **Property 1: Numeric Value Extraction**
  - **Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3**
  - Generate random numeric values in various structures
  - Verify extraction produces correct numeric value
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [ ] 2. Update collection cycle manager to use value extraction utility
  - Import the value extraction utility in `collection-cycle-manager.ts`
  - Replace inline value extraction logic (lines 240-260) with utility function call
  - Update logging to use extracted numeric values
  - Ensure error handling for extraction failures
  - _Requirements: 1.1, 1.3, 1.5_

- [ ]* 2.1 Write unit tests for collection cycle manager value handling
  - Test that readings with extracted values are created correctly
  - Test that invalid values are skipped
  - Test that logging displays numeric values
  - _Requirements: 1.3, 1.5_

- [ ]* 2.2 Write property test for invalid value rejection
  - **Property 2: Invalid Value Rejection**
  - **Validates: Requirements 1.5, 3.1, 3.2**
  - Generate invalid/non-numeric values
  - Verify extraction returns null
  - Verify reading is rejected during validation
  - _Requirements: 1.5, 3.1, 3.2_

- [ ] 3. Update reading batcher validation
  - Ensure validation correctly rejects null values
  - Ensure validation correctly rejects NaN values
  - Update validation error messages for clarity
  - _Requirements: 3.1, 3.2_

- [ ]* 3.1 Write unit tests for reading batcher validation
  - Test validation rejects null values
  - Test validation rejects NaN values
  - Test validation accepts valid numbers
  - Test batch metrics track skipped readings
  - _Requirements: 3.1, 3.2_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Verify no regressions in existing functionality
  - Ask the user if questions arise

- [ ]* 4.1 Write property test for value persistence round trip
  - **Property 3: Value Persistence Round Trip**
  - **Validates: Requirements 1.4, 3.3**
  - Extract numeric values and persist to database
  - Retrieve values from database
  - Verify retrieved values equal original extracted values
  - _Requirements: 1.4, 3.3_

- [ ]* 4.2 Write property test for logging accuracy
  - **Property 4: Logging Accuracy**
  - **Validates: Requirements 1.3**
  - Generate readings with extracted numeric values
  - Capture log output
  - Verify log messages contain numeric values (not `[object Object]`)
  - _Requirements: 1.3_

- [ ] 5. Integration testing
  - Test complete collection cycle with real BACnet responses
  - Verify readings are logged with numeric values
  - Verify readings are persisted correctly to database
  - Verify batch metrics are accurate
  - _Requirements: 1.1, 1.3, 1.4_

- [ ] 6. Final checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Verify no regressions in existing functionality
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases

