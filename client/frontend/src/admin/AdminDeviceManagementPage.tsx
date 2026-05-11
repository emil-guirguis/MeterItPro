import React, { useState } from 'react';
import { FormModal } from '@framework/components/modal';
import { AdminDeviceList } from './AdminDeviceList';
import { AdminDeviceForm } from './AdminDeviceForm';
import type { AdminDevice } from './adminDevicesStore';

export const AdminDeviceManagementPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<AdminDevice | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (device: AdminDevice) => {
    setSelectedDevice(device);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedDevice(null);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setSelectedDevice(null);
  };

  return (
    <div className="entity-management-page">
      <AdminDeviceList onEdit={handleEdit} onCreate={handleCreate} />

      <FormModal
        isOpen={showForm}
        title={selectedDevice ? 'Edit Device' : 'New Device'}
        onClose={handleClose}
        showSaveButton={true}
        size="xl"
      >
        {showForm && (
          <AdminDeviceForm
            key={selectedDevice?.device_id ? `edit-${selectedDevice.device_id}` : 'new'}
            device={selectedDevice ?? undefined}
            onCancel={handleClose}
          />
        )}
      </FormModal>
    </div>
  );
};
