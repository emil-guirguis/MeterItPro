import React, { useEffect, useState } from 'react';
// Dynamically import recharts to avoid bundling it into the main chunk.
// This keeps the visualization code in a separate chunk that loads only when needed.
let _recharts: any = null;

function useRecharts() {
  const [mod, setMod] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    if (_recharts) {
      setMod(_recharts);
      return;
    }
    import('recharts').then((m) => {
      _recharts = m;
      if (mounted) setMod(m);
    }).catch(() => {
      // ignore
    });
    return () => {
      mounted = false;
    };
  }, []);
  return mod;
}
import type { VisualizationType } from '../types';
import './Visualization.css';

/**
 * Generic visualization data interface
 * Supports both single aggregation objects and time-series arrays
 */
export interface VisualizationData {
  [key: string]: number | string;
}

/**
 * Generic visualization component props
 * Works with any data structure that can be transformed to chart format
 */
export interface VisualizationProps {
  /** Visualization type (pie, line, bar, area, candlestick) */
  type?: VisualizationType;
  /** Data to visualize - can be single object or array of objects */
  data: VisualizationData | VisualizationData[];
  /** Column names to display in the visualization */
  columns: string[];
  /** Chart height in pixels */
  height?: number;
  /** Optional title for the visualization */
  title?: string;
}

// Color palette for charts
const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FFC658',
  '#FF7C7C',
];

/**
 * Helper function to safely format numeric values
 */
const formatValue = (value: unknown): string => {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return String(value);
};

/**
 * Pie Chart Visualization
 * Displays aggregated values as a pie chart
 * Best for showing proportions of different columns
 */
const PieVisualization: React.FC<VisualizationProps> = ({
  data,
  columns,
  height = 300,
}) => {
  const recharts = useRecharts();
  if (!recharts) {
    return <div style={{ height }} className="visualization-empty">Loading chart...</div>;
  }
  const { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } = recharts;
  // Handle array data - sum all values
  let dataObj: VisualizationData;
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <div className="visualization-empty">
          <p>No data available</p>
        </div>
      );
    }
    // Sum all values across array elements
    dataObj = {};
    columns.forEach(col => {
      dataObj[col] = data.reduce((sum, item) => sum + (Number(item[col]) || 0), 0);
    });
  } else {
    dataObj = data;
  }

  // Transform data for pie chart
  const pieData = columns.map((column) => ({
    name: column,
    value: Number(dataObj[column]) || 0,
  }));

  // Filter out zero values
  const filteredData = pieData.filter((item) => item.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="visualization-empty">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="visualization-container">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }: any) => `${name}: ${formatValue(value)}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {filteredData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={formatValue} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Line Chart Visualization
 * Displays aggregated values as a line chart
 * Best for showing trends over time or comparing multiple values
 */
const LineVisualization: React.FC<VisualizationProps> = ({
  data,
  columns,
  height = 300,
}) => {
  const recharts = useRecharts();
  if (!recharts) {
    return <div style={{ height }} className="visualization-empty">Loading chart...</div>;
  }
  const { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } = recharts;
  // Handle empty data
  if (!data || columns.length === 0) {
    return (
      <div className="visualization-empty">
        <p>No data available</p>
      </div>
    );
  }

  // Check if data is an array (time-series data) or object (single aggregation)
  const isTimeSeries = Array.isArray(data);
  
  let lineData;
  if (isTimeSeries && data.length > 0) {
    // Transform time-series data for line chart
    lineData = data.map((point, index) => {
      const pointData = point as Record<string, any>;
      let label = '';
      
      // Build label based on available date/time fields
      if (pointData.date && pointData.hour !== undefined) {
        // Hourly data: show time only "20:00"
        label = `${String(pointData.hour).padStart(2, '0')}:00`;
      } else if (pointData.date) {
        // Daily data: show date only "Jan 18"
        const dateObj = new Date(pointData.date);
        label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (pointData.week_start) {
        // Weekly data: show week start date "Jan 13"
        const dateObj = new Date(pointData.week_start);
        label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (pointData.month_start) {
        // Monthly data: show month only "January"
        const dateObj = new Date(pointData.month_start);
        label = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else {
        label = `Point ${index + 1}`;
      }
      
      const dataPoint = { name: label } as Record<string, any>;
      columns.forEach(col => {
        dataPoint[col] = Number(pointData[col]) || 0;
      });
      return dataPoint;
    });
  } else if (Array.isArray(data) && data.length === 0) {
    return (
      <div className="visualization-empty">
        <p>No data available</p>
      </div>
    );
  } else {
    // Transform single aggregation for line chart
    lineData = [
      {
        name: 'Values',
        ...Object.fromEntries(columns.map((col) => [col, Number((data as Record<string, any>)[col]) || 0])),
      },
    ];
  }

  return (
    <div className="visualization-container">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={lineData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={Math.max(0, Math.floor(lineData.length / 10))}
          />
          <YAxis />
          <Tooltip formatter={formatValue} />
          <Legend />
          {columns.map((column, index) => (
            <Line
              key={column}
              type="monotone"
              dataKey={column}
              stroke={COLORS[index % COLORS.length]}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Bar Chart Visualization
 * Displays aggregated values as a bar chart
 * Best for comparing values across different columns
 */
const BarVisualization: React.FC<VisualizationProps> = ({
  data,
  columns,
  height = 300,
}) => {
  const recharts = useRecharts();
  if (!recharts) {
    return <div style={{ height }} className="visualization-empty">Loading chart...</div>;
  }
  const { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } = recharts;
  // Handle empty data
  if (!data || columns.length === 0) {
    return (
      <div className="visualization-empty">
        <p>No data available</p>
      </div>
    );
  }

  // Check if data is an array (time-series data) or object (single aggregation)
  const isTimeSeries = Array.isArray(data);
  
  let barData;
  if (isTimeSeries && data.length > 0) {
    // Transform time-series data for bar chart
    barData = data.map((point, index) => {
      const pointData = point as Record<string, any>;
      let label = '';
      
      // Build label based on available date/time fields
      if (pointData.date && pointData.hour !== undefined) {
        // Hourly data: show time only "20:00"
        label = `${String(pointData.hour).padStart(2, '0')}:00`;
      } else if (pointData.date) {
        // Daily data: show date only "Jan 18"
        const dateObj = new Date(pointData.date);
        label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (pointData.week_start) {
        // Weekly data: show week start date "Jan 13"
        const dateObj = new Date(pointData.week_start);
        label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (pointData.month_start) {
        // Monthly data: show month only "January"
        const dateObj = new Date(pointData.month_start);
        label = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else {
        label = `Point ${index + 1}`;
      }
      
      const dataPoint = { name: label } as Record<string, any>;
      columns.forEach(col => {
        dataPoint[col] = Number(pointData[col]) || 0;
      });
      return dataPoint;
    });
  } else if (Array.isArray(data) && data.length === 0) {
    return (
      <div className="visualization-empty">
        <p>No data available</p>
      </div>
    );
  } else {
    // Transform single aggregation for bar chart
    barData = [
      {
        name: 'Values',
        ...Object.fromEntries(columns.map((col) => [col, Number((data as Record<string, any>)[col]) || 0])),
      },
    ];
  }

  return (
    <div className="visualization-container">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={barData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={Math.max(0, Math.floor(barData.length / 10))}
          />
          <YAxis />
          <Tooltip formatter={formatValue} />
          <Legend />
          {columns.map((column, index) => (
            <Bar
              key={column}
              dataKey={column}
              fill={COLORS[index % COLORS.length]}
              radius={[8, 8, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Area Chart Visualization
 * Displays aggregated values as an area chart
 * Best for showing cumulative trends or stacked values
 */
const AreaVisualization: React.FC<VisualizationProps> = ({
  data,
  columns,
  height = 300,
}) => {
  // Handle empty data
  if (!data || columns.length === 0) {
    return (
      <div className="visualization-empty">
        <p>No data available</p>
      </div>
    );
  }

  // Check if data is an array (time-series data) or object (single aggregation)
  const isTimeSeries = Array.isArray(data);
  
  let areaData;
  if (isTimeSeries && data.length > 0) {
    // Transform time-series data for area chart
    areaData = data.map((point, index) => {
      const pointData = point as Record<string, any>;
      let label = '';
      
      // Build label based on available date/time fields
      if (pointData.date && pointData.hour !== undefined) {
        // Hourly data: show time only "20:00"
        label = `${String(pointData.hour).padStart(2, '0')}:00`;
      } else if (pointData.date) {
        // Daily data: show date only "Jan 18"
        const dateObj = new Date(pointData.date);
        label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (pointData.week_start) {
        // Weekly data: show week start date "Jan 13"
        const dateObj = new Date(pointData.week_start);
        label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (pointData.month_start) {
        // Monthly data: show month only "January"
        const dateObj = new Date(pointData.month_start);
        label = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else {
        label = `Point ${index + 1}`;
      }
      
      const dataPoint = { name: label } as Record<string, any>;
      columns.forEach(col => {
        dataPoint[col] = Number(pointData[col]) || 0;
      });
      return dataPoint;
    });
  } else if (Array.isArray(data) && data.length === 0) {
    return (
      <div className="visualization-empty">
        <p>No data available</p>
      </div>
    );
  } else {
    // Transform single aggregation for area chart
    areaData = [
      {
        name: 'Values',
        ...Object.fromEntries(columns.map((col) => [col, Number((data as Record<string, any>)[col]) || 0])),
      },
    ];
  }

  return (
    <div className="visualization-container">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={areaData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            {columns.map((column, index) => (
              <linearGradient key={`gradient-${column}`} id={`color-${column}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={Math.max(0, Math.floor(areaData.length / 10))}
          />
          <YAxis />
          <Tooltip formatter={formatValue} />
          <Legend />
          {columns.map((column, index) => (
            <Area
              key={column}
              type="monotone"
              dataKey={column}
              stroke={COLORS[index % COLORS.length]}
              fillOpacity={1}
              fill={`url(#color-${column})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Candlestick Chart Visualization
 * Displays aggregated values as a candlestick chart
 * Best for showing high/low/open/close values (financial data)
 * For this implementation, we use a bar chart as a fallback
 * since Recharts doesn't have native candlestick support
 */
const CandlestickVisualization: React.FC<VisualizationProps> = ({
  data,
  columns,
  height = 300,
}) => {
  // Handle empty data
  if (!data || columns.length === 0) {
    return (
      <div className="visualization-empty">
        <p>No data available</p>
      </div>
    );
  }

  // Handle array data - use first element
  let dataObj: VisualizationData;
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <div className="visualization-empty">
          <p>No data available</p>
        </div>
      );
    }
    dataObj = data[0];
  } else {
    dataObj = data;
  }

  // For candlestick, we expect data with specific columns: open, high, low, close
  // If not available, we'll display a bar chart as fallback
  const hasOHLC = ['open', 'high', 'low', 'close'].every((col) => col in dataObj);

  if (hasOHLC) {
    // Display candlestick-like data using bar chart
    const candleData = [
      {
        name: 'OHLC',
        open: Number(dataObj.open) || 0,
        high: Number(dataObj.high) || 0,
        low: Number(dataObj.low) || 0,
        close: Number(dataObj.close) || 0,
      },
    ];

    return (
      <div className="visualization-container">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={candleData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={formatValue} />
            <Legend />
            <Bar dataKey="open" fill={COLORS[0]} />
            <Bar dataKey="high" fill={COLORS[1]} />
            <Bar dataKey="low" fill={COLORS[2]} />
            <Bar dataKey="close" fill={COLORS[3]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Fallback: display as bar chart
  return <BarVisualization data={data} type="bar" columns={columns} height={height} />;
};

/**
 * Generic Visualization Component
 * Renders the appropriate visualization based on type
 * Works with generic data structures and supports multiple chart types
 */
export const Visualization: React.FC<VisualizationProps> = ({
  type,
  data,
  columns,
  height = 300,
}) => {
  // Handle empty data
  if (!data || columns.length === 0) {
    return (
      <div className="visualization-empty">
        <p>No data available</p>
      </div>
    );
  }

  // Check if data is empty array
  if (Array.isArray(data) && data.length === 0) {
    return (
      <div className="visualization-empty">
        <p>No data available</p>
      </div>
    );
  }

  switch (type) {
    case 'pie':
      return <PieVisualization data={data} columns={columns} height={height} />;
    case 'line':
      return <LineVisualization data={data} columns={columns} height={height} />;
    case 'bar':
      return <BarVisualization data={data} columns={columns} height={height} />;
    case 'area':
      return <AreaVisualization data={data} columns={columns} height={height} />;
    case 'candlestick':
      return <CandlestickVisualization data={data} columns={columns} height={height} />;
    default:
      return (
        <div className="visualization-empty">
          <p>Unknown visualization type: {type}</p>
        </div>
      );
  }
};
