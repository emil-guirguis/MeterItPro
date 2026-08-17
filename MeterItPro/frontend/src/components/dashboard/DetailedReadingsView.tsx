import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService, type DashboardCard, type DetailedReadingsResponse } from '../../services/dashboardService';
import './DetailedReadingsView.css';

interface DetailedReadingsViewProps {
  cardId: number;
  card?: DashboardCard;
  onBack?: () => void;
}

export const DetailedReadingsView: React.FC<DetailedReadingsViewProps> = ({
  cardId,
  onBack
}) => {
  const [data, setData] = useState<DetailedReadingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [exporting, setExporting] = useState(false);

  // Fetch detailed readings
  const fetchReadings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getDetailedReadings(cardId, {
        page,
        pageSize,
        sortBy,
        sortOrder,
      });
      setData(response);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch detailed readings';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [cardId, page, pageSize, sortBy, sortOrder]);

  // Load data on mount and when parameters change
  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column with descending order
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(parseInt(e.target.value, 10));
    setPage(1); // Reset to first page
  };

  // Handle CSV export
  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await dashboardService.exportReadingsToCSV(cardId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const meterElementName = data?.card_info?.meter_element_name || 'readings';
      link.download = `${meterElementName}-${timestamp}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to export readings';
      setError(errorMsg);
    } finally {
      setExporting(false);
    }
  };

  // Handle email
  const handleEmail = async () => {
    try {
      const blob = await dashboardService.exportReadingsToCSV(cardId);
      
      // Create download link for email
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const meterElementName = data?.card_info?.meter_element_name || 'readings';
      const filename = `${meterElementName}-${timestamp}.csv`;
      
      // Create mailto URL
      const subject = encodeURIComponent(`Meter Readings Export - ${meterElementName} (${timestamp})`);
      const body = encodeURIComponent(`Please find the attached meter readings export file: ${filename}`);
      const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
      
      // Open email client
      window.location.href = mailtoUrl;
      
      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to open email client';
      setError(errorMsg);
    }
  };

  // Handle back button
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    onBack?.();
  };

  // Format number with commas
  const formatNumber = (value: any): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '--';
    }
    if (typeof value === 'number') {
      return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return String(value);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get column headers (timestamp + selected columns)
  const getColumnHeaders = (): string[] => {
    if (!data || !data.items || data.items.length === 0) {
      return ['created_at'];
    }
    
    // Get all keys from first item, excluding meter_reading_id
    const firstItem = data.items[0];
    return Object.keys(firstItem).filter(key => key !== 'meter_reading_id');
  };

  // Get sort indicator
  const getSortIndicator = (column: string): string => {
    if (sortBy !== column) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  if (loading && !data) {
    return (
      <div className="detailed-readings-view">
        <div className="detailed-readings-view__loading">
          <div className="detailed-readings-view__spinner"></div>
          <p>Loading detailed readings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detailed-readings-view">
        <div className="detailed-readings-view__error">
          <p>Error: {error}</p>
          <button
            type="button"
            className="detailed-readings-view__retry-btn"
            onClick={() => fetchReadings()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const columns = getColumnHeaders();
  const hasData = data && data.items && data.items.length > 0;

  return (
    <div className="detailed-readings-view">
      {/* Header */}
      <div className="detailed-readings-view__header">
        <div className="detailed-readings-view__title-section">
          <button
            type="button"
            className="detailed-readings-view__back-btn"
            onClick={handleBack}
            title="Back to dashboard"
            aria-label="Back"
          >
            ← Back to Dashboard
          </button>
          <div className="detailed-readings-view__title-info">
            <h2 className="detailed-readings-view__title">
              {data?.card_info?.card_name || 'Detailed Readings'}
            </h2>
            {data?.card_info && (
              <div className="detailed-readings-view__metadata">
                <span className="detailed-readings-view__meter-element">
                  📊 {data.card_info.meter_element_name}
                </span>
                <span className="detailed-readings-view__time-frame">
                  📅 {new Date(data.card_info.time_frame.start).toLocaleDateString()} - {new Date(data.card_info.time_frame.end).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="detailed-readings-view__actions">
          <button
            type="button"
            className="detailed-readings-view__export-btn"
            onClick={handleExport}
            disabled={exporting || !hasData}
            title="Export to CSV"
          >
            {exporting ? '⬇️ Exporting...' : '⬇️ Export CSV'}
          </button>
          <button
            type="button"
            className="detailed-readings-view__email-btn"
            onClick={handleEmail}
            disabled={!hasData}
            title="Email readings"
          >
            ✉️ Email
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="detailed-readings-view__controls">
        <div className="detailed-readings-view__page-size">
          <label htmlFor="page-size">Rows per page:</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="detailed-readings-view__page-size-select"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="250">250</option>
          </select>
        </div>
        {data?.pagination && (
          <div className="detailed-readings-view__row-count">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.pagination.total)} of {data.pagination.total} rows
          </div>
        )}
      </div>

      {/* Data Grid */}
      <div className="detailed-readings-view__grid-container">
        {hasData ? (
          <table className="detailed-readings-view__grid">
            <thead className="detailed-readings-view__grid-head">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className={`detailed-readings-view__grid-header ${sortBy === column ? 'detailed-readings-view__grid-header--active' : ''}`}
                    onClick={() => handleSort(column)}
                  >
                    <span className="detailed-readings-view__header-text">
                      {column.replace(/_/g, ' ').toUpperCase()}
                      {getSortIndicator(column)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="detailed-readings-view__grid-body">
              {data.items.map((row, index) => (
                <tr key={row.meter_reading_id || index} className="detailed-readings-view__grid-row">
                  {columns.map((column) => (
                    <td
                      key={`${row.meter_reading_id}-${column}`}
                      className={`detailed-readings-view__grid-cell ${column === 'created_at' ? 'detailed-readings-view__grid-cell--timestamp' : ''}`}
                    >
                      {column === 'created_at'
                        ? formatTimestamp(row[column])
                        : formatNumber(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="detailed-readings-view__empty">
            <p>No meter readings available for this card.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="detailed-readings-view__pagination">
          <button
            type="button"
            className="detailed-readings-view__pagination-btn"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            ← Previous
          </button>
          <div className="detailed-readings-view__pagination-info">
            Page {page} of {data.pagination.totalPages}
          </div>
          <button
            type="button"
            className="detailed-readings-view__pagination-btn"
            onClick={() => handlePageChange(page + 1)}
            disabled={!data.pagination.hasMore}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};
