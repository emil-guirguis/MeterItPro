# Design Document: Reports List Display and Selection Features

## Overview

This design addresses critical issues in the Reports module:

1. **Column display bug** - ReportList is not showing columns due to incorrect prop usage
2. **Missing selection features** - No way to select meters, elements, or registers
3. **Missing HTML formatting** - No support for HTML output formatting

The solution follows existing framework patterns used in other modules (Meters, Contacts, Dashboards) and maintains consistency with the codebase architecture.

## Architecture

### Current Issues

```
ReportList.tsx
  ├─ Defines reportColumns locally
  ├─ Calls useBaseList() hook
  └─ Uses baseList.columns instead of reportColumns ❌ BUG
     └─ Results in empty/undefined columns
```

### Fixed Architecture

```
ReportList.tsx
  ├─ Defines reportColumns locally
  ├─ Calls useBaseList() hook
  └─ Uses reportColumns directly ✓ FIX
     └─ Columns display properly

ReportForm.tsx
  ├─ Uses BaseForm with schema
  ├─ Custom field renderers for:
  │  ├─ recipients (RecipientsField)
  │  ├─ schedule (ScheduleField)
  │  ├─ meter_ids (MeterElementSelector) ✓ NEW
  │  ├─ element_ids (MeterElementSelector) ✓ NEW
  │  ├─ register_ids (RegisterSelector) ✓ NEW
  │  └─ html_format (checkbox) ✓ NEW
  └─ All custom fields integrated
```

## Components and Interfaces

### 1. Fix ReportList Column Display

**File**: `MeterItPro/frontend/src/features/reports/ReportList.tsx`

**Issue**: The component defines `reportColumns` but passes `baseList.columns` to BaseList, which is undefined.

**Fix**: Use the locally defined `reportColumns` instead.

```typescript
// BEFORE (broken)
<BaseList
  columns={baseList.columns}  // ❌ undefined
  data={baseList.data}
  // ...
/>

// AFTER (fixed)
<BaseList
  columns={reportColumns}  // ✓ properly defined
  data={reports.data}
  // ...
/>
```

### 2. Update Report Schema

**File**: `client/backend/src/models/ReportWithSchema.js`

Add new fields to the Report schema:

```javascript
{
  entityName: 'Report',
  tableName: 'report',
  
  formTabs: [
    // ... existing tabs ...
    
    // NEW: Meters & Elements Tab
    tab({
      name: 'Meters & Elements',
      order: 4,
      sections: [
        section({
          name: 'Select Meters and Elements',
          order: 1,
          fields: [
            field({
              name: 'meter_ids',
              order: 1,
              type: FieldTypes.CUSTOM,
              label: 'Meters and Elements',
              required: false,
              default: [],
              showOn: ['form'],
            }),
            field({
              name: 'element_ids',
              order: 2,
              type: FieldTypes.CUSTOM,
              label: 'Selected Elements',
              required: false,
              default: [],
              showOn: ['form'],
            }),
          ],
        }),
      ],
    }),
    
    // NEW: Registers Tab
    tab({
      name: 'Registers',
      order: 5,
      sections: [
        section({
          name: 'Select Registers',
          order: 1,
          fields: [
            field({
              name: 'register_ids',
              order: 1,
              type: FieldTypes.CUSTOM,
              label: 'Registers',
              required: false,
              default: [],
              showOn: ['form'],
            }),
          ],
        }),
      ],
    }),
    
    // NEW: Formatting Tab
    tab({
      name: 'Formatting',
      order: 6,
      sections: [
        section({
          name: 'Output Format',
          order: 1,
          fields: [
            field({
              name: 'html_format',
              order: 1,
              type: FieldTypes.BOOLEAN,
              label: 'Enable HTML Formatting',
              required: false,
              default: false,
              showOn: ['form'],
            }),
          ],
        }),
      ],
    }),
  ],
}
```

### 3. MeterElementSelector Component

**File**: `MeterItPro/frontend/src/features/reports/components/MeterElementSelector.tsx`

```typescript
interface MeterElementSelectorProps {
  value: {
    meter_ids: string[];
    element_ids: string[];
  };
  error?: string;
  isDisabled: boolean;
  onChange: (value: { meter_ids: string[]; element_ids: string[] }) => void;
}

export const MeterElementSelector: React.FC<MeterElementSelectorProps> = ({
  value = { meter_ids: [], element_ids: [] },
  error,
  isDisabled,
  onChange,
}) => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedMeterIds, setSelectedMeterIds] = useState<string[]>(value.meter_ids || []);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>(value.element_ids || []);

  // Load meters on mount
  useEffect(() => {
    // Fetch meters from API
    fetchMeters().then(setMeters);
  }, []);

  // Load elements when meters change
  useEffect(() => {
    if (selectedMeterIds.length > 0) {
      fetchElementsForMeters(selectedMeterIds).then(setElements);
    } else {
      setElements([]);
    }
  }, [selectedMeterIds]);

  const handleMeterToggle = (meterId: string) => {
    const newMeterIds = selectedMeterIds.includes(meterId)
      ? selectedMeterIds.filter(id => id !== meterId)
      : [...selectedMeterIds, meterId];
    
    setSelectedMeterIds(newMeterIds);
    onChange({
      meter_ids: newMeterIds,
      element_ids: selectedElementIds,
    });
  };

  const handleElementToggle = (elementId: string) => {
    const newElementIds = selectedElementIds.includes(elementId)
      ? selectedElementIds.filter(id => id !== elementId)
      : [...selectedElementIds, elementId];
    
    setSelectedElementIds(newElementIds);
    onChange({
      meter_ids: selectedMeterIds,
      element_ids: newElementIds,
    });
  };

  return (
    <div className="meter-element-selector">
      <div className="selector-section">
        <h4>Available Meters</h4>
        <div className="meter-list">
          {meters.map(meter => (
            <label key={meter.id} className="checkbox-item">
              <input
                type="checkbox"
                checked={selectedMeterIds.includes(meter.id)}
                onChange={() => handleMeterToggle(meter.id)}
                disabled={isDisabled}
              />
              <span>{meter.name} ({meter.identifier})</span>
            </label>
          ))}
        </div>
      </div>

      {selectedMeterIds.length > 0 && (
        <div className="selector-section">
          <h4>Available Elements</h4>
          <div className="element-list">
            {elements.map(element => (
              <label key={element.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedElementIds.includes(element.id)}
                  onChange={() => handleElementToggle(element.id)}
                  disabled={isDisabled}
                />
                <span>{element.name} ({element.element_number})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
```

### 4. RegisterSelector Component

**File**: `MeterItPro/frontend/src/features/reports/components/RegisterSelector.tsx`

```typescript
interface RegisterSelectorProps {
  value: string[];
  error?: string;
  isDisabled: boolean;
  onChange: (value: string[]) => void;
}

export const RegisterSelector: React.FC<RegisterSelectorProps> = ({
  value = [],
  error,
  isDisabled,
  onChange,
}) => {
  const [registers, setRegisters] = useState<Register[]>([]);

  // Load available registers on mount
  useEffect(() => {
    fetchRegisters().then(setRegisters);
  }, []);

  const handleToggle = (registerId: string) => {
    const newValue = value.includes(registerId)
      ? value.filter(id => id !== registerId)
      : [...value, registerId];
    
    onChange(newValue);
  };

  return (
    <div className="register-selector">
      <div className="register-list">
        {registers.map(register => (
          <label key={register.id} className="checkbox-item">
            <input
              type="checkbox"
              checked={value.includes(register.id)}
              onChange={() => handleToggle(register.id)}
              disabled={isDisabled}
            />
            <span className="register-label">
              <span className="register-name">{register.name}</span>
              <span className="register-description">{register.description}</span>
            </span>
          </label>
        ))}
      </div>

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
```

### 5. Updated ReportForm Component

**File**: `MeterItPro/frontend/src/features/reports/ReportForm.tsx`

```typescript
export const ReportForm: React.FC<ReportFormProps> = ({
  report,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const reports = useReportsEnhanced();

  return (
    <FormContainer>
      <BaseForm
        schemaName="report"
        entity={report}
        store={reports}
        onCancel={onCancel}
        onLegacySubmit={onSubmit}
        loading={loading}
        showTabs={true}
        renderCustomField={(fieldName, fieldDef, value, error, isDisabled, onChange) => {
          // Recipients field
          if (fieldName === 'recipients') {
            return (
              <RecipientsField
                value={value || []}
                error={error}
                isDisabled={isDisabled}
                onChange={onChange}
              />
            );
          }

          // Schedule field
          if (fieldName === 'schedule') {
            return (
              <ScheduleField
                value={value || ''}
                error={error}
                isDisabled={isDisabled}
                onChange={onChange}
              />
            );
          }

          // Meter/Element selector
          if (fieldName === 'meter_ids' || fieldName === 'element_ids') {
            return (
              <MeterElementSelector
                value={{
                  meter_ids: report?.meter_ids || [],
                  element_ids: report?.element_ids || [],
                }}
                error={error}
                isDisabled={isDisabled}
                onChange={(newValue) => {
                  // Update both fields when either changes
                  onChange(newValue);
                }}
              />
            );
          }

          // Register selector
          if (fieldName === 'register_ids') {
            return (
              <RegisterSelector
                value={value || []}
                error={error}
                isDisabled={isDisabled}
                onChange={onChange}
              />
            );
          }

          // HTML format checkbox - let BaseForm render default
          if (fieldName === 'html_format') {
            return null; // BaseForm will render as checkbox
          }

          return null;
        }}
      />
    </FormContainer>
  );
};
```

## Data Models

### Report Entity (Updated)

```typescript
interface Report {
  report_id: number;
  name: string;
  type: 'meter_readings' | 'usage_summary' | 'daily_summary';
  schedule: string; // Cron expression
  recipients: string[]; // Email addresses
  enabled: boolean;
  
  // NEW FIELDS
  meter_ids: string[]; // Selected meter IDs
  element_ids: string[]; // Selected element IDs
  register_ids: string[]; // Selected register IDs
  html_format: boolean; // Enable HTML formatting
  
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

### Database Schema Update

```sql
-- Add new columns to report table
ALTER TABLE report ADD COLUMN meter_ids TEXT[] DEFAULT '{}';
ALTER TABLE report ADD COLUMN element_ids TEXT[] DEFAULT '{}';
ALTER TABLE report ADD COLUMN register_ids TEXT[] DEFAULT '{}';
ALTER TABLE report ADD COLUMN html_format BOOLEAN DEFAULT false;
```

## Correctness Properties

### Property 1: ReportList displays all columns

*For any* ReportList render, the component should display all defined columns (name, type, schedule, recipients, status, created date) with proper data.

**Validates: Requirement 1.1, 1.2, 1.3, 1.4**

### Property 2: MeterElementSelector allows meter selection

*For any* MeterElementSelector render, the component should display available meters and allow toggling selection.

**Validates: Requirement 2.2, 2.3**

### Property 3: MeterElementSelector updates form data

*For any* meter or element selection change, the component should call onChange with updated meter_ids and element_ids.

**Validates: Requirement 2.4, 2.5**

### Property 4: RegisterSelector allows register selection

*For any* RegisterSelector render, the component should display available registers and allow toggling selection.

**Validates: Requirement 3.2, 3.3**

### Property 5: RegisterSelector updates form data

*For any* register selection change, the component should call onChange with updated register_ids.

**Validates: Requirement 3.4, 3.5**

### Property 6: ReportForm renders all custom fields

*For any* ReportForm render, the component should render custom field renderers for meter_ids, element_ids, register_ids, and html_format fields.

**Validates: Requirement 8.1, 8.2, 8.3**

### Property 7: Form submission includes new fields

*For any* valid form submission, the onSubmit callback should be called with data including meter_ids, element_ids, register_ids, and html_format.

**Validates: Requirement 8.4, 8.5**

### Property 8: Backward compatibility maintained

*For any* existing report without new fields, the form should handle missing fields gracefully and default to empty arrays/false.

**Validates: Requirement 9.1, 9.2, 9.3, 9.4**

## Implementation Notes

### Key Changes

1. **ReportList.tsx** - One-line fix: use `reportColumns` instead of `baseList.columns`
2. **ReportWithSchema.js** - Add 4 new fields to schema (meter_ids, element_ids, register_ids, html_format)
3. **MeterElementSelector.tsx** - New component for meter/element selection
4. **RegisterSelector.tsx** - New component for register selection
5. **ReportForm.tsx** - Add custom field renderers for new components

### Database Migration

Add new columns to report table to store selected meters, elements, registers, and HTML format preference.

### API Considerations

- Existing reports without new fields should work without modification
- New fields should be optional in API validation
- Default values: empty arrays for IDs, false for html_format

### Performance

- MeterElementSelector loads meters once on mount
- Elements are loaded only when meters are selected
- RegisterSelector loads registers once on mount
- No additional API calls beyond initial data loading

## Testing Strategy

### Unit Tests

1. **ReportList column display** - Verify columns are rendered with correct data
2. **MeterElementSelector** - Verify meter/element selection and onChange callback
3. **RegisterSelector** - Verify register selection and onChange callback
4. **ReportForm integration** - Verify custom field renderers are called
5. **Backward compatibility** - Verify old reports load without errors

### Property-Based Tests

1. **Property 1: ReportList displays all columns** - Generate random report data and verify columns display
2. **Property 2-3: MeterElementSelector** - Generate random meter/element data and verify selection
3. **Property 4-5: RegisterSelector** - Generate random register data and verify selection
4. **Property 6-7: ReportForm** - Generate random form data and verify submission
5. **Property 8: Backward compatibility** - Generate reports with missing fields and verify handling

