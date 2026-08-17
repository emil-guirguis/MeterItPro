/**
 * Dashboard Layout Helpers
 * 
 * Utility functions for dashboard layout calculations and responsive behavior
 */

import type { DashboardLayout, DashboardBreakpoint } from '../types/layout';

/**
 * Calculate number of columns based on viewport width and breakpoints
 * 
 * @param width - Current viewport width in pixels
 * @param layout - Dashboard layout configuration
 * @returns Number of columns for the current width
 */
export function calculateColumns(width: number, layout: DashboardLayout): number {
  if (!layout.breakpoints || layout.breakpoints.length === 0) {
    return layout.columns;
  }

  // Sort breakpoints by maxWidth descending
  const sortedBreakpoints = [...layout.breakpoints].sort((a, b) => b.maxWidth - a.maxWidth);

  // Find the first breakpoint that matches
  for (const breakpoint of sortedBreakpoints) {
    if (width <= breakpoint.maxWidth) {
      return breakpoint.columns;
    }
  }

  // If no breakpoint matches, use default columns
  return layout.columns;
}

/**
 * Calculate gap size based on viewport width and breakpoints
 * 
 * @param width - Current viewport width in pixels
 * @param layout - Dashboard layout configuration
 * @returns Gap size (number or string)
 */
export function calculateGap(width: number, layout: DashboardLayout): number | string {
  if (!layout.breakpoints || layout.breakpoints.length === 0) {
    return layout.gap;
  }

  // Sort breakpoints by maxWidth descending
  const sortedBreakpoints = [...layout.breakpoints].sort((a, b) => b.maxWidth - a.maxWidth);

  // Find the first breakpoint that matches and has a gap defined
  for (const breakpoint of sortedBreakpoints) {
    if (width <= breakpoint.maxWidth && breakpoint.gap !== undefined) {
      return breakpoint.gap;
    }
  }

  // If no breakpoint matches, use default gap
  return layout.gap;
}

/**
 * Get responsive layout configuration for current viewport width
 * 
 * @param width - Current viewport width in pixels
 * @param layout - Dashboard layout configuration
 * @returns Responsive layout configuration
 */
export function getResponsiveLayout(width: number, layout: DashboardLayout): DashboardLayout {
  return {
    ...layout,
    columns: calculateColumns(width, layout),
    gap: calculateGap(width, layout)
  };
}

/**
 * Create default breakpoints for responsive dashboards
 * 
 * @returns Array of default breakpoints
 */
export function createDefaultBreakpoints(): DashboardBreakpoint[] {
  return [
    {
      name: 'mobile',
      maxWidth: 480,
      columns: 1,
      gap: 12
    },
    {
      name: 'tablet',
      maxWidth: 768,
      columns: 1,
      gap: 16
    },
    {
      name: 'desktop-small',
      maxWidth: 1200,
      columns: 2,
      gap: 16
    }
  ];
}

/**
 * Calculate grid template columns CSS value
 * 
 * @param columns - Number of columns
 * @param minColumnWidth - Minimum column width (for auto-fit)
 * @param autoFit - Whether to use auto-fit
 * @returns CSS grid-template-columns value
 */
export function getGridTemplateColumns(
  columns: number,
  minColumnWidth?: number | string,
  autoFit: boolean = true
): string {
  if (autoFit && minColumnWidth) {
    const minWidth = typeof minColumnWidth === 'number' ? `${minColumnWidth}px` : minColumnWidth;
    return `repeat(auto-fit, minmax(${minWidth}, 1fr))`;
  }
  return `repeat(${columns}, 1fr)`;
}

/**
 * Calculate optimal number of columns based on container width and min column width
 * 
 * @param containerWidth - Container width in pixels
 * @param minColumnWidth - Minimum column width in pixels
 * @param gap - Gap between columns in pixels
 * @returns Optimal number of columns
 */
export function calculateOptimalColumns(
  containerWidth: number,
  minColumnWidth: number,
  gap: number = 16
): number {
  if (containerWidth <= minColumnWidth) {
    return 1;
  }

  // Calculate how many columns can fit
  // Formula: (containerWidth + gap) / (minColumnWidth + gap)
  const columns = Math.floor((containerWidth + gap) / (minColumnWidth + gap));
  return Math.max(1, columns);
}

/**
 * Convert gap value to pixels
 * 
 * @param gap - Gap value (number or CSS string)
 * @returns Gap in pixels
 */
export function gapToPixels(gap: number | string): number {
  if (typeof gap === 'number') {
    return gap;
  }

  // Parse CSS units
  const match = gap.match(/^(\d+(?:\.\d+)?)(px|rem|em)?$/);
  if (!match) {
    return 16; // Default fallback
  }

  const value = parseFloat(match[1]);
  const unit = match[2] || 'px';

  switch (unit) {
    case 'px':
      return value;
    case 'rem':
      // Assume 16px base font size
      return value * 16;
    case 'em':
      // Assume 16px base font size
      return value * 16;
    default:
      return value;
  }
}

/**
 * Check if viewport is mobile size
 * 
 * @param width - Viewport width in pixels
 * @returns True if mobile size
 */
export function isMobile(width: number): boolean {
  return width <= 768;
}

/**
 * Check if viewport is tablet size
 * 
 * @param width - Viewport width in pixels
 * @returns True if tablet size
 */
export function isTablet(width: number): boolean {
  return width > 768 && width <= 1024;
}

/**
 * Check if viewport is desktop size
 * 
 * @param width - Viewport width in pixels
 * @returns True if desktop size
 */
export function isDesktop(width: number): boolean {
  return width > 1024;
}

/**
 * Get device type based on viewport width
 * 
 * @param width - Viewport width in pixels
 * @returns Device type
 */
export function getDeviceType(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (isMobile(width)) return 'mobile';
  if (isTablet(width)) return 'tablet';
  return 'desktop';
}

/**
 * Create a responsive layout configuration
 * 
 * @param baseColumns - Base number of columns for desktop
 * @param baseGap - Base gap size
 * @returns Layout configuration with responsive breakpoints
 */
export function createResponsiveLayout(
  baseColumns: number = 3,
  baseGap: number = 16
): DashboardLayout {
  return {
    columns: baseColumns,
    gap: baseGap,
    breakpoints: [
      {
        name: 'mobile',
        maxWidth: 480,
        columns: 1,
        gap: 12
      },
      {
        name: 'tablet',
        maxWidth: 768,
        columns: Math.min(2, baseColumns),
        gap: 16
      },
      {
        name: 'desktop-small',
        maxWidth: 1200,
        columns: Math.min(2, baseColumns),
        gap: 16
      }
    ]
  };
}
