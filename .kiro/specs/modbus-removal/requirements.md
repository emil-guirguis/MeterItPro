# Requirements Document: Modbus Removal

## Introduction

This feature involves systematically removing all Modbus protocol support from the codebase while preserving complete BACnet functionality. The Modbus implementation is largely isolated from BACnet, allowing for clean removal without affecting core meter reading collection and storage capabilities. The removal includes backend routes, frontend services, type definitions, worker threads, npm dependencies, and UI filters.

## Glossary

- **Modbus**: A communication protocol for industrial automation; currently implemented but being removed
- **BACnet**: A building automation protocol that will remain as the primary protocol
- **Meter Reading**: A data structure representing a measurement from a device (protocol-agnostic)
- **Device Type Filter**: UI component that allows filtering devices by protocol type
- **MCP Server**: Message Control Protocol server for handling protocol-specific operations
- **Worker Thread**: Background thread for handling Modbus communication (ModbusMCPServerWorker)
- **Backend Route**: HTTP endpoint for API communication (e.g., `/api/modbus/*`)
- **Frontend Service**: TypeScript service layer for client-side Modbus operations
- **Type Definition**: TypeScript interface or type for Modbus-specific data structures
- **npm Package**: JavaScript library dependency (jsmodbus)

## Requirements

### Requirement 1: Remove Backend Modbus Routes

**User Story:** As a backend maintainer, I want to remove all Modbus API routes, so that the backend no longer exposes Modbus functionality.

#### Acceptance Criteria

1. WHEN the backend is deployed, THE Backend SHALL NOT expose any `/api/modbus/*` routes
2. WHEN a request is made to a removed Modbus route, THE Backend SHALL return a 404 error
3. THE Backend SHALL remove the file `client/backend/src/routes/modbus.js`
4. THE Backend SHALL remove all imports and references to Modbus routes from the main application file

### Requirement 2: Remove Frontend Modbus Service

**User Story:** As a frontend developer, I want to remove the Modbus service layer, so that the frontend no longer contains Modbus-specific business logic.

#### Acceptance Criteria

1. THE Frontend SHALL remove the file `MeterItPro/frontend/src/services/modbusService.ts`
2. THE Frontend SHALL remove all imports of `modbusService` from components and hooks
3. WHEN the frontend is built, THE Frontend SHALL NOT contain any references to the Modbus service
4. THE Frontend SHALL remove the `useModbus()` React hook from the codebase

### Requirement 3: Remove Modbus Type Definitions

**User Story:** As a type system maintainer, I want to remove Modbus-specific type definitions, so that the codebase only contains types for active protocols.

#### Acceptance Criteria

1. THE Backend SHALL remove the file `client/backend/src/types/modbus.ts`
2. THE Frontend SHALL remove all Modbus-specific type imports and definitions
3. THE Shared Entity Types SHALL remove Modbus-specific fields from `MeterItPro/frontend/src/types/entities.ts` while preserving protocol-agnostic fields
4. WHEN the codebase is type-checked, THE TypeScript compiler SHALL report no errors related to missing Modbus types

### Requirement 4: Remove Modbus Worker Thread Integration

**User Story:** As a system architect, I want to remove the Modbus worker thread, so that the threading system only manages BACnet operations.

#### Acceptance Criteria

1. THE Backend SHALL remove the file `client/backend/src/services/threading/ModbusMCPServerWorker.ts`
2. THE Backend SHALL remove all imports and references to ModbusMCPServerWorker from the threading service
3. WHEN the backend starts, THE Backend SHALL NOT spawn any Modbus worker threads
4. THE Backend SHALL maintain all BACnet worker thread functionality

### Requirement 5: Remove Modbus npm Package Dependency

**User Story:** As a dependency manager, I want to remove the jsmodbus npm package, so that the project has fewer external dependencies.

#### Acceptance Criteria

1. THE Backend package.json SHALL remove the `jsmodbus` dependency (v4.0.10)
2. WHEN npm install is run, THE jsmodbus package SHALL NOT be installed
3. WHEN the backend is built, THE Build SHALL NOT fail due to missing jsmodbus imports
4. THE Backend SHALL maintain all BACnet npm package dependencies

### Requirement 6: Update Device Type Filters

**User Story:** As a UI maintainer, I want to remove Modbus from device type filters, so that users only see BACnet as an available protocol option.

#### Acceptance Criteria

1. WHEN the device type filter is rendered, THE Filter SHALL only display BACnet as an available option
2. THE Filter configuration in `framework/frontend/components/list/config/listFilters.ts` SHALL remove the Modbus device type option
3. WHEN a user opens the device filter dropdown, THE Dropdown SHALL NOT show Modbus as a selectable option
4. THE Filter SHALL maintain all BACnet filtering functionality

### Requirement 7: Preserve Meter Reading Functionality

**User Story:** As a data persistence maintainer, I want to ensure meter reading storage and validation continues to work, so that BACnet data collection is not affected.

#### Acceptance Criteria

1. THE Meter Reading Entity in `MeterItProSync/mcp/src/entities/meter-reading.entity.ts` SHALL remain unchanged in its core structure
2. WHEN a meter reading is stored, THE Storage System SHALL successfully persist the reading to the database
3. WHEN a meter reading is retrieved, THE Retrieval System SHALL return the complete and accurate reading
4. THE Meter Reading Validation Logic SHALL continue to function for all protocol-agnostic fields

### Requirement 8: Ensure No Broken Imports or References

**User Story:** As a code quality maintainer, I want to ensure no broken imports remain, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. WHEN the codebase is analyzed, THE Linter SHALL report no errors related to missing Modbus imports
2. WHEN the codebase is type-checked, THE TypeScript Compiler SHALL report no errors related to undefined Modbus references
3. THE Build Process SHALL complete successfully without warnings about missing Modbus modules
4. WHEN the application starts, THE Application SHALL NOT throw errors related to missing Modbus code

### Requirement 9: Verify BACnet Functionality Remains Intact

**User Story:** As a BACnet maintainer, I want to verify that BACnet functionality is completely preserved, so that the removal does not introduce regressions.

#### Acceptance Criteria

1. WHEN the BACnet MCP server starts, THE Server SHALL successfully initialize all BACnet components
2. WHEN a BACnet device is queried, THE Query SHALL return valid meter readings
3. WHEN BACnet scheduling runs, THE Scheduler SHALL execute cron jobs as configured
4. WHEN the sync-agent runs, THE Agent SHALL successfully synchronize BACnet data to the database

### Requirement 10: Clean Up Configuration References

**User Story:** As a configuration maintainer, I want to remove Modbus references from configuration files, so that the configuration is clean and accurate.

#### Acceptance Criteria

1. THE Configuration Files SHALL remove any Modbus-specific environment variables or settings
2. THE Configuration Files SHALL remove any Modbus-specific feature flags or toggles
3. WHEN the application reads configuration, THE Application SHALL NOT attempt to load Modbus configuration
4. THE Configuration Files SHALL maintain all BACnet-specific settings and environment variables
