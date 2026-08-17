# Dashboard Framework

A comprehensive framework for building responsive, accessible dashboards with React.

## Features

- 🎯 **State Management**: Built-in hook for dashboard state, loading, and errors
- 🔄 **Auto-Refresh**: Configurable auto-refresh with cleanup
- 💾 **Persistence**: Save dashboard state to localStorage
- 📱 **Responsive**: Mobile-first responsive layouts with breakpoints
- ♿ **Accessible**: WCAG 2.1 AA compliant components
- 🎨 **Customizable**: Flexible styling with CSS variables
- 📊 **Stat Cards**: Pre-built components for displaying metrics
- 🔧 **Utilities**: Helper functions for layout calculations

## Quick Start

```tsx
import { 
  useDashboard, 
  DashboardGrid, 
  DashboardWidget, 
  StatCard,
  formatNumber 
} from '../../../framework/frontend/dashboards';

function MyDashboard() {
  const dashboard = useDashboard({
    id: 'my-dashboard',
    layout: { columns: 3, gap: 16 },
    refreshInterval: 30000,
    fetchData: async () => {
      const response = await fetch('/api/stats');
      return response.json();
    }
  });

  return (
    <DashboardWidget
      id="stats"
      title="Statistics"
      collapsible
      refreshable
      onRefresh={dashboard.refresh}
      loading={dashboard.loading}
      error={dashboard.error}
    >
      <DashboardGrid layout={dashboard.config.layout}>
        <StatCard
          id="users"
          title="Total Users"
          value={dashboard.data?.users || 0}
          icon="👥"
          variant="success"
          loading={dashboard.loading}
        />
        <StatCard
          id="revenue"
          title="Revenue"
          value={dashboard.data?.revenue || 0}
          icon="💰"
          variant="info"
          formatValue={(val) => `$${formatNumber(val)}`}
          loading={dashboard.loading}
        />
      </DashboardGrid>
    </DashboardWidget>
  );
}
```

## Components

### useDashboard Hook

Manages dashboard state, auto-refresh, and persistence.

```tsx
const dashboard = useDashboard({
  id: 'dashboard-id',
  layout: { columns: 3, gap: 16 },
  refreshInterval: 30000,
  persistState: true,
  fetchData: async () => { /* ... */ }
});
```

**Returns:**
- `loading`: Loading state
- `error`: Error message
- `data`: Dashboard data
- `lastUpdate`: Last update timestamp
- `refresh()`: Manual refresh function
- `config`: Dashboard configuration

### DashboardGrid

Responsive grid layout for dashboard content.

```tsx
<DashboardGrid 
  layout={{ columns: 3, gap: 16 }}
  minColumnWidth={280}
>
  {/* Grid items */}
</DashboardGrid>
```

**Props:**
- `layout`: Grid configuration (columns, gap, breakpoints)
- `minColumnWidth`: Minimum column width for auto-fit
- `autoFit`: Use auto-fit layout (default: true)

### DashboardWidget

Container for dashboard widgets with loading/error states.

```tsx
<DashboardWidget
  id="widget-id"
  title="Widget Title"
  collapsible
  refreshable
  onRefresh={handleRefresh}
  loading={loading}
  error={error}
>
  {/* Widget content */}
</DashboardWidget>
```

**Props:**
- `id`: Unique widget identifier
- `title`: Widget title
- `collapsible`: Enable collapse functionality
- `refreshable`: Show refresh button
- `loading`: Loading state
- `error`: Error message
- `onRefresh`: Refresh handler

### StatCard

Display statistics with icon, value, and trend.

```tsx
<StatCard
  id="stat-id"
  title="Metric Name"
  value={1234}
  subtitle="Description"
  icon="📊"
  variant="success"
  trend={{ value: 12, direction: 'up' }}
  formatValue={(val) => formatNumber(val)}
  loading={loading}
/>
```

**Props:**
- `id`: Unique stat identifier
- `title`: Stat title
- `value`: Stat value
- `subtitle`: Optional subtitle
- `icon`: Icon (emoji or icon name)
- `variant`: Color variant (default, success, warning, error, info)
- `trend`: Trend indicator
- `formatValue`: Value formatter function
- `loading`: Show loading skeleton

## Utilities

### Layout Helpers

```tsx
import { 
  createResponsiveLayout,
  calculateColumns,
  getDeviceType 
} from '../../../framework/frontend/dashboards';

// Create responsive layout
const layout = createResponsiveLayout(3, 16);

// Calculate columns for width
const columns = calculateColumns(1024, layout);

// Get device type
const device = getDeviceType(window.innerWidth);
```

### Formatters

```tsx
import { 
  formatNumber,
  formatCurrency,
  formatPercentage 
} from '../../../framework/frontend/dashboards';

formatNumber(1234567);        // "1.2M"
formatCurrency(45200);        // "$45.2K"
formatPercentage(3.14159, 2); // "3.14%"
```

## Styling

The framework uses CSS variables for theming:

```css
:root {
  --color-surface: #ffffff;
  --color-border: #e5e7eb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

## Responsive Breakpoints

Default breakpoints:
- **Mobile**: ≤ 480px (1 column)
- **Tablet**: ≤ 768px (1-2 columns)
- **Desktop Small**: ≤ 1200px (2 columns)
- **Desktop**: > 1200px (3+ columns)

## Examples

See `examples/DashboardExample.tsx` for complete examples:
- Meter Dashboard with stats
- Simple stats dashboard
- Widget with auto-refresh
- Responsive grid layouts

## Migration Guide

See `MIGRATION_GUIDE.md` for detailed instructions on migrating existing dashboards to use the framework.

## Type Definitions

All types are exported from `types/dashboard.ts` and `types/widget.ts`:

```tsx
import type { 
  DashboardConfig,
  DashboardLayout,
  WidgetConfig,
  StatCardConfig 
} from '../../../framework/frontend/dashboards';
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid support required
- ES2020+ features

## Accessibility

- Keyboard navigation support
- ARIA labels and roles
- Screen reader friendly
- Focus management
- Minimum touch target sizes (44px)

## Performance

- React.memo for expensive components
- Cleanup of intervals on unmount
- Efficient re-renders with proper dependencies
- Loading skeletons for better perceived performance

## License

Part of the framework project.
