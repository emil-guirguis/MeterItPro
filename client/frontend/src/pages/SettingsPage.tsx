import React, { useState, useEffect } from 'react';
import {
  Alert, Button, Box, CircularProgress, Typography, Paper,
  List, ListItemButton, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import SyncIcon from '@mui/icons-material/Sync';
import TuneIcon from '@mui/icons-material/Tune';
import CompanyInfoForm from '../components/settings/CompanyInfoForm';
import SystemConfigForm from '../components/settings/SystemConfigForm';
import './SettingsPage.css';
import { useSettings } from '../store/entities/settingsStore';
import apiClient from '../services/apiClient';

const NAV_ITEMS = [
  {
    label: 'Organization',
    icon: <BusinessIcon fontSize="small" />,
    description: 'Tenant-level settings applied to every user in your org.',
  },
  {
    label: 'System Config',
    icon: <TuneIcon fontSize="small" />,
    description: 'System configuration and operational settings.',
  },
  {
    label: 'Sync Server',
    icon: <SyncIcon fontSize="small" />,
    description: 'Manually trigger uploads of collected meter readings.',
  },
];

const SettingsPage: React.FC = () => {
  const [activeItem, setActiveItem] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { settings, loading, error, fetchSettings, updateSettings, updateSystemConfig } = useSettings();

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line
  }, []);

  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  useEffect(() => {
    if (uploadError) {
      const t = setTimeout(() => setUploadError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [uploadError]);

  const handleCompanyInfoChange = (field: string, value: any) => {
    if (!localSettings) return;
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setLocalSettings({
        ...localSettings,
        [parent]: { ...(localSettings[parent as keyof typeof localSettings] as any), [child]: value },
      });
    } else {
      setLocalSettings({ ...localSettings, [field]: value });
    }
  };

  const handleSystemConfigChange = (field: string, value: any) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, systemConfig: { ...localSettings.systemConfig, [field]: value } });
  };

  const handleCompanyInfoSubmit = async () => {
    if (!localSettings) return;
    try {
      await updateSettings({ name: localSettings.name, address: localSettings.address, contactInfo: localSettings.contactInfo });
      setSuccessMessage('Company information saved successfully');
    } catch (err) {
      console.error('Failed to save company info:', err);
    }
  };

  const handleSystemConfigSubmit = async () => {
    if (!localSettings) return;
    try {
      await updateSystemConfig(localSettings.systemConfig);
      setSuccessMessage('System configuration saved successfully');
    } catch (err) {
      console.error('Failed to save system config:', err);
    }
  };

  const handleManualUpload = async () => {
    setUploadLoading(true);
    setUploadError(null);
    try {
      const response = await apiClient.post('/sync/trigger-upload', {});
      if (response.data.success) {
        setSuccessMessage('Upload triggered successfully');
      } else {
        setUploadError(response.data.message || 'Failed to trigger upload');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to trigger upload';
      setUploadError(errorMsg);
      console.error('Failed to trigger upload:', err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCancel = () => setLocalSettings(settings);

  const current = NAV_ITEMS[activeItem];

  return (
    <Box className="settings-page">
      <Box className="settings-page__header">
        <Typography variant="overline" className="settings-page__manage-label">
          Manage
        </Typography>
        <Typography variant="h4" className="settings-page__title">
          Settings
        </Typography>
        <Typography variant="body2" className="settings-page__subtitle">
          Tenant configuration and preferences
        </Typography>
      </Box>

      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
      {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box className="settings-page__body">
        <Paper className="settings-page__sidebar" elevation={0} variant="outlined">
          <List disablePadding>
            {NAV_ITEMS.map((item, idx) => (
              <ListItemButton
                key={item.label}
                selected={activeItem === idx}
                onClick={() => setActiveItem(idx)}
                className="settings-page__nav-item"
              >
                <ListItemIcon className="settings-page__nav-icon">
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Paper>

        <Paper className="settings-page__content" elevation={0} variant="outlined">
          <Box className="settings-page__content-header">
            <Typography variant="h6" className="settings-page__section-title">
              {current.label}
            </Typography>
            <Typography variant="body2" className="settings-page__section-desc">
              {current.description}
            </Typography>
          </Box>
          <Divider />
          <Box className="settings-page__content-body">
            {activeItem === 0 && localSettings && (
              <CompanyInfoForm
                values={localSettings}
                onChange={handleCompanyInfoChange}
                onSubmit={handleCompanyInfoSubmit}
                onCancel={handleCancel}
                loading={loading}
                error={error}
              />
            )}
            {activeItem === 1 && localSettings && (
              <SystemConfigForm
                values={localSettings.systemConfig}
                onChange={handleSystemConfigChange}
                onSubmit={handleSystemConfigSubmit}
                onCancel={handleCancel}
                loading={loading}
                error={error}
              />
            )}
            {activeItem === 2 && (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Manually trigger an upload of collected meter readings to the remote client system.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleManualUpload}
                  disabled={uploadLoading}
                >
                  {uploadLoading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Uploading...
                    </>
                  ) : (
                    'Trigger Upload'
                  )}
                </Button>
              </Box>
            )}
            {!settings && loading && <CircularProgress />}
            {!settings && error && <Typography color="error">{error}</Typography>}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default SettingsPage;
