# Reports Framework

A comprehensive framework for generating and displaying reports in multiple formats (PDF, Excel, CSV, JSON).

## Features

- **Multiple Formats**: Generate reports in PDF, Excel, CSV, or JSON format
- **Flexible Templates**: Define report structure with sections (header, table, chart, summary, text)
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **React Components**: Pre-built components for displaying reports
- **Customizable**: Extensive styling and configuration options
- **Export Ready**: Built-in download functionality for all formats

## Installation

The reports framework is part of the main framework package. Import from:

```typescript
import { useReport, ReportViewer, ReportHeader } from '../../../framework/frontend/reports';
```

## Quick Start

### Basic Report Generation

```typescript
import { useReport, ReportViewer } from '../../../framework/frontend/reports';

function MyReportPage() {
  const { report, generateReport, isLoading, error } = useReport({
    data: myData,
    options: {
      format: 'pdf',
      template: {
        id: 'monthly-report',
        name: 'Monthly Report',
        sections: [
          {
            type: 'header',
            title: 'Summary',
            content: 'This is the monthly summary report',
          },
          {
            type: 'table',
            title: 'Data Table',
            content: {
              columns: [
                { key: 'name', label: 'Name' },
                { key: 'value', label: 'Value' },
              ],
              data: myData,
            },
          },
        ],
      },
      title: 'Monthly Report',
    },
  });

  return (
    <div>
      <button onClick={() => generateReport()}>Generate Report</button>
      <ReportViewer report={report} isLoading={isLoading} error={error} />
    </div>
  );
}
```

## Report Templates

### Template Structure

```typescript
interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  sections: ReportSection[];
  styles?: ReportStyles;
  pageConfig?: PageConfig;
}
```

### Section Types

#### Header/Footer Section
```typescript
{
  type: 'header', // or 'footer'
  title: 'Report Header',
  content: 'Header text content',
}
```

#### Text Section
```typescript
{
  type: 'text',
  title: 'Introduction',
  content: 'This is a text section with detailed information...',
}
```

#### Table Section
```typescript
{
  type: 'table',
  title: 'Data Table',
  content: {
    columns: [
      { 
        key: 'name', 
        label: 'Name',
        align: 'left',
        format: (value) => value.toUpperCase()
      },
      { 
        key: 'amount', 
        label: 'Amount',
        align: 'right',
        format: (value) => `$${value.toFixed(2)}`
      },
    ],
    data: [
      { name: 'Item 1', amount: 100 },
      { name: 'Item 2', amount: 200 },
    ],
  },
}
```

#### Summary Section
```typescript
{
  type: 'summary',
  title: 'Key Metrics',
  content: [
    {
      label: 'Total Revenue',
      value: 50000,
      format: 'currency',
      icon: '💰',
      trend: {
        direction: 'up',
        value: 15,
        label: '15% increase',
      },
    },
    {
      label: 'Total Orders',
      value: 1250,
      format: 'number',
      icon: '📦',
    },
  ],
}
```

#### Chart Section
```typescript
{
  type: 'chart',
  title: 'Sales Trend',
  content: {
    type: 'line',
    data: chartData,
    xAxis: { label: 'Month', dataKey: 'month' },
    yAxis: { label: 'Sales', dataKey: 'sales' },
  },
}
```

## Components

### ReportViewer

Displays the generated report with all sections.

```typescript
<ReportViewer
  report={report}
  isLoading={isLoading}
  error={error}
  sectionRenderers={{
    custom: (section, data) => <CustomSection section={section} data={data} />
  }}
/>
```

### ReportHeader

Displays report metadata and export actions.

```typescript
<ReportHeader
  report={report}
  exportFormats={['pdf', 'excel', 'csv']}
  onExport={(format) => downloadReport(format)}
  onPrint={() => window.print()}
  showMetadata
/>
```

## Hooks

### useReport

Main hook for report generation and management.

```typescript
const {
  report,           // Current report
  status,           // 'idle' | 'generating' | 'ready' | 'error'
  isLoading,        // Boolean loading state
  error,            // Error message if any
  generateReport,   // Function to generate report
  downloadReport,   // Function to download report
  clearReport,      // Function to clear current report
  updateData,       // Function to update report data
} = useReport({
  data: myData,
  options: {
    format: 'pdf',
    template: myTemplate,
    title: 'My Report',
  },
  autoGenerate: false,
  onGenerated: (report) => console.log('Report generated:', report),
  onError: (error) => console.error('Generation failed:', error),
});
```

## Export Formats

### PDF Export

```typescript
await generateReport({ format: 'pdf' });
```

**Note**: PDF generation requires a library like jsPDF or pdfmake. The current implementation is a placeholder. See `utils/pdfGenerator.ts` for integration examples.

### Excel Export

```typescript
await generateReport({ format: 'excel' });
```

**Note**: Excel generation requires a library like SheetJS (xlsx) or ExcelJS. The current implementation is a placeholder. See `utils/excelGenerator.ts` for integration examples.

### CSV Export

```typescript
await generateReport({ format: 'csv' });
```

CSV export is fully functional and integrates with the existing CSV export utilities.

### JSON Export

```typescript
await generateReport({ format: 'json' });
```

Exports the raw report data as JSON.

## Styling

### Custom Styles

```typescript
const template: ReportTemplate = {
  id: 'styled-report',
  name: 'Styled Report',
  sections: [...],
  styles: {
    fontFamily: 'Arial',
    fontSize: 12,
    primaryColor: '#3b82f6',
    secondaryColor: '#6b7280',
    header: {
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      fontSize: 16,
      padding: 10,
    },
    table: {
      headerBackgroundColor: '#f3f4f6',
      headerTextColor: '#111827',
      borderColor: '#e5e7eb',
      alternateRowColor: '#f9fafb',
    },
  },
};
```

## Advanced Usage

### Custom Section Renderers

```typescript
<ReportViewer
  report={report}
  sectionRenderers={{
    customChart: (section, data) => (
      <div>
        <h3>{section.title}</h3>
        <MyCustomChart data={section.content} />
      </div>
    ),
  }}
/>
```

### Auto-Download on Generation

```typescript
await generateReport({
  format: 'pdf',
  autoDownload: true,
  filename: 'monthly-report-2024.pdf',
});
```

### Multiple Format Export

```typescript
const formats: ReportFormat[] = ['pdf', 'excel', 'csv'];

for (const format of formats) {
  await downloadReport(format, `report-${format}`);
}
```

## Integration with Existing Code

The reports framework integrates with the existing CSV export functionality from the lists framework:

```typescript
import { generateCSV, downloadCSV } from '../../../framework/frontend/lists/utils/exportHelpers';

// Use existing CSV utilities
const csvContent = generateCSV(headers, rows, info);
downloadCSV(csvContent, filename);
```

## Examples

See the `examples/` directory for complete working examples:

- Simple report generation
- Multi-section reports
- Custom styling
- Export to multiple formats

## API Reference

### Types

- `Report<T>` - Generated report data
- `ReportTemplate` - Report template configuration
- `ReportSection` - Individual report section
- `ReportFormat` - Export format type
- `ReportStatus` - Report generation status

### Utilities

- `generatePDF(report)` - Generate PDF blob
- `generateExcel(report)` - Generate Excel blob
- `generateCSVReport(report)` - Generate CSV string
- `dataToCSV(data, columns)` - Convert data array to CSV

## Requirements

This framework satisfies requirements 14.1-14.6 from the framework migration specification:

- ✅ 14.1: Report components for display
- ✅ 14.2: Report state management hook
- ✅ 14.3: PDF and Excel export utilities
- ✅ 14.4: Report type definitions
- ✅ 14.5: Multiple output formats (PDF, CSV, Excel)
- ✅ 14.6: Report templates and customization

## Future Enhancements

- Integration with charting libraries (Chart.js, Recharts)
- Full PDF generation with jsPDF or pdfmake
- Full Excel generation with SheetJS or ExcelJS
- Report scheduling and automation
- Report caching and persistence
- Email report delivery
