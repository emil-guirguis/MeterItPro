# Favorites Unfavorite Refresh - Requirements

## Overview
When a user clicks the star icon to unfavorite a meter element from the Favorites section, the meter element should be updated in the Meter Readings list to reflect that it's no longer favorited.

## User Stories

### 1.1 Unfavorite from Favorites Section
**As a** user  
**I want to** click the star icon on a favorited item in the Favorites section to remove it  
**So that** I can manage my favorites

**Acceptance Criteria:**
- When I click the star icon on a favorite item, the favorite is removed from the database
- The Favorites section updates to remove the item
- The corresponding meter element in the Meter Readings list updates to show it's no longer favorited
- The star icon in the Meter Readings list changes from filled to outlined

### 1.2 Meter Elements State Synchronization
**As a** developer  
**I want to** ensure the meterElements state is updated when a favorite is removed  
**So that** the UI stays in sync with the database

**Acceptance Criteria:**
- When a favorite is removed via FavoritesSection, the corresponding element's `is_favorited` property is set to false
- The MetersList component re-renders with the updated favorite status
- No additional API calls are needed beyond the remove favorite call

## Technical Details

### Current Issue
- `handleFavoritesStarClick` in SidebarMetersSection removes the favorite from the favorites array
- However, it doesn't update the `meterElements` state
- MetersList uses `element.is_favorited` from meterElements to determine star icon state
- Result: Star icon in Meter Readings list remains filled even though favorite was removed

### Solution
Update `handleFavoritesStarClick` to also update the `meterElements` state:
1. Find the meter and element in meterElements
2. Set `is_favorited` to false for that element
3. Update the state to trigger re-render

## Files to Modify
- `MeterItPro/frontend/src/components/sidebar-meters/SidebarMetersSection.tsx`
