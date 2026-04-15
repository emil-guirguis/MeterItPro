import React, { useState, useEffect, useMemo } from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useMeterSelection } from '../../contexts/MeterSelectionContext';
import { useAuth } from '../../hooks/useAuth';
import { ConsumptionGraph } from './ConsumptionGraph';
import { DemandGraph } from './DemandGraph';
import { meterService, formatItemLabel, type SelectedItem } from '../../services/meterService';
import { meterReadingService } from '../../services/meterReadingService';
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
  isVirtual?: boolean;
  installationDate?: string | null;
}

type TimePeriod = 'today' | 'weekly' | 'monthly' | 'yearly';
type GraphType = 'consumption' | 'demand';

export const DetailedMeterReadingView: React.FC<DetailedMeterReadingViewProps> = ({
  meterInfo,
  reading,
  loading = false,
  error = null,
  onViewAllReadings,
  isVirtual = false,
  installationDate,
}) => {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('today');
  const [selectedGraphType, setSelectedGraphType] = useState<GraphType>('consumption');
  const [offset, setOffset] = useState<number>(0);
  const [virtualComponents, setVirtualComponents] = useState<SelectedItem[]>([]);
  const [checkedComponents, setCheckedComponents] = useState<Set<string>>(new Set());
  const [componentKwh, setComponentKwh] = useState<Map<number, number>>(new Map());
  const [componentKwhLoaded, setComponentKwhLoaded] = useState(false);

  const { selectedMeter, selectedElement } = useMeterSelection();
  const { user } = useAuth();

  useEffect(() => {
    if (!isVirtual || !selectedMeter) return;
    meterService.getVirtualMeterConfig(selectedMeter)
      .then((items) => {
        setVirtualComponents(items);
        setCheckedComponents(new Set(items.map((item) => item.id)));
      })
      .catch(() => setVirtualComponents([]));
  }, [isVirtual, selectedMeter]);

  useEffect(() => {
    if (!isVirtual || !selectedMeter) return;
    setComponentKwhLoaded(false);
    meterReadingService.getVirtualComponentsLast(selectedMeter)
      .then((rows) => {
        console.log('[VirtualMeter] virtual-components-last rows:', rows);
        const map = new Map<number, number>();
        rows.forEach((r) => map.set(Number(r.select_meter_element_id), Number(r.kwh)));
        console.log('[VirtualMeter] componentKwh map:', [...map.entries()]);
        setComponentKwh(map);
        setComponentKwhLoaded(true);
      })
      .catch((err) => {
        console.error('[VirtualMeter] virtual-components-last error:', err);
        setComponentKwh(new Map());
        setComponentKwhLoaded(true);
      });
  }, [isVirtual, selectedMeter]);

  const excludeIds = useMemo(() => {
    return virtualComponents
      .filter((item) => !checkedComponents.has(item.id))
      .map((item) => item.selectionType === 'element' ? item.meter_element_id : item.meter_id);
  }, [virtualComponents, checkedComponents]);

  const displayTotal = useMemo(() => {
    console.log('[VirtualMeter] displayTotal calc — isVirtual:', isVirtual, 'mapSize:', componentKwh.size, 'checked:', checkedComponents.size, 'components:', virtualComponents.length);
    if (!isVirtual || componentKwh.size === 0) return reading.activeEnergyTotal;
    const result = virtualComponents
      .filter((item) => checkedComponents.has(item.id))
      .reduce((sum, item) => {
        const elementId = item.selectionType === 'element' ? Number(item.meter_element_id) : Number(item.meter_id);
        const kwh = componentKwh.get(elementId) ?? 0;
        console.log('[VirtualMeter] item:', item.id, 'elementId:', elementId, 'kwh:', kwh);
        return sum + kwh;
      }, 0);
    console.log('[VirtualMeter] displayTotal result:', result);
    return result;
  }, [isVirtual, virtualComponents, checkedComponents, componentKwh, reading.activeEnergyTotal]);

  const handleTimePeriodChange = (period: TimePeriod) => {
    setSelectedTimePeriod(period);
    setOffset(0);
  };

  const formatNumber = (value: number | string | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined) return '0.00';
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(decimals);
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
      <div className={`main-content${isVirtual ? ' main-content--virtual' : ''}`}>
        {/* Left: Meter Information */}
        <div className="meter-info-card">
          <div className="info-row">
            <span className="info-label">Description</span>
            <span className="info-value info-value--bold">{meterInfo.description}</span>
          </div>
          {!isVirtual && (
            <div className="info-row">
              <span className="info-label">Serial Number</span>
              <span className="info-value">{meterInfo.serialNumber}</span>
            </div>
          )}
          {isVirtual && installationDate && (
            <div className="info-row">
              <span className="info-label">Installation Date</span>
              <span className="info-value">
                {new Date(installationDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">Reading Date</span>
            <span className="info-value">
              {reading.timestamp ? new Date(reading.timestamp).toLocaleString() : 'N/A'}
            </span>
          </div>
          <hr className="meter-info-divider" />
          <div className="info-row">
            <span className="total-label">Total kWh</span>
            <span className="total-value">{formatNumber(displayTotal)} <span className="total-unit">kWh</span></span>
          </div>
          {!isVirtual && (
            <>
              <div className="info-row">
                <span className="total-label">Peak Demand</span>
                <span className="total-value">{formatNumber(reading.maximumDemandReal)} <span className="total-unit">kW</span></span>
              </div>
              <div className="info-row">
                <span className="total-label">Frequency</span>
                <span className="total-value">{formatNumber(reading.frequency)} <span className="total-unit">Hz</span></span>
              </div>
            </>
          )}

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

        {/* Right Column: Virtual components list OR Phase Table */}
        {isVirtual && (
          <div className="meter-info-card virtual-components-card">
            <div className={`virtual-components-list${virtualComponents.length > 4 ? ' virtual-components-list--columns' : ''}`}>
              {virtualComponents.length === 0 ? (
                <span className="info-value" style={{ color: '#888' }}>No components configured</span>
              ) : (
                virtualComponents.map((item) => (
                  <div key={item.id} className="virtual-component-item">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkedComponents.has(item.id)}
                          onChange={() => {
                            setCheckedComponents((prev) => {
                              const next = new Set(prev);
                              if (next.has(item.id)) {
                                next.delete(item.id);
                              } else {
                                next.add(item.id);
                              }
                              return next;
                            });
                          }}
                          size="small"
                          sx={{ py: 0.25, pl: 0.5, pr: 0.75 }}
                        />
                      }
                      label={formatItemLabel(item)}
                      sx={{ margin: 0, '& .MuiFormControlLabel-label': { fontSize: 14, color: '#333' } }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {!isVirtual && <div className="right-column">
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
        </div>}
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
            {selectedGraphType === 'consumption' && selectedMeter && (isVirtual || selectedElement) && user?.client ? (
              <ConsumptionGraph
                meterId={selectedMeter}
                meterElementId={selectedElement || ''}
                tenantId={user.client}
                timePeriod={selectedTimePeriod}
                offset={offset}
                isVirtual={isVirtual}
                excludeIds={isVirtual ? excludeIds : undefined}
              />
            ) : selectedGraphType === 'demand' && selectedMeter && (isVirtual || selectedElement) && user?.client ? (
              <DemandGraph
                meterId={selectedMeter}
                meterElementId={selectedElement || ''}
                tenantId={user.client}
                timePeriod={selectedTimePeriod}
                offset={offset}
                isVirtual={isVirtual}
                excludeIds={isVirtual ? excludeIds : undefined}
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