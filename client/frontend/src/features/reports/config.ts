/**
 * Report Configuration
 * 
 * Centralized configuration for Report entity including:
 * - Stats, bulk actions, and export configuration
 * 
 * Schema is loaded dynamically from the backend via useSchema('report')
 * List columns and filters are auto-generated from the schema.
 */

import type { StatDefinition, ExportConfig } from '@framework/components/list/types/list';
import type { Report } from './types';

// ============================================================================
// STATS DEFINITIONS
// ============================================================================

/**
 * Stats definitions for report list
 */
export const reportStats: StatDefinition<Report>[] = [
  {
    label: 'Enabled Reports',
    value: (items: Report[]) => Array.isArray(items) ? items.filter((r: Report) => r.active).length : 0,
  },
  {
    label: 'Disabled Reports',
    value: (items: Report[]) => Array.isArray(items) ? items.filter((r: Report) => !r.active).length : 0,
  },
  {
    label: 'Total Reports',
    value: (items: Report[]) => Array.isArray(items) ? items.length : 0,
  },
];

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

/**
 * Export configuration for report list
 */
export const reportExportConfig: ExportConfig<Report> = {
  filename: (date: string) => `reports_export_${date}.csv`,
  headers: [
    'Name',
    'Type',
    'Schedule',
    'Recipients',
    'Active',
    'Created',
    'Updated',
  ],
  mapRow: (report: Report) => [
    report.name,
    report.type,
    report.schedule,
    Array.isArray(report.recipients) ? report.recipients.join('; ') : '',
    report.active ? 'Yes' : 'No',
    report.created_at ? new Date(report.created_at).toISOString() : '',
    report.updated_at ? new Date(report.updated_at).toISOString() : '',
  ],
  includeInfo: 'Report export with configuration details',
};
