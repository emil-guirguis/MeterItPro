/**
 * ReadingDataTable Component
 * 
 * Displays meter reading values organized by section and phase in a table format.
 * Shows Overall, Phase 1, Phase 2, and Phase 3 columns with numeric values and units.
 * Handles null/missing phase data with indicators.
 */

import React from 'react';
import type { MeterReading } from './types';

/**
 * Props for the ReadingDataTable component
 */
export interface ReadingDataTableProps {
  reading: MeterReading;
}

/**
 * Placeholder text for missing data
 */
const PLACEHOLDER_TEXT = '—';

/**
 * Format a numeric value with appropriate precision
 */
const formatValue = (value: number | string | null): string => {
  if (value === null || value === undefined || value === '') {
    return PLACEHOLDER_TEXT;
  }
  
  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if conversion resulted in NaN
  if (isNaN(numValue)) {
    return PLACEHOLDER_TEXT;
  }
  
  // Format to 2 decimal places, removing trailing zeros
  return parseFloat(numValue.toFixed(2)).toString();
};

/**
 * ReadingDataTable Component
 * 
 * Displays meter reading values organized into sections with phase columns.
 * Each section contains metrics with Overall, Phase 1, Phase 2, and Phase 3 values.
 * Includes frequency display with Hz unit.
 * 
 * @param reading - The meter reading object containing sections and metrics
 */
export const ReadingDataTable: React.FC<ReadingDataTableProps> = ({
  reading,
}) => {
  // Get all section names from the reading
  const sectionNames = Object.keys(reading.sections || {});

  // If no sections, show empty state
  if (sectionNames.length === 0) {
    return (
      <div className="reading-data-table reading-data-table--empty">
        <p className="reading-data-table__empty-message">
          No reading data available
        </p>
      </div>
    );
  }

  return (
    <div className="reading-data-table">
      {/* Render each section as a separate table */}
      {sectionNames.map((sectionName) => {
        const section = reading.sections[sectionName];
        const metricNames = Object.keys(section || {});

        return (
          <div key={sectionName} className="reading-data-table__section">
            <h3 className="reading-data-table__section-title">{sectionName}</h3>

            <table className="reading-data-table__table">
              <thead>
                <tr>
                  <th className="reading-data-table__header reading-data-table__header--metric">
                    Metric
                  </th>
                  <th className="reading-data-table__header reading-data-table__header--overall">
                    Overall
                  </th>
                  <th className="reading-data-table__header reading-data-table__header--phase">
                    Phase 1
                  </th>
                  <th className="reading-data-table__header reading-data-table__header--phase">
                    Phase 2
                  </th>
                  <th className="reading-data-table__header reading-data-table__header--phase">
                    Phase 3
                  </th>
                </tr>
              </thead>
              <tbody>
                {metricNames.map((metricName) => {
                  const metric = section[metricName];

                  return (
                    <tr key={metricName} className="reading-data-table__row">
                      <td className="reading-data-table__cell reading-data-table__cell--metric">
                        {metricName}
                      </td>
                      <td className="reading-data-table__cell reading-data-table__cell--value">
                        <span className="reading-data-table__value">
                          {formatValue(metric.overall)}
                        </span>
                        <span className="reading-data-table__unit">
                          {metric.unit}
                        </span>
                      </td>
                      <td className="reading-data-table__cell reading-data-table__cell--value">
                        <span className="reading-data-table__value">
                          {formatValue(metric.phase1)}
                        </span>
                        <span className="reading-data-table__unit">
                          {metric.unit}
                        </span>
                      </td>
                      <td className="reading-data-table__cell reading-data-table__cell--value">
                        <span className="reading-data-table__value">
                          {formatValue(metric.phase2)}
                        </span>
                        <span className="reading-data-table__unit">
                          {metric.unit}
                        </span>
                      </td>
                      <td className="reading-data-table__cell reading-data-table__cell--value">
                        <span className="reading-data-table__value">
                          {formatValue(metric.phase3)}
                        </span>
                        <span className="reading-data-table__unit">
                          {metric.unit}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Frequency Display */}
      <div className="reading-data-table__frequency">
        <div className="reading-data-table__frequency-item">
          <label className="reading-data-table__frequency-label">
            Frequency
          </label>
          <div className="reading-data-table__frequency-value">
            <span className="reading-data-table__value">
              {formatValue(reading.frequency)}
            </span>
            <span className="reading-data-table__unit">Hz</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingDataTable;
