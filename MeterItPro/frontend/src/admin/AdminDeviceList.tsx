import React, { useMemo } from 'react';
import { BaseList } from '@meterit/framework-frontend/components/list/BaseList';
import { useBaseList } from '@meterit/framework-frontend/components/list/hooks';
import { useSchema } from '@meterit/framework-frontend/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@meterit/framework-frontend/components/list/utils/schemaColumnGenerator';
import { useAdminDevicesEnhanced, type AdminDevice } from './adminDevicesStore';

interface AdminDeviceListProps {
  onEdit?: (device: AdminDevice) => void;
  onCreate?: () => void;
}

const allowedAuth = { checkPermission: () => true as boolean, user: undefined };

export const AdminDeviceList: React.FC<AdminDeviceListProps> = ({ onEdit, onCreate }) => {
  const { schema } = useSchema('device');

  const columns = useMemo(() => {
    if (!schema) return [];
    return generateColumnsFromSchema<AdminDevice>(schema.formFields, {
      fieldOrder: ['manufacturer', 'model_number', 'description', 'type', 'number_of_elements', 'default_price'],
      responsive: 'hide-mobile',
    });
  }, [schema]);

  const filters = useMemo(() => {
    if (!schema) return [];
    return generateFiltersFromSchema(schema.formFields, {
      fieldOrder: ['type', 'manufacturer'],
    });
  }, [schema]);

  const baseList = useBaseList<AdminDevice, ReturnType<typeof useAdminDevicesEnhanced>>({
    entityName: 'device',
    entityNamePlural: 'devices',
    useStore: useAdminDevicesEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: false,
      allowExport: false,
      allowSearch: true,
      allowFilters: true,
    },
    columns,
    filters,
    onEdit,
    onCreate,
    authContext: allowedAuth,
  });

  return (
    <div className="admin-device-list">
      <BaseList
        title="Device Catalog"
        filters={baseList.renderFilters()}
        onCreateClick={baseList.canCreate ? baseList.handleCreate : undefined}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No devices in catalog."
        onEdit={baseList.handleEdit}
        onDelete={baseList.handleDelete}
        pagination={baseList.pagination}
      />
    </div>
  );
};
