import React, { useState, useCallback, useMemo } from 'react';
import { BaseList } from '@framework/components/list/BaseList';
import { useMetersEnhanced, type Meter } from './metersStore';
import { useAuth } from '../../hooks/useAuth';
import { useBaseList } from '@framework/components/list/hooks';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@framework/components/list/utils/schemaColumnGenerator';
import { Permission } from '../../types/auth';
import type { ColumnDefinition } from '@framework/components/list/types';
import './MeterList.css';
import { tokenStorage } from '../../utils/tokenStorage';

interface MeterListProps {
  onMeterSelect?: (meter: Meter) => void;
  onMeterEdit?: (meter: Meter) => void;
  onMeterCreate?: () => void;
}

export const MeterList: React.FC<MeterListProps> = ({
  onMeterSelect,
  onMeterEdit,
  onMeterCreate,
}) => {
  const { checkPermission } = useAuth();
  const { schema } = useSchema('meter');
  const [testingConnection, setTestingConnection] = useState<number | null>(null);
  const canRead = checkPermission(Permission.METER_READ);

  const handleTestConnection = useCallback(async (meter: Meter) => {
    if (!canRead) return;
    setTestingConnection(meter.meter_id);
    try {
      const authToken = tokenStorage.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const response = await fetch(`/api/meters/${meter.meter_id}/test-connection`, {
        method: 'POST',
        headers
      });
      const result = await response.json();
      if (!result.success || !result.data.connected) {
        alert(`Connection failed: ${result.data?.error || result.message}`);
      }
    } catch (error) {
      console.error('Connection test error:', error);
    } finally {
      setTestingConnection(null);
    }
  }, [canRead]);

  const customColumns: ColumnDefinition<Meter>[] = useMemo(() => {
    if (!schema?.formFields) return [];
    
    const generatedColumns = generateColumnsFromSchema(schema.formFields);
    
    return generatedColumns.map(col => {
      if (col.key === 'configuration') {
        return {
          ...col,
          render: (value: { ipAddress?: string; port?: number }, meter) => (
            <div className="table-cell--two-line">
              <div className="table-cell__primary">
                {value?.ipAddress || 'Not configured'}:{value?.port || 502}
              </div>
              {value?.ipAddress && (
                <button
                  type="button"
                  onClick={() => handleTestConnection(meter)}
                  disabled={testingConnection === meter.meter_id}
                  className="table-cell__action"
                >
                  {testingConnection === meter.meter_id ? 'Testing...' : 'Test'}
                </button>
              )}
            </div>
          ),
        };
      }
      return col;
    });
  }, [canRead, testingConnection, handleTestConnection, schema]);

  const meterFilters = useMemo(() => {
    if (!schema?.formFields) {
      console.log('[MeterList] No schema.formFields available', { schema });
      return [];
    }
    console.log('[MeterList] Generating filters from schema.formFields:', schema.formFields);
    const filters = generateFiltersFromSchema(schema.formFields);
    console.log('[MeterList] Generated filters:', filters);
    return filters;
  }, [schema]);

  const auth = useAuth();

  const baseList = useBaseList<Meter, any>({
    entityName: 'meter',
    entityNamePlural: 'meters',
    useStore: useMetersEnhanced,
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
      create: Permission.METER_CREATE,
      update: Permission.METER_UPDATE,
      read: Permission.METER_READ,
    },
    columns: customColumns,
    filters: meterFilters,
    onEdit: onMeterEdit,
    onCreate: onMeterCreate,
    authContext: auth,
  });

  return (
    <div className="meter-list">
      <BaseList
        title="Meters"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No meters found. Create your first meter to get started."
        onEdit={baseList.handleEdit}
        onDelete={baseList.handleDelete}
        onSelect={baseList.bulkActions.length > 0 && onMeterSelect ? (items) => onMeterSelect(items[0]) : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
      {baseList.renderDeleteConfirmation()}
    </div>
  );
};

export default MeterList;