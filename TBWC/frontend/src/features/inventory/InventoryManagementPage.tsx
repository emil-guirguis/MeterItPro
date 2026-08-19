import React from 'react';
import { EntityManagementPage } from '@meterit/framework-frontend/components/entity';
import { InventoryList } from './InventoryList';
import { InventoryForm } from './InventoryForm';
import type { Inventory } from '../../types/inventory';

export const InventoryManagementPage: React.FC = () => (
  <EntityManagementPage<Inventory>
    title="Inventory"
    moduleIcon="inventory"
    modalSize="xl"
    renderList={({ onEdit, onCreate }) => (
      <InventoryList onInventoryEdit={onEdit} onInventoryCreate={onCreate} />
    )}
    renderForm={({ entity, onCancel }) => <InventoryForm item={entity} onCancel={onCancel} />}
  />
);

export default InventoryManagementPage;
