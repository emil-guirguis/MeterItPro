/**
 * Reports Framework - Type Definitions
 * 
 * Defines types for report generation, templates, and display.
 */

/**
 * Report format types
 */
export type ReportFormat = 'pdf' | 'csv' | 'excel' | 'json';

/**
 * Report section types
 */
export type ReportSectionType = 'header' | 'table' | 'chart' | 'text' | 'summary' | 'footer';

/**
 * Chart types for report visualizations
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';

/**
 * Report status
 */
export type ReportStatus = 'idle' | 'generating' | 'ready' | 'error';

/**
 * Report template configuration
 */
export interface ReportTemplate {
  /** Unique identifier for the template */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Template description */
  description?: string;
  
  /** Report sections */
  sections: ReportSection[];
  
  /** Styling configuration */
  styles?: ReportStyles;
  
  /** Page configuration */
  pageConfig?: PageConfig;
}

/**
 * Report section definition
 */
export interface ReportSection {
  /** Section type */
  type: ReportSectionType;
  
  /** Section title */
  title?: string;
  
  /** Section content */
  content: any;
  
  /** Section-specific styling */
  styles?: Record<string, any>;
  
  /** Whether section should start on a new page */
  pageBreak?: boolean;
}

/**
 * Report styling configuration
 */
export interface ReportStyles {
  /** Font family */
  fontFamily?: string;
  
  /** Base font size */
  fontSize?: number;
  
  /** Primary color */
  primaryColor?: string;
  
  /** Secondary color */
  secondaryColor?: string;
  
  /** Header styles */
  header?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    padding?: number;
  };
  
  /** Table styles */
  table?: {
    headerBackgroundColor?: string;
    headerTextColor?: string;
    borderColor?: string;
    alternateRowColor?: string;
  };
  
  /** Custom CSS for web-based reports */
  customCSS?: string;
}

/**
 * Page configuration for PDF reports
 */
export interface PageConfig {
  /** Page size */
  size?: 'A4' | 'Letter' | 'Legal';
  
  /** Page orientation */
  orientation?: 'portrait' | 'landscape';
  
  /** Page margins */
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  
  /** Show page numbers */
  showPageNumbers?: boolean;
  
  /** Header content */
  header?: string | ((pageNumber: number, totalPages: number) => string);
  
  /** Footer content */
  footer?: string | ((pageNumber: number, totalPages: number) => string);
}

/**
 * Generated report data
 */
export interface Report<T = any> {
  /** Report ID */
  id: string;
  
  /** Report title */
  title: string;
  
  /** Report description */
  description?: string;
  
  /** Template used */
  template: ReportTemplate;
  
  /** Report data */
  data: T;
  
  /** Generated timestamp */
  generatedAt: Date;
  
  /** Report format */
  format: ReportFormat;
  
  /** Report status */
  status: ReportStatus;
  
  /** Generated content (URL or blob) */
  content?: string | Blob;
  
  /** Error message if generation failed */
  error?: string;
  
  /** Report metadata */
  metadata?: ReportMetadata;
}

/**
 * Report metadata
 */
export interface ReportMetadata {
  /** Author/generator */
  author?: string;
  
  /** Report period */
  period?: {
    startDate: Date;
    endDate: Date;
  };
  
  /** Number of records */
  recordCount?: number;
  
  /** Custom metadata */
  [key: string]: any;
}

/**
 * Report generation options
 */
export interface ReportGenerationOptions {
  /** Report format */
  format: ReportFormat;
  
  /** Template to use */
  template: ReportTemplate;
  
  /** Data to include in report */
  data: any;
  
  /** Report title */
  title?: string;
  
  /** Report description */
  description?: string;
  
  /** Additional metadata */
  metadata?: Partial<ReportMetadata>;
  
  /** Whether to auto-download */
  autoDownload?: boolean;
  
  /** Filename for download */
  filename?: string;
}

/**
 * Table column definition for reports
 */
export interface ReportTableColumn {
  /** Column key */
  key: string;
  
  /** Column header label */
  label: string;
  
  /** Column width (for PDF) */
  width?: number | string;
  
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  
  /** Format function */
  format?: (value: any, row: any) => string;
  
  /** Whether column is sortable */
  sortable?: boolean;
}

/**
 * Chart configuration for reports
 */
export interface ReportChartConfig {
  /** Chart type */
  type: ChartType;
  
  /** Chart title */
  title?: string;
  
  /** X-axis configuration */
  xAxis?: {
    label?: string;
    dataKey: string;
  };
  
  /** Y-axis configuration */
  yAxis?: {
    label?: string;
    dataKey: string;
  };
  
  /** Chart data */
  data: any[];
  
  /** Chart colors */
  colors?: string[];
  
  /** Chart dimensions */
  dimensions?: {
    width?: number;
    height?: number;
  };
}

/**
 * Summary statistics for reports
 */
export interface ReportSummary {
  /** Summary label */
  label: string;
  
  /** Summary value */
  value: string | number;
  
  /** Value format */
  format?: 'number' | 'currency' | 'percentage' | 'date';
  
  /** Icon or indicator */
  icon?: string;
  
  /** Trend indicator */
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: number;
    label?: string;
  };
}

/**
 * Report export configuration
 */
export interface ReportExportConfig {
  /** Available formats */
  formats: ReportFormat[];
  
  /** Default format */
  defaultFormat?: ReportFormat;
  
  /** Filename generator */
  generateFilename?: (format: ReportFormat, report: Report) => string;
  
  /** Custom export handlers */
  customHandlers?: {
    [format: string]: (report: Report) => Promise<void>;
  };
}
