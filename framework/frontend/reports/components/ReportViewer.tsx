/**
 * Reports Framework - ReportViewer Component
 * 
 * Displays generated reports with support for multiple section types.
 */

import React from 'react';
import type {
  Report,
  ReportSection,
  ReportTableColumn,
  ReportSummary,
} from '../types/report';
import './ReportViewer.css';

export interface ReportViewerProps {
  /** Report to display */
  report: Report | null;
  
  /** Whether report is loading */
  isLoading?: boolean;
  
  /** Error message */
  error?: string | null;
  
  /** Custom class name */
  className?: string;
  
  /** Custom section renderers */
  sectionRenderers?: {
    [key: string]: (section: ReportSection, data: any) => React.ReactNode;
  };
}

/**
 * Report viewer component that displays report content
 * 
 * @example
 * ```tsx
 * <ReportViewer
 *   report={report}
 *   isLoading={isLoading}
 *   error={error}
 * />
 * ```
 */
export const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  isLoading = false,
  error = null,
  className = '',
  sectionRenderers = {},
}) => {
  if (isLoading) {
    return (
      <div className={`report-viewer ${className}`}>
        <div className="report-viewer__container">
          <div className="report-viewer__loading">
            <div className="report-viewer__spinner" />
            <p className="report-viewer__loading-text">Generating report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`report-viewer ${className}`}>
        <div className="report-viewer__container">
          <div className="report-viewer__error">
            <div className="report-viewer__error-icon">⚠️</div>
            <h2 className="report-viewer__error-title">Report Generation Failed</h2>
            <p className="report-viewer__error-message">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className={`report-viewer ${className}`}>
        <div className="report-viewer__container">
          <div className="report-viewer__empty">
            <div className="report-viewer__empty-icon">📄</div>
            <p className="report-viewer__empty-text">No report available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`report-viewer ${className}`}>
      <div className="report-viewer__container">
        <div className="report-viewer__content">
          {report.template.sections.map((section, index) => (
            <ReportSection
              key={index}
              section={section}
              data={report.data}
              customRenderer={sectionRenderers[section.type]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Individual report section component
 */
interface ReportSectionProps {
  section: ReportSection;
  data: any;
  customRenderer?: (section: ReportSection, data: any) => React.ReactNode;
}

const ReportSection: React.FC<ReportSectionProps> = ({
  section,
  data,
  customRenderer,
}) => {
  // Use custom renderer if provided
  if (customRenderer) {
    return <>{customRenderer(section, data)}</>;
  }

  const className = `report-viewer__section ${
    section.pageBreak ? 'report-viewer__section--page-break' : ''
  }`;

  switch (section.type) {
    case 'header':
    case 'footer':
      return (
        <div className={className}>
          {section.title && (
            <h2 className="report-viewer__section-title">{section.title}</h2>
          )}
          <div className="report-viewer__text">{section.content}</div>
        </div>
      );

    case 'text':
      return (
        <div className={className}>
          {section.title && (
            <h2 className="report-viewer__section-title">{section.title}</h2>
          )}
          <div className="report-viewer__text">{section.content}</div>
        </div>
      );

    case 'table':
      return (
        <div className={className}>
          {section.title && (
            <h2 className="report-viewer__section-title">{section.title}</h2>
          )}
          <TableSection content={section.content} />
        </div>
      );

    case 'summary':
      return (
        <div className={className}>
          {section.title && (
            <h2 className="report-viewer__section-title">{section.title}</h2>
          )}
          <SummarySection content={section.content} />
        </div>
      );

    case 'chart':
      return (
        <div className={className}>
          {section.title && (
            <h2 className="report-viewer__section-title">{section.title}</h2>
          )}
          <ChartSection content={section.content} />
        </div>
      );

    default:
      return (
        <div className={className}>
          {section.title && (
            <h2 className="report-viewer__section-title">{section.title}</h2>
          )}
          <div className="report-viewer__text">
            {JSON.stringify(section.content, null, 2)}
          </div>
        </div>
      );
  }
};

/**
 * Table section component
 */
interface TableSectionProps {
  content: {
    columns: ReportTableColumn[];
    data: any[];
  };
}

const TableSection: React.FC<TableSectionProps> = ({ content }) => {
  const { columns, data } = content;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="report-viewer__table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  textAlign: column.align || 'left',
                  width: column.width,
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => {
                const value = row[column.key];
                const formattedValue = column.format
                  ? column.format(value, row)
                  : value;

                return (
                  <td
                    key={column.key}
                    style={{ textAlign: column.align || 'left' }}
                  >
                    {formattedValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Summary section component
 */
interface SummarySectionProps {
  content: ReportSummary[];
}

const SummarySection: React.FC<SummarySectionProps> = ({ content }) => {
  const formatValue = (summary: ReportSummary): string => {
    const { value, format } = summary;

    if (typeof value === 'number') {
      switch (format) {
        case 'currency':
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(value);
        case 'percentage':
          return `${value.toFixed(2)}%`;
        case 'number':
          return value.toLocaleString();
        default:
          return String(value);
      }
    }

    if (format === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }

    return String(value);
  };

  return (
    <div className="report-viewer__summary">
      {content.map((summary, index) => (
        <div key={index} className="report-viewer__summary-item">
          <div className="report-viewer__summary-label">
            {summary.icon && <span>{summary.icon} </span>}
            {summary.label}
          </div>
          <div className="report-viewer__summary-value">
            {formatValue(summary)}
          </div>
          {summary.trend && (
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              {summary.trend.direction === 'up' && '↑'}
              {summary.trend.direction === 'down' && '↓'}
              {summary.trend.direction === 'neutral' && '→'}
              {' '}
              {summary.trend.value}
              {summary.trend.label && ` ${summary.trend.label}`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Chart section component (placeholder)
 */
interface ChartSectionProps {
  content: any;
}

const ChartSection: React.FC<ChartSectionProps> = ({ content }) => {
  return (
    <div className="report-viewer__chart">
      <div style={{ textAlign: 'center', color: '#6b7280' }}>
        <p>Chart visualization</p>
        <p style={{ fontSize: '0.875rem' }}>
          Chart type: {content.type || 'unknown'}
        </p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
          Integrate with a charting library (e.g., Chart.js, Recharts) for visualization
        </p>
      </div>
    </div>
  );
};
