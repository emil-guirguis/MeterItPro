# Meter Readings Feature

## Overview

Read-only view for meter readings that inherits from the framework's `EntityManagementPage` and `DataList` components. This feature displays meter reading data without create/edit/delete functionality.

## Architecture

### Components

- **MeterReadingManagementPage** - Main page component that wraps the list
- **MeterReadingList** - List component using framework's DataList
- **meterReadingsStore** - Zustand store for data fetching (read-only)
- **meterReadingConfig** - Configuration for columns, filters, stats, and export

### Key Features

✅ **Read-Only** - No form, no create/edit/delete operations
✅ **Framework Integration** - Uses EntityManagementPage and DataList
✅ **Filtering** - Filter by meter ID and quality
✅ **Stats** - Total readings, energy, power, quality metrics
✅ **Export** - CSV export functionality
✅ **Responsive** - Mobile-friendly column hiding

## Files

```
client/frontend/src/features/meterReadings/
├── index.ts                          # Feature exports
├── README.md                         # This file
├── meterReadingConfig.ts             # Column, filter, stat definitions
├── meterReadingsStore.ts             # Zustand store (read-only)
├── MeterReadingList.tsx              # List component
├── MeterReadingList.css              # List styles
└── MeterReadingManagementPage.tsx    # Page wrapper
```

## Usage

### Routing

The page is accessible at `/meter-readings` and requires `Permission.METER_READ`.

```tsx
// Already configured in AppRoutes.tsx
<Route
  path="/meter-readings"
  element={
    <ProtectedRoute>
      <MeterReadingsPage />
    </ProtectedRoute>
  }
/>
```

### Sidebar Menu

Menu item added to `AppLayoutWrapper.tsx`:

```tsx
{
  id: 'meter-readings',
  label: 'Meter Readings',
  icon: 'chart',
  path: '/meter-readings',
  requiredPermission: Permission.METER_READ
}
```

## API Integration

### Endpoints Used

- `GET /api/meterreadings` - Fetch all readings with pagination
- `GET /api/meterreadings/meter/:meterId` - Fetch readings by meter ID

### Data Structure

```typescript
interface MeterReading {
  id: string;
  meterId: string;
  timestamp: string | Date;
  kWh?: number | null;
  kW?: number | null;
  V?: number | null;
  A?: number | null;
  dPF?: number | null;
  quality?: 'good' | 'estimated' | 'questionable' | null;
  // ... additional fields
}
```

## Configuration

### Columns

- Meter ID (with device IP/port)
- Reading Time (datetime)
- Energy (kWh)
- Power (kW)
- Voltage (V)
- Current (A)
- Quality (badge)

### Filters

- Meter ID (text input)
- Quality (select: good/estimated/questionable)

### Stats

- Total Readings
- Total Energy (kWh)
- Avg Power (kW)
- Good Quality Count

### Export

CSV export with all key metrics and quality data.

## Extending

To add new columns:

1. Update `meterReadingColumns` in `meterReadingConfig.ts`
2. Add corresponding filter in `meterReadingFilters` if needed
3. Update export headers in `meterReadingExportConfig`

To add new stats:

1. Update `meterReadingStats` in `meterReadingConfig.ts`

## Notes

- This is a **read-only** feature - no forms or mutations
- Uses framework components for consistency
- Backend model already exists at `client/backend/src/models/MeterReading.js`
- API routes already exist at `client/backend/src/routes/meterReadings.js`
