# Site ID to Tenant ID Migration - Requirements

## Overview
Fix incorrect database field references throughout the codebase. Replace all `site_id` references with `tenant_id`, remove non-existent `external_id` field references, and ensure all tables properly use `tenant_id` for tenant filtering.

## User Stories

### 1. Replace site_id with tenant_id
As a developer, I need all references to `site_id` to be replaced with `tenant_id` so that queries correctly reference the tenant table and tenant filtering works properly.

**Acceptance Criteria:**
- All SQL queries using `site_id` are updated to use `tenant_id`
- All TypeScript interfaces and types using `site_id` are updated to use `tenant_id`
- All MCP tool parameters using `site_id` are updated to use `tenant_id`
- All references to `sites` table are changed to `tenant` table
- No `site_id` references remain in the codebase (except in comments/documentation)

### 2. Remove external_id field references
As a developer, I need all references to the non-existent `external_id` field to be removed so that queries don't fail trying to access fields that don't exist in the database.

**Acceptance Criteria:**
- All SQL queries selecting `external_id` are removed or replaced with correct fields
- All TypeScript interfaces referencing `external_id` are updated
- All MCP tool parameters for `external_id` are removed
- No `external_id` references remain in active code (except in comments/documentation)

### 3. Remove slave_id field references
As a developer, I need all references to the non-existent `slave_id` field to be removed so that code doesn't try to access fields that don't exist in the database.

**Acceptance Criteria:**
- All references to `slave_id` in meter configuration are removed
- All SQL queries selecting `slave_id` are removed
- All TypeScript interfaces referencing `slave_id` are updated
- Environment variables referencing `SLAVE_ID` are removed or documented as deprecated
- No `slave_id` references remain in active code (except in comments/documentation)

### 3. Remove slave_id field references
As a developer, I need all references to the non-existent `slave_id` field to be removed so that code doesn't try to access fields that don't exist in the database.

**Acceptance Criteria:**
- All references to `slave_id` in meter configuration are removed
- All SQL queries selecting `slave_id` are removed
- All TypeScript interfaces referencing `slave_id` are updated
- Environment variables referencing `SLAVE_ID` are removed or documented as deprecated
- No `slave_id` references remain in active code (except in comments/documentation)

### 4. Ensure tenant_id on all tables
As a developer, I need to verify that all tables that require tenant filtering have `tenant_id` field and use it consistently.

**Acceptance Criteria:**
- All queries filtering by tenant use `tenant_id` consistently
- Entity metadata in sync system correctly identifies which tables are tenant-filtered
- All meter-related queries include proper tenant_id filtering
- All meter_reading queries include proper tenant_id filtering

## Files to Update

### Client Backend Service Files
- `client/backend/src/services/PowerColumnDiscoveryService.js` - Remove slave_id
- `client/backend/src/services/AutoMeterCollectionService.js` - Remove slave_id references
- `client/backend/.env` - Remove or deprecate DEFAULT_METER_SLAVE_ID

### Client MCP Service Files
- `MeterItPro/mcp/src/tools/query-readings.ts` - Remove site_id, external_id
- `MeterItPro/mcp/src/tools/query-meters.ts` - Remove site_id, external_id
- `MeterItPro/mcp/src/tools/generate-report.ts` - Replace site_id with tenant_id, remove external_id
- `MeterItPro/mcp/src/tools/get-site-status.ts` - Replace site_id with tenant_id
- `MeterItPro/mcp/src/services/report-executor.ts` - Replace site_id with tenant_id
- `MeterItPro/mcp/src/index.ts` - Update MCP tool definitions

### Sync System Files
- `MeterItProSync/mcp/src/types/common.types.ts` - Update ENTITY_METADATA

### Test Files
- `MeterItPro/mcp/src/services/report-executor.test.ts` - Update mock data
- `MeterItPro/mcp/src/tools/query-meters.ts` - Update test data

### Documentation
- `MeterItPro/mcp/SCHEDULER_IMPLEMENTATION.md` - Update field references

## Technical Notes
- The database uses `tenant_id` as the primary identifier for multi-tenancy
- The `sites` table does not exist; use `tenant` table instead
- The `external_id` field does not exist in the meters table
- The `slave_id` field does not exist in the meters table
- Meter table has: meter_id, device_id, name, active, ip, port, meter_element_id, element
- All tenant-filtered queries must include `WHERE tenant_id = $X` clause
