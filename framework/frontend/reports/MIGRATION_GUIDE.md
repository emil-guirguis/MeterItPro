# Reports Framework Migration Guide

This guide helps you integrate the Reports Framework into your existing application.

## Overview

The Reports Framework provides a standardized way to generate and display reports in multiple formats. It's designed to work alongside existing reporting functionality and can be adopted incrementally.

## Migration Steps

### Step 1: Import the Framework

Update your imports to use the framework:

```typescript
// Before (if you had custom report code)
import { generateReport } from '../utils/reportGenerator';

// After
import { useReport, ReportViewer, ReportHeader } from '../../../framework/frontend/reports';
import type { ReportTemplate, Report } from '../../../framework/frontend/reports';
```

### Step 2: Define Report Templates

Convert your existing report structure to the framework's template format:

```typescript
// Before (custom structure)
const reportConfig = {
  title: 'Sales Report',
  data: salesData,
  columns: ['name', 'sales', 'units'],
};

// After (framework template)
const reportTemplate: ReportTemplate = {
  id: 'sales-report',
  name: 'Sales Report',
  sections: [
    {
      type: 'summary',
      title: 'Overview',
      content: summaryMetrics,
    },
    {
      type: 'table',
      title: 'Sales Data',
      content: {
        columns: [
          { key: 'name', label: 'Product Name' },
          { key: 'sales', label: 'Sales', format: (v) => `$${v}` },
          { key: 'units', label: 'Units' },
        ],
        data: salesData,
      },
    },
  ],
};
```

### Step 3: Use the useReport Hook

Replace custom report generation logic with the `useReport` hook:

```typescript
// Before (custom implementation)
const [report, setReport] = useState(null);
const [loading, setLoading] = useState(false);

const generateReport = async () => {
  setLoading(true);
  try {
    const result = await customGenerateReport(data);
    setReport(result);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

// After (framework hook)
const {
  report,
  generateReport,
  downloadReport,
  isLoading,
  error,
} = useReport({
  data: salesData,
  options: {
    format: 'pdf',
    template: reportTemplate,
    title: 'Sales Report',
  },
});
```

### Step 4: Update UI Components

Replace custom report display components with framework components:

```typescript
// Before (custom components)
<div>
  <h1>{report.title}</h1>
  <CustomReportTable data={report.data} />
  <button onClick={exportToPDF}>Export PDF</button>
</div>

// After (framework components)
<>
  <ReportHeader
    report={report}
    exportFormats={['pdf', 'excel', 'csv']}
    onExport={(format) => downloadReport(format)}
    showMetadata
  />
  <ReportViewer report={report} isLoading={isLoading} error={error} />
</>
```

## Integration with Existing MCP Report Tool

If you're using the MCP `generate_report` tool, you can integrate it with the framework:

### Example: Converting MCP Report to Framework Report

```typescript
import { generateReport as mcpGenerateReport } from '../mcp/tools/generate-report';
import { useReport } from '../../../framework/frontend/reports';

function ReportPage() {
  const [mcpData, setMcpData] = useState(null);

  // Fetch data from MCP tool
  const fetchMCPReport = async () => {
    const result = await mcpGenerateReport({
      report_type: 'summary',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    });
    setMcpData(result.report);
  };

  // Convert MCP data to framework template
  const reportTemplate: ReportTemplate = {
    id: 'mcp-report',
    name: 'MCP Generated Report',
    sections: [
      {
        type: 'summary',
        title: 'Summary Statistics',
        content: [
          {
            label: 'Total Sites',
            value: mcpData?.total_sites || 0,
            format: 'number',
          },
          {
            label: 'Total Readings',
            value: mcpData?.total_readings || 0,
            format: 'number',
          },
        ],
      },
      {
        type: 'table',
        title: 'Site Data',
        content: {
          columns: [
            { key: 'site_name', label: 'Site' },
            { key: 'meter_count', label: 'Meters' },
            { key: 'reading_count', label: 'Readings' },
          ],
          data: mcpData?.sites || [],
        },
      },
    ],
  };

  const { report, generateReport, downloadReport } = useReport({
    data: mcpData,
    options: {
      template: reportTemplate,
      format: 'csv',
    },
  });

  return (
    <div>
      <button onClick={fetchMCPReport}>Fetch MCP Data</button>
      {mcpData && (
        <>
          <button onClick={() => generateReport()}>Generate Report</button>
          <ReportViewer report={report} />
        </>
      )}
    </div>
  );
}
```

## CSV Export Integration

The framework integrates with the existing CSV export utilities from the lists framework:

```typescript
import { generateCSV, downloadCSV } from '../../../framework/frontend/lists/utils/exportHelpers';

// Use existing CSV utilities directly
const csvContent = generateCSV(
  ['Name', 'Sales', 'Units'],
  data.map(item => [item.name, item.sales, item.units]),
  'Sales Report - Generated on ' + new Date().toLocaleDateString()
);

downloadCSV(csvContent, 'sales-report.csv');

// Or use the framework's CSV export
const { downloadReport } = useReport({...});
await downloadReport('csv', 'sales-report.csv');
```

## Common Migration Patterns

### Pattern 1: Simple Data Table Report

```typescript
// Convert a simple data table to a report
const data = [
  { id: 1, name: 'Item 1', value: 100 },
  { id: 2, name: 'Item 2', value: 200 },
];

const template: ReportTemplate = {
  id: 'simple-table',
  name: 'Data Report',
  sections: [
    {
      type: 'table',
      content: {
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'value', label: 'Value', format: (v) => `$${v}` },
        ],
        data,
      },
    },
  ],
};
```

### Pattern 2: Dashboard-Style Report with Metrics

```typescript
const template: ReportTemplate = {
  id: 'dashboard-report',
  name: 'Dashboard Report',
  sections: [
    {
      type: 'summary',
      title: 'Key Metrics',
      content: [
        { label: 'Total Revenue', value: 50000, format: 'currency' },
        { label: 'Total Orders', value: 1250, format: 'number' },
        { label: 'Conversion Rate', value: 3.5, format: 'percentage' },
      ],
    },
    {
      type: 'table',
      title: 'Top Products',
      content: {
        columns: [...],
        data: topProducts,
      },
    },
  ],
};
```

### Pattern 3: Multi-Section Report

```typescript
const template: ReportTemplate = {
  id: 'comprehensive-report',
  name: 'Comprehensive Report',
  sections: [
    {
      type: 'header',
      content: 'Executive Summary',
    },
    {
      type: 'summary',
      title: 'Overview',
      content: summaryMetrics,
    },
    {
      type: 'text',
      title: 'Analysis',
      content: 'Detailed analysis text...',
    },
    {
      type: 'table',
      title: 'Detailed Data',
      content: {
        columns: [...],
        data: detailedData,
      },
      pageBreak: true, // Start on new page in PDF
    },
    {
      type: 'footer',
      content: 'Report generated by MeterIt Pro',
    },
  ],
};
```

## Best Practices

### 1. Reusable Templates

Create reusable template functions:

```typescript
export function createSalesReportTemplate(data: any[]): ReportTemplate {
  return {
    id: 'sales-report',
    name: 'Sales Report',
    sections: [
      // ... sections using data
    ],
  };
}

// Usage
const template = createSalesReportTemplate(salesData);
const { report, generateReport } = useReport({
  data: salesData,
  options: { template, format: 'pdf' },
});
```

### 2. Format-Specific Handling

Handle different formats appropriately:

```typescript
const handleExport = async (format: ReportFormat) => {
  if (format === 'pdf' || format === 'excel') {
    alert('PDF and Excel require additional libraries. See documentation.');
    return;
  }
  await downloadReport(format);
};
```

### 3. Error Handling

Always handle errors gracefully:

```typescript
const { error } = useReport({...});

if (error) {
  return (
    <div className="error-message">
      <p>Failed to generate report: {error}</p>
      <button onClick={() => generateReport()}>Retry</button>
    </div>
  );
}
```

### 4. Loading States

Show appropriate loading states:

```typescript
const { isLoading } = useReport({...});

if (isLoading) {
  return <LoadingSpinner message="Generating report..." />;
}
```

## Troubleshooting

### Issue: PDF/Excel Not Working

**Solution**: The framework provides placeholder implementations for PDF and Excel. To enable full functionality:

1. Install required library:
   ```bash
   npm install jspdf jspdf-autotable  # For PDF
   npm install xlsx                    # For Excel
   ```

2. Update the generator files:
   - See `framework/frontend/reports/utils/pdfGenerator.ts`
   - See `framework/frontend/reports/utils/excelGenerator.ts`

### Issue: Custom Section Types

**Solution**: Use custom section renderers:

```typescript
<ReportViewer
  report={report}
  sectionRenderers={{
    myCustomType: (section, data) => (
      <MyCustomComponent section={section} data={data} />
    ),
  }}
/>
```

### Issue: Styling Not Applied

**Solution**: Ensure styles are defined in the template:

```typescript
const template: ReportTemplate = {
  // ...
  styles: {
    primaryColor: '#3b82f6',
    table: {
      headerBackgroundColor: '#f3f4f6',
    },
  },
};
```

## Next Steps

1. Review the [README.md](./README.md) for complete API documentation
2. Check the [examples/](./examples/) directory for working examples
3. Test report generation with your data
4. Customize templates to match your needs
5. Consider integrating PDF/Excel libraries for full functionality

## Support

For issues or questions:
- Review the type definitions in `types/report.ts`
- Check the implementation in `hooks/useReport.tsx`
- Refer to the examples in `examples/`
