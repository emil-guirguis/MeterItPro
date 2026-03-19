import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { meterReadingService } from '../../services/meterReadingService';
import './ConsumptionGraph.css';

interface ConsumptionGraphProps {
  meterId: string;
  meterElementId: string;
  tenantId: string;
  timePeriod: 'today' | 'weekly' | 'monthly' | 'yearly';
}

interface ChartData {
  label: string;
  calculated_kwh: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatHour(hour: number): string {
  if (hour === 0) return '12AM';
  if (hour < 12) return `${hour}AM`;
  if (hour === 12) return '12PM';
  return `${hour - 12}PM`;
}

function getDateRange(timePeriod: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (timePeriod === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (timePeriod === 'weekly') {
    // Get current week (Monday to Sunday)
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate = new Date(now);
    startDate.setDate(now.getDate() - daysToMonday);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else if (timePeriod === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else {
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }

  return { startDate, endDate };
}

function buildChartData(rows: { label_key: string | number; calculated_kwh: number }[], timePeriod: string): ChartData[] {
  const lookup = new Map<string, number>();
  for (const row of rows) {
    lookup.set(String(row.label_key), Math.round(Number(row.calculated_kwh) * 10000) / 10000);
  }

  if (timePeriod === 'today') {
    return Array.from({ length: 24 }, (_, h) => ({
      label: formatHour(h),
      calculated_kwh: lookup.get(String(h)) ?? 0,
    }));
  }

  if (timePeriod === 'yearly') {
    return Array.from({ length: 12 }, (_, i) => ({
      label: MONTH_NAMES[i],
      calculated_kwh: lookup.get(String(i + 1)) ?? 0,
    }));
  }

  // weekly / monthly — fill every day in the range using local dates
  const { startDate, endDate } = getDateRange(timePeriod);
  const result: ChartData[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    // Format local date as YYYY-MM-DD to match what the API returns
    const key = [
      cursor.getFullYear(),
      String(cursor.getMonth() + 1).padStart(2, '0'),
      String(cursor.getDate()).padStart(2, '0'),
    ].join('-');
    result.push({
      label: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calculated_kwh: lookup.get(key) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export const ConsumptionGraph: React.FC<ConsumptionGraphProps> = ({
  meterId,
  meterElementId,
  timePeriod,
}) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        // getTimezoneOffset() returns minutes BEHIND UTC (negative for UTC+), so negate it
        const tzOffsetMinutes = -now.getTimezoneOffset();
        const { startDate, endDate } = getDateRange(timePeriod);

        const rows = await meterReadingService.getConsumptionData(
          meterId,
          meterElementId,
          timePeriod,
          startDate.toISOString(),
          endDate.toISOString(),
          tzOffsetMinutes,
        );
        setData(buildChartData(rows, timePeriod));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch consumption data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [meterId, meterElementId, timePeriod]);

  if (loading) return <div className="consumption-graph-loading">Loading chart...</div>;
  if (error) return <div className="consumption-graph-error">Error: {error}</div>;

  return (
    <div className="consumption-graph-container">
      <div className="consumption-graph-inner">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              label={{ value: 'kWh', angle: -90, position: 'insideLeft', offset: -5 }}
              tickFormatter={(v: number) => v.toFixed(4)}
            />
            <Tooltip formatter={(value: number) => [`${(value as number).toFixed(4)} kWh`, 'Consumption']} />
            <Bar dataKey="calculated_kwh" fill="#0ea5e9" name="Consumption" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ConsumptionGraph;
