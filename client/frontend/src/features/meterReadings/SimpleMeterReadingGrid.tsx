import React, { useState, useEffect } from 'react';
import { registerMappingService } from '../../services/registerMappingService';
import './SimpleMeterReadingGrid.css';

interface MeterReading {
  meter_reading_id?: number;
  meter_id?: number;
  tenant_id?: number;
  created_at?: string;
  meter_element_id?: number;
  kw?: number;
  kwh?: number;
  pf?: number;
  amperage?: number;
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
  onPageSizeChange?: (pageSize: number) => void;
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
  onPageSizeChange,
}) => {
  const [selectedRowIdx, setSelectedRowIdx] = React.useState<number | null>(null);
  const [selectedColIdx, setSelectedColIdx] = React.useState<number | null>(null);
  const [pageInputValue, setPageInputValue] = useState<string>(String(page));

  useEffect(() => {
    setPageInputValue(String(page));
  }, [page]);

  const commitPageInput = () => {
    if (!onPageChange) return;
    const n = parseInt(pageInputValue, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      onPageChange(n);
    } else {
      setPageInputValue(String(page));
    }
  };

  const handleCellClick = (rowIdx: number, colIdx: number) => {
    if (selectedRowIdx === rowIdx && selectedColIdx === colIdx) {
      setSelectedRowIdx(null);
      setSelectedColIdx(null);
    } else {
      setSelectedRowIdx(rowIdx);
      setSelectedColIdx(colIdx);
    }
  };
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
    'kwh',
    'calculated_kwh',
    'kva',
    'phase_kva_a',
    'phase_kva_b',
    'phase_kva_c',
    'amperage',
    'phase_amperage_a',
    'phase_amperage_b',
    'phase_amperage_c',
    'frequency',
    'peak_kw',
    'kw',
    'pf',
    'pf_a',
    'pf_b',
    'pf_c',
    'phase_kw_a',
    'phase_kw_b',
    'phase_kw_c',
    'kvar',
    'phase_kvar_a',
    'phase_kvar_b',
    'phase_kvar_c',
    'voltage_a_b',
    'voltage_a_n',
    'voltage_b_c',
    'voltage_b_n',
    'voltage_c_a',
    'voltage_c_n',
    'voltage_p_n',
    'voltage_p_p',
    'total_thdv',
    'phase_thdv_a',
    'phase_thdv_b',
    'phase_thdv_c',
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
    if (col === 'created_at') return 'Timestamp';
    if (col === 'calculated_kwh') return 'Calc. kWh';

    // Try to get the register name from the mapping service
    const registerName = registerMappingService.getRegisterName(col);
    const unit = registerMappingService.getRegisterUnit(col);

    if (registerName && unit) {
      return `${registerName} (${unit})`;
    } else if (registerName) {
      return registerName;
    }

    // Fallback: Convert snake_case to Title Case
    return col
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="simple-grid-container">
      <table className="simple-grid">
        <thead>
          <tr>
            {columns.map((col, colIdx) => {
              let thClassName = '';
              if (colIdx === 0) thClassName += 'simple-grid__first-column';
              if (selectedColIdx === colIdx) thClassName += (thClassName ? ' ' : '') + 'simple-grid__col--selected';
              return (
                <th
                  key={col}
                  className={thClassName}
                  onClick={() => handleCellClick(-1, colIdx)}
                >
                  {formatColumnName(col)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={selectedRowIdx === idx ? 'simple-grid__row--selected' : ''}
            >
              {columns.map((col, colIdx) => {
                let tdClassName = '';
                if (colIdx === 0) tdClassName += 'simple-grid__first-column';
                if (selectedColIdx === colIdx) tdClassName += (tdClassName ? ' ' : '') + 'simple-grid__col--selected';
                return (
                  <td
                    key={`${idx}-${col}`}
                    className={tdClassName}
                    onClick={() => handleCellClick(idx, colIdx)}
                  >
                    {formatValue(row[col])}
                  </td>
                );
              })}
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
        {onPageSizeChange && (
          <select
            className="simple-grid-pager__size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Records per page"
          >
            {[10, 20, 50, 100].map(n => (
              <option key={n} value={n}>{n} per page</option>
            ))}
          </select>
        )}
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
              <input
                type="text"
                className="simple-grid-pager__page-input"
                value={pageInputValue}
                onChange={(e) => setPageInputValue(e.target.value)}
                onBlur={commitPageInput}
                onKeyDown={(e) => { if (e.key === 'Enter') commitPageInput(); }}
                aria-label="Current page"
              />
              <span className="simple-grid-pager__page-of">of {totalPages}</span>
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
