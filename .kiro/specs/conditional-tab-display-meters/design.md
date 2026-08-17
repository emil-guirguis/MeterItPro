# Design Document: Conditional Tab Display for Virtual vs Physical Meters

## Overview

This design implements conditional tab visibility in the meter form based on meter type. The system will filter tabs at runtime based on a `visibleFor` property defined in the schema, allowing different tabs to be displayed for physical vs virtual meters. This eliminates the need for custom rendering logic and provides a declarative, schema-driven approach to tab management.

## Architecture

The implementation follows a layered approach:

1. **Schema Layer**: Define `visibleFor` property on tabs in MeterWithSchema
2. **Hook Layer**: Enhance useFormTabs to filter tabs based on meter type
3. **Component Layer**: Pass meterType prop through MeterForm → BaseForm → useFormTabs
4. **Rendering Layer**: Only render tabs that pass the visibility filter

### Data Flow

```
MeterForm (determines meter type)
    ↓
BaseForm (receives meterType prop)
    ↓
useFormTabs (filters tabs based on visibleFor + meterType)
    ↓
FormTabs (renders only visible tabs)
```

## Components and Interfaces

### 1. Schema Definition Enhancement

**File**: `client/backend/src/models/MeterWithSchema.js`

Add `visibleFor` property to tab definitions:

```typescript
interface Tab {
  name: string;
  order?: number;
  visibleFor?: ('physical' | 'virtual')[]; // NEW: controls visibility
  sections: Section[];
}
```

**Behavior**:
- If `visibleFor` is not specified: tab is visible for all meter types (backward compatible)
- If `visibleFor` is specified: tab only visible when meter_type matches one of the values
- `visibleFor: ['physical']` → visible only for physical meters
- `visibleFor: ['virtual']` → visible only for virtual meters
- `visibleFor: ['physical', 'virtual']` → visible for both types

### 2. useFormTabs Hook Enhancement

**File**: `framework/frontend/components/form/hooks/useFormTabs.ts`

Enhance the hook to accept and filter by meterType:

```typescript
interface UseFormTabsResult {
  tabs: Record<string, TabInfo>;
  tabList: string[];
  fieldSections: Record<string, string[]>;
}

export const useFormTabs = (
  formTabs: Tab[] | null | undefined,
  activeTab: string,
  meterType?: 'physical' | 'virtual' | null  // NEW parameter
): UseFormTabsResult => {
  // Filter tabs based on visibleFor property and meterType
  // Return only tabs that should be visible
}
```

**Filtering Logic**:
1. For each tab in formTabs:
   - If tab has no `visibleFor` property: include it (backward compatible)
   - If tab has `visibleFor` property:
     - If meterType is null/undefined: include it (default behavior)
     - If meterType matches any value in `visibleFor`: include it
     - Otherwise: exclude it
2. Return filtered tabs in the same structure

### 3. BaseForm Component Enhancement

**File**: `framework/frontend/components/form/BaseForm.tsx`

Add meterType prop and pass it to useFormTabs:

```typescript
export interface BaseFormProps {
  // ... existing props ...
  meterType?: 'physical' | 'virtual' | null;  // NEW prop
}

export const BaseForm: React.FC<BaseFormProps> = ({
  // ... existing props ...
  meterType,
}) => {
  // Pass meterType to useFormTabs
  const { tabs: allTabs, fieldSections: formTabsFieldSections, tabList } = useFormTabs(
    schema?.formTabs,
    effectiveActiveTab,
    meterType  // NEW: pass meterType for filtering
  );
  // ... rest of component
}
```

### 4. MeterForm Component Enhancement

**File**: `MeterItPro/frontend/src/features/meters/MeterForm.tsx`

Determine meter type and pass to BaseForm:

```typescript
export const MeterForm: React.FC<MeterFormProps> = ({
  meter,
  meterType,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  // Determine meter type from meter object or prop
  const determinedMeterType = meter?.meter_type || meterType;

  return (
    <FormContainer>
      <BaseForm
        schemaName="meter"
        entity={meter}
        store={meters}
        onCancel={onCancel}
        onSubmit={onSubmit}
        meterType={determinedMeterType}  // NEW: pass meterType
        // ... other props ...
      />
    </FormContainer>
  );
}
```

## Data Models

### Tab Definition with Visibility

```typescript
interface Tab {
  name: string;
  order?: number;
  visibleFor?: ('physical' | 'virtual')[];  // NEW
  sections: Section[];
}

interface Section {
  name: string;
  order?: number;
  fields: FieldRef[];
  minWidth?: string;
  maxWidth?: string;
}

interface FieldRef {
  name: string;
  order?: number;
}
```

### MeterWithSchema Configuration

The schema will be updated to include:

```javascript
tab({
  name: 'Elements',
  order: 2,
  visibleFor: ['physical'],  // NEW: only show for physical meters
  sections: [
    section({
      name: 'Meter Elements',
      order: 1,
      fields: [
        field({
          name: 'elements',
          // ... field definition ...
        }),
      ],
    }),
  ],
}),

tab({
  name: 'Combined Meters',
  order: 2,
  visibleFor: ['virtual'],  // NEW: only show for virtual meters
  sections: [
    section({
      name: 'Combined Meters',
      order: 1,
      fields: [
        field({
          name: 'elements',
          // ... field definition ...
        }),
      ],
    }),
  ],
}),
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Tabs without visibleFor are always visible

*For any* tab without a `visibleFor` property, the tab should appear in the filtered tab list regardless of the meterType value (including null/undefined).

**Validates: Requirements 1.2, 5.1, 5.2, 5.3, 7.4, 7.5**

### Property 2: Physical meter shows only physical-visible tabs

*For any* set of tabs and meterType='physical', the filtered tab list should only include tabs where `visibleFor` is undefined or contains 'physical'.

**Validates: Requirements 1.3, 4.1, 4.3, 7.2, 7.3**

### Property 3: Virtual meter shows only virtual-visible tabs

*For any* set of tabs and meterType='virtual', the filtered tab list should only include tabs where `visibleFor` is undefined or contains 'virtual'.

**Validates: Requirements 1.4, 3.1, 3.3, 7.2, 7.3**

### Property 4: Null meterType shows all tabs

*For any* set of tabs and meterType=null or undefined, the filtered tab list should include all tabs (same as if visibleFor was not specified).

**Validates: Requirements 2.4, 5.2, 5.3, 7.5**

### Property 5: Tab filtering is consistent across meter types

*For any* tab with `visibleFor: ['physical', 'virtual']`, the tab should appear in the filtered list for both meterType='physical' and meterType='virtual'.

**Validates: Requirements 1.5, 2.2**

### Property 6: Filtered tabs are completely removed from rendering

*For any* tab that does not match the current meterType's visibility criteria, the tab should not appear in the tabList output and should not be renderable.

**Validates: Requirements 2.3, 3.4, 4.2**

### Property 7: Tab list updates when meterType changes

*For any* change in meterType value, the filtered tab list should update to reflect the new visibility criteria, with previously hidden tabs becoming visible and previously visible tabs becoming hidden as appropriate.

**Validates: Requirements 2.5, 3.3, 4.3, 6.4**

### Property 8: MeterForm passes correct meterType to BaseForm

*For any* meter object with a meter_type field, MeterForm should pass that meter_type value to BaseForm via the meterType prop, or use the meterType prop if provided.

**Validates: Requirements 6.1, 6.2, 6.3**

## Error Handling

### Graceful Degradation

- **All tabs filtered out**: If all tabs are filtered out for a meter type, the form should still render without errors. The tab container will be empty but functional.
- **Invalid meterType**: If meterType is an unexpected value (not 'physical', 'virtual', null, or undefined), treat it as null and show all tabs.
- **Missing visibleFor**: Tabs without `visibleFor` property are always shown (backward compatible).
- **Empty formTabs**: If formTabs is empty or null, useFormTabs returns empty result without errors.

### Validation

- Schema validation ensures `visibleFor` only contains valid meter type values
- Runtime checks ensure meterType is one of the expected values
- No errors thrown for missing or invalid data; defaults to safe behavior

## Testing Strategy

### Unit Tests

Unit tests validate specific examples and edge cases:

1. **Tab filtering with physical meter type**
   - Verify Elements tab appears, Combined Meters tab hidden
   - Verify Meter and Additional Info tabs appear

2. **Tab filtering with virtual meter type**
   - Verify Combined Meters tab appears, Elements tab hidden
   - Verify Meter and Additional Info tabs appear

3. **Tab filtering with null meterType**
   - Verify all tabs appear regardless of visibleFor

4. **Backward compatibility**
   - Verify tabs without visibleFor appear for all meter types
   - Verify existing schemas work without modification

5. **MeterForm meter type detection**
   - Verify meter_type from meter object is used
   - Verify meterType prop is used when provided
   - Verify prop takes precedence over meter object

6. **Edge cases**
   - Empty formTabs array
   - All tabs filtered out
   - Invalid meterType values
   - Null/undefined meter object

### Property-Based Tests

Property-based tests validate universal properties across many generated inputs:

1. **Property 1: Tabs without visibleFor are always visible**
   - Generate random tabs with and without visibleFor
   - Generate random meterType values (physical, virtual, null, undefined)
   - Verify tabs without visibleFor always appear in output

2. **Property 2: Physical meter shows only physical-visible tabs**
   - Generate random tabs with various visibleFor values
   - Set meterType='physical'
   - Verify output only includes tabs with undefined visibleFor or containing 'physical'

3. **Property 3: Virtual meter shows only virtual-visible tabs**
   - Generate random tabs with various visibleFor values
   - Set meterType='virtual'
   - Verify output only includes tabs with undefined visibleFor or containing 'virtual'

4. **Property 4: Null meterType shows all tabs**
   - Generate random tabs with various visibleFor values
   - Set meterType=null or undefined
   - Verify output includes all tabs

5. **Property 5: Tab filtering is consistent across meter types**
   - Generate tabs with visibleFor=['physical', 'virtual']
   - Test with both meterType='physical' and meterType='virtual'
   - Verify tab appears in both cases

6. **Property 6: Filtered tabs are completely removed**
   - Generate tabs with specific visibleFor values
   - Verify filtered tabs don't appear in tabList
   - Verify filtered tabs don't appear in fieldSections

7. **Property 7: Tab list updates when meterType changes**
   - Generate random tabs and meterType values
   - Call useFormTabs with initial meterType
   - Call useFormTabs again with different meterType
   - Verify tab list changes appropriately

8. **Property 8: MeterForm passes correct meterType**
   - Generate random meter objects with meter_type
   - Render MeterForm with meter object
   - Verify BaseForm receives correct meterType prop

### Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with: `Feature: conditional-tab-display-meters, Property N: [property title]`
- Unit tests focus on specific examples and edge cases
- Property tests focus on universal correctness across all inputs
- Both test types are complementary and necessary for comprehensive coverage

## Implementation Notes

### Backward Compatibility

- Existing schemas without `visibleFor` continue to work unchanged
- Tabs without `visibleFor` are visible for all meter types
- If meterType is not provided, all tabs are shown
- No breaking changes to existing API or component interfaces

### Performance Considerations

- Tab filtering happens in useFormTabs hook (memoized with useMemo)
- Filtering is O(n) where n is number of tabs (typically small)
- No additional API calls or database queries
- Filtering happens on every render but is memoized to prevent unnecessary recalculation

### Future Enhancements

- Support for more complex visibility conditions (e.g., based on other field values)
- Support for conditional sections within tabs
- Support for conditional fields within sections
- Dynamic tab ordering based on meter type

