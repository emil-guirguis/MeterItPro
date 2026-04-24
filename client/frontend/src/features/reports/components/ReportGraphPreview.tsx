import React, { useState, useEffect } from 'react';
import { Visualization } from '@framework/dashboards/components/Visualization';
import apiClient from '../../../services/apiClient';
import type { AggregatedData } from '../../../services/dashboardService';
import type { GraphControlsValue } from '../../../components/shared/GraphControls';

interface ReportGraphPreviewProps {
  reportId: number;
  controls: GraphControlsValue;
}

/** Pivot grouped_data by meter_element_id — identical to DashboardPage logic. */
function pivotByMeterElement(data: AggregatedData): AggregatedData {
  const { grouped_data, meter_element_labels, selected_columns, column_units } = data;
  if (!grouped_data || !meter_element_labels) return data;

  const elementIds = Object.keys(meter_element_labels).map(Number);
  const cols = selected_columns || [];

  if (elementIds.length <= 1) {
    if (column_units && Object.keys(column_units).length > 0) {
      const series_labels: Record<string, string> = {};
      for (const col of cols) {
        const unit = column_units[col];
        series_labels[col] = unit ? `${col.replace(/_/g, ' ')} (${unit})` : col;
      }
      return { ...data, series_labels };
    }
    return data;
  }

  const getTimeKey = (row: Record<string, any>): string => {
    const parts: any[] = [];
    if (row.label_key !== undefined) return String(row.label_key);
    if (row.date !== undefined) parts.push(row.date);
    if (row.hour !== undefined) parts.push(row.hour);
    if (row.week_start !== undefined) parts.push(row.week_start);
    if (row.month_start !== undefined) parts.push(row.month_start);
    return parts.length ? parts.join('|') : 'total';
  };

  const pivotMap = new Map<string, Record<string, any>>();
  for (const row of grouped_data) {
    const key = getTimeKey(row);
    if (!pivotMap.has(key)) {
      pivotMap.set(key, { label_key: key });
    }
    const pivotRow = pivotMap.get(key)!;
    for (const col of cols) {
      pivotRow[`${col}_${row.meter_element_id}`] = row[col];
    }
  }

  const pivotedColumns = elementIds.flatMap(id => cols.map(col => `${col}_${id}`));
  const series_labels: Record<string, string> = {};
  for (const id of elementIds) {
    const label = meter_element_labels[id] || `Element ${id}`;
    for (const col of cols) {
      const unit = column_units?.[col];
      series_labels[`${col}_${id}`] = unit ? `${label} (${unit})` : label;
    }
  }

  return { ...data, grouped_data: Array.from(pivotMap.values()), selected_columns: pivotedColumns, series_labels };
}

export const ReportGraphPreview: React.FC<ReportGraphPreviewProps> = ({ reportId, controls }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<AggregatedData | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const tzOffset = -new Date().getTimezoneOffset();
    apiClient
      .get(`/reports/${reportId}/graph-data`, { params: { tzOffset } })
      .then((res) => {
        if (!res.data.success) throw new Error(res.data.message || 'Failed to load graph data');
        const raw: AggregatedData = res.data.data;
        setGraphData(pivotByMeterElement(raw));
      })
      .catch((err: any) => setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load graph data'))
      .finally(() => setLoading(false));
  }, [reportId, controls.timePeriod]);

  if (loading) return <div style={{ padding: '16px', color: '#666' }}>Loading chart...</div>;
  if (error) return <div style={{ padding: '16px', color: '#c62828' }}>Error: {error}</div>;
  if (!graphData) return null;

  const { grouped_data = [], selected_columns = [], series_labels } = graphData;

  if (grouped_data.length === 0) {
    return <div style={{ padding: '16px', color: '#888', fontStyle: 'italic' }}>No data for the selected period.</div>;
  }

  return (
    <Visualization
      type={controls.visualizationType as any}
      data={grouped_data}
      columns={selected_columns}
      seriesLabels={series_labels}
      height={300}
    />
  );
};

export default ReportGraphPreview;
