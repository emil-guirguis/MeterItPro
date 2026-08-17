# Next Steps: Virtual Meter Field Visibility

## What Was Fixed

The `ConvertedSchema` interface in `schemaLoader.ts` was updated to include `visibleFor` properties for tabs, sections, and fields. This allows the `visibleFor` properties from the backend schema to be properly preserved and used by the filtering logic.

## What You Need to Do

### Step 1: Rebuild Frontend

**Option A: Using npm dev server**
```bash
cd MeterItPro/frontend
npm run dev
```

**Option B: Using npm build**
```bash
cd MeterItPro/frontend
npm run build
```

Wait for the build to complete.

### Step 2: Clear Browser Cache

**Option A: Hard Refresh**
- Windows: `Ctrl+Shift+R`
- Mac: `Cmd+Shift+R`

**Option B: Clear Cache in DevTools**
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Cache Storage"
4. Delete all caches
5. Refresh the page

### Step 3: Test Virtual Meter

1. Navigate to **Meters** page
2. Click **Add Meter**
3. Select **Virtual Meter**
4. **Verify these fields are NOT visible:**
   - Serial Number
   - Device
   - Network section (IP Address, Port)
5. **Verify these fields ARE visible:**
   - Name
   - Location
   - Active
   - Installation Date
   - Notes

### Step 4: Test Physical Meter

1. Click **Add Meter** again
2. Select **Physical Meter**
3. **Verify all device-related fields ARE visible:**
   - Serial Number
   - Device
   - Network section (IP Address, Port)

### Step 5: Check Console Logs

1. Open DevTools (F12)
2. Go to **Console** tab
3. Create a new virtual meter
4. Look for logs starting with `[useFormTabs]`
5. Verify you see filtering logs like:
   ```
   [useFormTabs] ❌ Filtering out field: serial_number
   [useFormTabs] ❌ Filtering out section: Network
   ```

## Files Changed

### Modified Files:
1. `framework/frontend/components/form/utils/schemaLoader.ts` - Updated `ConvertedSchema` interface

### Already Updated Files (from previous implementation):
1. `client/backend/src/models/MeterWithSchema.js` - Added `visibleFor` properties
2. `framework/frontend/components/form/hooks/useFormTabs.ts` - Added filtering logic with debug logs

## Troubleshooting

### Changes Still Not Visible

**Step 1: Verify Frontend is Rebuilt**
- Check that the build completed successfully
- Look for any build errors in the terminal

**Step 2: Verify Browser Cache is Cleared**
- Do a hard refresh (Ctrl+Shift+R)
- Or clear cache in DevTools

**Step 3: Check Console for Errors**
- Open DevTools (F12)
- Go to Console tab
- Look for any JavaScript errors
- Look for `[useFormTabs]` logs

**Step 4: Verify Schema is Correct**
- Open DevTools (F12)
- Go to Network tab
- Create a new virtual meter
- Look for request to `/api/schema/meter`
- Check the response includes `visibleFor` properties

### Build Fails

**Solution:**
1. Check for TypeScript errors
2. Verify all files were saved correctly
3. Try deleting `node_modules` and reinstalling:
   ```bash
   cd MeterItPro/frontend
   rm -rf node_modules
   npm install
   npm run dev
   ```

## Expected Behavior

### Virtual Meter Form
- ✅ Name field visible
- ✅ Location field visible
- ✅ Active checkbox visible
- ✅ Installation Date field visible
- ✅ Notes field visible
- ✅ Combined Meters tab visible
- ❌ Serial Number field hidden
- ❌ Device field hidden
- ❌ Network section hidden
- ❌ Elements tab hidden

### Physical Meter Form
- ✅ All fields visible
- ✅ Elements tab visible
- ✅ Serial Number field visible
- ✅ Device field visible
- ✅ Network section visible
- ❌ Combined Meters tab hidden

## Verification Checklist

- [ ] Frontend has been rebuilt
- [ ] Browser cache has been cleared
- [ ] Hard refresh has been done
- [ ] Virtual meter form hides device fields
- [ ] Physical meter form shows device fields
- [ ] Console shows `[useFormTabs]` logs
- [ ] Console shows filtering logs for device fields
- [ ] No console errors

## Support

If you continue to have issues:

1. Check the DEBUG_GUIDE.md for detailed debugging steps
2. Verify all files have been updated correctly
3. Check console logs for error messages
4. Try a complete restart of both frontend and backend

## Summary

The fix is complete. You just need to:
1. Rebuild the frontend
2. Clear browser cache
3. Test the virtual meter form

The device-related fields should now be hidden for virtual meters.
