/**
 * MeterInfoPanel Component
 * 
 * Displays meter metadata and information including driver name, description,
 * serial number, and reading timestamp.
 */

import React from 'react';
import type { Meter, MeterReading } from './types';

/**
 * Props for the MeterInfoPanel component
 */
export interface MeterInfoPanelProps {
  meter: Meter;
  reading: MeterReading;
}

/**
 * Placeholder text for missing data
 */
const PLACEHOLDER_TEXT = 'N/A';

/**
 * Format a date to a readable string
 */
const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return PLACEHOLDER_TEXT;
    }
    return dateObj.toLocaleString();
  } catch {
    return PLACEHOLDER_TEXT;
  }
};

/**
 * MeterInfoPanel Component
 * 
 * Displays meter information in a structured panel format with proper
 * handling of missing data using placeholder text.
 * 
 * @param meter - The meter object containing driver, description, and serial number
 * @param reading - The meter reading object containing the timestamp
 */
export const MeterInfoPanel: React.FC<MeterInfoPanelProps> = ({
  meter,
  reading,
}) => {
  /**
   * Build description in the format: [meter name] (element number) element name
   * This matches the favorite caption format for consistency
   */
  const getFormattedDescription = (): string => {
    if (meter.meterName && meter.elementName && meter.elementNumber) {
      return `${meter.meterName} (${meter.elementNumber}) ${meter.elementName}`;
    }
    return meter.description || PLACEHOLDER_TEXT;
  };

  return (
    <div className="meter-info-panel">
      <div className="meter-info-panel__grid">
        {/* Driver Name */}
        <div className="meter-info-panel__item">
          <label className="meter-info-panel__label">Driver</label>
          <p className="meter-info-panel__value">
            {meter.driver || PLACEHOLDER_TEXT}
          </p>
        </div>

        {/* Description */}
        <div className="meter-info-panel__item">
          <label className="meter-info-panel__label">Description</label>
          <p className="meter-info-panel__value">
            {getFormattedDescription()}
          </p>
        </div>

        {/* Serial Number */}
        <div className="meter-info-panel__item">
          <label className="meter-info-panel__label">Serial Number</label>
          <p className="meter-info-panel__value">
            {meter.serialNumber || PLACEHOLDER_TEXT}
          </p>
        </div>

        {/* Reading Timestamp */}
        <div className="meter-info-panel__item">
          <label className="meter-info-panel__label">Reading Timestamp</label>
          <p className="meter-info-panel__value">
            {formatDate(reading.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MeterInfoPanel;
