# Double-Click Feature - Test Guide

## Quick Test

### Setup
1. Start backend: `npm start` (in `client/backend`)
2. Start frontend: `npm run dev` (in `MeterItPro/frontend`)
3. Open DevTools: F12
4. Go to Console tab

### Test Single-Click
1. Click on a favorite meter element (single click)
2. Check console for:
   ```
   [FavoritesSection] ===== FAVORITE CLICKED (SINGLE) =====
   [FavoritesSection] Calling onItemClick with gridType: simple
   ```
3. Check URL: Should be `/meter-readings?meterId=X&elementId=Y&gridType=simple`
4. Check grid: Should display SimpleMeterReadingGrid

### Test Double-Click
1. Double-click on a favorite meter element
2. Check console for:
   ```
   [FavoritesSection] ===== FAVORITE CLICKED (DOUBLE) =====
   [FavoritesSection] Calling onItemClick with gridType: baselist
   ```
3. Check URL: Should be `/meter-readings?meterId=X&elementId=Y&gridType=baselist`
4. Check grid: Should display old BaseList grid (placeholder)

## Expected Console Output

### Single-Click Flow
```
[FavoritesSection] ===== FAVORITE CLICKED (SINGLE) =====
[FavoritesSection] meterId: 1 type: number
[FavoritesSection] elementId: 8 type: number
[FavoritesSection] Calling onItemClick with gridType: simple
[FavoritesSection] ===== FAVORITE CLICK COMPLETE =====

[SidebarMetersSection] ===== FAVORITE ITEM CLICK HANDLER =====
[SidebarMetersSection] meterId: 1 type: string
[SidebarMetersSection] elementId: 8 type: string
[SidebarMetersSection] gridType: simple
[SidebarMetersSection] Setting selected item and calling onMeterElementSelect
[SidebarMetersSection] ===== FAVORITE ITEM CLICK COMPLETE =====

[AppLayoutWrapper] ===== METER ELEMENT SELECT =====
[AppLayoutWrapper] Meter element selected: 1 8
[AppLayoutWrapper] gridType: simple
[AppLayoutWrapper] meterId type: string elementId type: string
[AppLayoutWrapper] Setting selectedMeter and selectedElement in context
[AppLayoutWrapper] Context updated
[AppLayoutWrapper] Navigating to: /meter-readings?meterId=1&elementId=8&gridType=simple
[AppLayoutWrapper] ===== METER ELEMENT SELECT COMPLETE =====

[MeterReadingManagementPage] ===== EFFECT TRIGGERED =====
[MeterReadingManagementPage] meterId: 1 elementId: 8 tenantId: 1
[MeterReadingManagementPage] meterId type: string elementId type: string
[MeterReadingManagementPage] Conditions met, setting context and fetching
[MeterReadingManagementPage] Setting gridType from URL: simple
[MeterReadingManagementPage] Calling fetchItems with: {tenantId: 1, meterId: "1", meterElementId: "8"}
[MeterReadingManagementPage] ===== EFFECT COMPLETE =====

[MeterReadingsStore] ===== FETCH ITEMS CALLED =====
[MeterReadingsStore] params: {tenantId: 1, meterId: "1", meterElementId: "8"}
[MeterReadingsStore] ===== QUERY STRING =====
[MeterReadingsStore] Query string: tenantId=1&meterId=1&meterElementId=8
[MeterReadingsStore] Full URL: http://localhost:3001/api/meterreadings?tenantId=1&meterId=1&meterElementId=8
[MeterReadingsStore] ===== END QUERY STRING =====
[MeterReadingsStore] Response status: 200
[MeterReadingsStore] ===== RESPONSE DATA =====
[MeterReadingsStore] Response: {success: true, data: {items: [...], total: 9468, page: 1, pageSize: 20, totalPages: 474, hasMore: false}}
[MeterReadingsStore] Fetched 20 readings
[MeterReadingsStore] First item: {meter_reading_id: 1, meter_id: 1, meter_element_id: 8, ...}
[MeterReadingsStore] ===== END RESPONSE DATA =====
```

### Double-Click Flow
Same as above, but with `gridType: baselist` instead of `gridType: simple`

## Troubleshooting

### Single-click not working
- Check if FavoritesSection logs appear
- Check if favorite item is clickable
- Check if onItemClick is being called

### Double-click not working
- Check if FavoritesSection double-click logs appear
- Try double-clicking more slowly
- Check if onDoubleClick handler is attached

### gridType not being passed
- Check if gridType appears in console logs
- Check if URL contains `&gridType=simple` or `&gridType=baselist`
- Check if MeterReadingManagementPage reads gridType from URL

### Grid not switching
- Check if gridType is being set in MeterReadingManagementPage
- Check if MeterReadingList receives gridType prop
- Check if MeterReadingList renders correct grid based on gridType

## Files Modified

1. `MeterItPro/frontend/src/components/sidebar-meters/types.ts` - Updated type definitions
2. `MeterItPro/frontend/src/components/sidebar-meters/FavoritesSection.tsx` - Added double-click handler
3. `MeterItPro/frontend/src/components/sidebar-meters/SidebarMetersSection.tsx` - Updated to pass gridType
4. `MeterItPro/frontend/src/components/layout/AppLayoutWrapper.tsx` - Updated to pass gridType in URL
5. `MeterItPro/frontend/src/features/meterReadings/MeterReadingManagementPage.tsx` - Updated to read gridType from URL

## Status

✅ Single-click: Display simple grid
✅ Double-click: Display old BaseList grid (placeholder)
✅ gridType passed through entire flow
✅ URL query parameter set correctly
⏳ Old BaseList grid implementation (placeholder only)
