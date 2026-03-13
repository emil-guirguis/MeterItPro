import React, { useMemo } from 'react';
import { BaseList } from '@framework/components/list/BaseList';
import { useDevicesEnhanced } from './devicesStore';
import { useAuth } from '../../hooks/useAuth';
import { useBaseList } from '@framework/components/list/hooks';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@framework/components/list/utils/schemaColumnGenerator';
import type { Device } from './deviceConfig';
import { deviceStats, deviceExportConfig } from './deviceConfig';
import './DeviceList.css';

interface DeviceListProps {
  onDeviceSelect?: (device: Device) => void;
  onDeviceView?: (device: Device) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  onDeviceSelect,
  onDeviceView,
}) => {
  const auth = useAuth();
  const { schema } = useSchema('device');

  // Dynamically generate columns from schema based on showOn: ['list']
  const columns = useMemo(() => {
    if (!schema) return [];
    return generateColumnsFromSchema<Device>(schema.formFields, {
      fieldOrder: ['manufacturer', 'modelNumber', 'description', 'type' ],
      responsive: 'hide-mobile',
    });
  }, [schema]);

  // Dynamically generate filters from schema based on showOn: ['list'] and enumValues
  const filters = useMemo(() => {
    if (!schema) return [];
    return generateFiltersFromSchema(schema.formFields, {
      fieldOrder: ['type', 'manufacturer'],
    });
  }, [schema]);

  const baseList = useBaseList<Device, any>({
    entityName: 'device',
    entityNamePlural: 'devices',
    useStore: useDevicesEnhanced,
    features: {
      allowCreate: false,      // Disabled - devices are read-only
      allowEdit: false,        // Disabled - devices are read-only
      allowDelete: false,      // Disabled - devices are read-only
      allowBulkActions: false, // Disabled - devices are read-only
      allowExport: true,       // Keep export for viewing data
      allowImport: false,      // Disabled - devices are read-only
      allowSearch: true,       // Keep search for finding devices
      allowFilters: true,      // Keep filters for finding devices
      allowStats: true,        // Keep stats for overview
    },
    permissions: {
      create: '',  // No create permission
      update: '',  // No update permission
      delete: '',  // No delete permission
    },
    columns,
    filters,
    stats: deviceStats,
    bulkActions: [], // No bulk actions for read-only
    export: deviceExportConfig,
    authContext: auth,
    onEdit: undefined,        // No edit function
    onCreate: undefined,      // No create function
  });

  const safeData = Array.isArray(baseList.data) ? baseList.data : [];

  return (
    <div className="device-list device-list--readonly">
      <BaseList
        title="Devices (Read-Only)"
        filters={baseList.renderFilters()}
        onExportClick={baseList.canExport ? () => baseList.handleExport(safeData) : undefined}
        data={safeData}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No devices found."
        onView={onDeviceView}     // Use onView instead of onEdit
        onEdit={undefined}       // No edit function
        onDelete={undefined}     // No delete function
        onSelect={onDeviceSelect ? (items: Device[]) => onDeviceSelect(items[0]) : undefined}
        bulkActions={[]} // No bulk actions
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
    </div>
  );
};
