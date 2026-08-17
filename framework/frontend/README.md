# Frontend Framework

A comprehensive, domain-driven UI framework for building consistent, reusable components across multiple projects. The framework provides standardized patterns for lists, forms, dashboards, reports, and email templates.

## Overview

This framework was created to enable code reuse across multiple projects while maintaining backward compatibility and ensuring components are project-agnostic. It follows a domain-driven architecture where each feature area (lists, forms, dashboards, etc.) is self-contained with its own types, hooks, components, and utilities.

## Features

- **Lists Framework** - Comprehensive list/table components with filtering, sorting, pagination, bulk actions, and export/import
- **Forms Framework** - Form components with validation, error handling, and permission-based field visibility
- **Dashboards Framework** - Responsive dashboard layouts with customizable widgets
- **Reports Framework** - Report generation and display with PDF, Excel, and CSV export
- **Email Templates Framework** - Email template editor with variable substitution and preview
- **Shared Utilities** - Common utilities, types, hooks, and components used across all domains

## Directory Structure

```
framework/frontend/
├── index.ts                    # Root barrel export
├── README.md                   # This file
├── docs/                       # Framework documentation
│   ├── README.md
│   ├── LISTS.md
│   ├── FORMS.md
│   ├── DASHBOARDS.md
│   ├── REPORTS.md
│   ├── EMAIL_TEMPLATES.md
│   ├── MIGRATION_GUIDE.md
│   └── EXAMPLES.md
├── shared/                     # Cross-domain utilities
│   ├── types/
│   ├── hooks/
│   ├── utils/
│   └── components/
├── lists/                      # List framework
│   ├── types/
│   ├── hooks/
│   ├── components/
│   ├── utils/
│   └── config/
├── forms/                      # Form framework
│   ├── types/
│   ├── hooks/
│   ├── components/
│   └── utils/
├── dashboards/                 # Dashboard framework
│   ├── types/
│   ├── hooks/
│   ├── components/
│   └── utils/
├── reports/                    # Report framework
│   ├── types/
│   ├── hooks/
│   ├── components/
│   └── utils/
└── email-templates/            # Email template framework
    ├── types/
    ├── hooks/
    ├── components/
    └── utils/
```

## Installation

The framework is part of the monorepo and doesn't require separate installation. Simply import from the framework directory using relative paths.

## Usage

### Basic Import Patterns

```typescript
// Import from root (all domains available)
import { useBaseList, useBaseForm, useDashboard } from '../../../framework/frontend';

// Import from specific domain
import { useBaseList, DataList, DataTable } from '../../../framework/frontend/lists';
import { useBaseForm, FormField } from '../../../framework/frontend/forms';

// Import shared utilities
import { useResponsive, formatDate } from '../../../framework/frontend/shared';
```

### Lists Framework Example

```typescript
import { useBaseList, DataList } from '../../../framework/frontend/lists';
import { useAuth } from '../contexts/AuthContext';

function ContactList() {
  const authContext = useAuth();
  
  const listProps = useBaseList({
    entityName: 'contact',
    entityNamePlural: 'contacts',
    useStore: useContactStore,
    authContext, // Inject your auth context
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'phone', label: 'Phone' }
    ],
    filters: [
      { key: 'status', label: 'Status', type: 'select', options: [...] }
    ],
    bulkActions: [
      { id: 'delete', label: 'Delete', icon: 'trash', action: handleBulkDelete }
    ]
  });

  return <DataList {...listProps} />;
}
```

### Forms Framework Example

```typescript
import { useBaseForm, FormField, FormActions } from '../../../framework/frontend/forms';

function ContactForm({ contact, onSave }) {
  const { values, errors, handleChange, handleSubmit, isSubmitting } = useBaseForm({
    initialValues: contact || {},
    validationSchema: {
      name: [{ type: 'required', message: 'Name is required' }],
      email: [
        { type: 'required', message: 'Email is required' },
        { type: 'email', message: 'Invalid email format' }
      ]
    },
    onSubmit: async (values) => {
      await onSave(values);
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label="Name"
        name="name"
        value={values.name}
        error={errors.name}
        onChange={handleChange}
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        value={values.email}
        error={errors.email}
        onChange={handleChange}
      />
      <FormActions
        onSubmit={handleSubmit}
        onCancel={() => history.back()}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
```

### Dashboards Framework Example

```typescript
import { useDashboard, DashboardGrid, StatCard } from '../../../framework/frontend/dashboards';

function Dashboard() {
  const { layout, widgets } = useDashboard({
    layout: { columns: 3, rows: 2, gap: 16 },
    widgets: [
      {
        id: 'total-contacts',
        type: 'stat',
        position: { x: 0, y: 0 },
        size: { width: 1, height: 1 },
        props: { title: 'Total Contacts', value: 1234, trend: '+12%' }
      }
    ]
  });

  return (
    <DashboardGrid layout={layout}>
      {widgets.map(widget => (
        <StatCard key={widget.id} {...widget.props} />
      ))}
    </DashboardGrid>
  );
}
```

### Reports Framework Example

```typescript
import { useReport, ReportViewer } from '../../../framework/frontend/reports';

function ContactReport() {
  const { report, generateReport, isLoading } = useReport({
    data: contacts,
    template: {
      id: 'contact-report',
      name: 'Contact Report',
      sections: [
        { type: 'header', content: { title: 'Contact Report' } },
        { type: 'table', content: { columns: [...], data: contacts } }
      ]
    },
    format: 'pdf'
  });

  return (
    <div>
      <button onClick={generateReport} disabled={isLoading}>
        Generate Report
      </button>
      {report && <ReportViewer report={report} />}
    </div>
  );
}
```

### Email Templates Framework Example

```typescript
import { useTemplate, TemplateEditor, TemplatePreview } from '../../../framework/frontend/email-templates';

function EmailTemplateManager() {
  const { template, updateTemplate, renderPreview } = useTemplate({
    template: {
      id: 'welcome-email',
      name: 'Welcome Email',
      subject: 'Welcome {{name}}!',
      body: 'Hello {{name}}, welcome to our platform!',
      variables: [
        { key: 'name', label: 'Name', type: 'text', required: true }
      ]
    },
    variables: { name: 'John Doe' }
  });

  return (
    <div>
      <TemplateEditor template={template} onChange={updateTemplate} />
      <TemplatePreview template={template} variables={{ name: 'John Doe' }} />
    </div>
  );
}
```

## Auth Context Integration

The framework supports dependency injection for authentication contexts, allowing it to work with different authentication systems:

```typescript
// Define your auth context
const authContext = {
  checkPermission: (permission) => {
    // Your permission logic
    return user.permissions.includes(permission);
  },
  user: currentUser
};

// Pass it to framework hooks
const listProps = useBaseList({
  // ... other config
  authContext, // Framework uses this for permission checks
});
```

## Migration Guide

### Migrating from Client-Specific Components

If you're migrating existing components to use the framework:

1. **Update imports** - Change imports from client-specific paths to framework paths
2. **Inject auth context** - Pass your auth context to framework hooks
3. **Update type imports** - Import types from framework instead of client
4. **Test thoroughly** - Verify all functionality works as expected

Example migration:

```typescript
// Before
import { useBaseList } from '../hooks/useBaseList';
import { DataList } from '../components/common/DataList';
import { Contact } from '../types/entities';

// After
import { useBaseList, DataList } from '../../../framework/frontend/lists';
import { Contact } from '../types/entities'; // Keep entity-specific types in client
import { useAuth } from '../contexts/AuthContext';

function ContactList() {
  const authContext = useAuth(); // Get your auth context
  
  const listProps = useBaseList({
    // ... config
    authContext, // Inject it into the framework
  });
  
  return <DataList {...listProps} />;
}
```

See [docs/MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md) for detailed migration instructions.

## Requirements

- **React** 18+
- **TypeScript** 5.0+
- **Node.js** 18+
- **Modern browsers** with ES2020+ support

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- No IE11 support

## Performance Considerations

- Components use `React.memo` for expensive renders
- Virtual scrolling for large lists
- Lazy loading for framework modules
- Tree shaking for minimal bundle size
- Computed values cached with `useMemo`

## Accessibility

All framework components follow WCAG 2.1 AA standards:

- Keyboard navigation supported
- Screen reader friendly
- Proper ARIA labels and roles
- Focus management
- Color contrast compliance

## Documentation

Detailed documentation for each domain:

- [Lists Framework](./docs/LISTS.md) - Comprehensive list/table functionality
- [Forms Framework](./docs/FORMS.md) - Form handling and validation
- [Dashboards Framework](./docs/DASHBOARDS.md) - Dashboard layouts and widgets
- [Reports Framework](./docs/REPORTS.md) - Report generation and export
- [Email Templates Framework](./docs/EMAIL_TEMPLATES.md) - Template management
- [Migration Guide](./docs/MIGRATION_GUIDE.md) - Migrating existing code
- [Examples](./docs/EXAMPLES.md) - Complete usage examples

## Contributing

When adding new features to the framework:

1. Follow the domain-driven structure
2. Add TypeScript types for all public APIs
3. Include JSDoc comments
4. Update relevant documentation
5. Add examples to the docs
6. Ensure accessibility compliance
7. Test across all supported browsers

## License

Internal use only - part of the MeterIt project.

## Support

For questions or issues with the framework, contact the development team or refer to the documentation in the `docs/` directory.
