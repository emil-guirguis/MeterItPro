import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import './GraphControls.css';

export type TimePeriod = 'today' | 'weekly' | 'monthly' | 'yearly' | 'last_month' | 'this_month_to_date' | 'since_installation' | 'custom';
export type VisualizationType = 'bar' | 'line' | 'pie' | 'csv' | 'area' | 'candlestick' | 'list';
export type DataGrouping = 'total' | 'hourly' | 'daily' | 'weekly' | 'monthly';
export type AggregationType = 'sum' | 'average' | 'min' | 'max' | 'none';

export interface GraphControlsValue {
  timePeriod: TimePeriod;
  visualizationType: VisualizationType;
  dataGrouping: DataGrouping;
  aggregation: AggregationType;
}

export function deriveGrouping(timePeriod: TimePeriod): DataGrouping {
  if (timePeriod === 'today') return 'hourly';
  if (timePeriod === 'yearly' || timePeriod === 'since_installation') return 'monthly';
  return 'daily';
}

export function defaultGraphControls(overrides?: Partial<GraphControlsValue>): GraphControlsValue {
  return {
    timePeriod: 'today',
    visualizationType: 'bar',
    dataGrouping: 'hourly',
    aggregation: 'sum',
    ...overrides,
  };
}

export function getSubtitle(value: GraphControlsValue): string {
  const now = new Date();
  const { timePeriod } = value;
  if (timePeriod === 'today') {
    return now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  if (timePeriod === 'weekly') {
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
  if (timePeriod === 'monthly') {
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  if (timePeriod === 'last_month') {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  if (timePeriod === 'this_month_to_date') {
    return `${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} (to date)`;
  }
  if (timePeriod === 'since_installation') return 'Since Installation';
  if (timePeriod === 'custom') return 'Custom Range';
  return String(now.getFullYear());
}

const ALL_TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: 'today',               label: 'Today'              },
  { value: 'weekly',              label: 'This Week'          },
  { value: 'monthly',             label: 'This Month'         },
  { value: 'yearly',              label: 'This Year'          },
  { value: 'last_month',          label: 'Last Month'         },
  { value: 'this_month_to_date',  label: 'This Month to Date' },
  { value: 'since_installation',  label: 'Since Installation' },
  { value: 'custom',              label: 'Custom Date Range'  },
];

const ALL_VIZ_OPTIONS: { value: VisualizationType; label: string }[] = [
  { value: 'bar',         label: 'Bar Chart'   },
  { value: 'line',        label: 'Line Chart'  },
  { value: 'pie',         label: 'Pie Chart'   },
  { value: 'area',        label: 'Area Chart'  },
  { value: 'candlestick', label: 'Candlestick' },
  { value: 'list',        label: 'List'        },
  { value: 'csv',         label: 'CSV'         },
];

const ALL_GROUPING_OPTIONS: { value: DataGrouping; label: string }[] = [
  { value: 'total',   label: 'Total'   },
  { value: 'hourly',  label: 'Hourly'  },
  { value: 'daily',   label: 'Daily'   },
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
];

const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: 'sum',     label: 'Sum'     },
  { value: 'average', label: 'Average' },
  { value: 'min',     label: 'Min'     },
  { value: 'max',     label: 'Max'     },
  { value: 'none',    label: 'None'    },
];

interface GraphControlsProps {
  value: GraphControlsValue;
  onChange: (value: GraphControlsValue) => void;
  /** Subset of time periods to show. Defaults to today, weekly, monthly, yearly. */
  supportedTimePeriods?: TimePeriod[];
  /** Subset of visualization types to show. Defaults to bar + line. */
  supportedVisualizations?: VisualizationType[];
  /** Subset of grouping options to show. Defaults to hourly, daily, monthly. */
  supportedGroupings?: DataGrouping[];
  disabled?: boolean;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  value,
  onChange,
  supportedTimePeriods = ['today', 'weekly', 'monthly', 'yearly'],
  supportedVisualizations = ['bar', 'line'],
  supportedGroupings = ['hourly', 'daily', 'monthly'],
  disabled = false,
}) => {
  const timePeriodOptions = ALL_TIME_PERIOD_OPTIONS.filter((o) => supportedTimePeriods.includes(o.value));
  const vizOptions = ALL_VIZ_OPTIONS.filter((o) => supportedVisualizations.includes(o.value));
  const groupingOptions = ALL_GROUPING_OPTIONS.filter((o) => supportedGroupings.includes(o.value));

  const handleTimePeriodChange = (period: TimePeriod) => {
    const newGrouping = deriveGrouping(period);
    const groupingValid = supportedGroupings.includes(newGrouping);
    onChange({
      ...value,
      timePeriod: period,
      dataGrouping: groupingValid ? newGrouping : (supportedGroupings[0] ?? value.dataGrouping),
    });
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
      {/* Time Frame */}
      <FormControl size="small" sx={{ minWidth: 140 }} disabled={disabled}>
        <InputLabel>Time Frame</InputLabel>
        <Select
          label="Time Frame"
          value={value.timePeriod}
          onChange={(e) => handleTimePeriodChange(e.target.value as TimePeriod)}
        >
          {timePeriodOptions.map(({ value: v, label }) => (
            <MenuItem key={v} value={v}>{label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Visualization */}
      {vizOptions.length > 0 && (
        <FormControl size="small" sx={{ minWidth: 140 }} disabled={disabled}>
          <InputLabel>Visualization</InputLabel>
          <Select
            label="Visualization"
            value={value.visualizationType}
            onChange={(e) => onChange({ ...value, visualizationType: e.target.value as VisualizationType })}
          >
            {vizOptions.map(({ value: v, label }) => (
              <MenuItem key={v} value={v}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Grouping */}
      {groupingOptions.length > 0 && (
        <FormControl size="small" sx={{ minWidth: 120 }} disabled={disabled}>
          <InputLabel>Grouping</InputLabel>
          <Select
            label="Grouping"
            value={value.dataGrouping}
            onChange={(e) => onChange({ ...value, dataGrouping: e.target.value as DataGrouping })}
          >
            {groupingOptions.map(({ value: v, label }) => (
              <MenuItem key={v} value={v}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Aggregation */}
      <FormControl size="small" sx={{ minWidth: 130 }} disabled={disabled}>
        <InputLabel>Aggregation</InputLabel>
        <Select
          label="Aggregation"
          value={value.aggregation}
          onChange={(e) => onChange({ ...value, aggregation: e.target.value as AggregationType })}
        >
          {AGGREGATION_OPTIONS.map(({ value: v, label }) => (
            <MenuItem key={v} value={v}>{label}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default GraphControls;
