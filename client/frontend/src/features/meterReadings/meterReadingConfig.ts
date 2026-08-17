/**
 * Meter Reading Configuration
 * 
 * Read-only configuration for MeterReading entity including:
 * - List columns, filters, stats
 * - Export configuration
 * 
 * Note: Meter readings are read-only (no form/create/edit functionality)
 */

import React from 'react';
import type { ColumnDefinition } from '../../types/ui';
import type { FilterDefinition, StatDefinition, ExportConfig } from '@meterit/framework-frontend/components/list/types/list';
import { registerMappingService } from '../../services/registerMappingService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * MeterReading TypeScript type
 */
export interface MeterReading {
  meter_reading_id: string;
  meter_id: number;
  tenant_id: number;
  created_at: string | Date;
  sync_status?: string | null;

  // Meter and element info (from joins)
  meter_name?: string | null;
  element_name?: string | null;
  element_number?: number | null;

  // Energy metrics
  kwh?: number | null;

  // Power metrics
  kw?: number | null;
  phase_kw_a?: number | null;
  phase_kw_b?: number | null;
  phase_kw_c?: number | null;
  kva?: number | null;
  kvar?: number | null;

  // Current metrics
  amperage?: number | null;
  phase_amperage_a?: number | null;
  phase_amperage_b?: number | null;
  phase_amperage_c?: number | null;

  // Voltage metrics
  voltage_a_n?: number | null;
  voltage_b_n?: number | null;
  voltage_c_n?: number | null;
  voltage_p_n?: number | null;

  // Power factor metrics
  pf?: number | null;
  pf_a?: number | null;
  pf_b?: number | null;
  pf_c?: number | null;

  // Other metrics
  frequency?: number | null;
  peak_kw?: number | null;
  total_thdv?: number | null;

  // Sync/system fields
  meter_element_id?: number | null;
  is_synchronized?: boolean | null;
  retry_count?: number | null;

  // Additional fields
  [key: string]: any;
}

// ============================================================================
// LIST CONFIGURATION
// ============================================================================

/**
 * Helper function to create column label with register name and unit
 */
function getColumnLabel(fieldName: string, defaultLabel: string): string {
  const registerName = registerMappingService.getRegisterName(fieldName);
  const unit = registerMappingService.getRegisterUnit(fieldName);
  
  if (unit) {
    return `${registerName} (${unit})`;
  }
  return registerName || defaultLabel;
}

/**
 * Column definitions for meter reading list
 */
export const meterReadingColumns: ColumnDefinition<MeterReading>[] = [
  {
    key: 'created_at' as keyof MeterReading,
    label: 'Reading Time',
    sortable: true,
    render: (value) => {
      if (!value) return React.createElement('span', { className: 'text-muted' }, '—');
      const date = new Date(value);
      // Format as YYYY-MM-DD HH:MM:SS (military time)
      const formatted = date.toISOString().replace('T', ' ').substring(0, 19);
      return React.createElement('span', { className: 'font-mono text-sm' }, formatted);
    },
  },
  
  {
    key: 'kwh' as keyof MeterReading,
    label: getColumnLabel('kwh', 'Energy (kWh)'),
    sortable: true,
    responsive: 'hide-mobile',
    render: (value) => {
      const energy = value as number | null;
      if (energy === null || energy === undefined) return React.createElement('span', { className: 'text-muted' }, '—');
      return React.createElement('span', { className: 'font-mono' }, energy.toFixed(2));
    },
  },

  {
    key: 'kw' as keyof MeterReading,
    label: getColumnLabel('kw', 'Power (kW)'),
    sortable: true,
    responsive: 'hide-mobile',
    render: (value) => {
      const power = value as number | null;
      if (power === null || power === undefined) return React.createElement('span', { className: 'text-muted' }, '—');
      return React.createElement('span', { className: 'font-mono' }, power.toFixed(2));
    },
  },

  {
    key: 'voltage_p_n' as keyof MeterReading,
    label: getColumnLabel('voltage_p_n', 'Voltage (V)'),
    sortable: true,
    responsive: 'hide-tablet',
    render: (value) => {
      const voltage = value as number | null;
      if (voltage === null || voltage === undefined) return React.createElement('span', { className: 'text-muted' }, '—');
      return React.createElement('span', { className: 'font-mono' }, voltage.toFixed(1));
    },
  },

  {
    key: 'amperage' as keyof MeterReading,
    label: getColumnLabel('amperage', 'Current (A)'),
    sortable: true,
    responsive: 'hide-tablet',
    render: (value) => {
      const current = value as number | null;
      if (current === null || current === undefined) return React.createElement('span', { className: 'text-muted' }, '—');
      return React.createElement('span', { className: 'font-mono' }, current.toFixed(2));
    },
  },
];

/**
 * Filter definitions for meter reading list
 */
export const meterReadingFilters: FilterDefinition[] = [
  {
    key: 'meter_id',
    label: 'Meter ID',
    type: 'text',
    placeholder: 'Filter by meter ID',
  },
];

/**
 * Stats definitions for meter reading list
 */
export const meterReadingStats: StatDefinition<MeterReading>[] = [
  {
    label: 'Total Readings',
    value: (items) => Array.isArray(items) ? items.length : 0,
  },
  {
    label: `Total ${registerMappingService.getRegisterName('kwh')}`,
    value: (items) => {
      if (!Array.isArray(items)) return '0.00';
      const total = items.reduce((sum, item) => sum + (item.kwh || 0), 0);
      return total.toFixed(2);
    },
  },
  {
    label: `Avg ${registerMappingService.getRegisterName('kw')}`,
    value: (items) => {
      if (!Array.isArray(items)) return '0.00';
      const validItems = items.filter(item => item.kw !== null && item.kw !== undefined);
      if (validItems.length === 0) return '0.00';
      const avg = validItems.reduce((sum, item) => sum + (item.kw || 0), 0) / validItems.length;
      return avg.toFixed(2);
    },
  },
  {
    label: `Avg ${registerMappingService.getRegisterName('pf')}`,
    value: (items) => {
      if (!Array.isArray(items)) return '0.00';
      const validItems = items.filter(item => item.pf !== null && item.pf !== undefined);
      if (validItems.length === 0) return '0.00';
      const avg = validItems.reduce((sum, item) => sum + (item.pf || 0), 0) / validItems.length;
      return avg.toFixed(2);
    },
  },
];

/**
 * Export configuration for meter reading list
 */
export const meterReadingExportConfig: ExportConfig<MeterReading> = {
  filename: (date: string) => `meter_reading_export_${date}.csv`,
  headers: [
    'Meter ID',
    'Reading Time',
    registerMappingService.getRegisterName('kwh'),
    registerMappingService.getRegisterName('kw'),
    registerMappingService.getRegisterName('voltage_p_n'),
    registerMappingService.getRegisterName('amperage'),
    registerMappingService.getRegisterName('pf'),
    registerMappingService.getRegisterName('frequency'),
    'Sync Status',
  ],
  mapRow: (reading: MeterReading) => [
    reading.meter_id?.toString() || '',
    new Date(reading.created_at).toISOString().replace('T', ' ').substring(0, 19),
    reading.kwh?.toString() || '',
    reading.kw?.toFixed(2) || '',
    reading.voltage_p_n?.toString() || '',
    reading.amperage?.toString() || '',
    reading.pf?.toString() || '',
    reading.frequency?.toString() || '',
    reading.sync_status || '',
  ],
  includeInfo: 'Meter reading export with energy, power, voltage, current, and power factor data',
};
