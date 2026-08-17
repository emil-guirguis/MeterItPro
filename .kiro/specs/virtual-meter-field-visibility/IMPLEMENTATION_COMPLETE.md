# Virtual Meter Field Visibility - Implementation Complete

## Summary

The virtual meter field visibility feature has been successfully implemented. Device-related fields (Network section, Serial Number, and Device) are now hidden when editing virtual meters.

## Changes Made

### 1. MeterWithSchema.js
**File:** `client/backend/src/models/MeterWithSchema.js`

Added `visibleFor: ['physical']` to:
- Serial Number field (line ~107)
- Device field (line ~120)
- Network section (line ~135)

```javascript
// Serial Number field
field({
  name: 'serial_number',
  // ... other properties
  visibleFor: ['physical'],
})

// Device field
field({
  name: 'device_id',
  // ... other properties
  visibleFor: ['physical'],
})

// Network section
section({
  name: 'Network',
  order: 2,
  visibleFor: ['physical'],  // NEW
  fields: [
    // IP and Port fields
  ],
})
```

### 2. useFormTabs.ts Hook
**File:** `framework/frontend/components/form/hooks/useFormTabs.ts`

Enhanced to filter sections and fields based on `visibleFor` property:

**Updated Interfaces:**
```typescript
export interface FieldRef {
  name: string;
  order?: number | null;
  visibleFor?: ('physical' | 'virtual')[];  // NEW
}

export interface Section {
  name: string;
  order?: number | null;
  visibleFor?: ('physical' | 'virtual')[];  // NEW
  fields: FieldRef[];
  minWidth?: string | null;
  maxWidth?: string | null;
}
```

**Section Filtering Logic:**
```typescript
// Filter sections based on visibleFor property and meterType
if (section.visibleFor && section.visibleFor.length > 0) {
  if (meterType !== null && meterType !== undefined) {
    if (!section.visibleFor.includes(meterType)) {
      return; // Skip this section
    }
  }
}
```

**Field Filtering Logic:**
```typescript
// Filter fields based on visibleFor property and meterType
if (fieldRef.visibleFor && fieldRef.visibleFor.length > 0) {
  if (meterType !== null && meterType !== undefined) {
    if (!fieldRef.visibleFor.includes(meterType)) {
      return; // Skip this field
    }
  }
}
```

### 3. BaseForm.tsx
**File:** `framework/frontend/components/form/BaseForm.tsx`

No changes needed - already supports `meterType` prop and passes it to useFormTabs.

### 4. MeterForm.tsx
**File:** `MeterItPro/frontend/src/features/meters/MeterForm.tsx`

No changes needed - already determines meter type and passes it to BaseForm.

## How It Works

### Virtual Meter Form
When editing a virtual meter:
1. MeterForm determines `meter_type = 'virtual'`
2. MeterForm passes `meterType='virtual'` to BaseForm
3. BaseForm passes `meterType='virtual'` to useFormTabs
4. useFormTabs filters out fields/sections with `visibleFor: ['physical']`
5. Form renders only:
   - Name field
   - Location field
   - Status & Installation section
   - Combined Meters tab

### Physical Meter Form
When editing a physical meter:
1. MeterForm determines `meter_type = 'physical'`
2. MeterForm passes `meterType='physical'` to BaseForm
3. BaseForm passes `meterType='physical'` to useFormTabs
4. useFormTabs includes all fields/sections with `visibleFor: ['physical']`
5. Form renders all fields including:
   - Serial Number field
   - Device field
   - Network section (IP Address, Port)

## Backward Compatibility

- Fields and sections without `visibleFor` are visible for all meter types
- Existing schemas continue to work without modification
- When `meterType` is not provided, all fields and sections are displayed

## Testing

### Manual Testing Steps

1. **Test Virtual Meter:**
   - Navigate to Meters > Add Meter > Virtual Meter
   - Verify Network section is NOT visible
   - Verify Serial Number field is NOT visible
   - Verify Device field is NOT visible
   - Verify Name, Location, and Status fields ARE visible

2. **Test Physical Meter:**
   - Navigate to Meters > Add Meter > Physical Meter
   - Verify Network section IS visible
   - Verify Serial Number field IS visible
   - Verify Device field IS visible
   - Verify all fields in Information section ARE visible

3. **Test Switching:**
   - Edit an existing virtual meter
   - Verify device fields are hidden
   - Edit an existing physical meter
   - Verify device fields are visible

## Files Modified

1. `client/backend/src/models/MeterWithSchema.js` - Added `visibleFor` properties
2. `framework/frontend/components/form/hooks/useFormTabs.ts` - Added filtering logic

## Files Not Modified (Already Support Feature)

1. `framework/frontend/components/form/BaseForm.tsx` - Already has `meterType` prop
2. `MeterItPro/frontend/src/features/meters/MeterForm.tsx` - Already passes `meterType`

## Verification Checklist

- [x] Serial Number field has `visibleFor: ['physical']`
- [x] Device field has `visibleFor: ['physical']`
- [x] Network section has `visibleFor: ['physical']`
- [x] useFormTabs filters sections based on `visibleFor`
- [x] useFormTabs filters fields based on `visibleFor`
- [x] Backward compatibility maintained
- [x] MeterForm passes `meterType` to BaseForm
- [x] BaseForm passes `meterType` to useFormTabs

## Next Steps

1. Start the development server
2. Navigate to Meters page
3. Test adding a virtual meter
4. Verify device fields are hidden
5. Test adding a physical meter
6. Verify device fields are visible

## Notes

- The implementation is complete and ready for testing
- All code changes are in place
- The feature is backward compatible
- No database migrations are required
- No API changes are required
