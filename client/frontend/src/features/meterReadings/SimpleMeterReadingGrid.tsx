import React from 'react';
import './SimpleMeterReadingGrid.css';

interface MeterReading {
  meter_reading_id?: number;
  meter_id?: number;
  tenant_id?: number;
  created_at?: string;
  meter_element_id?: number;
  power?: number;
  active_energy?: number;
  power_factor?: number;
  current?: number;
  voltage_p_n?: number;
  [key: string]: any;
}

interface SimpleMeterReadingGridProps {
  data: MeterReading[];
  loading?: boolean;
  error?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export const SimpleMeterReadingGrid: React.FC<SimpleMeterReadingGridProps> = ({
  data,
  loading = false,
  error,
  page = 1,
  pageSize = 20,
  total = 0,
  totalPages = 1,
  onPageChange,
}) => {
  if (error) {
    return (
      <div className="simple-grid-error">
        <p>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="simple-grid-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="simple-grid-empty">
        <p>No meter readings found</p>
      </div>
    );
  }

  // Get all unique keys from data to use as columns
  const allKeys = new Set<string>();
  data.forEach(row => {
    Object.keys(row).forEach(key => allKeys.add(key));
  });

  // Filter to only show important columns
  const importantColumns = [
    'created_at',
    'active_energy',
    'active_energy_export',
    'apparent_energy',
    'apparent_energy_export',
    'apparent_power',
    'apparent_power_phase_a',
    'apparent_power_phase_b',
    'apparent_power_phase_c',
    'current',
    'current_line_a',
    'current_line_b',
    'current_line_c',
    'frequency',
    'maximum_demand_real',
    'power',
    'power_factor',
    'power_factor_phase_a',
    'power_factor_phase_b',
    'power_factor_phase_c',
    'power_phase_a',
    'power_phase_b',
    'power_phase_c',
    'reactive_energy',
    'reactive_energy_export',
    'reactive_power',
    'reactive_power_phase_a',
    'reactive_power_phase_b',
    'reactive_power_phase_c',
    'voltage_a_b',
    'voltage_a_n',
    'voltage_b_c',
    'voltage_b_n',
    'voltage_c_a',
    'voltage_c_n',
    'voltage_p_n',
    'voltage_p_p',
    'voltage_thd',
    'voltage_thd_phase_a',
    'voltage_thd_phase_b',
    'voltage_thd_phase_c',
  ];

  const columns = importantColumns.filter(col => allKeys.has(col));

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'number') {
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (typeof value === 'string') {
      if (value.includes('T') || value.match(/^\d{4}-\d{2}-\d{2}/)) {
        return new Date(value).toLocaleString();
      }
      const num = parseFloat(value);
      if (!isNaN(num) && String(num) === value) {
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
    return String(value);
  };

  const formatColumnName = (col: string): string => {
    if (col === 'created_at') {
      return 'Timestamp';
    }
    // Convert snake_case to camelCase
    return col
      .split('_')
      .map((word, index) => {
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('');
  };

  return (
    <div className="simple-grid-container">
      <table className="simple-grid">
        <thead>
          <tr>
            {columns.map((col, colIdx) => (
              <th key={col} className={colIdx === 0 ? 'simple-grid__first-column' : ''}>{formatColumnName(col)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col, colIdx) => (
                <td key={`${idx}-${col}`} className={colIdx === 0 ? 'simple-grid__first-column' : ''}>{formatValue(row[col])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="simple-grid-pager">
        <span className="simple-grid-pager__info">
          {total > 0
            ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} records`
            : `Showing ${data.length} records`}
        </span>
        {totalPages > 1 && onPageChange && (
          <div className="simple-grid-pager__controls">
            <button
              className="simple-grid-pager__btn"
              onClick={() => onPageChange(1)}
              disabled={page <= 1}
              title="First page"
            >«</button>
            <button
              className="simple-grid-pager__btn"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              title="Previous page"
            >‹</button>
            <span className="simple-grid-pager__pages">
              Page {page} of {totalPages}
            </span>
            <button
              className="simple-grid-pager__btn"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              title="Next page"
            >›</button>
            <button
              className="simple-grid-pager__btn"
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages}
              title="Last page"
            >»</button>
          </div>
        )}
      </div>
    </div>
  );
};
