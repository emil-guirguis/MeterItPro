/**
 * Reports Framework - Simple Report Example
 * 
 * Demonstrates basic report generation and display.
 */

import React, { useState } from 'react';
import { useReport } from '../hooks/useReport';
import { ReportViewer } from '../components/ReportViewer';
import { ReportHeader } from '../components/ReportHeader';
import type { ReportTemplate, ReportFormat } from '../types/report';

/**
 * Sample data for the report
 */
const sampleData = [
  { id: 1, name: 'Product A', category: 'Electronics', sales: 15000, units: 150 },
  { id: 2, name: 'Product B', category: 'Electronics', sales: 22000, units: 220 },
  { id: 3, name: 'Product C', category: 'Furniture', sales: 8500, units: 45 },
  { id: 4, name: 'Product D', category: 'Furniture', sales: 12000, units: 60 },
  { id: 5, name: 'Product E', category: 'Clothing', sales: 18000, units: 300 },
];

/**
 * Report template definition
 */
const salesReportTemplate: ReportTemplate = {
  id: 'sales-report',
  name: 'Sales Report',
  description: 'Monthly sales performance report',
  sections: [
    {
      type: 'summary',
      title: 'Key Metrics',
      content: [
        {
          label: 'Total Sales',
          value: 75500,
          format: 'currency' as const,
          icon: '💰',
          trend: {
            direction: 'up' as const,
            value: 12.5,
            label: '12.5% vs last month',
          },
        },
        {
          label: 'Total Units',
          value: 775,
          format: 'number' as const,
          icon: '📦',
          trend: {
            direction: 'up' as const,
            value: 8.3,
            label: '8.3% vs last month',
          },
        },
        {
          label: 'Average Order Value',
          value: 97.42,
          format: 'currency' as const,
          icon: '📊',
        },
        {
          label: 'Products Sold',
          value: 5,
          format: 'number' as const,
          icon: '🏷️',
        },
      ],
    },
    {
      type: 'table',
      title: 'Sales by Product',
      content: {
        columns: [
          { key: 'name', label: 'Product Name', align: 'left' as const },
          { key: 'category', label: 'Category', align: 'left' as const },
          { 
            key: 'sales', 
            label: 'Sales', 
            align: 'right' as const,
            format: (value: number) => `$${value.toLocaleString()}`,
          },
          { 
            key: 'units', 
            label: 'Units Sold', 
            align: 'right' as const,
            format: (value: number) => value.toLocaleString(),
          },
          {
            key: 'avgPrice',
            label: 'Avg Price',
            align: 'right' as const,
            format: (_: any, row: any) => `$${(row.sales / row.units).toFixed(2)}`,
          },
        ],
        data: sampleData,
      },
    },
    {
      type: 'text',
      title: 'Analysis',
      content: `This month showed strong performance across all categories. Electronics led with $37,000 in sales, 
followed by Clothing at $18,000 and Furniture at $20,500. The average order value increased by 5% compared 
to last month, indicating customers are purchasing higher-value items.

Key highlights:
- Electronics category grew by 15%
- Furniture category remained stable
- Clothing category showed 10% growth
- Customer satisfaction scores improved to 4.8/5`,
    },
  ],
  styles: {
    primaryColor: '#3b82f6',
    secondaryColor: '#6b7280',
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
  },
};

/**
 * Simple Report Example Component
 */
export const SimpleReportExample: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('csv');

  const {
    report,
    generateReport,
    downloadReport,
    isLoading,
    error,
  } = useReport({
    data: sampleData,
    options: {
      template: salesReportTemplate,
      title: 'Monthly Sales Report',
      description: 'Sales performance for January 2024',
      metadata: {
        author: 'Sales Team',
        period: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        recordCount: sampleData.length,
      },
    },
  });

  const handleGenerate = async () => {
    await generateReport({ format: selectedFormat });
  };

  const handleExport = async (format: ReportFormat) => {
    await downloadReport(format);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Reports Framework Example
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Generate and export reports in multiple formats
        </p>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <label>
            <strong>Format:</strong>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as ReportFormat)}
              style={{
                marginLeft: '0.5rem',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
              }}
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF (Placeholder)</option>
              <option value="excel">Excel (Placeholder)</option>
              <option value="json">JSON</option>
            </select>
          </label>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
            }}
          >
            {isLoading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '0.375rem',
              marginBottom: '1rem',
            }}
          >
            Error: {error}
          </div>
        )}
      </div>

      {report && (
        <>
          <ReportHeader
            report={report}
            exportFormats={['pdf', 'excel', 'csv', 'json']}
            onExport={handleExport}
            onPrint={handlePrint}
            showMetadata
          />
          <ReportViewer report={report} isLoading={isLoading} error={error} />
        </>
      )}

      {!report && !isLoading && (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            color: '#6b7280',
          }}
        >
          <p style={{ fontSize: '1.125rem' }}>
            Select a format and click "Generate Report" to see the report
          </p>
        </div>
      )}
    </div>
  );
};

export default SimpleReportExample;
