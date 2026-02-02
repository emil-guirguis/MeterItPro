/**
 * DetailedMeterReadingView Component
 * 
 * Displays a comprehensive meter reading view with:
 * - Meter information (driver, description, serial number)
 * - Total consumption and generation metrics
 * - Phase-based electrical measurements table
 * - Frequency display
 * - Consumption graphs
 */

import React, { useState } from 'react';
import './DetailedMeterReadingView.css';

interface MeterInfo {
  driver: string;
  description: string;
  serialNumber: string;
}

interface MeterReadingData {
  // Energy totals
  activeEnergyTotal: number;
  reactiveEnergyTotal: number;
  activeEnergyExport: number;
  reactiveEnergyExport: number;

  // Phase voltages (line-to-neutral)
  voltagePhaseA: number;
  voltagePhaseB: number;
  voltagePhaseC: number;

  // Line voltages (line-to-line)
  voltageAB: number;
  voltageBC: number;
  voltageCA: number;

  // Current per phase
  currentPhaseA: number;
  currentPhaseB: number;
  currentPhaseC: number;
  currentTotal: number;

  // Active power
  powerPhaseA: number;
  powerPhaseB: number;
  powerPhaseC: number;
  powerTotal: number;

  // Apparent power
  apparentPowerPhaseA: number;
  apparentPowerPhaseB: number;
  apparentPowerPhaseC: number;
  apparentPowerTotal: number;

  // Reactive power
  reactivePowerPhaseA: number;
  reactivePowerPhaseB: number;
  reactivePowerPhaseC: number;
  reactivePowerTotal: number;

  // Power factor
  powerFactorPhaseA: number;
  powerFactorPhaseB: number;
  powerFactorPhaseC: number;
  powerFactorTotal: number;

  // Frequency
  frequency: number;

  // Timestamp
  timestamp: Date;
}

interface DetailedMeterReadingViewProps {
  meterInfo: MeterInfo;
  reading: MeterReadingData;
  loading?: boolean;
  error?: string | null;
}

type TimePeriod = 'today' | 'weekly' | 'monthly' | 'yearly';
type GraphType = 'consumption' | 'demand' | 'ghg';

export const DetailedMeterReadingView: React.FC<DetailedMeterReadingViewProps> = ({
  meterInfo,
  reading,
  loading = false,
  error = null,
}) => {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('today');
  const [selectedGraphType, setSelectedGraphType] = useState<GraphType>('consumption');

  // Format number with specified decimals
  const formatNumber = (value: number | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00';
    }
    return value.toFixed(decimals);
  };

  if (loading) {
    return (
      <div className="detailed-reading-view detailed-reading-view--loading">
        <div className="loading-message">Loading meter reading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detailed-reading-view detailed-reading-view--error">
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detailed-reading-view">
      {/* Top Section: Meter Info and Energy Totals */}
      <div className="top-section">
        {/* Left: Meter Information */}
        <div className="meter-info-card">
          <div className="info-row">
            <span className="info-label">Meter Driver</span>
            <span className="info-value">: {meterInfo.driver}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Description</span>
            <span className="info-value">: {meterInfo.description}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Serial Number</span>
            <span className="info-value">: {meterInfo.serialNumber}</span>
          </div>
          {/* Frequency Display */}
          <div className="info-row">
            <div className="frequency-section">
              <span className="frequency-label">Frequency</span>
              <span className="frequency-colon">:</span>
              <span className="frequency-value">{formatNumber(reading.frequency, 2)}</span>
              <span className="frequency-unit">Hz</span>
            </div>
          </div>

        </div>

        {/* Right: Total Consumption and Generation */}
        <div className="energy-totals-card">
          <h3 className="card-title">Total Consumption</h3>
          <div className="energy-row">
            <span className="energy-label">Active</span>
            <span className="energy-colon">:</span>
            <span className="energy-value">{formatNumber(reading.activeEnergyTotal, 2)}</span>
            <span className="energy-unit">kWh</span>
          </div>
          <div className="energy-row">
            <span className="energy-label">Reactive</span>
            <span className="energy-colon">:</span>
            <span className="energy-value">{formatNumber(reading.reactiveEnergyTotal, 2)}</span>
            <span className="energy-unit">kVArh</span>
          </div>

          <h3 className="card-title">Total Generation</h3>
          <div className="energy-row">
            <span className="energy-label">Active</span>
            <span className="energy-colon">:</span>
            <span className="energy-value">{formatNumber(reading.activeEnergyExport, 2)}</span>
            <span className="energy-unit">kWh</span>
          </div>
          <div className="energy-row">
            <span className="energy-label">Reactive</span>
            <span className="energy-colon">:</span>
            <span className="energy-value">{formatNumber(reading.reactiveEnergyExport, 2)}</span>
            <span className="energy-unit">kVArh</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Phase Data Table */}
      <div className="phase-data-section">
        <table className="phase-data-table">
          <thead>
            <tr>
              <th className="metric-header"></th>
              <th className="value-header">Overall</th>
              <th className="value-header">Phase 1</th>
              <th className="value-header">Phase 2</th>
              <th className="value-header">Phase 3</th>
              <th className="unit-header">Unit</th>
            </tr>
          </thead>
          <tbody>
            {/* Phase Voltage */}
            <tr className="data-row data-row--primary">
              <td className="metric-name">Phase Voltage</td>
              <td className="value">{formatNumber((reading.voltagePhaseA + reading.voltagePhaseB + reading.voltagePhaseC) / 3, 2)}</td>
              <td className="value">{formatNumber(reading.voltagePhaseA, 2)}</td>
              <td className="value">{formatNumber(reading.voltagePhaseB, 2)}</td>
              <td className="value">{formatNumber(reading.voltagePhaseC, 2)}</td>
              <td className="unit">V</td>
            </tr>

            {/* Line Voltage */}
            <tr className="data-row">
              <td className="metric-name">Line Voltage</td>
              <td className="value">{formatNumber((reading.voltageAB + reading.voltageBC + reading.voltageCA) / 3, 2)}</td>
              <td className="value">{formatNumber(reading.voltageAB, 2)}</td>
              <td className="value">{formatNumber(reading.voltageBC, 2)}</td>
              <td className="value">{formatNumber(reading.voltageCA, 2)}</td>
              <td className="unit">V</td>
            </tr>

            {/* Current */}
            <tr className="data-row data-row--primary">
              <td className="metric-name">Current</td>
              <td className="value">{formatNumber(reading.currentTotal, 2)}</td>
              <td className="value">{formatNumber(reading.currentPhaseA, 2)}</td>
              <td className="value">{formatNumber(reading.currentPhaseB, 2)}</td>
              <td className="value">{formatNumber(reading.currentPhaseC, 2)}</td>
              <td className="unit">A</td>
            </tr>

            {/* Power */}
            <tr className="data-row">
              <td className="metric-name">Power</td>
              <td className="value">{formatNumber(reading.powerTotal, 2)}</td>
              <td className="value">{formatNumber(reading.powerPhaseA, 2)}</td>
              <td className="value">{formatNumber(reading.powerPhaseB, 2)}</td>
              <td className="value">{formatNumber(reading.powerPhaseC, 2)}</td>
              <td className="unit">kW</td>
            </tr>

            {/* Apparent Power */}
            <tr className="data-row data-row--primary">
              <td className="metric-name">Apparent Power</td>
              <td className="value">{formatNumber(reading.apparentPowerTotal, 2)}</td>
              <td className="value">{formatNumber(reading.apparentPowerPhaseA, 2)}</td>
              <td className="value">{formatNumber(reading.apparentPowerPhaseB, 2)}</td>
              <td className="value">{formatNumber(reading.apparentPowerPhaseC, 2)}</td>
              <td className="unit">kVA</td>
            </tr>

            {/* Reactive Power */}
            <tr className="data-row">
              <td className="metric-name">Reactive Power</td>
              <td className="value">{formatNumber(reading.reactivePowerTotal, 2)}</td>
              <td className="value">{formatNumber(reading.reactivePowerPhaseA, 2)}</td>
              <td className="value">{formatNumber(reading.reactivePowerPhaseB, 2)}</td>
              <td className="value">{formatNumber(reading.reactivePowerPhaseC, 2)}</td>
              <td className="unit">kVAr</td>
            </tr>

            {/* Power Factor */}
            <tr className="data-row data-row--primary">
              <td className="metric-name">Power Factor</td>
              <td className="value">{formatNumber(reading.powerFactorTotal, 2)}</td>
              <td className="value">{formatNumber(reading.powerFactorPhaseA, 2)}</td>
              <td className="value">{formatNumber(reading.powerFactorPhaseB, 2)}</td>
              <td className="value">{formatNumber(reading.powerFactorPhaseC, 2)}</td>
              <td className="unit"></td>
            </tr>
          </tbody>
        </table>
      </div>



      {/* Consumption Graphs */}
      <div className="consumption-graphs-section">
        <h2 className="section-title">Consumption Graphs</h2>
        <h3 className="graph-subtitle">Today's Usage</h3>

        <div className="graph-container">
          {/* Placeholder for graph - TODO: Implement chart component */}
          <div className="graph-placeholder">
            <p>Graph visualization will be displayed here</p>
            <p className="graph-note">(Chart component to be implemented)</p>
          </div>

          {/* Time Period Buttons */}
          <div className="time-controls">
            <button
              className={`time-button ${selectedTimePeriod === 'today' ? 'time-button--active' : ''}`}
              onClick={() => setSelectedTimePeriod('today')}
            >
              Today
            </button>
            <button
              className={`time-button ${selectedTimePeriod === 'weekly' ? 'time-button--active' : ''}`}
              onClick={() => setSelectedTimePeriod('weekly')}
            >
              Weekly
            </button>
            <button
              className={`time-button ${selectedTimePeriod === 'monthly' ? 'time-button--active' : ''}`}
              onClick={() => setSelectedTimePeriod('monthly')}
            >
              Monthly
            </button>
            <button
              className={`time-button ${selectedTimePeriod === 'yearly' ? 'time-button--active' : ''}`}
              onClick={() => setSelectedTimePeriod('yearly')}
            >
              Yearly
            </button>
          </div>

          {/* Graph Type Buttons */}
          <div className="graph-type-controls">
            <button
              className={`graph-type-button ${selectedGraphType === 'consumption' ? 'graph-type-button--active' : ''}`}
              onClick={() => setSelectedGraphType('consumption')}
            >
              Consumption
            </button>
            <button
              className={`graph-type-button ${selectedGraphType === 'demand' ? 'graph-type-button--active' : ''}`}
              onClick={() => setSelectedGraphType('demand')}
            >
              Demand
            </button>
            <button
              className={`graph-type-button ${selectedGraphType === 'ghg' ? 'graph-type-button--active' : ''}`}
              onClick={() => setSelectedGraphType('ghg')}
            >
              GHG Emissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedMeterReadingView;
