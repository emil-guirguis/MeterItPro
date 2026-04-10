import React, { useRef, useState, useEffect } from 'react';
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

function truncateLabel(label: string, maxLen = 28): string {
  return label.length > maxLen ? label.slice(0, maxLen - 1) + '…' : label;
}

/**
 * Sort legend items by meter → element → register.
 * Labels for multi-element series look like "Meter - Element (unit)".
 * Column keys look like "power_101" (multi) or "power" (single).
 */
function sortLegendItems<T extends { col: string; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const parse = (col: string, name: string): [string, string, string] => {
      const dashIdx = name.indexOf(' - ');
      const meter = dashIdx >= 0 ? name.slice(0, dashIdx) : '';
      const element = dashIdx >= 0 ? name.slice(dashIdx + 3) : name;
      const register = col.replace(/_\d+$/, '');
      return [meter, element, register];
    };
    const [ma, ea, ra] = parse(a.col, a.name);
    const [mb, eb, rb] = parse(b.col, b.name);
    return ma.localeCompare(mb) || ea.localeCompare(eb) || ra.localeCompare(rb);
  });
}

/** Measures container width and returns how many legend columns fit (1–3). */
function useLegendCols(ref: React.RefObject<HTMLDivElement | null>): number {
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = (width: number) => {
      setCols(width >= 420 ? 3 : width >= 260 ? 2 : 1);
    };
    update(el.clientWidth);
    const ro = new ResizeObserver(entries => {
      update(entries[0]?.contentRect.width ?? el.clientWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return cols;
}

interface LegendItem {
  col: string;
  name: string;
  color: string;
}

interface LegendProps {
  items: LegendItem[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const ChartLegend: React.FC<LegendProps> = ({ items, containerRef }) => {
  const cols = useLegendCols(containerRef);
  const sorted = sortLegendItems(items);
  return (
    <div
      className="viz-legend"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {sorted.map(item => (
        <div key={item.col} className="viz-legend-item" title={item.name}>
          <span className="viz-legend-marker" style={{ background: item.color }} />
          <span className="viz-legend-label">{truncateLabel(item.name)}</span>
        </div>
      ))}
    </div>
  );
};

const baseOptions: ApexCharts.ApexOptions = {
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
};

export const Visualization: React.FC<VisualizationProps> = ({
  type = 'bar',
  data,
  columns,
  height = 300,
  seriesLabels,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!data || columns.length === 0 || (Array.isArray(data) && data.length === 0)) {
    return <div className="visualization-empty"><p>No data available</p></div>;
  }

  const rows = toArray(data);

  // ── Pie ──────────────────────────────────────────────────────────────────────
  if (type === 'pie') {
    const source = rows[0] ?? {};
    const series = columns.map(c => {
      const v = source[c];
      return typeof v === 'number' ? v : parseFloat(String(v)) || 0;
    });
    const legendItems: LegendItem[] = columns.map((c, i) => ({
      col: c,
      name: seriesLabels?.[c] ?? labelForKey(c),
      color: COLORS[i % COLORS.length],
    }));
    return (
      <div className="visualization-container" ref={containerRef}>
        <ApexChart
          type="pie"
          series={series}
          options={{
            ...baseOptions,
            labels: columns.map(c => seriesLabels?.[c] ?? labelForKey(c)),
            colors: COLORS,
          }}
          width="100%"
          height={height}
        />
        <ChartLegend items={legendItems} containerRef={containerRef} />
      </div>
    );
  }

  // ── Time-series (line / bar / area) ─────────────────────────────────────────
  const categories = rows.map(r => {
    const x = getXKey(r);
    if ('hour' in r) {
      const h = parseInt(x);
      return isNaN(h) ? x : (h === 0 ? '12AM' : h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`);
    }
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

  const legendItems: LegendItem[] = columns.map((col, i) => ({
    col,
    name: seriesLabels?.[col] ?? labelForKey(col),
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
    <div className="visualization-container" ref={containerRef}>
      <ApexChart
        type={apexType as any}
        series={series}
        options={{
          ...baseOptions,
          xaxis,
          yaxis,
          stroke,
          fill,
          plotOptions,
          colors: COLORS,
        }}
        width="100%"
        height={height}
      />
      <ChartLegend items={legendItems} containerRef={containerRef} />
    </div>
  );
};

export default Visualization;
