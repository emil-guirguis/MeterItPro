import React, { useMemo } from 'react';
import { BaseList } from '@meterit/framework-frontend/components/list';
import { useBaseList } from '@meterit/framework-frontend/components/list/hooks';
import { useSchema } from '@meterit/framework-frontend/components/form/utils/schemaLoader';
import {
  generateColumnsFromSchema,
  generateFiltersFromSchema,
} from '@meterit/framework-frontend/components/list/utils/schemaColumnGenerator';
import { useOrdersEnhanced } from './ordersStore';
import { useAuth } from '../../hooks/useAuth';
import { Permission } from '../../types/auth';
import type { Order } from '../../types/order';

interface OrderListProps {
  onOrderEdit?: (order: Order) => void;
  onOrderCreate?: () => void;
  authContext?: { checkPermission: (p: any) => boolean; user: any };
}

export const OrderList: React.FC<OrderListProps> = ({ onOrderEdit, onOrderCreate, authContext: authProp }) => {
  const realAuth = useAuth();
  const auth = authProp ?? realAuth;
  const { schema } = useSchema('order');

  const columns = useMemo(() => {
    if (!schema) return [];
    return generateColumnsFromSchema<Order>(schema.formFields, {
      fieldOrder: ['customer', 'tbwc_number', 'po_number', 'inv_stat', 'received_date', 'rep', 'job_name'],
      responsive: 'hide-mobile',
    });
  }, [schema]);

  const filters = useMemo(() => {
    if (!schema) return [];
    return generateFiltersFromSchema(schema.formFields);
  }, [schema]);

  const baseList = useBaseList<Order, any>({
    entityName: 'order',
    entityNamePlural: 'orders',
    useStore: useOrdersEnhanced,
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
      create: Permission.ORDER_CREATE,
      update: Permission.ORDER_UPDATE,
      delete: Permission.ORDER_DELETE,
    },
    columns,
    filters,
    onEdit: onOrderEdit,
    onCreate: onOrderCreate,
    authContext: auth,
  });

  return (
    <div className="order-list">
      <BaseList
        title="Orders"
        filters={baseList.renderFilters()}
        onCreateClick={baseList.canCreate ? baseList.handleCreate : undefined}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No orders found."
        onEdit={baseList.handleEdit}
        pagination={baseList.pagination}
      />
    </div>
  );
};

export default OrderList;
