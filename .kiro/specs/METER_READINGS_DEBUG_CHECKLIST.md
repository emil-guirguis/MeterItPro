# Meter Readings Debug Checklist

## Pre-Debug Checklist

- [ ] Backend is running (`npm start` in `client/backend`)
- [ ] Frontend is running (`npm run dev` in `MeterItPro/frontend`)
- [ ] Browser DevTools is open (F12)
- [ ] Console tab is active
- [ ] At least one favorite meter element exists in the sidebar

## Debug Steps

### Step 1: Click Favorite
- [ ] Click on a favorite meter element in the sidebar
- [ ] Watch the console for logs

### Step 2: Check FavoritesSection Logs
```
[FavoritesSection] ===== FAVORITE CLICKED =====
[FavoritesSection] meterId: <value> type: <type>
[FavoritesSection] elementId: <value> type: <type>
[FavoritesSection] Calling onItemClick with: <meterId> <elementId>
[FavoritesSection] ===== FAVORITE CLICK COMPLETE =====
```
- [ ] Do you see these logs?
- [ ] Are meterId and elementId correct?
- [ ] Are they numbers or strings?

**If NO logs**: Click handler not being called
- [ ] Check if favorite item is clickable
- [ ] Check if FavoritesSection is rendering

**If YES, continue to Step 3**

### Step 3: Check SidebarMetersSection Logs
```
[SidebarMetersSection] ===== FAVORITE ITEM CLICK HANDLER =====
[SidebarMetersSection] meterId: <value> type: <type>
[SidebarMetersSection] elementId: <value> type: <type>
[SidebarMetersSection] Setting selected item and calling onMeterElementSelect
[SidebarMetersSection] ===== FAVORITE ITEM CLICK COMPLETE =====
```
- [ ] Do you see these logs?
- [ ] Are values the same as FavoritesSection?

**If NO logs**: onItemClick callback not being called
- [ ] Check FavoritesSection props
- [ ] Check if onItemClick is defined

**If YES, continue to Step 4**

### Step 4: Check AppLayoutWrapper Logs
```
[AppLayoutWrapper] ===== METER ELEMENT SELECT =====
[AppLayoutWrapper] Meter element selected: <meterId> <elementId>
[AppLayoutWrapper] meterId type: <type> elementId type: <type>
[AppLayoutWrapper] Setting selectedMeter and selectedElement in context
[AppLayoutWrapper] Context updated
[AppLayoutWrapper] Navigating to /meter-readings?meterId=<meterId>&elementId=<elementId>
[AppLayoutWrapper] ===== METER ELEMENT SELECT COMPLETE =====
```
- [ ] Do you see these logs?
- [ ] Is the navigation URL correct?
- [ ] Did the page navigate to /meter-readings?

**If NO logs**: onMeterElementSelect callback not being called
- [ ] Check SidebarMetersSection props
- [ ] Check if onMeterElementSelect is defined

**If YES, continue to Step 5**

### Step 5: Check MeterReadingManagementPage Logs
```
[MeterReadingManagementPage] ===== EFFECT TRIGGERED =====
[MeterReadingManagementPage] meterId: <value> elementId: <value> tenantId: <value>
[MeterReadingManagementPage] meterId type: <type> elementId type: <type>
[MeterReadingManagementPage] Conditions met, setting context and fetching
[MeterReadingManagementPage] Calling fetchItems with: {tenantId, meterId, meterElementId}
[MeterReadingManagementPage] ===== EFFECT COMPLETE =====
```
- [ ] Do you see these logs?
- [ ] Are URL params being parsed correctly?
- [ ] Is tenantId present?

**If NO logs**: useEffect not being triggered
- [ ] Check if URL params are correct
- [ ] Check if component is rendering

**If YES, continue to Step 6**

### Step 6: Check meterReadingsStore Logs
```
[MeterReadingsStore] ===== FETCH ITEMS CALLED =====
[MeterReadingsStore] params: {tenantId, meterId, meterElementId}
[MeterReadingsStore] params.meterId: <value> type: <type>
[MeterReadingsStore] params.meterElementId: <value> type: <type>
[MeterReadingsStore] ===== QUERY STRING =====
[MeterReadingsStore] Query string: tenantId=<id>&meterId=<id>&meterElementId=<id>
[MeterReadingsStore] Full URL: http://localhost:3001/api/meterreadings?tenantId=<id>&meterId=<id>&meterElementId=<id>
[MeterReadingsStore] ===== END QUERY STRING =====
[MeterReadingsStore] Response status: 200
[MeterReadingsStore] ===== RESPONSE DATA =====
[MeterReadingsStore] Response: {success: true, data: {items: [...], total, page, pageSize, totalPages, hasMore}}
[MeterReadingsStore] Fetched <count> readings
[MeterReadingsStore] First item: {meter_reading_id, meter_id, meter_element_id, ...}
[MeterReadingsStore] First item keys: [meter_reading_id, meter_element_id, ...]
[MeterReadingsStore] ===== END RESPONSE DATA =====
```
- [ ] Do you see these logs?
- [ ] Is the query string correct?
- [ ] Is the API URL correct?
- [ ] Is response status 200?
- [ ] Are items being returned?

**If NO logs**: fetchItems not being called
- [ ] Check MeterReadingManagementPage effect
- [ ] Check if store.fetchItems is defined

**If response status is NOT 200**: Backend error
- [ ] Check backend terminal for error logs
- [ ] Check if API endpoint is correct

**If items are empty**: Backend query returning no rows
- [ ] Check backend logs
- [ ] Check if data exists in database
- [ ] Check if query parameters are correct

**If YES and items are returned, continue to Step 7**

### Step 7: Check Grid Display
- [ ] Does the page show the meter readings grid?
- [ ] Are the readings displayed correctly?
- [ ] Are all columns visible?

**If NO grid**: Issue is in SimpleMeterReadingGrid component
- [ ] Check if data is being passed to grid
- [ ] Check if grid is rendering

**If YES**: Issue is resolved! ✅

## Backend Verification

In the backend terminal, you should see:

```
[MeterReadings] Request: {tenantId, meterId, meterElementId, page, pageSize}
[MeterReadings] ===== EXECUTING QUERY =====
[MeterReadings] SQL: SELECT * FROM meter_reading WHERE tenant_id = $1 AND meter_id = $2 AND meter_element_id = $3 ORDER BY created_at DESC LIMIT $4 OFFSET $5
[MeterReadings] Params: [<tenantId>, <meterId>, <meterElementId>, <pageSize>, <skip>]
[MeterReadings] ===== QUERY RESULT =====
[MeterReadings] Returned: <count> rows
[MeterReadings] First row keys: [meter_reading_id, meter_id, meter_element_id, ...]
[MeterReadings] First row: {meter_reading_id, meter_id, meter_element_id, ...}
[MeterReadings] ===== END QUERY RESULT =====
```

- [ ] Do you see these logs?
- [ ] Is the SQL query correct?
- [ ] Are the parameters correct?
- [ ] Are rows being returned?

## Summary

After completing all steps, you should know:
1. ✅ Where the flow breaks (if it does)
2. ✅ What data is being passed at each step
3. ✅ Whether the backend is returning data
4. ✅ Whether the frontend is displaying data

## Report Template

When reporting the issue, please include:

```
Step where flow breaks: [e.g., "Step 3 - SidebarMetersSection"]

Console logs:
[Paste relevant console logs here]

Backend logs:
[Paste relevant backend logs here]

Expected behavior:
[What should happen]

Actual behavior:
[What actually happens]

Screenshots:
[If applicable]
```

## Need Help?

If you get stuck at any step:
1. Note which step you're stuck at
2. Copy the console logs
3. Copy the backend logs
4. Share them with me
5. We'll identify and fix the issue
