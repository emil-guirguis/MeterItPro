import React, { useState } from 'react';
import { useMeterSelection } from '../../contexts/MeterSelectionContext';
import { useAuth } from '../../hooks/useAuth';
import { ConsumptionGraph } from './ConsumptionGraph';
import { DemandGraph } from './DemandGraph';
import './DetailedMeterReadingView.css';

interface MeterInfo {
  driver: string;
  description: string;
  serialNumber: string;
}

interface MeterReadingData {
  activeEnergyTotal: number;
  maximumDemandReal: number;
  voltagePhaseA: number;
  voltagePhaseB: number;
  voltagePhaseC: number;
  voltageAB: number;
  voltageBC: number;
  voltageCA: number;
  currentPhaseA: number;
  currentPhaseB: number;
  currentPhaseC: number;
  currentTotal: number;
  powerPhaseA: number;
  powerPhaseB: number;
  powerPhaseC: number;
  powerTotal: number;
  apparentPowerPhaseA: number;
  apparentPowerPhaseB: number;
  apparentPowerPhaseC: number;
  apparentPowerTotal: number;
  reactivePowerPhaseA: number;
  reactivePowerPhaseB: number;
  reactivePowerPhaseC: number;
  reactivePowerTotal: number;
  powerFactorPhaseA: number;
  powerFactorPhaseB: number;
  powerFactorPhaseC: number;
  powerFactorTotal: number;
  frequency: number;
  timestamp: Date;
}

interface DetailedMeterReadingViewProps {
  meterInfo: MeterInfo;
  reading: MeterReadingData;
  loading?: boolean;
  error?: string | null;
  onViewAllReadings?: () => void;
}

type TimePeriod = 'today' | 'weekly' | 'monthly' | 'yearly';
type GraphType = 'consumption' | 'demand';

export const DetailedMeterReadingView: React.FC<DetailedMeterReadingViewProps> = ({
  meterInfo,
  reading,
  loading = false,
  error = null,
  onViewAllReadings,
}) => {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('today');
  const [selectedGraphType, setSelectedGraphType] = useState<GraphType>('consumption');
  const [offset, setOffset] = useState<number>(0);

  const { selectedMeter, selectedElement } = useMeterSelection();
  const { user } = useAuth();

  const handleTimePeriodChange = (period: TimePeriod) => {
    setSelectedTimePeriod(period);
    setOffset(0);
  };

  const formatNumber = (value: number | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(value)) return '0.00';
    return value.toFixed(decimals);
  };

  const getPeriodSubtitle = (): string => {
    const now = new Date();
    if (selectedTimePeriod === 'today') {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (selectedTimePeriod === 'weekly') {
      return `Week of ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (selectedTimePeriod === 'monthly') {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return String(now.getFullYear() + offset);
  };

  if (loading) return <div className="detailed-reading-view--loading">Loading meter reading...</div>;
  if (error) return <div className="detailed-reading-view--error">Error: {error}</div>;

  return (
    <div className="detailed-reading-view">
      {/* Main Content */}
      <div className="main-content">
        {/* Left: Meter Information */}
        <div className="meter-info-card">
          <div className="info-row">
            <span className="info-label">Description</span>
            <span className="info-value info-value--bold">{meterInfo.description}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Serial Number</span>
            <span className="info-value">{meterInfo.serialNumber}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Reading Date</span>
            <span className="info-value">
              {reading.timestamp ? new Date(reading.timestamp).toLocaleString() : 'N/A'}
            </span>
          </div>
          <hr className="meter-info-divider" />
          <div className="info-row">
            <span className="total-label">Total kWh</span>
            <span className="total-value">{formatNumber(reading.activeEnergyTotal)} <span className="total-unit">kWh</span></span>
          </div>
          <div className="info-row">
            <span className="total-label">Peak Demand</span>
            <span className="total-value">{formatNumber(reading.maximumDemandReal)} <span className="total-unit">kW</span></span>
          </div>
          <div className="info-row">
            <span className="total-label">Frequency</span>
            <span className="total-value">{formatNumber(reading.frequency)} <span className="total-unit">Hz</span></span>
          </div>

          {onViewAllReadings && (
            <div className="meter-info-card-actions">
              <button
                type="button"
                className="view-all-readings-btn"
                onClick={onViewAllReadings}
              >
                View All Readings
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Totals + Phase Table */}
        <div className="right-column">
          {/* Phase Data Table */}
          <div className="phase-data-section">
            <table className="phase-data-table">
              <thead>
                <tr>
                  <th className="metric-header"></th>
                  <th>Overall</th>
                  <th>Phase 1</th>
                  <th>Phase 2</th>
                  <th>Phase 3</th>
                  <th className="unit-header">Unit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="metric-name">Phase Voltage</td>
                  <td>{formatNumber((reading.voltagePhaseA + reading.voltagePhaseB + reading.voltagePhaseC) / 3)}</td>
                  <td>{formatNumber(reading.voltagePhaseA)}</td>
                  <td>{formatNumber(reading.voltagePhaseB)}</td>
                  <td>{formatNumber(reading.voltagePhaseC)}</td>
                  <td className="unit">V</td>
                </tr>
                <tr>
                  <td className="metric-name">Line Voltage</td>
                  <td>{formatNumber((reading.voltageAB + reading.voltageBC + reading.voltageCA) / 3)}</td>
                  <td>{formatNumber(reading.voltageAB)}</td>
                  <td>{formatNumber(reading.voltageBC)}</td>
                  <td>{formatNumber(reading.voltageCA)}</td>
                  <td className="unit">V</td>
                </tr>
                <tr>
                  <td className="metric-name">Current</td>
                  <td>{formatNumber(reading.currentTotal)}</td>
                  <td>{formatNumber(reading.currentPhaseA)}</td>
                  <td>{formatNumber(reading.currentPhaseB)}</td>
                  <td>{formatNumber(reading.currentPhaseC)}</td>
                  <td className="unit">A</td>
                </tr>
                <tr>
                  <td className="metric-name">Power</td>
                  <td>{formatNumber(reading.powerTotal)}</td>
                  <td>{formatNumber(reading.powerPhaseA)}</td>
                  <td>{formatNumber(reading.powerPhaseB)}</td>
                  <td>{formatNumber(reading.powerPhaseC)}</td>
                  <td className="unit">kW</td>
                </tr>
                <tr>
                  <td className="metric-name">Apparent Power</td>
                  <td>{formatNumber(reading.apparentPowerTotal)}</td>
                  <td>{formatNumber(reading.apparentPowerPhaseA)}</td>
                  <td>{formatNumber(reading.apparentPowerPhaseB)}</td>
                  <td>{formatNumber(reading.apparentPowerPhaseC)}</td>
                  <td className="unit">kVA</td>
                </tr>
                <tr>
                  <td className="metric-name">Reactive Power</td>
                  <td>{formatNumber(reading.reactivePowerTotal)}</td>
                  <td>{formatNumber(reading.reactivePowerPhaseA)}</td>
                  <td>{formatNumber(reading.reactivePowerPhaseB)}</td>
                  <td>{formatNumber(reading.reactivePowerPhaseC)}</td>
                  <td className="unit">kVAr</td>
                </tr>
                <tr>
                  <td className="metric-name">Power Factor</td>
                  <td>{formatNumber(reading.powerFactorTotal)}</td>
                  <td>{formatNumber(reading.powerFactorPhaseA)}</td>
                  <td>{formatNumber(reading.powerFactorPhaseB)}</td>
                  <td>{formatNumber(reading.powerFactorPhaseC)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Consumption Graphs Section - Updated Design */}
      <div className="consumption-graphs-section">
        <div className="graphs-header">
          <h2 className="section-title">Consumption Graphs</h2>
          <h3 className="graph-subtitle">{getPeriodSubtitle()}</h3>
        </div>

        <div className="graph-container">
          {/* Graph Area */}
          <div className="graph-area">
            {selectedGraphType === 'consumption' && selectedMeter && selectedElement && user?.client ? (
              <ConsumptionGraph
                meterId={selectedMeter}
                meterElementId={selectedElement}
                tenantId={user.client}
                timePeriod={selectedTimePeriod}
                offset={offset}
              />
            ) : selectedGraphType === 'demand' && selectedMeter && selectedElement && user?.client ? (
              <DemandGraph
                meterId={selectedMeter}
                meterElementId={selectedElement}
                tenantId={user.client}
                timePeriod={selectedTimePeriod}
                offset={offset}
              />
            ) : (
              <div className="graph-placeholder">
                <p>Unable to load chart data</p>
              </div>
            )}
          </div>

          {/* Time Period Radio Group (Right Side) */}
          <div className="time-controls" role="radiogroup" aria-label="Time period">
            {([
              { value: 'today', label: 'Day' },
              { value: 'weekly', label: 'Week' },
              { value: 'monthly', label: 'Month' },
              { value: 'yearly', label: 'Year' },
            ] as { value: TimePeriod; label: string }[]).map(({ value, label }) => (
              <label key={value} className={`time-button ${selectedTimePeriod === value ? 'time-button--active' : ''}`}>
                <input
                  type="radio"
                  name="timePeriod"
                  value={value}
                  checked={selectedTimePeriod === value}
                  onChange={() => handleTimePeriodChange(value)}
                />
                {label}
              </label>
            ))}

            {/* Navigation Arrows */}
            <div className="period-nav-controls">
              <button
                type="button"
                className="period-nav-button"
                onClick={() => setOffset((o) => o - 1)}
              >
                ←
              </button>
              <button
                type="button"
                className="period-nav-button"
                onClick={() => setOffset((o) => o + 1)}
                disabled={offset === 0}
              >
                →
              </button>
            </div>

            {/* Graph Type Radio Group */}
            <div role="radiogroup" aria-label="Graph type" className="graph-type-radio-group">
              {([
                { value: 'consumption', label: 'Consumption' },
                { value: 'demand', label: 'Demand' },
              ] as { value: GraphType; label: string }[]).map(({ value, label }) => (
                <label key={value} className={`time-button ${selectedGraphType === value ? 'time-button--active' : ''}`}>
                  <input
                    type="radio"
                    name="graphType"
                    value={value}
                    checked={selectedGraphType === value}
                    onChange={() => setSelectedGraphType(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedMeterReadingView;