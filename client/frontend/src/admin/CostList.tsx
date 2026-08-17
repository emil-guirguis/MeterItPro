import React, { useMemo } from 'react';
import { BaseList } from '@meterit/framework-frontend/components/list/BaseList';
import { useBaseList } from '@meterit/framework-frontend/components/list/hooks';
import { useSchema } from '@meterit/framework-frontend/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@meterit/framework-frontend/components/list/utils/schemaColumnGenerator';
import { useCostsEnhanced, type CostEntity } from './costsStore';

const allowedAuth = { checkPermission: () => true as boolean, user: undefined };

interface CostListProps {
  onEdit?: (cost: CostEntity) => void;
  onCreate?: () => void;
}

export const CostList: React.FC<CostListProps> = ({ onEdit, onCreate }) => {
  const { schema } = useSchema('cost');

  const columns = useMemo(() => {
    if (!schema) return [];
    return generateColumnsFromSchema<CostEntity>(schema.formFields, {
      fieldOrder: ['name', 'quantity', 'rate', 'active'],
    });
  }, [schema]);

  const filters = useMemo(() => {
    if (!schema) return [];
    return generateFiltersFromSchema(schema.formFields);
  }, [schema]);

  const baseList = useBaseList<CostEntity, ReturnType<typeof useCostsEnhanced>>({
    entityName: 'cost',
    entityNamePlural: 'costs',
    useStore: useCostsEnhanced,
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
    <div className="cost-list">
      <BaseList
        title="Costs"
        filters={baseList.renderFilters()}
        onCreateClick={baseList.canCreate ? baseList.handleCreate : undefined}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No costs found."
        onEdit={baseList.handleEdit}
        onDelete={baseList.handleDelete}
        pagination={baseList.pagination}
      />
    </div>
  );
};
