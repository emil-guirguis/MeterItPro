/**
 * Device Form - READ-ONLY
 * 
 * Uses the dynamic schema-based BaseForm to render the device form in read-only mode.
 * All fields are read-only as devices are managed externally.
 * No create/update/delete operations are available.
 */

import React from 'react';
import { BaseForm } from '@meterit/framework-frontend/components/form/BaseForm';
import { useSchema } from '@meterit/framework-frontend/components/form/utils/schemaLoader';
import { useDevicesEnhanced } from './devicesStore';
import { RegistersGrid } from './RegistersGrid';
import type { Device } from './deviceConfig';
import './DeviceForm.css';

interface DeviceFormProps {
  device?: Device;
  onCancel: () => void;
  loading?: boolean;
}

export const DeviceForm: React.FC<DeviceFormProps> = ({
  device,
  onCancel,
  loading = false,
}) => {
  const devices = useDevicesEnhanced();

  // Use schema from cache (prefetched at login) - not used directly but needed for BaseForm
  useSchema('device');

  // Read-only handler - no actual submission
  const handleReadOnlySubmit = async () => {
    // No-op: devices are read-only
    console.log('Device form is read-only - no changes saved');
  };

  // Custom field renderer for registers
  const renderCustomField = (
    fieldName: string,
    fieldDef: any,
    _value: any,
    _error: string | undefined,
    _isDisabled: boolean,
    _onChange: (value: any) => void
  ) => {
    console.log('renderCustomField called for:', fieldName, { 
      fieldDef, 
      deviceId: device.id,
      hasDevice: !!device,
      deviceObject: device,
      deviceKeys: device ? Object.keys(device) : []
    });
    
    if (fieldName === 'registers') {
      if (!device) {
        console.log('No device object available');
        return <div>No device selected</div>;
      }
      
      // Get device ID - use 'device_id' field from device object
      const deviceId = device.device_id;
      if (!deviceId && deviceId !== 0) {
        console.log('Device has no device_id:', device);
        console.log('Device keys:', Object.keys(device));
        console.log('All device values:', device);
        return <div>Device ID not available. Available keys: {Object.keys(device).join(', ')}</div>;
      }
      
      console.log('Rendering custom RegistersGrid for field:', fieldName, 'with deviceId:', deviceId, 'type:', typeof deviceId);
      return (
        <RegistersGrid
          deviceId={Number(deviceId)}
          onError={(error) => console.error('RegistersGrid error:', error)}
          onSuccess={(message) => console.log('RegistersGrid success:', message)}
        />
      );
    }
    return null; // Let BaseForm handle other fields normally
  };

  return (
    <BaseForm
      schemaName="device"
      entity={device}
      store={devices}
      onCancel={onCancel}
      onSubmit={handleReadOnlySubmit}
      className="device-form device-form--readonly"
      loading={loading}
      showTabs={true}
      onTabChange={undefined}
      renderCustomField={renderCustomField}
    />
  );
};

export default DeviceForm;
