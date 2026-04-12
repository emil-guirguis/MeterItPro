import React, { useMemo } from 'react';
import { BaseList } from '@framework/components/list/BaseList';
import { useAuth } from '../../hooks/useAuth';
import { useBaseList } from '@framework/components/list/hooks';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@framework/components/list/utils/schemaColumnGenerator';
import type { Report } from './types';
import { Permission } from '../../types/auth';
import type { ColumnDefinition } from '@framework/components/list/types';
import { useReportsEnhanced } from './reportsStore';
import './ReportList.css';

interface ReportListProps {
  onReportSelect?: (report: Report) => void;
  onReportEdit?: (report: Report) => void;
  onReportCreate?: () => void;
}

export const ReportList: React.FC<ReportListProps> = ({
  onReportSelect,
  onReportEdit,
  onReportCreate,
}) => {
    const auth = useAuth();
    const { schema } = useSchema('report');

  const customColumns: ColumnDefinition<Report>[] = useMemo(() => {
    if (!schema?.formFields) return [];
    
    const generatedColumns = generateColumnsFromSchema(schema.formFields);
    
    return generatedColumns.map(col => {
      if (col.key === 'recipients') {
        return {
          ...col,
          render: (value: string[]) => (
            <div className="recipients-list">
              {Array.isArray(value) && value.length > 0 ? (
                <>
                  <span className="recipient-count">{value.length} recipient{value.length !== 1 ? 's' : ''}</span>
                  <div className="recipients-tooltip">
                    {value.map((email, idx) => (
                      <div key={idx} className="recipient-email">{email}</div>
                    ))}
                  </div>
                </>
              ) : (
                <span className="no-recipients">No recipients</span>
              )}
            </div>
          ),
        };
      }
      if (col.key === 'schedule') {
        return {
          ...col,
          render: (value: string) => (
            <code className="schedule-code">{value}</code>
          ),
        };
      }
      return col;
    });
  }, [schema]);

  const reportFilters = useMemo(() => {
    if (!schema?.formFields) {
      console.log('[ReportList] No schema.formFields available', { schema });
      return [];
    }
    console.log('[ReportList] Generating filters from schema.formFields:', schema.formFields);
    const filters = generateFiltersFromSchema(schema.formFields);
    console.log('[ReportList] Generated filters:', filters);
    return filters;
  }, [schema]);

  const baseList = useBaseList<Report, any>({
    entityName: 'report',
    entityNamePlural: 'reports',
    useStore: useReportsEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: true,
      allowExport: true,
      allowImport: false,
      allowSearch: true,
      allowFilters: true,
      allowStats: false,
    },
    permissions: {
      create: Permission.REPORT_CREATE,
      update: Permission.REPORT_UPDATE,
      read: Permission.REPORT_READ,
      delete: Permission.REPORT_DELETE,
    },
    columns: customColumns,
    filters: reportFilters,
    onEdit: onReportEdit,
    onCreate: onReportCreate,
    authContext: auth,
  });

  return (
    <div className="report-list">
      <BaseList
        title="Reports"
        filters={baseList.renderFilters()}
        onCreateClick={baseList.canCreate ? baseList.handleCreate : undefined}
        onExportClick={baseList.canExport ? () => baseList.handleExport(baseList.data) : undefined}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No reports found. Create your first report to get started."
        onEdit={baseList.handleEdit}
        onDelete={baseList.handleDelete}
        onSelect={baseList.bulkActions.length > 0 && onReportSelect ? (items) => onReportSelect(items[0]) : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
      {baseList.renderDeleteConfirmation()}
    </div>
  );
};

export default ReportList;

