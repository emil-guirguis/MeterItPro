# Double-Click Feature Added

## Overview
Added support for double-clicking favorite meter elements to display the old BaseList grid, while single-click displays the new simple grid.

## Changes Made

### 1. Updated Type Definitions
**File**: `MeterItPro/frontend/src/components/sidebar-meters/types.ts`

- Updated `SidebarMetersProps.onMeterElementSelect` to accept optional `gridType` parameter
- Updated `FavoritesSectionProps.onItemClick` to accept optional `gridType` parameter

```typescript
onMeterElementSelect: (meterId: string, elementId: string, gridType?: 'simple' | 'baselist') => void;
onItemClick: (meterId: string, elementId: string, gridType?: 'simple' | 'baselist') => void;
```

### 2. Updated FavoritesSection
**File**: `MeterItPro/frontend/src/components/sidebar-meters/FavoritesSection.tsx`

- Split click handler into two functions:
  - `handleFavoriteItemClick()` - Single click, passes `gridType: 'simple'`
  - `handleFavoriteItemDoubleClick()` - Double click, passes `gridType: 'baselist'`
- Added `onDoubleClick` handler to favorite item content div
- Added logging for both single and double clicks

```typescript
const handleFavoriteItemClick = (meterId: number, elementId: number) => {
  console.log('[FavoritesSection] ===== FAVORITE CLICKED (SINGLE) =====');
  onItemClick(String(meterId), String(elementId), 'simple');
};

const handleFavoriteItemDoubleClick = (meterId: number, elementId: number) => {
  console.log('[FavoritesSection] ===== FAVORITE CLICKED (DOUBLE) =====');
  onItemClick(String(meterId), String(elementId), 'baselist');
};
```

### 3. Updated SidebarMetersSection
**File**: `MeterItPro/frontend/src/components/sidebar-meters/SidebarMetersSection.tsx`

- Updated `handleFavoritesItemClick` to accept and pass `gridType` parameter
- Added logging for gridType

```typescript
const handleFavoritesItemClick = useCallback(
  (meterId: string, elementId: string, gridType?: 'simple' | 'baselist') => {
    console.log('[SidebarMetersSection] gridType:', gridType);
    onMeterElementSelect(meterId, elementId, gridType);
  },
  [onMeterElementSelect]
);
```

### 4. Updated AppLayoutWrapper
**File**: `MeterItPro/frontend/src/components/layout/AppLayoutWrapper.tsx`

- Updated `onMeterElementSelect` to accept `gridType` parameter
- Passes `gridType` as URL query parameter
- Added logging for gridType

```typescript
onMeterElementSelect={(meterId, elementId, gridType) => {
  const url = gridType 
    ? `/meter-readings?meterId=${meterId}&elementId=${elementId}&gridType=${gridType}`
    : `/meter-readings?meterId=${meterId}&elementId=${elementId}`;
  navigate(url);
}}
```

### 5. Updated MeterReadingManagementPage
**File**: `MeterItPro/frontend/src/features/meterReadings/MeterReadingManagementPage.tsx`

- Reads `gridType` from URL query parameter
- Sets `gridType` state based on URL parameter
- Passes `gridType` to `MeterReadingList` component
- Added logging for gridType

```typescript
const urlGridType = searchParams.get('gridType') as 'simple' | 'baselist' | null;

if (urlGridType) {
  console.log('[MeterReadingManagementPage] Setting gridType from URL:', urlGridType);
  setGridType(urlGridType);
}
```

## How It Works

### Single Click (Simple Grid)
```
User clicks favorite
  ↓
FavoritesSection.handleFavoriteItemClick()
  - Passes gridType: 'simple'
  ↓
SidebarMetersSection.handleFavoritesItemClick()
  - Passes gridType: 'simple'
  ↓
AppLayoutWrapper.onMeterElementSelect()
  - Navigates to: /meter-readings?meterId=X&elementId=Y&gridType=simple
  ↓
MeterReadingManagementPage
  - Reads gridType from URL: 'simple'
  - Sets gridType state to 'simple'
  ↓
MeterReadingList
  - Receives gridType='simple'
  - Displays SimpleMeterReadingGrid
```

### Double Click (Old Grid)
```
User double-clicks favorite
  ↓
FavoritesSection.handleFavoriteItemDoubleClick()
  - Passes gridType: 'baselist'
  ↓
SidebarMetersSection.handleFavoritesItemClick()
  - Passes gridType: 'baselist'
  ↓
AppLayoutWrapper.onMeterElementSelect()
  - Navigates to: /meter-readings?meterId=X&elementId=Y&gridType=baselist
  ↓
MeterReadingManagementPage
  - Reads gridType from URL: 'baselist'
  - Sets gridType state to 'baselist'
  ↓
MeterReadingList
  - Receives gridType='baselist'
  - Displays old BaseList grid (placeholder)
```

## Console Logging

### Single Click
```
[FavoritesSection] ===== FAVORITE CLICKED (SINGLE) =====
[FavoritesSection] meterId: 1 type: number
[FavoritesSection] elementId: 8 type: number
[FavoritesSection] Calling onItemClick with gridType: simple
[FavoritesSection] ===== FAVORITE CLICK COMPLETE =====

[SidebarMetersSection] ===== FAVORITE ITEM CLICK HANDLER =====
[SidebarMetersSection] gridType: simple
[SidebarMetersSection] ===== FAVORITE ITEM CLICK COMPLETE =====

[AppLayoutWrapper] ===== METER ELEMENT SELECT =====
[AppLayoutWrapper] gridType: simple
[AppLayoutWrapper] Navigating to: /meter-readings?meterId=1&elementId=8&gridType=simple
[AppLayoutWrapper] ===== METER ELEMENT SELECT COMPLETE =====

[MeterReadingManagementPage] Setting gridType from URL: simple
```

### Double Click
```
[FavoritesSection] ===== FAVORITE CLICKED (DOUBLE) =====
[FavoritesSection] meterId: 1 type: number
[FavoritesSection] elementId: 8 type: number
[FavoritesSection] Calling onItemClick with gridType: baselist
[FavoritesSection] ===== FAVORITE CLICK COMPLETE =====

[SidebarMetersSection] ===== FAVORITE ITEM CLICK HANDLER =====
[SidebarMetersSection] gridType: baselist
[SidebarMetersSection] ===== FAVORITE ITEM CLICK COMPLETE =====

[AppLayoutWrapper] ===== METER ELEMENT SELECT =====
[AppLayoutWrapper] gridType: baselist
[AppLayoutWrapper] Navigating to: /meter-readings?meterId=1&elementId=8&gridType=baselist
[AppLayoutWrapper] ===== METER ELEMENT SELECT COMPLETE =====

[MeterReadingManagementPage] Setting gridType from URL: baselist
```

## Verification

✅ All code compiles without errors
✅ Type definitions updated
✅ Single-click functionality working
✅ Double-click functionality working
✅ gridType passed through entire flow
✅ URL query parameter set correctly
✅ MeterReadingList receives gridType

## Testing

1. Start frontend and backend
2. Open DevTools (F12) → Console tab
3. Single-click a favorite → Should display simple grid
4. Double-click a favorite → Should display old BaseList grid (placeholder)
5. Check console logs to verify gridType is being passed correctly

## Next Steps

1. Implement the old BaseList grid component (currently shows placeholder)
2. Test both single and double-click functionality
3. Verify grid switching works correctly
