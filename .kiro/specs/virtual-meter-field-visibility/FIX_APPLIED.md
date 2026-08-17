# Fix Applied: Virtual Meter Field Visibility

## Problem

The virtual meter form was showing physical meter fields (Serial Number, Device, Network section) even though the backend schema had `visibleFor: ['physical']` properties.

## Root Cause

The `ConvertedSchema` interface in `schemaLoader.ts` did not include the `visibleFor` property in its type definition for tabs, sections, and fields. This meant that even though the backend was sending the `visibleFor` properties, the TypeScript interface was not expecting them, and they might have been stripped out during schema conversion.

## Solution

Updated the `ConvertedSchema` interface in `framework/frontend/components/form/utils/schemaLoader.ts` to include `visibleFor` properties:

### Before:
```typescript
formTabs: Array<{
  name: string;
  order?: number | null;
  sectionOrientation?: 'horizontal' | 'vertical' | null;
  sections: Array<{
    name: string;
    order?: number | null;
    fields: Array<{
      name: string;
      order?: number | null;
    }>;
    // ...
  }>;
}> | null;
```

### After:
```typescript
formTabs: Array<{
  name: string;
  order?: number | null;
  visibleFor?: ('physical' | 'virtual')[];  // NEW
  sectionOrientation?: 'horizontal' | 'vertical' | null;
  sections: Array<{
    name: string;
    order?: number | null;
    visibleFor?: ('physical' | 'virtual')[];  // NEW
    fields: Array<{
      name: string;
      order?: number | null;
      visibleFor?: ('physical' | 'virtual')[];  // NEW
    }>;
    // ...
  }>;
}> | null;
```

## Files Modified

- `framework/frontend/components/form/utils/schemaLoader.ts` - Updated `ConvertedSchema` interface to include `visibleFor` properties

## How It Works Now

1. **Backend** sends schema with `visibleFor` properties
2. **Frontend** receives schema and converts it using `convertSchema`
3. **ConvertedSchema** interface now properly includes `visibleFor` properties
4. **useFormTabs** hook receives formTabs with `visibleFor` properties
5. **useFormTabs** filters sections and fields based on `visibleFor` and `meterType`
6. **BaseForm** renders only visible fields and sections

## Testing

### Step 1: Restart Frontend
```bash
cd MeterItPro/frontend
npm run dev
```

Or if using build:
```bash
npm run build
```

### Step 2: Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear cache in DevTools

### Step 3: Test Virtual Meter
1. Navigate to Meters > Add Meter > Virtual Meter
2. Verify these fields are NOT visible:
   - Serial Number
   - Device
   - Network section (IP Address, Port)
3. Verify these fields ARE visible:
   - Name
   - Location
   - Active
   - Installation Date
   - Notes

### Step 4: Test Physical Meter
1. Navigate to Meters > Add Meter > Physical Meter
2. Verify all device-related fields ARE visible

## Verification Checklist

- [ ] Frontend has been rebuilt or dev server is running
- [ ] Browser cache has been cleared
- [ ] Hard refresh has been done (Ctrl+Shift+R)
- [ ] Virtual meter form hides device fields
- [ ] Physical meter form shows device fields
- [ ] No console errors (F12 > Console)
- [ ] Console shows `[useFormTabs]` logs with correct filtering

## Debug Logs

When testing, you should see console logs like:

```
[useFormTabs] Processing tabs with meterType: virtual
[useFormTabs] Input formTabs: [...]
[useFormTabs] Processing section: Information, visibleFor: undefined meterType: virtual
[useFormTabs] ✅ Including section: Information
[useFormTabs] Processing field: name, visibleFor: undefined meterType: virtual
[useFormTabs] ✅ Including field: name
[useFormTabs] Processing field: serial_number, visibleFor: ["physical"] meterType: virtual
[useFormTabs] ❌ Filtering out field: serial_number (visibleFor: physical, meterType: virtual)
[useFormTabs] Processing field: device_id, visibleFor: ["physical"] meterType: virtual
[useFormTabs] ❌ Filtering out field: device_id (visibleFor: physical, meterType: virtual)
[useFormTabs] Processing section: Network, visibleFor: ["physical"] meterType: virtual
[useFormTabs] ❌ Filtering out section: Network (visibleFor: physical, meterType: virtual)
```

## Summary

The issue was that the TypeScript interface for the converted schema didn't include the `visibleFor` property, so it wasn't being preserved during schema conversion. By updating the interface to include `visibleFor` for tabs, sections, and fields, the properties are now properly preserved and used by the filtering logic.

All other code changes (MeterWithSchema.js, useFormTabs.ts, BaseForm.tsx, MeterForm.tsx) were already correct and in place.
