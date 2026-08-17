# Debug Guide: Virtual Meter Field Visibility

## Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Create a new virtual meter
4. Look for logs starting with `[useFormTabs]`

You should see something like:
```
[useFormTabs] Processing tabs with meterType: virtual
[useFormTabs] Input formTabs: [...]
[useFormTabs] Processing section: Information, visibleFor: undefined meterType: virtual
[useFormTabs] ✅ Including section: Information
[useFormTabs] Processing field: name, visibleFor: undefined meterType: virtual
[useFormTabs] ✅ Including field: name
[useFormTabs] Processing field: serial_number, visibleFor: ["physical"] meterType: virtual
[useFormTabs] ❌ Filtering out field: serial_number (visibleFor: physical, meterType: virtual)
```

## Step 2: Check Network Request

1. Open DevTools (F12)
2. Go to **Network** tab
3. Create a new virtual meter
4. Look for a request to `/api/schema/meter`
5. Click on it and check the **Response** tab
6. Search for `"visibleFor"` in the JSON

You should see:
```json
{
  "name": "serial_number",
  "visibleFor": ["physical"],
  ...
}
```

## Step 3: Verify Frontend is Rebuilt

The frontend needs to be rebuilt for the debug logging to appear.

**If using npm:**
```bash
cd MeterItPro/frontend
npm run build
```

**Or if using dev server:**
```bash
cd MeterItPro/frontend
npm run dev
```

Wait for the build to complete, then refresh the browser.

## Step 4: Check if visibleFor is in Schema

If you don't see `visibleFor` in the schema response:

1. The backend schema might not have been restarted
2. Or the MeterWithSchema.js changes weren't saved

**Solution:**
1. Stop the backend server
2. Verify MeterWithSchema.js has `visibleFor: ['physical']` properties
3. Restart the backend
4. Check the schema endpoint again

## Step 5: Verify meterType is Being Passed

Look for logs like:
```
[useFormTabs] Processing tabs with meterType: virtual
```

If you see `meterType: null` or `meterType: undefined`, then:
1. MeterForm is not passing meterType correctly
2. Or MetersPage is not passing selectedMeterType to MeterForm

**Check MetersPage.tsx:**
```tsx
<MeterForm
  meter={selectedMeter || undefined}
  meterType={selectedMeterType}  // Should be 'virtual'
  onSubmit={handleFormSubmit}
  onCancel={handleFormCancel}
/>
```

## Troubleshooting Checklist

- [ ] Backend has been restarted
- [ ] Frontend has been rebuilt or dev server is running
- [ ] Browser cache has been cleared
- [ ] Hard refresh has been done (Ctrl+Shift+R)
- [ ] Console shows `[useFormTabs]` logs
- [ ] Console shows `meterType: virtual`
- [ ] Console shows `visibleFor: ["physical"]` for device fields
- [ ] Console shows `❌ Filtering out field` for device fields
- [ ] Network request to `/api/schema/meter` includes `visibleFor`

## If visibleFor is NOT in Schema Response

**Problem:** The schema endpoint is not returning `visibleFor` properties.

**Solution:**
1. Check that MeterWithSchema.js has the `visibleFor` properties
2. Verify the backend is running the updated code
3. Check backend logs for errors
4. Restart the backend server

**Verify MeterWithSchema.js:**
```bash
grep -n "visibleFor" client/backend/src/models/MeterWithSchema.js
```

You should see:
```
107:                  visibleFor: ['physical'],
120:                  visibleFor: ['physical'],
135:              visibleFor: ['physical'],
```

## If meterType is NOT Being Passed

**Problem:** The form shows `meterType: null` or `meterType: undefined`.

**Solution:**
1. Check that MetersPage is passing `selectedMeterType` to MeterForm
2. Verify MeterTypeSelector is setting `selectedMeterType` correctly
3. Check that MeterForm is receiving the prop

**Verify MetersPage.tsx:**
```bash
grep -A 5 "<MeterForm" MeterItPro/frontend/src/pages/MetersPage.tsx
```

You should see:
```tsx
<MeterForm
  meter={selectedMeter || undefined}
  meterType={selectedMeterType}
```

## If Fields are Still Showing

**Problem:** Even with correct `meterType` and `visibleFor`, fields are still visible.

**Possible Causes:**
1. The filtering logic has a bug
2. The fields don't have `visibleFor` property
3. The `visibleFor` value is incorrect

**Debug Steps:**
1. Check console for `❌ Filtering out field` messages
2. If you see them, the filtering is working but fields are still rendering
3. Check if BaseForm is rendering fields that should be filtered
4. Look for custom field rendering logic that might override filtering

## Console Output Examples

### Correct Output (Virtual Meter)
```
[useFormTabs] Processing tabs with meterType: virtual
[useFormTabs] Input formTabs: Array(4)
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

### Incorrect Output (No Filtering)
```
[useFormTabs] Processing tabs with meterType: null
[useFormTabs] Input formTabs: Array(4)
```

If you see `meterType: null`, the issue is that meterType is not being passed.

## Next Steps

1. Check the console output
2. Identify which step is failing
3. Follow the troubleshooting steps for that issue
4. Report back with the console output

## Support

If you're still having issues:

1. Share the console output
2. Share the schema response from `/api/schema/meter`
3. Verify all files have been updated correctly
4. Try a complete restart of both frontend and backend
