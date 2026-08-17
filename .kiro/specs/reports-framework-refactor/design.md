# Design Document: Reports Module Framework Integration

## Overview

This design refactors the Reports module to use framework components (BaseForm, FormContainer, BaseList) instead of custom implementations. The refactoring aligns the Reports module with other framework-integrated modules like Meters and Contacts, providing consistency, maintainability, and reduced custom code. The key changes are:

1. Create a Report schema definition for schema-driven form rendering
2. Refactor ReportForm to use BaseForm with custom field renderers for recipients and schedule
3. Enhance ReportList to fully utilize BaseList features
4. Maintain all current functionality through custom field rendering

## Architecture

The refactored Reports module follows the framework architecture pattern:

```
ReportsPage
    ↓
ReportList (uses BaseList)
    ↓
BaseList (framework component)

ReportsPage
    ↓
FormModal
    ↓
ReportForm (uses BaseForm)
    ↓
BaseForm (framework component)
    ↓
useEntityFormWithStore (manages form state and submission)
```

### Data Flow

1. **List View**: ReportsPage → ReportList → BaseList → renders reports with filtering, sorting, pagination
2. **Create/Edit View**: ReportsPage → FormModal → ReportForm → BaseForm → renders form with schema-driven fields
3. **Form Submission**: ReportForm → BaseForm → useEntityFormWithStore → reports store → API call
4. **Custom Fields**: BaseForm calls renderCustomField for recipients and schedule fields

## Components and Interfaces

### 1. Report Schema Definition

**File**: `client/backend/src/models/ReportWithSchema.js`

Create a schema definition for the Report entity:

```typescript
interface ReportSchema {
  entityName: 'report';
  fields: {
    report_id: FieldDefinition;
    name: FieldDefinition;
    type: FieldDefinition;
    schedule: FieldDefinition;
    recipients: FieldDefinition;
    enabled: FieldDefinition;
    config: FieldDefinition;
    created_at: FieldDefinition;
    updated_at: FieldDefinition;
  };
  formTabs: Tab[];
  formGrouping: Record<string, string[]>;
}

interface Tab {
  name: string;
  order: number;
  sections: Section[];
}

interface Section {
  name: string;
  order: number;
  fields: FieldRef[];
}

interface FieldDefinition {
  name: string;
  type: 'text' | 'select' | 'checkbox' | 'email' | 'custom';
  label: string;
  required?: boolean;
  validation?: ValidationRule[];
  placeholder?: string;
  help?: string;
  options?: Array<{ value: string; label: string }>;
}
```

**Schema Structure**:
- **Basic Info Tab**: name, type, enabled
- **Schedule Tab**: schedule (with cron presets)
- **Recipients Tab**: recipients (with add/remove UI)
- **Configuration Tab**: config (for type-specific settings)

### 2. Refactored ReportForm Component

**File**: `MeterItPro/frontend/src/features/reports/ReportForm.tsx`

```typescript
interface ReportFormProps {
  report?: Report;
  onSubmit: (data: Omit<Report, 'report_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

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
        onSubmit={onSubmit}
        loading={loading}
        showTabs={true}
        renderCustomField={(fieldName, fieldDef, value, error, isDisabled, onChange) => {
          // Custom rendering for recipients field
          if (fieldName === 'recipients') {
            return <RecipientsField value={value} error={error} isDisabled={isDisabled} onChange={onChange} />;
          }
          
          // Custom rendering for schedule field
          if (fieldName === 'schedule') {
            return <ScheduleField value={value} error={error} isDisabled={isDisabled} onChange={onChange} />;
          }
          
          // Return null to let BaseForm render default field
          return null;
        }}
      />
    </FormContainer>
  );
};
```

**Key Changes**:
- Removes all manual state management (useState for form fields)
- Removes all manual validation logic
- Uses BaseForm for schema-driven rendering
- Uses FormContainer for consistent layout
- Implements custom field renderers for recipients and schedule

### 3. RecipientsField Custom Component

**File**: `MeterItPro/frontend/src/features/reports/components/RecipientsField.tsx`

```typescript
interface RecipientsFieldProps {
  value: string[];
  error?: string;
  isDisabled: boolean;
  onChange: (value: string[]) => void;
}

export const RecipientsField: React.FC<RecipientsFieldProps> = ({
  value = [],
  error,
  isDisabled,
  onChange,
}) => {
  const [recipientInput, setRecipientInput] = useState('');
  const [inputError, setInputError] = useState('');

  const handleAddRecipient = () => {
    const email = recipientInput.trim();
    if (!email) return;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setInputError('Invalid email format');
      return;
    }

    if (value.includes(email)) {
      setInputError('Email already added');
      return;
    }

    onChange([...value, email]);
    setRecipientInput('');
    setInputError('');
  };

  const handleRemoveRecipient = (email: string) => {
    onChange(value.filter(r => r !== email));
  };

  return (
    <div className="recipients-field">
      <div className="recipients-input-group">
        <input
          type="email"
          className={`form-input ${inputError ? 'form-input--error' : ''}`}
          value={recipientInput}
          onChange={(e) => {
            setRecipientInput(e.target.value);
            if (inputError) setInputError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddRecipient();
            }
          }}
          placeholder="Enter email address"
          disabled={isDisabled}
        />
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleAddRecipient}
          disabled={isDisabled || !recipientInput.trim()}
        >
          Add
        </button>
      </div>
      {inputError && <span className="form-error">{inputError}</span>}

      {value.length > 0 && (
        <div className="recipients-list">
          {value.map((email, idx) => (
            <div key={idx} className="recipient-tag">
              <span>{email}</span>
              <button
                type="button"
                className="recipient-tag__remove"
                onClick={() => handleRemoveRecipient(email)}
                disabled={isDisabled}
                aria-label={`Remove ${email}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
```

### 4. ScheduleField Custom Component

**File**: `MeterItPro/frontend/src/features/reports/components/ScheduleField.tsx`

```typescript
const CRON_PRESETS = [
  { value: '0 9 * * *', label: 'Daily at 9 AM' },
  { value: '0 9 * * 1', label: 'Weekly on Monday at 9 AM' },
  { value: '0 9 1 * *', label: 'Monthly on 1st at 9 AM' },
  { value: '0 0 * * *', label: 'Daily at Midnight' },
  { value: '0 */6 * * *', label: 'Every 6 hours' },
];

interface ScheduleFieldProps {
  value: string;
  error?: string;
  isDisabled: boolean;
  onChange: (value: string) => void;
}

export const ScheduleField: React.FC<ScheduleFieldProps> = ({
  value,
  error,
  isDisabled,
  onChange,
}) => {
  return (
    <div className="schedule-field">
      <select
        className={`form-select ${error ? 'form-select--error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
      >
        <option value="">Select a preset or enter custom...</option>
        {CRON_PRESETS.map(preset => (
          <option key={preset.value} value={preset.value}>
            {preset.label} ({preset.value})
          </option>
        ))}
      </select>

      <input
        type="text"
        className={`form-input form-input--secondary ${error ? 'form-input--error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0 9 * * * (Daily at 9 AM)"
        disabled={isDisabled}
      />

      <small className="form-help">
        Format: minute hour day month day-of-week. Examples: 0 9 * * * (Daily at 9 AM), 0 9 * * 1 (Weekly on Monday)
      </small>

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
```

### 5. Enhanced ReportList Component

**File**: `MeterItPro/frontend/src/features/reports/ReportList.tsx`

The ReportList already uses BaseList but will be enhanced to:
- Ensure all columns are properly defined
- Ensure all filters are properly configured
- Ensure bulk actions are properly implemented
- Ensure export functionality is available

```typescript
export const ReportList: React.FC<ReportListProps> = ({
  onReportSelect,
  onReportEdit,
  onReportCreate,
}) => {
  const reports = useReportsEnhanced();
  
  // Define columns with proper rendering
  const reportColumns: ColumnDefinition<Report>[] = [
    {
      key: 'name',
      label: 'Report Name',
      sortable: true,
      filterable: true,
      width: '25%',
      render: (value: string, report: Report) => (
        <div className="report-name">
          <span className="report-name__text">{value}</span>
          <span className={`report-type-badge report-type-badge--${report.type}`}>
            {report.type}
          </span>
        </div>
      ),
    },
    // ... other columns ...
  ];

  // Define filters
  const reportFilters: FilterDefinition[] = [
    {
      key: 'name',
      label: 'Report Name',
      type: 'text',
      placeholder: 'Search by name...',
    },
    // ... other filters ...
  ];

  // Use BaseList with all features
  const baseList = useBaseList<Report, any>({
    entityName: 'report',
    entityNamePlural: 'reports',
    useStore: useReportsEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: true,
      allowExport: true,
      allowImport: false,
      allowSearch: true,
      allowFilters: true,
      allowStats: false,
    },
    columns: reportColumns,
    filters: reportFilters,
    onEdit: onReportEdit,
    onCreate: onReportCreate,
  });

  return (
    <div className="report-list">
      <BaseList
        title="Reports"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No reports found. Create your first report to get started."
        onEdit={baseList.handleEdit}
        onDelete={baseList.handleDelete}
        onSelect={onReportSelect ? (items) => onReportSelect(items[0]) : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
      {baseList.renderDeleteConfirmation()}
    </div>
  );
};
```

## Data Models

### Report Entity

```typescript
interface Report {
  report_id: number;
  name: string;
  type: 'meter_readings' | 'usage_summary' | 'daily_summary';
  schedule: string; // Cron expression
  recipients: string[]; // Email addresses
  enabled: boolean;
  config: Record<string, any>; // Type-specific configuration
  created_at: string;
  updated_at: string;
}
```

### Report Schema Structure

```javascript
{
  entityName: 'report',
  fields: {
    report_id: { type: 'number', label: 'ID', readonly: true },
    name: { type: 'text', label: 'Report Name', required: true, maxLength: 255 },
    type: { type: 'select', label: 'Report Type', required: true, options: [...] },
    schedule: { type: 'custom', label: 'Schedule', required: true },
    recipients: { type: 'custom', label: 'Email Recipients', required: true },
    enabled: { type: 'checkbox', label: 'Enabled' },
    config: { type: 'json', label: 'Configuration' },
    created_at: { type: 'date', label: 'Created', readonly: true },
    updated_at: { type: 'date', label: 'Updated', readonly: true },
  },
  formTabs: [
    {
      name: 'Basic Info',
      order: 1,
      sections: [
        {
          name: 'Report Details',
          order: 1,
          fields: ['name', 'type', 'enabled'],
        },
      ],
    },
    {
      name: 'Schedule',
      order: 2,
      sections: [
        {
          name: 'Execution Schedule',
          order: 1,
          fields: ['schedule'],
        },
      ],
    },
    {
      name: 'Recipients',
      order: 3,
      sections: [
        {
          name: 'Email Recipients',
          order: 1,
          fields: ['recipients'],
        },
      ],
    },
    {
      name: 'Configuration',
      order: 4,
      sections: [
        {
          name: 'Type-Specific Settings',
          order: 1,
          fields: ['config'],
        },
      ],
    },
  ],
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: ReportForm renders with BaseForm

*For any* Report entity, ReportForm should render using BaseForm component with the schema name "report" and pass the report entity to BaseForm.

**Validates: Requirements 2.1, 2.2**

### Property 2: Custom field renderers are called for recipients and schedule

*For any* ReportForm render, the renderCustomField callback should be called for the "recipients" and "schedule" fields, and should return a React component (not null).

**Validates: Requirements 3.1, 4.1**

### Property 3: Recipients field validates email format

*For any* email string entered in the recipients field, if the email format is invalid, the field should display an error and not add the recipient to the list.

**Validates: Requirements 3.4, 6.4**

### Property 4: Recipients field prevents duplicates

*For any* email already in the recipients list, attempting to add it again should display an error and not add a duplicate.

**Validates: Requirements 3.5, 6.5**

### Property 5: Schedule field displays cron presets

*For any* ScheduleField render, the component should display a dropdown with all cron presets and a text input for custom expressions.

**Validates: Requirements 4.1, 4.2**

### Property 6: ReportList uses BaseList for rendering

*For any* ReportList render, the component should use BaseList component and pass all required props (data, columns, filters, etc.).

**Validates: Requirements 5.1, 5.2**

### Property 7: Form submission calls onSubmit callback

*For any* valid form submission in ReportForm, the onSubmit callback should be called with the form data (excluding report_id, created_at, updated_at).

**Validates: Requirements 2.3, 6.1, 9.2**

### Property 8: Form maintains all current validation rules

*For any* invalid form data (empty name, invalid email, etc.), the form should display appropriate error messages and prevent submission.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 9: ReportForm integrates with FormContainer

*For any* ReportForm render, the component should be wrapped in FormContainer and use framework styling and layout.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 10: ReportList displays all required columns

*For any* ReportList render, the component should display columns for name, type, schedule, recipients, status, and created date.

**Validates: Requirements 5.2, 5.3**

### Property 11: Form loading state disables all fields

*For any* ReportForm with loading=true, all form fields should be disabled and a loading indicator should be displayed.

**Validates: Requirements 9.4**

### Property 12: Form cancellation calls onCancel callback

*For any* cancel button click in ReportForm, the onCancel callback should be called.

**Validates: Requirements 9.3**

## Error Handling

### Form Validation Errors

- **Empty name**: Display "Report name is required"
- **Name too long**: Display "Report name must not exceed 255 characters"
- **Invalid email**: Display "Invalid email format"
- **Duplicate recipient**: Display "Email already added"
- **Empty recipients**: Display "At least one recipient is required"
- **Invalid cron**: Display "Invalid cron expression format"

### API Errors

- **Create failure**: Display error message from API
- **Update failure**: Display error message from API
- **Delete failure**: Display error message from API

### Graceful Degradation

- If schema fails to load, display error message
- If API call fails, display error message and allow retry
- If custom field renderer fails, fall back to default field rendering

## Testing Strategy

### Unit Tests

Unit tests validate specific examples and edge cases:

1. **ReportForm renders with BaseForm**
   - Verify BaseForm is rendered with correct props
   - Verify schema name is "report"
   - Verify entity is passed correctly

2. **Custom field renderers**
   - Verify recipients field renders with add/remove UI
   - Verify schedule field renders with presets and text input
   - Verify custom renderers are called for correct fields

3. **Recipients field validation**
   - Verify email format validation works
   - Verify duplicate prevention works
   - Verify error messages display correctly

4. **Schedule field**
   - Verify cron presets are displayed
   - Verify custom cron expressions can be entered
   - Verify help text is displayed

5. **ReportList rendering**
   - Verify BaseList is rendered with correct props
   - Verify all columns are displayed
   - Verify filters are available

6. **Form submission**
   - Verify onSubmit callback is called with correct data
   - Verify form data excludes report_id, created_at, updated_at
   - Verify loading state is handled correctly

7. **Form cancellation**
   - Verify onCancel callback is called
   - Verify form is cleared after submission

8. **Error handling**
   - Verify validation errors are displayed
   - Verify API errors are displayed
   - Verify form can be retried after error

### Property-Based Tests

Property-based tests validate universal properties across many generated inputs:

1. **Property 1: ReportForm renders with BaseForm**
   - Generate random Report entities
   - Render ReportForm with each entity
   - Verify BaseForm is rendered with correct props

2. **Property 2: Custom field renderers are called**
   - Generate random Report entities
   - Render ReportForm with each entity
   - Verify renderCustomField is called for recipients and schedule

3. **Property 3: Recipients field validates email format**
   - Generate random email strings (valid and invalid)
   - Attempt to add each email
   - Verify validation works correctly

4. **Property 4: Recipients field prevents duplicates**
   - Generate random email lists
   - Attempt to add duplicate emails
   - Verify duplicates are prevented

5. **Property 5: Schedule field displays cron presets**
   - Render ScheduleField multiple times
   - Verify presets are always displayed
   - Verify text input is always available

6. **Property 6: ReportList uses BaseList**
   - Generate random Report lists
   - Render ReportList with each list
   - Verify BaseList is rendered with correct props

7. **Property 7: Form submission calls onSubmit**
   - Generate random valid Report data
   - Submit form with each data set
   - Verify onSubmit is called with correct data

8. **Property 8: Form maintains validation rules**
   - Generate random invalid form data
   - Attempt to submit each data set
   - Verify validation errors are displayed

9. **Property 9: ReportForm integrates with FormContainer**
   - Render ReportForm multiple times
   - Verify FormContainer is rendered
   - Verify framework styling is applied

10. **Property 10: ReportList displays all columns**
    - Generate random Report lists
    - Render ReportList with each list
    - Verify all required columns are displayed

11. **Property 11: Form loading state disables fields**
    - Render ReportForm with loading=true
    - Verify all fields are disabled
    - Verify loading indicator is displayed

12. **Property 12: Form cancellation calls onCancel**
    - Render ReportForm multiple times
    - Click cancel button
    - Verify onCancel is called

### Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with: `Feature: reports-framework-refactor, Property N: [property title]`
- Unit tests focus on specific examples and edge cases
- Property tests focus on universal correctness across all inputs
- Both test types are complementary and necessary for comprehensive coverage

## Implementation Notes

### Backward Compatibility

- ReportForm maintains the same props interface (report, onSubmit, onCancel, loading)
- ReportList maintains the same props interface (onReportSelect, onReportEdit, onReportCreate)
- All current functionality is preserved through custom field rendering
- No breaking changes to the API or component interfaces

### Performance Considerations

- BaseForm handles memoization of form fields
- Custom field renderers are only called for recipients and schedule fields
- ReportList uses BaseList's built-in pagination and filtering
- No additional API calls or database queries

### Future Enhancements

- Support for conditional fields based on report type
- Support for report templates
- Support for report scheduling UI
- Support for report preview before sending
- Integration with email service for testing

</content>
</invoke>