# Design Document: Register Display Names

## Overview

This design document outlines the implementation of a register name mapping system that displays human-readable register value names instead of database field names in meter reading columns and dashboard components. The system uses a centralized service to fetch and cache register mappings, providing a consistent approach across the UI.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React/TypeScript)                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Meter Readings   │  │ Dashboard Cards  │  │ Other Views  │  │
│  │ (List View)      │  │ (Metrics)        │  │ (Future)     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Uses
┌────────────────────────────▼────────────────────────────────────┐
│            RegisterMappingService (Centralized)                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Fetch Registers  │  │ Cache Mappings   │  │ Get Name by  │  │
│  │ from Database    │  │ (In Memory)      │  │ Field Name   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Queries
┌────────────────────────────▼────────────────────────────────────┐
│                    Backend API Endpoint                          │
│  GET /api/registers - Returns all registers with name/field_name │
└────────────────────────────┬────────────────────────────────────┘
                             │ Database Query
┌────────────────────────────▼────────────────────────────────────┐
│                    PostgreSQL Database                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Register Table                                           │  │
│  │ - register_id, name, register, unit, field_name         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Initialization**: RegisterMappingService fetches all registers from backend API
2. **Caching**: Service caches register mappings in memory (field_name → name)
3. **Lookup**: Components request register name by field name
4. **Fallback**: If register not found, format field name as fallback
5. **Display**: Components display register name in UI

## Components and Interfaces

### RegisterMappingService

**Location**: `MeterItPro/frontend/src/services/registerMappingService.ts`

**Responsibilities**:
- Fetch all registers from backend API
- Cache register mappings in memory
- Provide function to get register name by field name
- Handle errors and missing registers gracefully

**Interface**:
```typescript
interface RegisterMapping {
  fieldName: string;
  registerName: string;
  unit: string;
}

class RegisterMappingService {
  // Fetch and cache all registers
  async initialize(): Promise<void>
  
  // Get register name by field name
  getRegisterName(fieldName: string): string
  
  // Get register unit by field name
  getRegisterUnit(fieldName: string): string
  
  // Check if register exists
  hasRegister(fieldName: string): boolean
  
  // Get all cached mappings
  getAllMappings(): Map<string, RegisterMapping>
}
```

### Backend API Endpoint

**Endpoint**: `GET /api/registers`

**Response**:
```json
{
  "registers": [
    {
      "register_id": 1,
      "name": "Active Energy",
      "register": 40,
      "unit": "kWh",
      "field_name": "active_energy"
    },
    {
      "register_id": 2,
      "name": "Power Phase A",
      "register": 50,
      "unit": "kW",
      "field_name": "power_phase_a"
    }
  ]
}
```

### Updated Meter Reading Configuration

**Location**: `MeterItPro/frontend/src/features/meterReadings/meterReadingConfig.ts`

**Changes**:
- Column labels use register names instead of hardcoded strings
- Export headers use register names
- Stats labels use register names
- Fallback to formatted field name if register not found

**Example**:
```typescript
// Before
label: 'Active Energy (kWh)'

// After
label: `${registerMappingService.getRegisterName('active_energy')} (${registerMappingService.getRegisterUnit('active_energy')})`
```

### Updated Dashboard Components

**Locations**:
- `MeterItPro/frontend/src/components/dashboard/DashboardCard.tsx`
- `MeterItPro/frontend/src/pages/dashboard/DashboardPage.tsx`

**Changes**:
- Card labels use register names
- Metric displays use register names
- Filter labels use register names
- Export headers use register names

## Data Models

### Register Entity (Backend)
```typescript
type RegisterEntity = {
  register_id: number;
  name: string;              // Human-readable name (e.g., "Active Energy")
  register: number;          // Register address
  unit: string;              // Unit of measurement (e.g., "kWh")
  field_name: string;        // Database column name (e.g., "active_energy")
};
```

### Register Mapping (Frontend Cache)
```typescript
interface RegisterMapping {
  fieldName: string;         // Database column name
  registerName: string;      // Human-readable name
  unit: string;              // Unit of measurement
}
```

## Correctness Properties

### Property 1: Register Name Mapping Accuracy
*For any* field name that exists in the register table, the service should return the correct register name.
**Validates: Requirements 1.2, 2.2, 3.3**

### Property 2: Fallback for Missing Registers
*For any* field name that does not exist in the register table, the service should return a formatted version of the field name.
**Validates: Requirements 1.4, 2.4, 3.4**

### Property 3: Cache Consistency
*For any* register mapping, the cached value should match the database value.
**Validates: Requirements 3.2**

### Property 4: Meter Reading Column Display
*For any* meter reading, the column headers should display register names instead of field names.
**Validates: Requirements 1.1, 4.1, 4.2**

### Property 5: Dashboard Card Display
*For any* dashboard card, the metric labels should display register names instead of field names.
**Validates: Requirements 2.1, 5.1, 5.2**

### Property 6: Export Header Accuracy
*For any* exported data, the headers should use register names instead of field names.
**Validates: Requirements 4.3, 5.4**

### Property 7: Unit Display Consistency
*For any* metric displayed, the unit should match the register unit from the database.
**Validates: Requirements 4.2, 5.2**

## Error Handling

### Missing Register
- **Scenario**: Field name not found in register table
- **Handling**: Format field name as fallback (e.g., `active_energy` → `Active Energy`)
- **User Impact**: Display is readable but may not match exact register name

### API Failure
- **Scenario**: Backend API fails to return registers
- **Handling**: Use fallback formatting for all field names
- **User Impact**: Display uses formatted field names instead of register names

### Cache Initialization Failure
- **Scenario**: Service fails to initialize cache on startup
- **Handling**: Log error, continue with fallback formatting
- **User Impact**: Display uses formatted field names instead of register names

## Testing Strategy

### Unit Testing
- Test register name lookup for existing registers
- Test fallback formatting for missing registers
- Test cache initialization and retrieval
- Test error handling for API failures
- Test unit retrieval and formatting

### Property-Based Testing
- **Property 1**: For any field name in register table, mapping should be accurate
- **Property 2**: For any field name not in table, fallback should be readable
- **Property 3**: For any cached mapping, value should match database
- **Property 4**: For any meter reading, columns should display register names
- **Property 5**: For any dashboard card, labels should display register names
- **Property 6**: For any export, headers should use register names
- **Property 7**: For any metric, unit should match register unit

### Integration Testing
- Test meter reading list displays register names
- Test dashboard cards display register names
- Test exports use register names
- Test fallback behavior when registers are missing
- Test cache updates when registers change

## Implementation Notes

### Performance Considerations
- Register mappings are cached in memory after first fetch
- Cache is initialized once on service startup
- Lookups are O(1) using Map data structure
- No additional API calls needed after initialization

### Backward Compatibility
- Fallback formatting ensures UI works even if registers are missing
- Existing components continue to work with new service
- No breaking changes to component interfaces

### Future Enhancements
- Cache invalidation strategy if registers change
- Real-time cache updates via WebSocket
- Register name localization/i18n support
- Register grouping by category

## Configuration

### Service Initialization
- Service should be initialized on app startup
- Cache should be populated before components render
- Error handling should allow graceful degradation

### API Endpoint
- Should be available at `GET /api/registers`
- Should return all registers with name and field_name
- Should be accessible to authenticated users

