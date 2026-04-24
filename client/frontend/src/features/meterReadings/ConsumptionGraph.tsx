import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { meterReadingService } from '../../services/meterReadingService';
import { buildConsumptionChartData, getChartDateRange } from '../../components/shared/chartUtils';
import './ConsumptionGraph.css';

interface ConsumptionGraphProps {
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

export const ConsumptionGraph: React.FC<ConsumptionGraphProps> = ({
  meterId,
  meterElementId,
  timePeriod,
  offset = 0,
  isVirtual = false,
  excludeIds,
  operationOverrides,
  chartType = 'bar',
}) => {
  const [data, setData] = useState<{ label: string; calculated_kwh: number }[]>([]);
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
          ? await meterReadingService.getVirtualConsumptionData(
              meterId, timePeriod, startDate.toISOString(), endDate.toISOString(),
              tzOffsetMinutes, excludeIds, operationOverrides,
            )
          : await meterReadingService.getConsumptionData(
              meterId, meterElementId, timePeriod,
              startDate.toISOString(), endDate.toISOString(), tzOffsetMinutes,
            );
        setData(buildConsumptionChartData(rows, timePeriod, offset));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch consumption data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [meterId, meterElementId, timePeriod, offset, isVirtual, excludeIds, operationOverrides]);

  if (loading) return <div className="consumption-graph-loading">Loading chart...</div>;
  if (error) return <div className="consumption-graph-error">Error: {error}</div>;

  const axisProps = { dataKey: 'label' as const, interval: 0, angle: -45, textAnchor: 'end' as const, height: 55, tick: { fontSize: 10 } };

  return (
    <div className="consumption-graph-container">
      <div className="consumption-graph-inner">
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...axisProps} />
              <YAxis label={{ value: 'kWh', angle: -90, position: 'insideLeft', offset: -5 }} tickFormatter={(v: number) => v.toFixed(4)} />
              <Tooltip formatter={(value: number) => [`${(value as number).toFixed(4)} kWh`, 'Consumption']} />
              <Line type="monotone" dataKey="calculated_kwh" stroke="#0ea5e9" name="Consumption" dot={false} strokeWidth={2} />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...axisProps} />
              <YAxis label={{ value: 'kWh', angle: -90, position: 'insideLeft', offset: -5 }} tickFormatter={(v: number) => v.toFixed(4)} />
              <Tooltip formatter={(value: number) => [`${(value as number).toFixed(4)} kWh`, 'Consumption']} />
              <Bar dataKey="calculated_kwh" fill="#0ea5e9" name="Consumption" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ConsumptionGraph;
