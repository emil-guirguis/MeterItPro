# Virtual Meter Field Visibility - Quick Start Guide

## ⚠️ Important: Backend Restart Required

The schema changes have been made to the backend, but **you must restart the backend server** for the changes to take effect.

## Steps to See the Changes

### 1. Stop the Backend Server
If your backend is running, stop it:
- Windows: Press `Ctrl+C` in the terminal where the backend is running
- Or use: `npm stop` in the `client/backend` directory

### 2. Restart the Backend Server
```bash
cd client/backend
npm start
```

Or use the provided script:
```bash
./start-dev.bat
```

### 3. Clear Browser Cache
- Open your browser's Developer Tools (F12)
- Go to Application > Cache Storage
- Clear all caches
- Or simply do a hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### 4. Test the Changes

#### Test Virtual Meter:
1. Navigate to **Meters** page
2. Click **Add Meter**
3. Select **Virtual Meter**
4. Verify the following fields are **NOT visible**:
   - Serial Number
   - Device
   - Network section (IP Address, Port)
5. Verify the following fields **ARE visible**:
   - Name
   - Location
   - Active (checkbox)
   - Installation Date
   - Notes

#### Test Physical Meter:
1. Click **Add Meter** again
2. Select **Physical Meter**
3. Verify the following fields **ARE visible**:
   - Serial Number
   - Device
   - Network section (IP Address, Port)
   - Name
   - Location
   - Active (checkbox)
   - Installation Date
   - Notes

## What Changed

### Backend (MeterWithSchema.js)
- Added `visibleFor: ['physical']` to Serial Number field
- Added `visibleFor: ['physical']` to Device field
- Added `visibleFor: ['physical']` to Network section

### Frontend (useFormTabs.ts)
- Enhanced to filter sections based on `visibleFor` property
- Enhanced to filter fields based on `visibleFor` property
- Respects the meter type passed from MeterForm

## Troubleshooting

### Changes Still Not Visible

**Problem:** After restarting the backend, the fields are still visible for virtual meters.

**Solution:**
1. Check browser console (F12) for errors
2. Verify the backend is running on the correct port
3. Clear browser cache completely
4. Try a different browser
5. Check that the schema is being loaded correctly by looking at network requests in DevTools

### Backend Won't Start

**Problem:** Backend fails to start after changes.

**Solution:**
1. Check for syntax errors in MeterWithSchema.js
2. Verify all parentheses and brackets are balanced
3. Check the backend logs for error messages
4. Try reverting changes and restarting to confirm backend works

### Schema Not Updating

**Problem:** The schema changes are not being picked up by the frontend.

**Solution:**
1. The frontend clears the schema cache automatically
2. If it's still not working, manually clear the browser cache
3. Check that the backend is serving the updated schema by inspecting network requests
4. Verify the `visibleFor` property is in the schema response

## Verification Checklist

- [ ] Backend server has been restarted
- [ ] Browser cache has been cleared
- [ ] Virtual meter form hides device fields
- [ ] Physical meter form shows device fields
- [ ] No console errors
- [ ] Form submission works correctly

## Next Steps

Once you've verified the changes are working:

1. Test editing existing virtual meters
2. Test editing existing physical meters
3. Test form submission with hidden fields
4. Run the test suite (if available)
5. Deploy to production

## Support

If you continue to see no changes:

1. Check the browser console for JavaScript errors
2. Check the backend logs for errors
3. Verify the MeterWithSchema.js file has the `visibleFor` properties
4. Verify the useFormTabs.ts file has the filtering logic
5. Try a complete restart of both frontend and backend

## Files Modified

- `client/backend/src/models/MeterWithSchema.js` - Added `visibleFor` properties
- `framework/frontend/components/form/hooks/useFormTabs.ts` - Added filtering logic

## Files Not Modified

- `framework/frontend/components/form/BaseForm.tsx` - Already supports `meterType` prop
- `MeterItPro/frontend/src/features/meters/MeterForm.tsx` - Already passes `meterType`
