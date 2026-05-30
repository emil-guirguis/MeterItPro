import React from 'react';
import { EntityManagementPage } from '@framework/components/entity';
import { DeviceList } from './DeviceList';
import { DeviceForm } from './DeviceForm';
import type { Device } from './deviceConfig';

export const DeviceManagementPage: React.FC = () => (
  <EntityManagementPage<Device>
    title="Device"
    moduleIcon="meter"
    modalSize="xl"
    showSaveButton={false}
    editLabel="View Device"
    newLabel="View Device"
    renderList={({ onEdit }) => (
      <DeviceList onDeviceView={onEdit} />
    )}
    renderForm={({ entity, onCancel }) => entity ? (
      <DeviceForm device={entity} onCancel={onCancel} />
    ) : null}
  />
);
