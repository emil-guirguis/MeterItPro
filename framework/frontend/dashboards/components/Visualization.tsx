import React from 'react';
import ApexChart from 'react-apexcharts';
import type { VisualizationType } from '../types';
import './Visualization.css';

export interface VisualizationData {
  [key: string]: number | string;
}

export interface VisualizationProps {
  type?: VisualizationType;
  data: VisualizationData | VisualizationData[];
  columns: string[];
  height?: number;
  title?: string;
  seriesLabels?: Record<string, string>;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
  '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C',
];

function labelForKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function toArray(data: VisualizationData | VisualizationData[]): VisualizationData[] {
  return Array.isArray(data) ? data : [data];
}

function getXKey(row: VisualizationData): string {
  if ('hour' in row) return String(row.hour);
  if ('date' in row) return String(row.date);
  if ('week_start' in row) return String(row.week_start);
  if ('month_start' in row) return String(row.month_start);
  if ('label_key' in row) return String(row.label_key);
  return '';
}

const baseOptions = (height: number): ApexCharts.ApexOptions => ({
  chart: {
    toolbar: { show: false },
    animations: { enabled: false },
    background: 'transparent',
    parentHeightOffset: 0,
  },
  grid: {
    borderColor: '#e2e8f0',
    strokeDashArray: 4,
    padding: { top: 0, right: 10, bottom: 0, left: 0 },
  },
  tooltip: { theme: 'light' },
  legend: { show: false },
  dataLabels: { enabled: false },
});

export const Visualization: React.FC<VisualizationProps> = ({
  type = 'bar',
  data,
  columns,
  height = 300,
  seriesLabels,
}) => {
  if (!data || columns.length === 0 || (Array.isArray(data) && data.length === 0)) {
    return <div className="visualization-empty"><p>No data available</p></div>;
  }

  const rows = toArray(data);
  const isSingle = rows.length <= 1;

  // ── Pie ──────────────────────────────────────────────────────────────────────
  if (type === 'pie') {
    const source = rows[0] ?? {};
    const series = columns.map(c => {
      const v = source[c];
      return typeof v === 'number' ? v : parseFloat(String(v)) || 0;
    });
    return (
      <div className="visualization-container">
        <ApexChart
          type="pie"
          series={series}
          options={{
            ...baseOptions(height),
            labels: columns.map(labelForKey),
            colors: COLORS,
            legend: { show: true, position: 'bottom' },
          }}
          width="100%"
          height={height}
        />
      </div>
    );
  }

  // ── Time-series (line / bar / area) ─────────────────────────────────────────
  const categories = rows.map(r => {
    const x = getXKey(r);
    // Format hour labels as AM/PM
    if ('hour' in r) {
      const h = parseInt(x);
      return isNaN(h) ? x : (h === 0 ? '12AM' : h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`);
    }
    // Strip time portion from ISO timestamps returned by DATE_TRUNC (weekly/monthly)
    if (typeof x === 'string' && x.includes('T')) return x.split('T')[0];
    return x;
  });

  const series: ApexAxisChartSeries = columns.map((col, i) => ({
    name: seriesLabels?.[col] ?? labelForKey(col),
    data: rows.map(r => {
      const v = r[col];
      if (v === null || v === undefined) return null;
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      return isNaN(n) ? null : parseFloat(n.toFixed(4));
    }),
    color: COLORS[i % COLORS.length],
  }));

  const xaxis: ApexXAxis = {
    categories,
    labels: {
      rotate: -45,
      style: { fontSize: '11px', colors: '#64748b' },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  };

  const yaxis: ApexYAxis = {
    labels: {
      style: { fontSize: '11px', colors: '#64748b' },
      formatter: (v: number) => v == null ? '' : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(2),
    },
  };

  const stroke = type === 'area'
    ? { curve: 'smooth' as const, width: 2 }
    : type === 'line'
    ? { curve: 'smooth' as const, width: 2 }
    : { width: 0 };

  const fill = type === 'area'
    ? { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } }
    : { opacity: 1 };

  const plotOptions = type === 'bar'
    ? { bar: { borderRadius: 4, columnWidth: '60%' } }
    : {};

  const apexType = type === 'candlestick' ? 'bar' : type;

  return (
    <div className="visualization-container">
      <ApexChart
        type={apexType as any}
        series={series}
        options={{
          ...baseOptions(height),
          xaxis,
          yaxis,
          stroke,
          fill,
          plotOptions,
          colors: COLORS,
          legend: series.length > 1 ? { show: true, position: 'bottom', fontSize: '12px' } : { show: false },
        }}
        width="100%"
        height={height}
      />
    </div>
  );
};

export default Visualization;
