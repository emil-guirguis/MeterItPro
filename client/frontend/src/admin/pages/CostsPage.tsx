import React from 'react';
import { EntityManagementPage } from '@meterit/framework-frontend/components/entity';
import { CostList } from '../CostList';
import { CostForm } from '../CostForm';
import type { CostEntity } from '../costsStore';

const CostsPage: React.FC = () => (
  <EntityManagementPage<CostEntity>
    title="Cost"
    moduleIcon="cost"
    modalSize="sm"
    renderList={({ onEdit, onCreate }) => (
      <CostList onEdit={onEdit} onCreate={onCreate} />
    )}
    renderForm={({ entity, onCancel }) => (
      <CostForm cost={entity} onCancel={onCancel} />
    )}
  />
);

export default CostsPage;
