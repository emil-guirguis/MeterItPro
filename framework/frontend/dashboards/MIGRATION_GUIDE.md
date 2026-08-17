# Dashboard Framework Migration Guide

This guide explains how to migrate existing dashboards to use the dashboard framework.

## Overview

The dashboard framework provides:
- **useDashboard hook**: State management, auto-refresh, and persistence
- **DashboardGrid**: Responsive grid layout
- **DashboardWidget**: Widget container with loading/error states and collapse
- **StatCard**: Stat display component with icons, trends, and formatting
- **Layout helpers**: Utilities for responsive layouts

## Migration Steps

### 1. Replace Manual State Management with useDashboard Hook

**Before:**
```tsx
const [stats, setStats] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [expanded, setExpanded] = useState(true);

const fetchStats = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await meterReadingService.getMeterStats();
    setStats(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchStats();
  const interval = setInterval(fetchStats, 30000);
  return () => clearInterval(interval);
}, []);
```

**After:**
```tsx
import { useDashboard } from '../../../framework/frontend/dashboards';

const dashboard = useDashboard({
  id: 'meter-dashboard',
  layout: { columns: 3, gap: 16 },
  refreshInterval: 30000,
  persistState: true,
  fetchData: async () => {
    return await meterReadingService.getMeterStats();
  }
});

// Access state via dashboard.data, dashboard.loading, dashboard.error
```

### 2. Replace Custom Grid with DashboardGrid

**Before:**
```tsx
<div className="dashboard__stats">
  {/* Manual grid with CSS */}
</div>
```

**After:**
```tsx
import { DashboardGrid } from '../../../framework/frontend/dashboards';

<DashboardGrid 
  layout={dashboard.config.layout} 
  minColumnWidth={280}
>
  {/* Children automatically arranged in responsive grid */}
</DashboardGrid>
```

### 3. Replace Custom Stat Cards with StatCard Component

**Before:**
```tsx
<div className="dashboard__stat-card dashboard__stat-card--energy">
  <div className="dashboard__stat-icon">⚡</div>
  <div className="dashboard__stat-content">
    <h3 className="dashboard__stat-title">Total Energy</h3>
    <p className="dashboard__stat-value">{formatNumber(stats.totalKWh)} kWh</p>
    <p className="dashboard__stat-subtitle">Cumulative consumption</p>
  </div>
</div>
```

**After:**
```tsx
import { StatCard, formatNumber } from '../../../framework/frontend/dashboards';

<StatCard
  id="total-energy"
  title="Total Energy"
  value={stats?.totalKWh || 0}
  subtitle="Cumulative consumption"
  icon="⚡"
  variant="success"
  formatValue={(val) => `${formatNumber(val)} kWh`}
  loading={dashboard.loading}
/>
```

### 4. Replace Collapsible Sections with DashboardWidget

**Before:**
```tsx
<div className="dashboard__stats-section">
  <div className="dashboard__stats-header" onClick={() => setExpanded(!expanded)}>
    <h2>Statistics</h2>
    <button className={expanded ? 'expanded' : ''}>▼</button>
  </div>
  <div className={expanded ? 'expanded' : 'collapsed'}>
    {/* Content */}
  </div>
</div>
```

**After:**
```tsx
import { DashboardWidget } from '../../../framework/frontend/dashboards';

<DashboardWidget
  id="stats-section"
  title="📊 Statistics"
  collapsible
  defaultCollapsed={false}
  refreshable
  onRefresh={dashboard.refresh}
  loading={dashboard.loading}
  error={dashboard.error}
>
  {/* Content */}
</DashboardWidget>
```

## Complete Example

See `framework/frontend/dashboards/examples/DashboardExample.tsx` for a complete migration example.

### Before (Original Dashboard.tsx)

```tsx
export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<MeterReadingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsExpanded, setStatsExpanded] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await meterReadingService.getMeterStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard__stats-section">
        <div className="dashboard__stats-header" onClick={() => setStatsExpanded(!statsExpanded)}>
          <h2>📊 Meter Statistics</h2>
          <button>{statsExpanded ? '▼' : '▶'}</button>
        </div>
        <div className={statsExpanded ? 'expanded' : 'collapsed'}>
          <div className="dashboard__stats">
            <div className="dashboard__stat-card dashboard__stat-card--energy">
              <div className="dashboard__stat-icon">⚡</div>
              <div className="dashboard__stat-content">
                <h3>Total Energy</h3>
                <p>{formatNumber(stats?.totalKWh)} kWh</p>
              </div>
            </div>
            {/* More stat cards... */}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### After (Using Framework)

```tsx
import { 
  useDashboard, 
  DashboardGrid, 
  DashboardWidget, 
  StatCard, 
  formatNumber,
  createResponsiveLayout 
} from '../../../framework/frontend/dashboards';

export const Dashboard: React.FC = () => {
  const dashboard = useDashboard({
    id: 'meter-dashboard',
    layout: createResponsiveLayout(3, 16),
    refreshInterval: 30000,
    persistState: true,
    fetchData: async () => {
      return await meterReadingService.getMeterStats();
    }
  });

  return (
    <div className="dashboard">
      <DashboardWidget
        id="meter-stats"
        title="📊 Meter Statistics"
        collapsible
        refreshable
        onRefresh={dashboard.refresh}
        loading={dashboard.loading}
        error={dashboard.error}
      >
        <DashboardGrid layout={dashboard.config.layout} minColumnWidth={280}>
          <StatCard
            id="total-energy"
            title="Total Energy"
            value={dashboard.data?.totalKWh || 0}
            subtitle="Cumulative consumption"
            icon="⚡"
            variant="success"
            formatValue={(val) => `${formatNumber(val)} kWh`}
            loading={dashboard.loading}
          />
          {/* More stat cards... */}
        </DashboardGrid>
      </DashboardWidget>
    </div>
  );
};
```

## Benefits

1. **Less Code**: Framework handles state management, auto-refresh, and persistence
2. **Consistent UI**: All dashboards use the same components and styling
3. **Responsive**: Built-in responsive behavior with breakpoints
4. **Accessible**: Components follow accessibility best practices
5. **Maintainable**: Changes to framework benefit all dashboards
6. **Type Safe**: Full TypeScript support with proper types

## API Reference

### useDashboard Hook

```tsx
const dashboard = useDashboard({
  id: string;                          // Unique dashboard ID
  layout: DashboardLayout;             // Grid layout configuration
  refreshInterval?: number;            // Auto-refresh interval (ms)
  persistState?: boolean;              // Save state to localStorage
  fetchData?: () => Promise<any>;      // Data fetching function
  onError?: (error: Error) => void;    // Error handler
});
```

### DashboardGrid Component

```tsx
<DashboardGrid
  layout={DashboardLayout}             // Grid configuration
  minColumnWidth={number | string}     // Min column width for auto-fit
  autoFit={boolean}                    // Use auto-fit (default: true)
  className={string}
  style={CSSProperties}
>
  {children}
</DashboardGrid>
```

### DashboardWidget Component

```tsx
<DashboardWidget
  id={string}                          // Unique widget ID
  title={string}                       // Widget title
  collapsible={boolean}                // Enable collapse
  refreshable={boolean}                // Show refresh button
  loading={boolean}                    // Loading state
  error={string | null}                // Error message
  onRefresh={() => void}               // Refresh handler
  onToggleCollapse={() => void}        // Collapse handler
>
  {children}
</DashboardWidget>
```

### StatCard Component

```tsx
<StatCard
  id={string}                          // Unique stat ID
  title={string}                       // Stat title
  value={string | number}              // Stat value
  subtitle={string}                    // Subtitle/description
  icon={string}                        // Icon (emoji or icon name)
  variant={'default' | 'success' | 'warning' | 'error' | 'info'}
  color={string}                       // Custom border color
  trend={{                             // Trend indicator
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  }}
  formatValue={(val) => string}        // Value formatter
  loading={boolean}                    // Show skeleton
  onClick={() => void}                 // Click handler
/>
```

## Layout Helpers

```tsx
import { 
  createResponsiveLayout,
  calculateColumns,
  getDeviceType 
} from '../../../framework/frontend/dashboards';

// Create responsive layout with breakpoints
const layout = createResponsiveLayout(3, 16);

// Calculate columns for current width
const columns = calculateColumns(window.innerWidth, layout);

// Get device type
const device = getDeviceType(window.innerWidth); // 'mobile' | 'tablet' | 'desktop'
```

## Testing

After migration:
1. Test dashboard loading and data display
2. Test auto-refresh functionality
3. Test collapse/expand behavior
4. Test responsive behavior at different screen sizes
5. Test error states and retry functionality
6. Verify localStorage persistence works

## Troubleshooting

### Issue: Stats not loading
- Check that `fetchData` function is provided to `useDashboard`
- Verify API endpoint is correct
- Check browser console for errors

### Issue: Layout not responsive
- Ensure `DashboardGrid` has proper `layout` prop
- Check that `minColumnWidth` is set appropriately
- Verify CSS is imported

### Issue: State not persisting
- Set `persistState: true` in `useDashboard` config
- Check that `id` is unique and consistent
- Verify localStorage is available

## Next Steps

1. Migrate main Dashboard.tsx
2. Test thoroughly
3. Remove old custom dashboard code
4. Update other dashboards (SystemHealth, LocalDashboard)
5. Document any project-specific patterns
