# Site ID to Tenant ID Migration - Design

## Overview
This design document outlines the systematic replacement of incorrect database field references (`site_id`, `external_id`, `slave_id`) with correct ones (`tenant_id`) throughout the codebase.

## Architecture

### Current State Issues
1. **site_id references**: Code references a non-existent `sites` table and `site_id` field
2. **external_id references**: Code tries to access `external_id` field that doesn't exist in meters table
3. **slave_id references**: Code references `slave_id` field that doesn't exist in meters table
4. **Missing tenant_id**: Some queries don't properly filter by tenant_id

### Target State
1. All queries use `tenant` table instead of `sites`
2. All queries use `tenant_id` instead of `site_id`
3. All references to `external_id` are removed
4. All references to `slave_id` are removed
5. All tenant-filtered queries include proper `tenant_id` filtering

## Implementation Strategy

### Phase 1: Client MCP Tools (Query Layer)
Update MCP tool definitions and queries to use correct field names:

**Files:**
- `MeterItPro/mcp/src/tools/query-readings.ts`
- `MeterItPro/mcp/src/tools/query-meters.ts`
- `MeterItPro/mcp/src/tools/generate-report.ts`
- `MeterItPro/mcp/src/tools/get-site-status.ts`
- `MeterItPro/mcp/src/index.ts`

**Changes:**
- Replace `site_id` with `tenant_id` in SQL queries
- Replace `sites` table with `tenant` table
- Remove `external_id` field selections
- Remove `external_id` from MCP tool parameters
- Update TypeScript interfaces to reflect correct field names

### Phase 2: Client MCP Services
Update service layer that executes queries:

**Files:**
- `MeterItPro/mcp/src/services/report-executor.ts`

**Changes:**
- Replace `site_id` with `tenant_id` in queries
- Replace `sites` table with `tenant` table
- Remove `external_id` references

### Phase 3: Client Backend Services
Remove slave_id references from meter collection:

**Files:**
- `client/backend/src/services/PowerColumnDiscoveryService.js`
- `client/backend/src/services/AutoMeterCollectionService.js`

**Changes:**
- Remove `slave_id` from column discovery
- Remove `slave_id` from meter reading insertion
- Remove `DEFAULT_METER_SLAVE_ID` environment variable usage

### Phase 4: Sync System
Update entity metadata to reflect correct database schema:

**Files:**
- `MeterItProSync/mcp/src/types/common.types.ts`

**Changes:**
- Verify ENTITY_METADATA has correct column definitions
- Ensure no references to non-existent fields

### Phase 5: Tests and Documentation
Update test data and documentation:

**Files:**
- `MeterItPro/mcp/src/services/report-executor.test.ts`
- `MeterItPro/mcp/SCHEDULER_IMPLEMENTATION.md`
- `.kiro/specs/POWER_COLUMN_DISCOVERY_*.md`

**Changes:**
- Update mock data to use correct field names
- Update documentation to reference correct fields

## Data Mapping

### Query Field Replacements

**Before:**
```sql
SELECT s.id as site_id, m.external_id, m.slave_id
FROM sites s
JOIN meters m ON s.id = m.site_id
```

**After:**
```sql
SELECT t.tenant_id
FROM tenant t
JOIN meter m ON t.tenant_id = m.tenant_id
```

### TypeScript Interface Updates

**Before:**
```typescript
interface MeterReading {
  site_id: number;
  meter_external_id: string;
  slave_id: number;
}
```

**After:**
```typescript
interface MeterReading {
  tenant_id: number;
  meter_id: number;
}
```

## Testing Strategy

1. **Unit Tests**: Update mock data to use correct field names
2. **Integration Tests**: Verify queries work with actual database schema
3. **Validation**: Ensure no references to removed fields remain

## Rollout Plan

1. Update all query definitions first (Phase 1)
2. Update service layer (Phase 2)
3. Update backend services (Phase 3)
4. Update sync system (Phase 4)
5. Update tests and documentation (Phase 5)
6. Verify no broken references remain

## Risk Mitigation

- All changes are field name corrections, not logic changes
- Database schema is the source of truth
- Tests will catch any remaining incorrect references
