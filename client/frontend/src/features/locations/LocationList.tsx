import React, { useMemo } from 'react';
import { BaseList } from '@meterit/framework-frontend/components/list/BaseList';
import { useLocationsEnhanced } from './locationsStore';
import { useBaseList } from '@meterit/framework-frontend/components/list/hooks';
import { useAuth } from '../../hooks/useAuth';
import { useSchema } from '@meterit/framework-frontend/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@meterit/framework-frontend/components/list/utils/schemaColumnGenerator';
import { Permission } from '../../types/auth';
import type { Location } from '../../types/entities';
import {
  locationStats,
  createLocationBulkActions,
  locationExportConfig,
} from './locationConfig';
import { showConfirmation } from '@meterit/framework-frontend/utils/confirmationHelper';
import './LocationList.css';

interface LocationListProps {
  onLocationEdit?: (location: Location) => void;
  onLocationCreate?: () => void;
}

export const LocationList: React.FC<LocationListProps> = ({
  onLocationEdit,
  onLocationCreate,
}) => {
  const locations = useLocationsEnhanced();
  const auth = useAuth();
  const { schema } = useSchema('location');

  // Generate columns and filters from schema (same pattern as ContactList)
  const columns = useMemo(() => {
    if (!schema) return [];
    return generateColumnsFromSchema<Location>(schema.formFields, {
      fieldOrder: ['name', 'type', 'active'],
      responsive: 'hide-mobile',
    });
  }, [schema]);

  const filters = useMemo(() => {
    if (!schema) return [];
    return generateFiltersFromSchema(schema.formFields);
  }, [schema]);

  const handleLocationDelete = (location: Location) => {
    showConfirmation({
      type: 'danger',
      title: 'Delete Location',
      message: `Delete location "${location.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        await locations.deleteItem(String(location.id));
        await locations.fetchItems();
      }
    });
  };

  const baseList = useBaseList<any, any>({
    entityName: 'location',
    entityNamePlural: 'locations',
    useStore: useLocationsEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: true,
      allowExport: true,
      allowImport: false,
      allowSearch: true,
      allowFilters: true,
      allowStats: true,
    },
    permissions: {
      create: Permission.LOCATION_CREATE,
      update: Permission.LOCATION_UPDATE,
      delete: Permission.LOCATION_DELETE,
    },
    columns,
    filters,
    stats: locationStats,
    bulkActions: createLocationBulkActions(
      { bulkUpdateStatus: locations.bulkUpdateStatus },
      (items) => baseList.handleExport(items)
    ),
    export: locationExportConfig,
    onEdit: onLocationEdit,
    onCreate: onLocationCreate,
    authContext: auth,
  });

  return (
    <div className="location-list">
      <BaseList
        title="Locations"
        filters={baseList.renderFilters()}
        onCreateClick={baseList.canCreate ? baseList.handleCreate : undefined}
        onExportClick={baseList.canExport ? () => baseList.handleExport(baseList.data) : undefined}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No locations found. Create your first location to get started."
        onEdit={baseList.handleEdit}
        onDelete={handleLocationDelete}
        onSelect={baseList.bulkActions.length > 0 ? () => {} : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
      {baseList.renderImportModal()}
    </div>
  );
};
