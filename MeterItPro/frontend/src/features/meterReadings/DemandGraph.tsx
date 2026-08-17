import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { meterReadingService } from '../../services/meterReadingService';
import { buildDemandChartData, getChartDateRange } from '../../components/shared/chartUtils';
import './DemandGraph.css';

interface DemandGraphProps {
  meterId: string;
  meterElementId: string;
  tenantId: string;
  timePeriod: 'today' | 'weekly' | 'monthly' | 'yearly';
  offset?: number;
  isVirtual?: boolean;
  excludeIds?: number[];
  operationOverrides?: Map<number, '+' | '-'>;
  chartType?: 'bar' | 'line';
}

export const DemandGraph: React.FC<DemandGraphProps> = ({
  meterId,
  meterElementId,
  timePeriod,
  offset = 0,
  isVirtual = false,
  excludeIds,
  operationOverrides,
  chartType = 'line',
}) => {
  const [data, setData] = useState<{ label: string; power: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const tzOffsetMinutes = -new Date().getTimezoneOffset();
        const { startDate, endDate } = getChartDateRange(timePeriod, offset);
        const rows = isVirtual
          ? await meterReadingService.getVirtualDemandData(
              meterId, timePeriod, startDate.toISOString(), endDate.toISOString(),
              tzOffsetMinutes, excludeIds, operationOverrides,
            )
          : await meterReadingService.getDemandData(
              meterId, meterElementId, timePeriod,
              startDate.toISOString(), endDate.toISOString(), tzOffsetMinutes,
            );
        setData(buildDemandChartData(rows, timePeriod, offset));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch demand data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [meterId, meterElementId, timePeriod, offset, isVirtual, excludeIds, operationOverrides]);

  if (loading) return <div className="demand-graph-loading">Loading chart...</div>;
  if (error) return <div className="demand-graph-error">Error: {error}</div>;

  const axisProps = { dataKey: 'label' as const, interval: 0, angle: -45, textAnchor: 'end' as const, height: 55, tick: { fontSize: 10 } };

  return (
    <div className="demand-graph-container">
      <div className="demand-graph-inner">
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...axisProps} />
              <YAxis label={{ value: 'kW', angle: -90, position: 'insideLeft', offset: -5 }} tickFormatter={(v: number) => v.toFixed(2)} />
              <Tooltip formatter={(value: number) => [`${(value as number).toFixed(2)} kW`, 'Demand']} />
              <Bar dataKey="power" fill="#ef4444" name="Demand" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...axisProps} />
              <YAxis label={{ value: 'kW', angle: -90, position: 'insideLeft', offset: -5 }} tickFormatter={(v: number) => v.toFixed(2)} />
              <Tooltip formatter={(value: number) => [`${(value as number).toFixed(2)} kW`, 'Demand']} />
              <Line type="monotone" dataKey="power" stroke="#ef4444" name="Demand" dot={false} strokeWidth={2} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DemandGraph;
