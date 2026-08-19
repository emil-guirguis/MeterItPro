import React from 'react';
import { EntityManagementPage } from '@meterit/framework-frontend/components/entity';
import { OrderList } from './OrderList';
import { OrderForm } from './OrderForm';
import type { Order } from '../../types/order';

export const OrderManagementPage: React.FC = () => (
  <EntityManagementPage<Order>
    title="Order"
    moduleIcon="orders"
    modalSize="xl"
    renderList={({ onEdit, onCreate }) => (
      <OrderList onOrderEdit={onEdit} onOrderCreate={onCreate} />
    )}
    renderForm={({ entity, onCancel }) => <OrderForm order={entity} onCancel={onCancel} />}
  />
);

export default OrderManagementPage;
