/**
 * DashboardGrid Component
 * 
 * Responsive grid layout for dashboard widgets and cards
 */

import React from 'react';
import type { DashboardLayout, DashboardGridItem } from '../types/dashboard';
import './DashboardGrid.css';

export interface DashboardGridProps {
  /** Grid layout configuration */
  layout: DashboardLayout;
  /** Grid items to render */
  items?: DashboardGridItem[];
  /** Children to render in grid */
  children?: React.ReactNode;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Whether to use auto-fit or auto-fill */
  autoFit?: boolean;
  /** Minimum column width for auto-fit/auto-fill */
  minColumnWidth?: number | string;
}

/**
 * Responsive grid layout component for dashboards
 * 
 * @example
 * ```tsx
 * <DashboardGrid
 *   layout={{ columns: 3, gap: 16 }}
 *   minColumnWidth={280}
 * >
 *   <StatCard title="Users" value={1234} />
 *   <StatCard title="Revenue" value="$45.2K" />
 *   <StatCard title="Orders" value={89} />
 * </DashboardGrid>
 * ```
 */
export const DashboardGrid: React.FC<DashboardGridProps> = ({
  layout,
  items,
  children,
  className = '',
  style = {},
  autoFit = true,
  minColumnWidth = 280
}) => {
  const { columns, gap, breakpoints } = layout;

  // Build grid template columns
  const getGridTemplateColumns = () => {
    if (autoFit) {
      const minWidth = typeof minColumnWidth === 'number' ? `${minColumnWidth}px` : minColumnWidth;
      return `repeat(auto-fit, minmax(${minWidth}, 1fr))`;
    }
    return `repeat(${columns}, 1fr)`;
  };

  // Build CSS custom properties for breakpoints
  const getBreakpointStyles = () => {
    if (!breakpoints || breakpoints.length === 0) {
      return {};
    }

    const styles: Record<string, string> = {};
    breakpoints.forEach((bp: any, index: number) => {
      styles[`--bp-${index}-max-width`] = `${bp.maxWidth}px`;
      styles[`--bp-${index}-columns`] = `${bp.columns}`;
      if (bp.gap !== undefined) {
        styles[`--bp-${index}-gap`] = typeof bp.gap === 'number' ? `${bp.gap}px` : bp.gap;
      }
    });
    return styles;
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: getGridTemplateColumns(),
    gap: typeof gap === 'number' ? `${gap}px` : gap,
    ...getBreakpointStyles(),
    ...style
  };

  // Render grid items if provided
  if (items && items.length > 0) {
    return (
      <div className={`dashboard-grid ${className}`} style={gridStyle}>
        {items.map(item => {
          const itemStyle: React.CSSProperties = {};
          
          if (item.position) {
            itemStyle.gridColumn = item.position.columnSpan
              ? `${item.position.column} / span ${item.position.columnSpan}`
              : item.position.column;
            itemStyle.gridRow = item.position.rowSpan
              ? `${item.position.row} / span ${item.position.rowSpan}`
              : item.position.row;
          }

          return (
            <div
              key={item.id}
              className={`dashboard-grid__item ${item.className || ''}`}
              style={itemStyle}
            >
              {item.content}
            </div>
          );
        })}
      </div>
    );
  }

  // Render children
  return (
    <div className={`dashboard-grid ${className}`} style={gridStyle}>
      {children}
    </div>
  );
};
