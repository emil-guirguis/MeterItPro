# Meter Readings Debug Breakpoints

## Overview
Added comprehensive console logging throughout the meter readings flow to help debug the issue where data is not displaying in the grid.

## Debug Flow (Click → Display)

### 1. FavoritesSection Click Handler
**File**: `MeterItPro/frontend/src/components/sidebar-meters/FavoritesSection.tsx`

```
[FavoritesSection] ===== FAVORITE CLICKED =====
[FavoritesSection] meterId: <value> type: <type>
[FavoritesSection] elementId: <value> type: <type>
[FavoritesSection] Calling onItemClick with: <meterId> <elementId>
[FavoritesSection] ===== FAVORITE CLICK COMPLETE =====
```

**What to check**: 
- Are meterId and elementId being passed correctly?
- Are they strings or numbers?

---

### 2. SidebarMetersSection Handler
**File**: `MeterItPro/frontend/src/components/sidebar-meters/SidebarMetersSection.tsx`

```
[SidebarMetersSection] ===== FAVORITE ITEM CLICK HANDLER =====
[SidebarMetersSection] meterId: <value> type: <type>
[SidebarMetersSection] elementId: <value> type: <type>
[SidebarMetersSection] Setting selected item and calling onMeterElementSelect
[SidebarMetersSection] ===== FAVORITE ITEM CLICK COMPLETE =====
```

**What to check**:
- Are the values being received correctly from FavoritesSection?
- Is onMeterElementSelect being called?

---

### 3. AppLayoutWrapper Navigation
**File**: `MeterItPro/frontend/src/components/layout/AppLayoutWrapper.tsx`

```
[AppLayoutWrapper] ===== METER ELEMENT SELECT =====
[AppLayoutWrapper] Meter element selected: <meterId> <elementId>
[AppLayoutWrapper] meterId type: <type> elementId type: <type>
[AppLayoutWrapper] Setting selectedMeter and selectedElement in context
[AppLayoutWrapper] Context updated
[AppLayoutWrapper] Navigating to /meter-readings?meterId=<meterId>&elementId=<elementId>
[AppLayoutWrapper] ===== METER ELEMENT SELECT COMPLETE =====
```

**What to check**:
- Is the navigation URL correct?
- Are the query parameters being set properly?

---

### 4. MeterReadingManagementPage URL Parsing
**File**: `MeterItPro/frontend/src/features/meterReadings/MeterReadingManagementPage.tsx`

```
[MeterReadingManagementPage] RENDERING
[MeterReadingManagementPage] URL params - meterId: <value> elementId: <value>
[MeterReadingManagementPage] auth.user?.client: <tenantId>
[MeterReadingManagementPage] ===== EFFECT TRIGGERED =====
[MeterReadingManagementPage] meterId: <value> elementId: <value> tenantId: <value>
[MeterReadingManagementPage] meterId type: <type> elementId type: <type>
[MeterReadingManagementPage] Conditions met, setting context and fetching
[MeterReadingManagementPage] Calling fetchItems with: {tenantId, meterId, meterElementId}
[MeterReadingManagementPage] ===== EFFECT COMPLETE =====
```

**What to check**:
- Are URL params being parsed correctly?
- Is the effect being triggered?
- Are the conditions being met?

---

### 5. MeterReadingsStore Fetch
**File**: `MeterItPro/frontend/src/features/meterReadings/meterReadingsStore.ts`

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
[MeterReadingsStore] First item keys: [meter_reading_id, meter_id, meter_element_id, ...]
[MeterReadingsStore] ===== END RESPONSE DATA =====
```

**What to check**:
- Is the query string being built correctly?
- Is the API URL correct?
- Is the response status 200?
- Are items being returned?
- Do the items have the correct field names (snake_case)?

---

## Backend Query Verification
**File**: `client/backend/src/routes/meterReadings.js`

The backend logs the SQL query being executed:

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

**What to check**:
- Is the SQL query using proper PostgreSQL parameter syntax ($1, $2, etc.)?
- Are the parameters being passed correctly?
- Is the query returning rows?
- Do the rows have all the expected fields?

---

## How to Use These Breakpoints

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Click on a favorite meter element**
4. **Watch the console output** - it will show the complete flow from click to data fetch
5. **Look for any errors or unexpected values**

## Expected Flow

```
[FavoritesSection] ===== FAVORITE CLICKED =====
  ↓
[SidebarMetersSection] ===== FAVORITE ITEM CLICK HANDLER =====
  ↓
[AppLayoutWrapper] ===== METER ELEMENT SELECT =====
  ↓
[MeterReadingManagementPage] ===== EFFECT TRIGGERED =====
  ↓
[MeterReadingsStore] ===== FETCH ITEMS CALLED =====
  ↓
[MeterReadingsStore] ===== QUERY STRING =====
  ↓
[MeterReadingsStore] Response status: 200
  ↓
[MeterReadingsStore] ===== RESPONSE DATA =====
  ↓
Grid displays data
```

## Fixes Applied

1. **Fixed FavoritesSection type error**: Removed the `gridType` parameter from `onItemClick` calls (was passing 3 params, function only accepts 2)
2. **Removed double-click handler**: Simplified to single-click only for now
3. **Added comprehensive logging**: Every step of the flow now logs detailed information

## Next Steps

1. Click on a favorite meter element
2. Check the console output
3. Identify where the flow breaks or where data is incorrect
4. Report the specific console logs that show the issue
