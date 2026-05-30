import React from 'react';
import { EntityManagementPage } from '@framework/components/entity';
import { SyncServerList } from './SyncServerList';
import { SyncServerForm } from './SyncServerForm';

const SyncServersPanel: React.FC = () => (
  <EntityManagementPage
    title="Sync Server"
    moduleIcon="sync"
    editLabel="Edit"
    newLabel="Add"
    renderList={({ onEdit, onCreate }) => (
      <SyncServerList onEdit={onEdit} onCreate={onCreate} />
    )}
    renderForm={({ entity, onCancel }) => (
      <SyncServerForm server={entity} onCancel={onCancel} />
    )}
  />
);

export default SyncServersPanel;
