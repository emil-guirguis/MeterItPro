# Dashboard Framework Migration Design

## Overview

This design document outlines the migration of dashboard components from the client application to the framework. The migration maintains a clear separation of concerns: framework components handle UI and state management, while client services handle API communication and business logic.

The architecture follows these principles:
- **Framework components** are generic and reusable across applications
- **Client services** handle tenant-specific API communication
- **Props-based data flow** ensures components remain decoupled from data sources
- **Callback-based interactions** allow clients to implement custom business logic

## Architecture

### Component Hierarchy

```
Framework Layer (framework/frontend/dashboards/)
├── Components
│   ├── DashboardPage (orchestrates layout and card management)
│   ├── DashboardCard (displays individual card with controls)
│   ├── DashboardCardModal (create/edit card dialog)
│   ├── ExpandedCardModal (fullscreen card view)
│   └── Visualization (generic chart component)
├── Hooks
│   ├── useDashboard (state management)
│   ├── useCardData (card-specific data management)
│   └── useLayout (grid layout management)
├── Types
│   ├── DashboardCard (generic card interface)
│   ├── DashboardConfig (configuration interface)
│   └── VisualizationType (supported chart types)
└── Utils
    ├── formatters (number, currency, percentage)
    ├── layout (responsive grid calculations)
    └── validators (data validation)

Client Layer (MeterItPro/frontend/)
├── Services
│   └── dashboardService (API communication)
├── Pages
│   └── DashboardPage (client-specific wrapper)
└── Components
    └── (client-specific overrides if needed)
```

### Data Flow

```
Client DashboardPage
    ↓
    Uses dashboardService to fetch data
    ↓
    Passes data to framework DashboardPage via props
    ↓
    Framework DashboardPage manages layout and orchestration
    ↓
    Framework DashboardCard receives card data and callbacks
    ↓
    Framework Visualization renders chart with data
```

## Components and Interfaces

### Framework Components

#### DashboardPage
Generic dashboard page component that manages card layout and orchestration.

**Props:**
```typescript
interface DashboardPageProps {
  cards: DashboardCard[];
  loading: boolean;
  error: string | null;
  onCreateCard: () => void;
  onEditCard: (card: DashboardCard) => void;
  onDeleteCard: (cardId: number) => void;
  onLayoutChange: (layout: Layout[]) => void;
  onRefresh: () => void;
  onExpandCard: (card: DashboardCard) => void;
  onCardRefresh: (cardId: number) => void;
}
```

**Responsibilities:**
- Render responsive grid layout
- Manage card positioning and resizing
- Display loading and error states
- Provide action buttons (create, refresh)
- Handle empty state

#### DashboardCard
Generic card component that displays aggregated data with controls.

**Props:**
```typescript
interface DashboardCardProps {
  card: DashboardCard;
  data: AggregatedData | null;
  loading: boolean;
  error: string | null;
  onEdit: (card: DashboardCard) => void;
  onDelete: (cardId: number) => void;
  onRefresh: (cardId: number) => void;
  onExpand: (card: DashboardCard) => void;
  onGroupingChange: (cardId: number, grouping: string) => void;
  onTimeFrameChange: (cardId: number, timeFrame: string) => void;
  onVisualizationChange: (cardId: number, type: VisualizationType) => void;
}
```

**Responsibilities:**
- Display card header with title and description
- Show action buttons (edit, delete, refresh, expand)
- Render visualization with data
- Display aggregated values
- Handle grouping and time frame selection
- Show loading and error states

#### DashboardCardModal
Generic modal for creating and editing dashboard cards.

**Props:**
```typescript
interface DashboardCardModalProps {
  isOpen: boolean;
  card: DashboardCard | null;
  meters: Array<{ id: number; name: string }>;
  meterElements: Array<{ id: number; name: string }>;
  powerColumns: Array<{ name: string; label: string }>;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: Partial<DashboardCard>) => void;
}
```

**Responsibilities:**
- Render form for card configuration
- Handle meter and element selection
- Handle column selection
- Validate form data
- Submit data to parent component

#### ExpandedCardModal
Generic modal for fullscreen card view.

**Props:**
```typescript
interface ExpandedCardModalProps {
  card: DashboardCard;
  data: AggregatedData | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRefresh: () => void;
}
```

**Responsibilities:**
- Display card in fullscreen
- Show larger visualization
- Provide refresh capability
- Handle close action

#### Visualization
Generic chart component that renders different visualization types.

**Props:**
```typescript
interface VisualizationProps {
  type: VisualizationType;
  data: any[];
  columns: string[];
  height: number;
  loading?: boolean;
}
```

**Responsibilities:**
- Render appropriate chart type
- Handle data transformation
- Provide responsive sizing
- Support multiple chart libraries

### Client Services

#### dashboardService
Handles all API communication for dashboard operations.

**Methods:**
```typescript
class DashboardService {
  getDashboardCards(params?: PaginationParams): Promise<DashboardCardResponse>;
  getDashboardCard(id: number): Promise<DashboardCard>;
  createDashboardCard(data: Partial<DashboardCard>): Promise<DashboardCard>;
  updateDashboardCard(id: number, data: Partial<DashboardCard>): Promise<DashboardCard>;
  deleteDashboardCard(id: number): Promise<void>;
  getCardData(id: number): Promise<AggregatedData>;
  getPowerColumns(): Promise<PowerColumn[]>;
  getDetailedReadings(cardId: number, params?: PaginationParams): Promise<DetailedReadingsResponse>;
  exportReadingsToCSV(cardId: number): Promise<Blob>;
  getMetersByTenant(): Promise<Meter[]>;
  getMeterElementsByMeter(meterId: number): Promise<MeterElement[]>;
}
```

**Responsibilities:**
- Include authentication tokens in requests
- Include tenant context in requests
- Handle API errors and transformations
- Manage request/response lifecycle

## Data Models

### Framework Types

```typescript
// Generic dashboard card interface
interface DashboardCard {
  id: string | number;
  title: string;
  description?: string;
  visualization_type: VisualizationType;
  grid_x?: number;
  grid_y?: number;
  grid_w?: number;
  grid_h?: number;
  [key: string]: any; // Allow extension
}

// Supported visualization types
type VisualizationType = 'pie' | 'line' | 'bar' | 'area' | 'candlestick';

// Generic aggregated data interface
interface AggregatedData {
  card_id: string | number;
  aggregated_values: Record<string, number>;
  grouped_data?: Array<Record<string, any>>;
  [key: string]: any; // Allow extension
}

// Dashboard configuration
interface DashboardConfig {
  id: string;
  layout: {
    columns: number;
    gap: number;
    breakpoints?: Record<string, number>;
  };
  refreshInterval?: number;
  persistState?: boolean;
}
```

### Client Types (extend framework types)

```typescript
// Client-specific dashboard card
interface ClientDashboardCard extends DashboardCard {
  dashboard_id: number;
  tenant_id: number;
  created_by_users_id: number;
  meter_id: number;
  meter_element_id: number;
  card_name: string;
  card_description?: string;
  selected_columns: string[];
  time_frame_type: 'custom' | 'last_month' | 'this_month_to_date' | 'since_installation';
  custom_start_date?: string;
  custom_end_date?: string;
  grouping_type?: 'total' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  created_at: string;
  updated_at: string;
}

// Client-specific aggregated data
interface ClientAggregatedData extends AggregatedData {
  time_frame: {
    start: string;
    end: string;
  };
  meter_element?: {
    id: number;
    name: string;
  };
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Component Isolation
*For any* framework dashboard component, it SHALL NOT make direct API calls or access tenant-specific data. All data SHALL be provided through props.

**Validates: Requirements 1.5, 2.4**

### Property 2: Data Flow Consistency
*For any* dashboard card with updated data, the visualization SHALL reflect the new data without requiring a page reload.

**Validates: Requirements 1.1, 1.2**

### Property 3: Layout Persistence
*For any* layout change in the dashboard grid, the new layout configuration SHALL be persisted and restored on page reload.

**Validates: Requirements 1.2**

### Property 4: Service Separation
*For any* API operation, the dashboardService SHALL include authentication tokens and tenant context in the request headers.

**Validates: Requirements 2.1, 2.2**

### Property 5: Type Safety
*For any* framework component, TypeScript types SHALL prevent passing incompatible data structures.

**Validates: Requirements 4.1, 4.2**

### Property 6: Callback Execution
*For any* user interaction with a framework component, the appropriate callback SHALL be invoked with correct parameters.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 7: Error Handling
*For any* error in data fetching or processing, the error message SHALL be displayed to the user without crashing the component.

**Validates: Requirements 1.1, 1.2**

### Property 8: Responsive Layout
*For any* viewport size change, the dashboard grid SHALL adjust the number of columns and card sizes appropriately.

**Validates: Requirements 1.2**

## Error Handling

### Component-Level Error Handling
- Framework components display error messages passed via props
- Client handles error state and passes error message to framework component
- User can retry operation through UI

### Service-Level Error Handling
- dashboardService catches API errors and transforms them to user-friendly messages
- Authentication errors trigger re-login flow
- Network errors display retry option

### Data Validation
- Framework components validate data structure before rendering
- Client validates data before passing to framework components
- Invalid data displays error message instead of crashing

## Testing Strategy

### Unit Tests
- Test framework components with mock data
- Test utility functions with various inputs
- Test error handling and edge cases
- Test responsive layout calculations

### Property-Based Tests
- Property 1: Component isolation (no API calls)
- Property 2: Data flow consistency (visualization updates)
- Property 3: Layout persistence (grid configuration)
- Property 4: Service separation (auth headers)
- Property 5: Type safety (TypeScript validation)
- Property 6: Callback execution (correct parameters)
- Property 7: Error handling (graceful failures)
- Property 8: Responsive layout (viewport adjustments)

### Integration Tests
- Test client DashboardPage with framework components
- Test data flow from service to component
- Test user interactions and callbacks
- Test layout changes and persistence

