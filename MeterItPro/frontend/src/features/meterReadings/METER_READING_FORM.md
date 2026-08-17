# Meter Reading Form Feature

## Overview

The Meter Reading Form is a comprehensive display component that presents the most recent meter reading for a selected meter element. It integrates with existing dashboard card components for graph visualization and provides users with detailed meter information, consumption/generation data organized by phase, and historical trend analysis through interactive graphs.

## Project Structure

```
meterReadings/
├── types.ts                          # Core TypeScript interfaces
├── MeterReadingForm.tsx              # Main component
├── MeterReadingForm.css              # Component styles
├── MeterReadingForm.test.tsx         # Component tests
├── MeterInfoPanel.tsx                # (TODO) Meter info display
├── MeterInfoPanel.test.tsx           # (TODO) Meter info tests
├── ReadingDataTable.tsx              # (TODO) Reading values table
├── ReadingDataTable.test.tsx         # (TODO) Reading values tests
├── ConsumptionGraph.tsx              # (TODO) Graph visualization
├── ConsumptionGraph.test.tsx         # (TODO) Graph tests
├── meterReadingConfig.ts             # Existing config
├── meterReadingsStore.ts             # Existing store
├── MeterReadingList.tsx              # Existing list component
└── METER_READING_FORM.md             # This file
```

## Core Types

### MeterReading
Represents a snapshot of values from a meter element at a specific time.

```typescript
interface MeterReading {
  id: string;
  meterElementId: string;
  timestamp: Date;
  frequency: number; // Hz
  sections: {
    [sectionName: string]: {
      [metricName: string]: ReadingMetric;
    };
  };
}
```

### Meter
Represents a physical device that measures energy consumption/generation.

```typescript
interface Meter {
  id: string;
  driver: string;
  description: string;
  serialNumber: string;
  elements: MeterElement[];
}
```

### MeterElement
Represents a logical grouping within a meter (e.g., Total Consumption, Total Generation).

```typescript
interface MeterElement {
  id: string;
  meterId: string;
  name: string;
  type: 'consumption' | 'generation';
}
```

### GraphDataPoint
Represents a single data point in a consumption/demand/emissions graph.

```typescript
interface GraphDataPoint {
  timestamp: Date;
  value: number;
  unit: string;
}
```

## Component Architecture

### MeterReadingForm (Main Component)
- **Purpose**: Main container component that orchestrates data fetching and sub-component rendering
- **Props**: 
  - `meterElementId: string` - The ID of the meter element to display
  - `onNavigateToList?: () => void` - Optional callback when navigating to the reading list
- **State**:
  - `lastReading: MeterReading | null` - The most recent meter reading
  - `graphData: GraphDataPoint[]` - Graph data for the selected time period and type
  - `selectedTimePeriod: 'today' | 'weekly' | 'monthly' | 'yearly'` - Selected time period
  - `selectedGraphType: 'consumption' | 'demand' | 'ghg_emissions'` - Selected graph type
  - `isLoading: boolean` - Loading state
  - `error: Error | null` - Error state

### MeterInfoPanel (TODO)
- **Purpose**: Displays meter metadata and information
- **Props**: 
  - `meter: Meter` - Meter information
  - `reading: MeterReading` - Reading information
- **Displays**:
  - Driver name
  - Meter description
  - Serial number
  - Reading timestamp

### ReadingDataTable (TODO)
- **Purpose**: Displays meter reading values organized by section and phase
- **Props**: 
  - `reading: MeterReading` - Reading data
- **Structure**:
  - Sections: Total Consumption, Total Generation, etc.
  - Columns: Overall, Phase 1, Phase 2, Phase 3
  - Rows: Metrics (Voltage, Current, Power, etc.)
  - Frequency display with Hz unit

### ConsumptionGraph (TODO)
- **Purpose**: Displays consumption trends with time period and graph type filters
- **Props**: 
  - `meterElementId: string` - Meter element ID
  - `timePeriod: 'today' | 'weekly' | 'monthly' | 'yearly'` - Selected time period
  - `graphType: 'consumption' | 'demand' | 'ghg_emissions'` - Selected graph type
  - `onTimePeriodChange: (period: string) => void` - Time period change callback
  - `onGraphTypeChange: (type: string) => void` - Graph type change callback
- **Features**:
  - Time period filter buttons (Today, Weekly, Monthly, Yearly)
  - Graph type toggle (Consumption, Demand, GHG Emissions)
  - Uses existing dashboard card component for visualization
  - Displays empty state when no data available

## State Management

The component uses React hooks for state management:
- `useState` for managing form state
- `useEffect` for fetching data on mount and when dependencies change

Future integration with existing meter store:
- Use `useMeterReadings` hook from `meterReadingsStore.ts`
- Use `useMeters` hook from `metersStore.ts`

## Styling

The component uses CSS classes following BEM (Block Element Modifier) naming convention:
- `.meter-reading-form` - Main component block
- `.meter-reading-form__header` - Header element
- `.meter-reading-form__content` - Content element
- `.meter-reading-form__section` - Section element
- `.meter-reading-form--loading` - Loading state modifier
- `.meter-reading-form--error` - Error state modifier
- `.meter-reading-form--empty` - Empty state modifier

Responsive design:
- Desktop: Components arranged horizontally where appropriate
- Tablet: Adjusted spacing and sizing
- Mobile: Vertical stacking of components

## Testing Strategy

### Unit Tests
- Test component rendering with different props
- Test state management and updates
- Test error handling and retry functionality
- Test navigation button functionality
- Test empty state display

### Property-Based Tests (TODO)
- Property 1: Last Reading Display
- Property 2: Meter Information Completeness
- Property 3: Reading Values Organization
- Property 4: Numeric Values with Units
- Property 5: Frequency Display
- Property 6: Time Period Filter Options
- Property 7: Graph Update on Time Period Change
- Property 8: Graph Type Toggle Options
- Property 9: Graph Update on Type Change
- Property 10: Graph Type Persistence
- Property 11: Navigation Button Presence
- Property 12: Navigation to Filtered List
- Property 13: Readings in Chronological Order
- Property 14: No Partial Data on Error

## Integration Points

### Existing Services
- `useMeterReadings` - Fetch meter readings
- `useMeters` - Fetch meter information
- Existing dashboard card component for graph visualization

### API Endpoints (TODO)
- `GET /api/meter-readings/last/:elementId` - Fetch last reading
- `GET /api/meter-readings/history/:elementId` - Fetch historical readings for graphs

## Next Steps

1. Implement MeterInfoPanel component
2. Implement ReadingDataTable component
3. Implement ConsumptionGraph component
4. Integrate with existing meter services
5. Add property-based tests
6. Add integration tests
7. Implement responsive layout
8. Add error handling and retry logic
