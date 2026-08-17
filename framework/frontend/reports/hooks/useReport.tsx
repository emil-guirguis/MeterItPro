/**
 * Reports Framework - useReport Hook
 * 
 * Manages report generation state and provides methods for creating reports
 * in various formats.
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  Report,
  ReportGenerationOptions,
  ReportStatus,
  ReportFormat,
} from '../types/report';
import { generatePDF } from '../utils/pdfGenerator';
import { generateExcel } from '../utils/excelGenerator';
import { generateCSVReport } from '../utils/csvExport';

/**
 * Configuration for useReport hook
 */
export interface UseReportConfig<T = any> {
  /** Initial data for the report */
  data?: T;
  
  /** Report generation options */
  options?: Partial<ReportGenerationOptions>;
  
  /** Auto-generate report on mount */
  autoGenerate?: boolean;
  
  /** Callback when report is generated */
  onGenerated?: (report: Report<T>) => void;
  
  /** Callback when generation fails */
  onError?: (error: Error) => void;
}

/**
 * Return type for useReport hook
 */
export interface UseReportReturn<T = any> {
  /** Current report */
  report: Report<T> | null;
  
  /** Report generation status */
  status: ReportStatus;
  
  /** Whether report is currently generating */
  isLoading: boolean;
  
  /** Error message if generation failed */
  error: string | null;
  
  /** Generate a new report */
  generateReport: (options?: Partial<ReportGenerationOptions>) => Promise<void>;
  
  /** Download the current report */
  downloadReport: (format?: ReportFormat, filename?: string) => Promise<void>;
  
  /** Clear the current report */
  clearReport: () => void;
  
  /** Update report data */
  updateData: (data: T) => void;
}

/**
 * Hook for managing report generation and state
 * 
 * @example
 * ```tsx
 * const { report, generateReport, downloadReport, isLoading } = useReport({
 *   data: myData,
 *   options: {
 *     format: 'pdf',
 *     template: myTemplate,
 *     title: 'Monthly Report'
 *   }
 * });
 * 
 * // Generate report
 * await generateReport();
 * 
 * // Download as Excel
 * await downloadReport('excel', 'monthly-report.xlsx');
 * ```
 */
export function useReport<T = any>(config: UseReportConfig<T> = {}): UseReportReturn<T> {
  const {
    data: initialData,
    options: initialOptions,
    autoGenerate = false,
    onGenerated,
    onError,
  } = config;

  const [report, setReport] = useState<Report<T> | null>(null);
  const [status, setStatus] = useState<ReportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | undefined>(initialData);

  /**
   * Generate a report with the specified options
   */
  const generateReport = useCallback(async (options?: Partial<ReportGenerationOptions>) => {
    try {
      setStatus('generating');
      setError(null);

      // Merge options
      const mergedOptions: ReportGenerationOptions = {
        ...initialOptions,
        ...options,
        data: options?.data ?? data,
      } as ReportGenerationOptions;

      // Validate required options
      if (!mergedOptions.template) {
        throw new Error('Report template is required');
      }
      if (!mergedOptions.data) {
        throw new Error('Report data is required');
      }
      if (!mergedOptions.format) {
        throw new Error('Report format is required');
      }

      // Generate report ID
      const reportId = `report-${Date.now()}`;

      // Create base report object
      const newReport: Report<T> = {
        id: reportId,
        title: mergedOptions.title || mergedOptions.template.name,
        description: mergedOptions.description,
        template: mergedOptions.template,
        data: mergedOptions.data,
        generatedAt: new Date(),
        format: mergedOptions.format,
        status: 'generating',
        metadata: mergedOptions.metadata,
      };

      // Generate content based on format
      let content: string | Blob;
      
      switch (mergedOptions.format) {
        case 'pdf':
          content = await generatePDF(newReport);
          break;
        case 'excel':
          content = await generateExcel(newReport);
          break;
        case 'csv':
          content = generateCSVReport(newReport);
          break;
        case 'json':
          content = JSON.stringify(newReport.data, null, 2);
          break;
        default:
          throw new Error(`Unsupported report format: ${mergedOptions.format}`);
      }

      // Update report with generated content
      newReport.content = content;
      newReport.status = 'ready';

      setReport(newReport);
      setStatus('ready');

      // Auto-download if requested
      if (mergedOptions.autoDownload) {
        await downloadReportContent(
          content,
          mergedOptions.format,
          mergedOptions.filename || generateDefaultFilename(newReport)
        );
      }

      // Call success callback
      if (onGenerated) {
        onGenerated(newReport);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
      setStatus('error');

      if (report) {
        setReport({
          ...report,
          status: 'error',
          error: errorMessage,
        });
      }

      // Call error callback
      if (onError && err instanceof Error) {
        onError(err);
      }

      throw err;
    }
  }, [data, initialOptions, onGenerated, onError, report]);

  /**
   * Download the current report
   */
  const downloadReport = useCallback(async (
    format?: ReportFormat,
    filename?: string
  ) => {
    if (!report) {
      throw new Error('No report available to download');
    }

    // If format is different, regenerate
    if (format && format !== report.format) {
      await generateReport({ format });
      return;
    }

    // Download current report
    if (report.content) {
      const downloadFilename = filename || generateDefaultFilename(report);
      await downloadReportContent(report.content, report.format, downloadFilename);
    }
  }, [report, generateReport]);

  /**
   * Clear the current report
   */
  const clearReport = useCallback(() => {
    setReport(null);
    setStatus('idle');
    setError(null);
  }, []);

  /**
   * Update report data
   */
  const updateData = useCallback((newData: T) => {
    setData(newData);
  }, []);

  // Auto-generate on mount if requested
  useEffect(() => {
    if (autoGenerate && data && initialOptions?.template) {
      generateReport();
    }
  }, []); // Only run on mount

  return {
    report,
    status,
    isLoading: status === 'generating',
    error,
    generateReport,
    downloadReport,
    clearReport,
    updateData,
  };
}

/**
 * Helper function to download report content
 */
async function downloadReportContent(
  content: string | Blob,
  format: ReportFormat,
  filename: string
): Promise<void> {
  let blob: Blob;
  
  if (content instanceof Blob) {
    blob = content;
  } else {
    // Determine MIME type based on format
    const mimeTypes: Record<ReportFormat, string> = {
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv;charset=utf-8;',
      json: 'application/json',
    };
    
    const mimeType = mimeTypes[format] || 'text/plain';
    
    // Add BOM for CSV files for Excel compatibility
    if (format === 'csv') {
      const BOM = '\uFEFF';
      blob = new Blob([BOM + content], { type: mimeType });
    } else {
      blob = new Blob([content], { type: mimeType });
    }
  }

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Generate default filename for report
 */
function generateDefaultFilename(report: Report): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const sanitizedTitle = report.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const extensions: Record<ReportFormat, string> = {
    pdf: 'pdf',
    excel: 'xlsx',
    csv: 'csv',
    json: 'json',
  };
  
  const extension = extensions[report.format] || 'txt';
  
  return `${sanitizedTitle}-${dateStr}.${extension}`;
}
