# Implementation Plan: Modbus Removal

## Overview

This implementation plan breaks down the Modbus removal into discrete, actionable tasks that can be executed incrementally. Each task builds on previous steps, ensuring that the codebase remains in a valid state throughout the removal process. The plan follows a logical order: frontend removal first, then backend removal, then configuration updates, and finally verification.

## Tasks

- [x] 1. Remove Frontend Modbus Services
  - Delete `MeterItPro/frontend/src/services/modbusService.ts`
  - Delete `MeterItPro/frontend/src/services/directModbusService.ts`
  - Remove `modbusService` export from `MeterItPro/frontend/src/services/index.ts`
  - Verify frontend builds without errors
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Remove Frontend Modbus Components
  - Delete entire directory `MeterItPro/frontend/src/components/modbus/`
  - Search for any remaining imports of Modbus components
  - Remove any found imports from other components
  - Verify no broken component references
  - _Requirements: 2.1, 2.2_

- [x] 3. Remove Backend Modbus Routes
  - Delete `client/backend/src/routes/modbus.js`
  - Remove Modbus route registration from `client/backend/src/server.js` (uncomment the commented-out line)
  - Verify server.js has no references to Modbus routes
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Remove Backend Modbus Services
  - Delete `client/backend/src/services/modbusService.ts`
  - Delete `client/backend/src/services/modbusService.js`
  - Delete `client/backend/src/services/modbusService.new.js`
  - Search for any remaining imports of modbusService in backend files
  - Remove any found imports
  - _Requirements: 2.1, 2.2_

- [x] 5. Remove Modbus Type Definitions
  - Delete `client/backend/src/types/modbus.ts`
  - Search for any remaining imports of Modbus types (e.g., `ModbusError`, `ModbusServiceInterface`)
  - Remove any found imports from other files
  - Verify TypeScript compilation succeeds
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Remove Modbus Worker Thread
  - Delete `client/backend/src/services/threading/ModbusMCPServerWorker.ts`
  - Remove `ModbusMCPServerWorker` export from `client/backend/src/services/threading/index.ts`
  - Remove Modbus worker instantiation from `client/backend/src/services/threading/mcp-worker.ts`
  - Remove Modbus configuration from threading service initialization in `client/backend/src/server.js`
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Remove Modbus Monitoring
  - Delete `client/backend/src/monitoring/modbusMonitoring.ts`
  - Search for any imports of modbusMonitoring in backend files
  - Remove any found imports
  - _Requirements: 2.1, 2.2_

- [x] 8. Update Direct Meter Route
  - Modify `client/backend/src/routes/directMeter.ts` to remove modbusService usage
  - Remove import of `modbusService` from the file
  - Remove import of Modbus types from the file
  - Verify the route file has no Modbus references
  - _Requirements: 2.1, 2.2, 8.1, 8.2_

- [x] 9. Remove jsmodbus npm Dependency
  - Open `client/backend/package.json`
  - Remove the line containing `"jsmodbus": "^4.0.10"`
  - Run `npm install` to update package-lock.json
  - Verify jsmodbus is not in node_modules
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10. Update Device Type Filter
  - Open `framework/frontend/components/list/config/listFilters.ts`
  - In the `createDeviceFilters` function, update the typeOptions to only include BACnet
  - Change from: `[{ label: 'Modbus', value: 'modbus' }, { label: 'BACnet', value: 'bacnet' }]`
  - Change to: `[{ label: 'BACnet', value: 'bacnet' }]`
  - Verify the filter renders correctly with only BACnet option
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 11. Checkpoint - Verify Build Success
  - Run frontend build: `npm run build` in `MeterItPro/frontend/`
  - Run backend build: `npm run build` in `client/backend/` (if applicable)
  - Verify no TypeScript errors
  - Verify no build warnings related to Modbus
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 12. Verify No Broken Imports
  - Run TypeScript compiler on entire codebase
  - Search for any remaining references to Modbus in source files
  - Verify no files import from deleted Modbus files
  - Verify no files reference deleted Modbus types
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 13. Verify BACnet Functionality
  - Start the backend server
  - Verify BACnet MCP servers initialize successfully
  - Verify no console errors related to Modbus
  - Verify BACnet device queries work correctly
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 14. Verify Meter Reading Functionality
  - Query existing meter readings from the database
  - Verify readings are retrievable with correct values
  - Verify all protocol-agnostic fields are intact
  - Verify no data loss occurred
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 15. Final Checkpoint - Ensure All Tests Pass
  - Run full test suite for frontend
  - Run full test suite for backend
  - Verify all tests pass
  - Verify no test failures related to Modbus removal
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4_

## Notes

- Each task is designed to be completed independently
- Tasks should be executed in order to maintain code integrity
- After each task, verify that the codebase still builds successfully
- If any task fails, investigate and resolve before proceeding to the next task
- The checkpoint tasks (11, 15) ensure that the removal is progressing correctly
- All Modbus-related code is removed by task 10, with tasks 11-15 focused on verification
