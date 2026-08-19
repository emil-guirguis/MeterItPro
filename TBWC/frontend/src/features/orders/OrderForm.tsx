import React from 'react';
import { BaseForm } from '@meterit/framework-frontend/components/form';
import { useOrdersEnhanced } from './ordersStore';
import type { Order } from '../../types/order';

interface OrderFormProps {
  order?: Order;
  onCancel: () => void;
  loading?: boolean;
}

/** Schema-driven order form (GET /api/schema/order); store handles create/update. */
export const OrderForm: React.FC<OrderFormProps> = ({ order, onCancel, loading = false }) => {
  const orders = useOrdersEnhanced();

  return (
    <BaseForm
      schemaName="order"
      entity={order}
      store={orders}
      onCancel={onCancel}
      className="order-form"
      loading={loading}
      showTabs={true}
    />
  );
};

export default OrderForm;
