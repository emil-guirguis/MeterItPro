/**
 * Reports Framework - ReportHeader Component
 * 
 * Displays report title, metadata, and action buttons.
 */

import React from 'react';
import type { Report, ReportFormat } from '../types/report';
import './ReportHeader.css';

export interface ReportHeaderProps {
  /** Report data */
  report: Report;
  
  /** Available export formats */
  exportFormats?: ReportFormat[];
  
  /** Callback when export is requested */
  onExport?: (format: ReportFormat) => void;
  
  /** Callback when print is requested */
  onPrint?: () => void;
  
  /** Additional actions */
  actions?: React.ReactNode;
  
  /** Whether to show metadata */
  showMetadata?: boolean;
  
  /** Custom class name */
  className?: string;
}

/**
 * Report header component with title, metadata, and actions
 * 
 * @example
 * ```tsx
 * <ReportHeader
 *   report={report}
 *   exportFormats={['pdf', 'excel', 'csv']}
 *   onExport={(format) => downloadReport(format)}
 *   showMetadata
 * />
 * ```
 */
export const ReportHeader: React.FC<ReportHeaderProps> = ({
  report,
  exportFormats = ['pdf', 'excel', 'csv'],
  onExport,
  onPrint,
  actions,
  showMetadata = true,
  className = '',
}) => {
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLabel = (format: ReportFormat): string => {
    const labels: Record<ReportFormat, string> = {
      pdf: 'PDF',
      excel: 'Excel',
      csv: 'CSV',
      json: 'JSON',
    };
    return labels[format] || format.toUpperCase();
  };

  return (
    <div className={`report-header ${className}`}>
      <div className="report-header__content">
        <div className="report-header__title-section">
          <h1 className="report-header__title">{report.title}</h1>
          {report.description && (
            <p className="report-header__description">{report.description}</p>
          )}
        </div>

        {showMetadata && (
          <div className="report-header__metadata">
            <div className="report-header__metadata-item">
              <span className="report-header__metadata-label">Generated:</span>
              <span className="report-header__metadata-value">
                {formatDate(report.generatedAt)}
              </span>
            </div>

            {report.metadata?.period && (
              <div className="report-header__metadata-item">
                <span className="report-header__metadata-label">Period:</span>
                <span className="report-header__metadata-value">
                  {formatDate(report.metadata.period.startDate)} -{' '}
                  {formatDate(report.metadata.period.endDate)}
                </span>
              </div>
            )}

            {report.metadata?.recordCount !== undefined && (
              <div className="report-header__metadata-item">
                <span className="report-header__metadata-label">Records:</span>
                <span className="report-header__metadata-value">
                  {report.metadata.recordCount.toLocaleString()}
                </span>
              </div>
            )}

            {report.metadata?.author && (
              <div className="report-header__metadata-item">
                <span className="report-header__metadata-label">Author:</span>
                <span className="report-header__metadata-value">
                  {report.metadata.author}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="report-header__actions">
        {exportFormats.length > 0 && onExport && (
          <div className="report-header__export">
            <span className="report-header__export-label">Export:</span>
            <div className="report-header__export-buttons">
              {exportFormats.map((format) => (
                <button
                  key={format}
                  type="button"
                  className="report-header__export-btn"
                  onClick={() => onExport(format)}
                  title={`Export as ${formatLabel(format)}`}
                >
                  {formatLabel(format)}
                </button>
              ))}
            </div>
          </div>
        )}

        {onPrint && (
          <button
            type="button"
            className="report-header__print-btn"
            onClick={onPrint}
            title="Print report"
          >
            🖨️ Print
          </button>
        )}

        {actions && <div className="report-header__custom-actions">{actions}</div>}
      </div>
    </div>
  );
};
