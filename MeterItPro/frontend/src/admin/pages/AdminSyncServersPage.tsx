import React from 'react';
import { EntityManagementPage } from '@meterit/framework-frontend/components/entity';
import { AdminSyncServerList } from '../AdminSyncServerList';
import { AdminSyncServerForm } from '../AdminSyncServerForm';
import type { AdminSyncServerEntity } from '../adminSyncServersStore';

const AdminSyncServersPage: React.FC = () => (
  <EntityManagementPage<AdminSyncServerEntity>
    title="Sync Server"
    moduleIcon="sync"
    modalSize="md"
    renderList={({ onEdit, onCreate }) => (
      <AdminSyncServerList onEdit={onEdit} onCreate={onCreate} />
    )}
    renderForm={({ entity, onCancel, isNew }) => (
      <AdminSyncServerForm syncServer={entity} isNew={isNew} onCancel={onCancel} />
    )}
  />
);

export default AdminSyncServersPage;
