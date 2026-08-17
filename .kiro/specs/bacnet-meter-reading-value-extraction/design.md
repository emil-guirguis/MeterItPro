# Design Document: BACnet Meter Reading Value Extraction Fix

## Overview

The BACnet meter reading collection system needs to properly extract numeric values from BACnet device responses. Currently, values are being logged as `[object Object]` instead of numeric values. This design addresses the value extraction logic in the collection cycle manager to handle various BACnet response structures and ensure numeric values are correctly extracted, validated, and persisted.

## Architecture

The value extraction occurs in the collection cycle manager during the meter data point reading phase:

```
BACnet Device Response
    ↓
BACnet Client (bacnet-client.ts)
    ↓
Collection Cycle Manager (collection-cycle-manager.ts) ← VALUE EXTRACTION HAPPENS HERE
    ↓
Reading Batcher (reading-batcher.ts)
    ↓
Database Insertion
```

## Components and Interfaces

### 1. Collection Cycle Manager - Value Extraction Logic

**Location:** `MeterItProSync/mcp/src/bacnet-collection/collection-cycle-manager.ts`

**Current Issue:** Lines 240-260 attempt to extract values but don't handle all cases properly.

**Responsibility:** Extract numeric values from BACnet responses and create PendingReading objects.

**Key Method:** `readMeterDataPoints()` - processes batch results and extracts values

### 2. Value Extraction Function

A utility function that handles various BACnet value structures:

```typescript
function extractNumericValue(rawValue: any): number | null {
  // Handle null/undefined
  if (rawValue === null || rawValue === undefined) {
    return null;
  }
  
  // Handle primitive numbers
  if (typeof rawValue === 'number') {
    return isNaN(rawValue) ? null : rawValue;
  }
  
  // Handle objects with value property
  if (typeof rawValue === 'object') {
    // Case 1: {value: 123.45}
    if ('value' in rawValue && typeof rawValue.value === 'number') {
      return isNaN(rawValue.value) ? null : rawValue.value;
    }
    
    // Case 2: [0] = {value: 123.45, type: 4}
    if (Array.isArray(rawValue) && rawValue.length > 0) {
      const firstElement = rawValue[0];
      if (typeof firstElement === 'object' && 'value' in firstElement) {
        const val = firstElement.value;
        return typeof val === 'number' && !isNaN(val) ? val : null;
      }
    }
  }
  
  // Last resort: try to convert to number
  const converted = Number(rawValue);
  return isNaN(converted) ? null : converted;
}
```

## Data Models

### PendingReading

```typescript
interface PendingReading {
  meter_id: number;
  meter_element_id?: number;
  field_name: string;
  value: number;  // Must be a valid number, not an object
  register: number;
  element: string;
  created_at: Date;
}
```

### BACnet Response Structure

The BACnet library returns responses in this format:

```typescript
{
  values: [
    {
      value: 116.86911773681164,  // or {value: 116.86911773681164, type: 4}
      type: 4
    }
  ]
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Numeric Value Extraction

**For any** BACnet response containing a valid numeric value (whether wrapped in objects or arrays), extracting the value should produce a primitive number that equals the original numeric value.

**Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3**

### Property 2: Invalid Value Rejection

**For any** BACnet response containing an invalid, null, or non-numeric value, the extraction should return null, and the reading should be rejected during validation.

**Validates: Requirements 1.5, 3.1, 3.2**

### Property 3: Value Persistence Round Trip

**For any** extracted numeric value, when persisted to the database and retrieved, the value should equal the original extracted value (within floating-point precision).

**Validates: Requirements 1.4, 3.3**

### Property 4: Logging Accuracy

**For any** meter reading with a successfully extracted numeric value, the log message should display the numeric value (not `[object Object]`).

**Validates: Requirements 1.3**

## Error Handling

1. **Null/Undefined Values**: Log warning and skip reading
2. **Non-Numeric Values**: Log warning with structure details and skip reading
3. **Unexpected Structures**: Log the structure for debugging, attempt extraction, skip if unsuccessful
4. **Validation Failures**: Increment skipped count in batch metrics

## Testing Strategy

### Unit Tests

- Test value extraction with various input structures:
  - Primitive numbers: `123.45`
  - Objects with value property: `{value: 123.45}`
  - Arrays with objects: `[{value: 123.45, type: 4}]`
  - Null/undefined values
  - Non-numeric values
  - Nested structures

- Test logging output contains numeric values, not `[object Object]`
- Test validation rejects invalid values
- Test batch metrics track skipped readings correctly

### Property-Based Tests

- **Property 1**: For all valid numeric values in various structures, extraction produces the correct number
- **Property 2**: For all invalid values, extraction returns null and reading is rejected
- **Property 3**: For all extracted values, database round-trip preserves the value
- **Property 4**: For all successful readings, log messages contain numeric values

**Testing Framework:** Vitest with fast-check for property-based testing

**Configuration:** Minimum 100 iterations per property test

**Test Annotation Format:**
```typescript
// Feature: bacnet-meter-reading-value-extraction, Property 1: Numeric Value Extraction
// Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3
```

