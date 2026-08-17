# Dashboard Export/Email Buttons - Implementation Complete

## Summary

The export and email buttons have been successfully integrated into the dashboard card's expanded view. When users click the expand button on a dashboard card, they now see export and email buttons in the metadata bar of the expanded modal.

## What Was Done

### 1. Updated DashboardPage.tsx (Client)
**File**: `MeterItPro/frontend/src/pages/DashboardPage.tsx`

Modified the `handleExpandCard` function to fetch BOTH:
- Aggregated data (for visualization)
- Detailed readings (for export/email)

```typescript
const [aggregatedData, detailedReadings] = await Promise.all([
  dashboardService.getCardData(card.dashboard_id),
  dashboardService.getDetailedReadings(card.dashboard_id, {
    page: 1,
    pageSize: 1000,
    sortBy: 'created_at',
    sortOrder: 'desc',
  })
]);

// Combine both data sources
const combinedData = {
  ...aggregatedData,
  items: detailedReadings.items,
  pagination: detailedReadings.pagination,
  card_info: detailedReadings.card_info,
};
```

This ensures the expanded modal has access to detailed meter readings needed for export.

### 2. Updated ExpandedCardModal.tsx (Framework)
**File**: `framework/frontend/dashboards/components/ExpandedCardModal.tsx`

Added:
- `handleExport()` function that generates CSV from detailed readings
- `handleEmail()` function that opens email client with pre-filled subject
- Export and Email buttons in the metadata bar
- Proper error handling and data validation

The buttons check for `data?.items` (detailed readings) and generate CSV with:
- All columns from the meter reading data
- Proper CSV escaping for special characters
- Filename format: `[elementName]-[YYYY-MM-DD].csv`

### 3. Updated ExpandedCardModal.css (Framework)
**File**: `framework/frontend/dashboards/components/ExpandedCardModal.css`

Added styling for:
- `.expanded-card-modal__export-btn` (green button)
- `.expanded-card-modal__email-btn` (blue button)
- Hover states and disabled states
- Proper spacing and alignment

## How It Works

### User Flow

1. **User navigates to Dashboard**
   - Sees dashboard cards with aggregated data

2. **User clicks Expand button (↗️)**
   - Modal opens showing visualization
   - System fetches detailed readings in background

3. **Expanded modal displays**
   - Metadata bar shows: Time frame | Visualization | Refresh | **Export** | **Email**
   - Export button (green): Downloads CSV file
   - Email button (blue): Opens email client

4. **User clicks Export**
   - CSV file is generated with all meter readings
   - Browser download dialog appears
   - File is saved as `[elementName]-[date].csv`

5. **User clicks Email**
   - Email client opens with pre-filled subject
   - Subject includes meter and element information
   - User can attach the CSV and send

## Data Flow

```
Dashboard Card
    ↓
User clicks Expand
    ↓
handleExpandCard() called
    ↓
Fetch aggregated data + detailed readings (parallel)
    ↓
Combine data (detailed readings for export, aggregated for viz)
    ↓
ExpandedCardModal renders with export/email buttons
    ↓
User clicks Export/Email
    ↓
handleExport/handleEmail() generates CSV from data.items
    ↓
Download or email
```

## Button States

### Export Button
- **Enabled**: When detailed readings are available
- **Disabled**: When loading, no data, or exporting
- **Shows**: "⬇️ Export" or "⬇️ Exporting..."

### Email Button
- **Enabled**: When detailed readings are available
- **Disabled**: When loading or no data
- **Shows**: "✉️ Email"

## CSV Export Format

The exported CSV includes:
- Header row with all column names
- All meter reading records
- Proper escaping of special characters (commas, quotes, newlines)
- UTF-8 encoding
- Sorted by created_at descending (newest first)

Example filename: `Main_Panel-2024-01-28.csv`

## Error Handling

- **No data available**: Shows alert "No data available to export"
- **Export fails**: Shows alert "Failed to export data"
- **Email client fails**: Shows alert "Failed to open email client"
- **Network error**: Gracefully handled with error messages

## Files Modified

1. `MeterItPro/frontend/src/pages/DashboardPage.tsx`
   - Updated `handleExpandCard()` to fetch detailed readings

2. `framework/frontend/dashboards/components/ExpandedCardModal.tsx`
   - Added `handleExport()` function
   - Added `handleEmail()` function
   - Added export and email buttons to JSX
   - Added `useState` for export loading state

3. `framework/frontend/dashboards/components/ExpandedCardModal.css`
   - Added `.expanded-card-modal__export-btn` styles
   - Added `.expanded-card-modal__email-btn` styles

## Testing

To verify the implementation:

1. Navigate to Dashboard page
2. Click the expand button (↗️) on any dashboard card
3. Wait for the modal to load
4. Look for the export and email buttons in the metadata bar
5. Click Export to download CSV
6. Click Email to open email client

## Notes

- The export buttons are now part of the framework component, making them available to all dashboard cards
- Detailed readings are fetched on-demand when expanding a card (not on initial page load)
- The implementation respects the existing dashboard architecture and data flow
- Both aggregated and detailed data are available in the expanded modal for maximum flexibility
