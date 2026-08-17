# Requirements Document: Cache Centralization

## Introduction

The sync MCP server currently has three cache objects (TenantCache, MeterCache, and DeviceRegisterCache) scattered across different feature folders. This creates confusion about where cache logic lives and makes it difficult to manage global cache state. This feature centralizes all cache objects into a dedicated `cache` folder for better organization and maintainability.

## Glossary

- **Cache**: In-memory data structure that stores frequently accessed data to avoid repeated database queries
- **TenantCache**: Cache for tenant configuration and API keys
- **MeterCache**: Cache for active meters and their metadata
- **DeviceRegisterCache**: Cache for device-to-register mappings
- **Sync MCP**: The synchronization service that manages data flow between remote and local databases
- **Feature Folder**: Subdirectories like `bacnet-collection`, `meter-collection`, `remote_to_local-sync` that contain feature-specific code

## Requirements

### Requirement 1: Create Centralized Cache Directory

**User Story:** As a developer, I want all cache objects in a dedicated folder, so that I can easily find and manage global cache state.

#### Acceptance Criteria

1. WHEN the sync MCP source structure is reviewed, THE system SHALL have a new `MeterItProSync/mcp/src/cache/` directory
2. WHEN the cache directory is created, THE system SHALL contain three cache files:
   - `tenant-cache.ts` - TenantCache implementation
   - `meter-cache.ts` - MeterCache implementation
   - `device-register-cache.ts` - DeviceRegisterCache implementation
3. WHEN the cache directory is created, THE system SHALL contain an `index.ts` file that exports all cache classes
4. THE cache directory SHALL be at the same level as other feature directories (api, bacnet-collection, meter-collection, etc.)

### Requirement 2: Migrate TenantCache Implementation

**User Story:** As a developer, I want the TenantCache to be in the centralized cache folder, so that tenant caching logic is co-located with other caches.

#### Acceptance Criteria

1. WHEN TenantCache is implemented, THE system SHALL load tenant data from the database at startup
2. WHEN TenantCache is initialized, THE system SHALL store tenant configuration including API keys
3. WHEN getTenant() is called, THE system SHALL return the cached tenant entity
4. WHEN the cache is invalid, THE system SHALL return null or throw an appropriate error
5. THE TenantCache SHALL have methods: initialize(), getTenant(), isValid(), clear()

### Requirement 3: Migrate MeterCache to Centralized Location

**User Story:** As a developer, I want MeterCache moved to the centralized cache folder, so that all caches are in one place.

#### Acceptance Criteria

1. WHEN MeterCache is moved to the cache directory, THE system SHALL maintain all existing functionality
2. WHEN MeterCache.reload() is called, THE system SHALL refresh meter data from the database
3. WHEN getMeters() is called, THE system SHALL return all cached meters
4. WHEN getMeter(meterId) is called, THE system SHALL return a specific cached meter
5. THE MeterCache SHALL maintain the same interface and behavior as the original implementation

### Requirement 4: Migrate DeviceRegisterCache to Centralized Location

**User Story:** As a developer, I want DeviceRegisterCache moved to the centralized cache folder, so that all caches are organized together.

#### Acceptance Criteria

1. WHEN DeviceRegisterCache is moved to the cache directory, THE system SHALL maintain all existing functionality
2. WHEN initialize() is called, THE system SHALL load all device_register mappings from the database
3. WHEN getDeviceRegisters(deviceId) is called, THE system SHALL return all registers for that device
4. WHEN isValid() is called, THE system SHALL return the cache validity status
5. THE DeviceRegisterCache SHALL maintain the same interface and behavior as the original implementation

### Requirement 5: Update All Import Paths

**User Story:** As a developer, I want all import paths updated to reference the centralized cache folder, so that the codebase reflects the new structure.

#### Acceptance Criteria

1. WHEN files import cache classes, THE system SHALL import from `../cache/index.js` instead of scattered locations
2. WHEN sync-agent.ts imports caches, THE system SHALL use the new centralized import path
3. WHEN collector.ts imports caches, THE system SHALL use the new centralized import path
4. WHEN bacnet-reading-agent.ts imports caches, THE system SHALL use the new centralized import path
5. WHEN collection-cycle-manager.ts imports caches, THE system SHALL use the new centralized import path
6. WHEN index.ts imports caches, THE system SHALL use the new centralized import path
7. ALL import statements SHALL be updated consistently across the codebase

### Requirement 6: Update Test Files

**User Story:** As a developer, I want test files updated to import from the new cache location, so that tests continue to work correctly.

#### Acceptance Criteria

1. WHEN collector.test.ts imports caches, THE system SHALL import from the new centralized location
2. WHEN any test file references cache classes, THE system SHALL use updated import paths
3. ALL test imports SHALL be consistent with the new structure

### Requirement 7: Verify No Functionality Loss

**User Story:** As a developer, I want to ensure the refactoring doesn't break existing functionality, so that the system continues to work correctly.

#### Acceptance Criteria

1. WHEN the codebase is refactored, THE system SHALL maintain all cache initialization logic
2. WHEN the codebase is refactored, THE system SHALL maintain all cache reload logic
3. WHEN the codebase is refactored, THE system SHALL maintain all cache query methods
4. WHEN the codebase is refactored, THE system SHALL maintain all cache validity checks
5. ALL existing cache behavior SHALL remain unchanged after the refactoring
