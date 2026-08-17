import React from 'react';
import { EntityManagementPage } from '@meterit/framework-frontend/components/entity';
import { AdminDeviceList } from './AdminDeviceList';
import { AdminDeviceForm } from './AdminDeviceForm';
import type { AdminDevice } from './adminDevicesStore';

export const AdminDeviceManagementPage: React.FC = () => (
  <EntityManagementPage<AdminDevice>
    title="Device"
    moduleIcon="devices"
    modalSize="xl"
    renderList={({ onEdit, onCreate }) => (
      <AdminDeviceList onEdit={onEdit} onCreate={onCreate} />
    )}
    renderForm={({ entity, onCancel }) => (
      <AdminDeviceForm device={entity} onCancel={onCancel} />
    )}
  />
);
