# Meter Device Manufacturer and Model Display - Design

## Architecture Overview

The solution involves enhancing the backend API to include device information when fetching meters, and ensuring the frontend properly displays this data.

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend: MeterList Component                               │
│ - Fetches meters via GET /api/meters                        │
│ - Displays columns from schema (including manufacturer)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: GET /api/meters Endpoint                           │
│ - Query meter table                                         │
│ - JOIN device table on device_id                           │
│ - Include manufacturer and model_number in response        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Database                                                    │
│ - meter table (meter_id, device_id, name, ...)            │
│ - device table (device_id, manufacturer, model_number, ...) │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Backend API Enhancement

**File**: `client/backend/src/routes/meters.js`

**Changes**:
- Modify the `GET /api/meters` endpoint to include device information
- Use a JOIN query to combine meter and device data
- Include `manufacturer` and `model_number` in the response

**Query Pattern**:
```sql
SELECT 
  m.*,
  d.manufacturer,
  d.model_number
FROM meter m
LEFT JOIN device d ON m.device_id = d.device_id
WHERE m.tenant_id = $1
LIMIT $2 OFFSET $3
```

### 2. Frontend Data Model

**File**: `MeterItPro/frontend/src/types/meter.ts`

**Changes**:
- Add `manufacturer` field to Meter interface
- Add `model_number` field to Meter interface
- These fields will be populated from the device relationship

### 3. Frontend Store

**File**: `MeterItPro/frontend/src/features/meters/metersStore.ts`

**Changes**:
- No changes needed - the store already handles any fields in the API response
- The `Meter` type will be updated to include the new fields

### 4. Frontend Display

**File**: `MeterItPro/frontend/src/features/meters/MeterList.tsx`

**Changes**:
- No changes needed - the component already generates columns from schema
- The schema already defines `device` and `model` fields with `showOn: ['list']`
- Once the backend provides the data, columns will automatically render

## Data Flow

1. **User opens Meter List**
   - MeterList component mounts
   - Calls `useMetersEnhanced()` hook

2. **Fetch Meters**
   - metersStore calls `GET /api/meters`
   - Backend queries meter table with device JOIN
   - Response includes manufacturer and model_number

3. **Display Data**
   - MeterList receives meter data with device info
   - Schema column generator creates columns for manufacturer and model
   - Columns render with data from the API response

## Schema Mapping

The meter schema already defines these fields:

```javascript
field({
  name: 'device',
  order: X,
  type: FieldTypes.STRING,
  label: 'Manufacturer',
  dbField: 'manufacturer',  // Maps to device.manufacturer
  showOn: ['list', 'form'],
  readOnly: true,
}),

field({
  name: 'model',
  order: Y,
  type: FieldTypes.STRING,
  label: 'Model Number',
  dbField: 'model_number',  // Maps to device.model_number
  showOn: ['list', 'form'],
  readOnly: true,
})
```

## Correctness Properties

### Property 1: Device Data Inclusion
**Validates: Requirements 1.1, 1.2**

For every meter in the response that has a device_id:
- The response must include the manufacturer from the related device
- The response must include the model_number from the related device
- The values must match the device table records

### Property 2: Null Handling
**Validates: Requirements 1.1, 1.2**

For meters without a device_id:
- The manufacturer field should be null or empty string
- The model_number field should be null or empty string
- The meter should still be included in the response

### Property 3: Column Display
**Validates: Requirements 1.1, 1.2**

When the meter list is rendered:
- The manufacturer column should be visible
- The model_number column should be visible
- Both columns should display the values from the API response

## Testing Strategy

### Unit Tests
- Test the meters API endpoint with device JOIN
- Verify manufacturer and model_number are included in response
- Test null handling for meters without devices

### Property-Based Tests
- For all meters in the response, verify device data is present when device_id exists
- For all meters without device_id, verify manufacturer and model_number are null/empty

### Integration Tests
- Fetch meters via API and verify columns display correctly
- Verify sorting and filtering work on manufacturer and model columns

## Implementation Order

1. Update Meter type interface to include manufacturer and model_number
2. Modify backend API endpoint to JOIN device table
3. Test API response includes device data
4. Verify frontend displays columns correctly
