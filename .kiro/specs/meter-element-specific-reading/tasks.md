# Implementation Plan: Meter Element-Specific Reading

## Overview

This plan implements element-specific meter reading by:
1. Creating a RegisterCache that loads all registers at MCP startup
2. Implementing element-specific register number calculation
3. Updating MeterCollector to query device_register and read only configured registers
4. Mapping BACnet readings to field_names from the register table
5. Storing readings with correct field_name values

## Tasks

- [x] 1. Create RegisterCache class
  - Create new file: MeterItProSync/mcp/src/bacnet-collection/register-cache.ts
  - Implement RegisterCache with Map<number, RegisterEntity>
  - Add initialize(syncDatabase) method to load all registers
  - Add getRegister(registerId) and getRegisterByNumber(registerNumber) methods
  - Add getAllRegisters() method
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Initialize RegisterCache at MCP server startup
  - Locate MCP server initialization code
  - Create RegisterCache singleton instance
  - Call initialize() during server startup
  - Log register count when loaded
  - _Requirements: 1.1, 1.3_

- [x] 3. Implement element-specific register number calculation
  - Create utility function: calculateElementRegisterNumber(baseRegister, element)
  - Implement logic: A=base, B=1xxxx, C=2xxxx, D=3xxxx, etc.
  - Add unit tests for calculation (A-Z elements)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 3.1 Write property test for register number calculation
  - **Property 1: Register Number Calculation**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 4. Update MeterCollector to query device_register
  - Modify collectMeterData() to get device_id from cached meter
  - Query device_register table for device_id
  - Join with register table to get register details
  - Build list of BACnetDataPoint with calculated register numbers
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 4.1 Write unit tests for device_register querying
  - Test querying device_register for a device
  - Test joining with register table
  - Test handling when no registers configured
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Update BACnetClient to accept calculated register numbers
  - Modify readMultipleProperties() to accept BACnetDataPoint with calculated register numbers
  - Ensure register numbers are used in BACnet read operations
  - Return readings with register number information
  - _Requirements: 3.4_

- [ ]* 5.1 Write unit tests for BACnet reading with calculated registers
  - Test reading with calculated register numbers
  - Test error handling when register cannot be read
  - _Requirements: 3.4, 3.5_

- [x] 6. Update MeterReading interface
  - Add registerNumber?: number field
  - Add fieldName?: string field
  - Update JSDoc comments
  - _Requirements: 4.1_

- [x] 7. Implement register number to field_name mapping
  - In collectMeterData(), after BACnet read:
    - For each reading, get registerNumber
    - Look up register in RegisterCache using registerNumber
    - Extract field_name from cached register
    - Set fieldName in MeterReading
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 7.1 Write unit tests for register to field_name mapping
  - Test mapping register number to field_name
  - Test handling when register not found
  - _Requirements: 4.1, 4.2_

- [x] 8. Update storeReading() to use field_name
  - Modify storeReading() to accept fieldName parameter
  - Use fieldName as data_point when storing in meter_reading table
  - Handle missing field_name gracefully with logging
  - _Requirements: 4.3, 4.4, 4.5_

- [ ]* 8.1 Write unit tests for storing readings with field_name
  - Test storing reading with field_name
  - Test storing reading without field_name (error case)
  - _Requirements: 4.3, 4.4_

- [x] 9. Checkpoint - Verify register caching and calculation
  - Ensure RegisterCache loads at startup
  - Verify register number calculation works for all elements
  - Verify device_register querying works
  - Ask the user if questions arise

- [ ]* 9.1 Write property test for register cache consistency
  - **Property 2: Register Cache Consistency**
  - **Validates: Requirements 1.1, 1.2, 1.4**

- [x] 10. Checkpoint - Verify device register filtering
  - Ensure only configured registers are read
  - Verify BACnet reads use calculated register numbers
  - Verify readings are mapped to field_names
  - Ask the user if questions arise

- [ ]* 10.1 Write property test for device register filtering
  - **Property 3: Device Register Filtering**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [x] 11. Final checkpoint - All element-specific reading tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Verify readings stored with correct field_names
  - Ask the user if questions arise

- [ ]* 11.1 Write property test for field name mapping
  - **Property 4: Field Name Mapping**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 12. Implement cache reload after sync
  - Locate remote-to-local sync completion handler
  - Add logic to check which tables were modified in sync result
  - Call RegisterCache.reload() if register table modified
  - Call MeterCache.reload() if meter or device_register table modified
  - Log cache reload events
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 12.1 Write unit tests for cache reload after sync
  - Test RegisterCache reload triggered on register table modification
  - Test MeterCache reload triggered on meter table modification
  - Test MeterCache reload triggered on device_register modification
  - Test error handling when reload fails
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 13. Add error handling for cache reload failures
  - Wrap cache reload calls in try-catch
  - Log errors without stopping collection
  - Ensure collection continues with previous cache state
  - _Requirements: 5.5_

- [x] 14. Final checkpoint - Cache reload integration complete
  - Ensure sync triggers cache reloads
  - Verify caches are updated after sync
  - Verify collection continues if reload fails
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- RegisterCache must be initialized before MeterCollector starts
- Element-specific register calculation is critical for correct BACnet reads
- Field_name mapping ensures readings are stored in correct columns
- Cache reload after sync ensures configuration changes are immediately reflected
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases

