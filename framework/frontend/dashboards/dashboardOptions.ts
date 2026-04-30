export const TIME_FRAME_OPTIONS = [
  { value: 'today',              label: 'Today' },
  { value: 'this_month_to_date', label: 'This Month to Date' },
  { value: 'last_month',         label: 'Last Month' },
  { value: 'since_installation', label: 'Since Installation' },
  { value: 'yearly',             label: 'This Year' },
  { value: 'custom',             label: 'Custom Date Range' },
] as const;

export const VISUALIZATION_OPTIONS = [
  { value: 'bar',         label: 'Bar Chart' },
  { value: 'line',        label: 'Line Chart' },
  { value: 'area',        label: 'Area Chart' },
  { value: 'pie',         label: 'Pie Chart' },
  { value: 'candlestick', label: 'Candlestick' },
  { value: 'list',        label: 'List' },
] as const;

export const GROUPING_OPTIONS = [
  { value: 'total',   label: 'Total' },
  { value: 'hourly',  label: 'Hourly' },
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

export const AGGREGATION_OPTIONS = [
  { value: 'none',    label: 'None' },
  { value: 'sum',     label: 'Sum' },
  { value: 'average', label: 'Average' },
  { value: 'min',     label: 'Min' },
  { value: 'max',     label: 'Max' },
] as const;

export type TimeFrameValue     = typeof TIME_FRAME_OPTIONS[number]['value'];
export type VisualizationValue = typeof VISUALIZATION_OPTIONS[number]['value'];
export type GroupingValue      = typeof GROUPING_OPTIONS[number]['value'];
export type AggregationValue   = typeof AGGREGATION_OPTIONS[number]['value'];

/** Normalise legacy `avg` stored in DB → `average` used in UI. */
export function normaliseAggregation(raw: string | undefined | null): AggregationValue {
  if (raw === 'avg') return 'average';
  if (AGGREGATION_OPTIONS.some(o => o.value === raw)) return raw as AggregationValue;
  return 'none';
}
