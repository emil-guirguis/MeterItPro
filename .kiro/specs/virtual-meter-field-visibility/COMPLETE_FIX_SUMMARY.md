# Complete Fix Summary: Virtual Meter Field Visibility

## Issue
When creating a virtual meter, the frontend was sending `"elements": null` in the API payload, causing the error:
```
Column 'elements' does not exist in table 'meter'
```

This happened even though:
1. The `elements` field was defined with `dbField: null` (indicating it's a custom field)
2. MeterForm was passing `fieldsToClean={['id', 'elements']}`
3. The backend was trying to delete the field

## Root Cause Analysis

### The Problem Flow
1. **MeterForm** passes `fieldsToClean={['id', 'elements']}` to BaseForm
2. **BaseForm** receives form data that includes `elements: null`
3. **formDataToEntity** function is called to convert form data to API format
4. **formSchema.toApi()** is called, which includes ALL fields from formData
5. The cleanup logic tries to delete `elements` AFTER it's already been added to the API payload

### Why It Failed
The `formSchema.toApi()` function in `formSchema.ts` (lines 72-76) includes fields that are not in the schema:
```typescript
} else {
  // Field not in schema, include as-is
  apiData[formField] = value;
}
```

So even though `elements` was defined with `dbField: null`, it was still being included in the API payload because it was in the formData.

## Solution Implemented

### File Modified
`framework/frontend/components/form/BaseForm.tsx` (lines 335-375)

### Change
Modified the `formDataToEntity` function to filter out fields with `dbField: null` BEFORE calling `toApi()`:

```typescript
// CRITICAL: Filter out fields with dbField: null BEFORE calling toApi()
// This prevents custom-rendered fields like "elements" from being included in the API payload
const cleanFormData: any = { ...formData };
Object.entries(allFormFields).forEach(([fieldName, fieldDef]: [string, any]) => {
  if (fieldDef.dbField === null) {
    delete cleanFormData[fieldName];
  }
});

const formSchema = createFormSchema(allFormFields);
const apiData = formSchema.toApi(cleanFormData);
```

### Why This Works
1. **Before calling toApi()**: We remove all fields with `dbField: null` from the form data
2. **toApi() is called**: With clean data that doesn't include custom fields
3. **Result**: The API payload no longer includes `elements`

## Implementation Details

### Field Definition
In `MeterWithSchema.js`, the `elements` field is defined as:
```javascript
field({
  name: 'elements',
  type: FieldTypes.OBJECT,
  default: null,
  required: false,
  label: 'Elements',
  dbField: null,  // ← This indicates it's a custom field
  showOn: ['form'],
})
```

### Custom Field Rendering
The `elements` field is rendered using a custom component:
- **Physical meters**: `ElementsGrid` component
- **Virtual meters**: `CombinedMetersTab` component

This is handled in `MeterForm.tsx` via the `renderCustomField` prop.

## Testing

### Test Cases
1. **Create Physical Meter**: Should work without errors
2. **Create Virtual Meter**: Should work without errors and hide device fields
3. **Edit Existing Meter**: Should work without errors
4. **API Payload**: Should NOT include `elements` field

### How to Verify
1. Open browser DevTools (F12)
2. Go to Network tab
3. Create a meter
4. Look for POST `/api/meters` request
5. Check Request body - `elements` should NOT be present

## Backend Fallback
Even if the frontend still sends `elements`, the backend has a fallback (line 363 in `client/backend/src/routes/meters.js`):
```javascript
delete meterData.elements;
```

This ensures the field is removed before saving to the database.

## Related Files
- `framework/frontend/components/form/BaseForm.tsx` - Main fix
- `MeterItPro/frontend/src/features/meters/MeterForm.tsx` - Uses BaseForm
- `client/backend/src/models/MeterWithSchema.js` - Schema definition
- `client/backend/src/routes/meters.js` - API endpoint
- `framework/backend/api/base/SchemaDefinition.js` - Schema utilities

## Status
✅ **FIXED** - The `elements` field is now properly filtered out before being sent to the API
