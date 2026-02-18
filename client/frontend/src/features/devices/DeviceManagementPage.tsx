import React, { useState } from 'react';
import { DeviceList } from './DeviceList';
import { DeviceForm } from './DeviceForm';
import { FormModal } from '@framework/components/modal';
import type { Device } from './deviceConfig';

export const DeviceManagementPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleDeviceView = (device: Device) => {
    setSelectedDevice(device);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedDevice(null);
  };

  return (
    <div className="entity-management-page">
        <DeviceList onDeviceView={handleDeviceView} />

        <FormModal
          isOpen={showForm}
          title="View Device"
          onClose={handleFormClose}
          showSaveButton={false}  // No save button for read-only
          size="xl"
        >
          {showForm && selectedDevice && (
            <DeviceForm
              key={`view-${selectedDevice.device_id}`}
              device={selectedDevice}
              onCancel={handleFormClose}
            />
          )}
        </FormModal>
      </div>
  );
};
