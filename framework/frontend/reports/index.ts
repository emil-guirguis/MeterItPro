/**
 * Reports Framework
 * 
 * Provides components, hooks, and utilities for generating and displaying reports
 * in multiple formats (PDF, Excel, CSV).
 * 
 * @example
 * ```tsx
 * import { useReport, ReportViewer } from '@framework/reports';
 * 
 * function MyReportPage() {
 *   const { report, generateReport, isLoading } = useReport({
 *     data: myData,
 *     template: myTemplate,
 *     format: 'pdf'
 *   });
 *   
 *   return <ReportViewer report={report} />;
 * }
 * ```
 */

export * from './types';
export * from './hooks';
export * from './components';
export * from './utils';
