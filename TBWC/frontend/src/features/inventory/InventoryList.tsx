import React, { useMemo } from 'react';
import { BaseList } from '@meterit/framework-frontend/components/list';
import { useBaseList } from '@meterit/framework-frontend/components/list/hooks';
import { useSchema } from '@meterit/framework-frontend/components/form/utils/schemaLoader';
import {
  generateColumnsFromSchema,
  generateFiltersFromSchema,
} from '@meterit/framework-frontend/components/list/utils/schemaColumnGenerator';
import { useInventoryEnhanced } from './inventoryStore';
import { useAuth } from '../../hooks/useAuth';
import { Permission } from '../../types/auth';
import type { Inventory } from '../../types/inventory';

interface InventoryListProps {
  onInventoryEdit?: (item: Inventory) => void;
  onInventoryCreate?: () => void;
  authContext?: { checkPermission: (p: any) => boolean; user: any };
}

export const InventoryList: React.FC<InventoryListProps> = ({ onInventoryEdit, onInventoryCreate, authContext: authProp }) => {
  const realAuth = useAuth();
  const auth = authProp ?? realAuth;
  const { schema } = useSchema('inventory');

  const columns = useMemo(() => {
    if (!schema) return [];
    return generateColumnsFromSchema<Inventory>(schema.formFields, {
      fieldOrder: ['part_number', 'description', 'category', 'base_price'],
      responsive: 'hide-mobile',
    });
  }, [schema]);

  const filters = useMemo(() => {
    if (!schema) return [];
    return generateFiltersFromSchema(schema.formFields);
  }, [schema]);

  const baseList = useBaseList<Inventory, any>({
    entityName: 'inventory',
    entityNamePlural: 'inventory',
    useStore: useInventoryEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: false,
      allowExport: false,
      allowImport: false,
      allowSearch: true,
      allowFilters: true,
      allowStats: false,
    },
    permissions: {
      create: Permission.INVENTORY_CREATE,
      update: Permission.INVENTORY_UPDATE,
      delete: Permission.INVENTORY_DELETE,
    },
    columns,
    filters,
    onEdit: onInventoryEdit,
    onCreate: onInventoryCreate,
    authContext: auth,
  });

  return (
    <div className="inventory-list">
      <BaseList
        title="Inventory"
        filters={baseList.renderFilters()}
        onCreateClick={baseList.canCreate ? baseList.handleCreate : undefined}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No inventory items found."
        onEdit={baseList.handleEdit}
        pagination={baseList.pagination}
      />
    </div>
  );
};

export default InventoryList;
