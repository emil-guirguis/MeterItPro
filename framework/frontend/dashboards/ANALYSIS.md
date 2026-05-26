# Dashboard Framework Analysis

## Existing Dashboard Patterns in client/frontend

### Dashboard Components Identified

1. **Main Dashboard Page** (`client/frontend/src/pages/Dashboard.tsx`)
   - Displays collapsible statistics section with multiple stat cards
   - Displays latest meter readings list
   - Uses grid layout for stat cards
   - Implements auto-refresh (30 seconds)
   - Stores collapse state in localStorage

2. **Sync Dashboard** (`sync/frontend/src/pages/LocalDashboard.tsx`)
   - Uses Material-UI components (Grid, Card, CardContent)
   - Displays summary cards (Total Meters, Connected Meters, Readings, Unsynchronized)
   - Shows meter status cards in grid layout
   - Includes readings chart component
   - Implements polling for data updates

3. **System Health Component** (`client/frontend/src/components/system/SystemHealth.tsx`)
   - Displays service health status cards
   - Shows system metrics in grid layout
   - Uses Material-UI Card components
   - Implements status indicators (healthy, warning, error)
   - Auto-refreshes every 30 seconds

### Widget Components Identified

1. **Stat Cards** (from Dashboard.tsx)
   - Icon + Title + Value + Subtitle layout
   - Color-coded borders for different metrics
   - Hover effects with elevation
   - Responsive grid layout
   - Support for formatted numbers (K, M suffixes)

2. **Summary Cards** (from LocalDashboard.tsx)
   - Simple title + value layout
   - Optional status icons (CheckCircle, Error)
   - Material-UI Card styling

3. **Service Status Cards** (from SystemHealth.tsx)
   - Status icon + service name + status chip
   - Message and timestamp display
   - Response time indicator
   - Outlined card variant

### Dashboard Layouts

1. **Grid Layout Pattern**
   - CSS Grid with `repeat(auto-fit, minmax(280px, 1fr))`
   - Responsive breakpoints (1200px, 768px, 480px)
   - Adjusts columns based on screen size
   - Gap spacing between cards

2. **Collapsible Sections**
   - Header with click handler
   - Animated expand/collapse with max-height transition
   - Rotation animation for collapse icon
   - State persistence in localStorage

3. **Material-UI Grid System**
   - Grid container with spacing
   - Grid items with responsive sizing (xs, sm, md)
   - Consistent spacing between elements

### Common Patterns

1. **Data Fetching**
   - useEffect for initial load
   - Auto-refresh with setInterval
   - Loading states with spinners
   - Error handling with retry buttons

2. **State Management**
   - useState for local state
   - localStorage for persistence
   - Loading/error/data states

3. **Styling Approaches**
   - Custom CSS with BEM-like naming (Dashboard.tsx)
   - Material-UI sx prop and styled components (LocalDashboard.tsx, SystemHealth.tsx)
   - CSS variables for theming

4. **Responsive Design**
   - Mobile-first approach
   - Touch-friendly targets (44px minimum)
   - Stacked layouts on small screens
   - Adjusted font sizes and spacing

### Reusable Patterns for Framework

1. **StatCard Component**
   - Props: icon, title, value, subtitle, color/variant
   - Support for formatted values
   - Hover effects
   - Responsive sizing

2. **DashboardGrid Component**
   - Props: columns, gap, responsive breakpoints
   - Auto-fit grid layout
   - Support for different card sizes

3. **DashboardWidget Component**
   - Generic container for dashboard content
   - Support for loading/error states
   - Collapsible sections
   - Auto-refresh capability

4. **useDashboard Hook**
   - Data fetching with auto-refresh
   - Loading/error state management
   - localStorage persistence
   - Cleanup on unmount

## Requirements Mapping

This analysis addresses **Requirement 13.1**: Identify dashboard components, widget components, and document dashboard layouts.

## Recommendations for Framework

1. Create flexible StatCard component that supports both custom CSS and Material-UI styling
2. Implement DashboardGrid with configurable layout options
3. Build DashboardWidget wrapper with common functionality (loading, error, refresh)
4. Provide useDashboard hook for common dashboard patterns
5. Include layout helpers for responsive grid calculations
6. Support both controlled and uncontrolled collapse states
7. Provide formatting utilities for numbers and dates
