import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { DeviceList, DeviceForm } from '../../features/devices';
import { LocationList, LocationForm } from '../../features/locations';
import { Modal } from '@meterit/framework-frontend/components/modal';
import type { Device } from '../../features/devices/deviceConfig';
import type { Location } from '../../types/entities';
import {
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box
} from '@mui/material';
import '../settings/SettingsForm.css';

export interface ManagementFormProps {
  values?: any;
  onChange?: (field: string, value: any) => void;
  onSubmit?: () => void;
  error?: string | null;
}

const ManagementForm: React.FC<ManagementFormProps> = ({
  values: _values,
  onChange: _onChange,
  onSubmit,
  error
}) => {
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);

  const handleDeviceView = (device: Device) => {
    setEditingDevice(device);
    setShowDeviceForm(true);
  };

  const handleDeviceFormClose = () => {
    setShowDeviceForm(false);
    setEditingDevice(null);
  };

  const handleLocationEdit = (location: Location) => {
    setEditingLocation(location);
    setShowLocationForm(true);
  };

  const handleLocationCreate = () => {
    setEditingLocation(null);
    setShowLocationForm(true);
  };

  const handleLocationFormClose = () => {
    setShowLocationForm(false);
    setEditingLocation(null);
  };

  const deviceFormTitle = editingDevice ? 'View Device' : 'Device Details';
  const locationFormTitle = editingLocation ? 'Edit Location' : 'Create New Location';

  return (
    <form className="settings-form" onSubmit={e => { e.preventDefault(); onSubmit?.(); }}>
      {error && <div className="settings-form__error">{error}</div>}

      <div className="settings-form__section">
        <Paper sx={{ p: 3, mb: 3 }}>
          {/* Location Section */}
          <Typography variant="h6" sx={{ mb: 1 }}>Location Management</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manage device locations.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setShowLocationModal(true)}
            sx={{ minWidth: '160px' }}
          >
            Locations
          </Button>

        </Paper>

      </div>
      <div className="settings-form__section">
        <Paper sx={{ p: 3, mb: 3 }}>

          {/* Devices Section */}
          <Typography variant="h6" sx={{ mb: 1 }}>Device Management</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manage devices and mapping configurations.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setShowDeviceModal(true)}
            sx={{ minWidth: '160px' }}
          >
            Devices
          </Button>

        </Paper>

      </div>

      {/* Location  Management Modal */}
      <Dialog
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Device Management
          <IconButton
            aria-label="close"
            onClick={() => setShowLocationModal(false)}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
            <LocationList 
              onLocationEdit={handleLocationEdit}
              onLocationCreate={handleLocationCreate}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Location Form Modal */}
      <Modal
        isOpen={showLocationForm}
        title={locationFormTitle}
        onClose={handleLocationFormClose}
        size="lg"
      >
        {showLocationForm && (
          <LocationForm
            key={editingLocation?.location_id ? `edit-${editingLocation.location_id}` : 'new'}
            location={editingLocation || undefined}
            onCancel={handleLocationFormClose}
            onSubmit={async () => {
              handleLocationFormClose();
            }}
          />
        )}
      </Modal>

      {/* Device Management Modal */}
      <Dialog
        open={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Device Management
          <IconButton
            aria-label="close"
            onClick={() => setShowDeviceModal(false)}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
            <DeviceList 
              onDeviceView={handleDeviceView}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Device Form Modal */}
      <Modal
        isOpen={showDeviceForm}
        title={deviceFormTitle}
        onClose={handleDeviceFormClose}
        size="lg"
      >
        {showDeviceForm && (
          <DeviceForm
            key={editingDevice?.id ? `edit-${editingDevice.device_id}` : 'new'}
            device={editingDevice || undefined}
            onCancel={handleDeviceFormClose}
          />
        )}
      </Modal>
    </form>
  );
};

export default ManagementForm;