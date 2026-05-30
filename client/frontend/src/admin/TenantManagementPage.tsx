import React from 'react';
import { EntityManagementPage } from '@framework/components/entity';
import { TenantList } from './TenantList';
import { TenantForm } from './TenantForm';
import type { TenantEntity } from './tenantsStore';

export const TenantManagementPage: React.FC = () => (
  <EntityManagementPage<TenantEntity>
    title="Client"
    moduleIcon="building"
    renderList={({ onEdit, onCreate }) => (
      <TenantList onEdit={onEdit} onCreate={onCreate} />
    )}
    renderForm={({ entity, onCancel }) => (
      <TenantForm tenant={entity} onCancel={onCancel} />
    )}
  />
);
