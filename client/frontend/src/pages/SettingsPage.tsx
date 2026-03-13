import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Alert, Button, Box, CircularProgress } from '@mui/material';
import CompanyInfoForm from '../components/settings/CompanyInfoForm';
import SystemConfigForm from '../components/settings/SystemConfigForm';
import NotificationSettingsTab from '../components/settings/NotificationSettingsTab';
import './SettingsPage.css';
import { useSettings } from '../store/entities/settingsStore';
import apiClient from '../services/apiClient';

const SettingsPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    updateSystemConfig,
  } = useSettings();

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line
  }, []);

  // Local state for form changes
  const [localSettings, setLocalSettings] = useState(settings);

  // Update local state when settings are fetched
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Clear upload error after 5 seconds
  useEffect(() => {
    if (uploadError) {
      const timer = setTimeout(() => setUploadError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadError]);

  // Handlers for updating local form state
  const handleCompanyInfoChange = (field: string, value: any) => {
    if (!localSettings) return;
    
    // Handle nested field updates (e.g., 'address.street')
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setLocalSettings({
        ...localSettings,
        [parent]: {
          ...(localSettings[parent as keyof typeof localSettings] as any),
          [child]: value
        }
      });
    } else {
      setLocalSettings({ ...localSettings, [field]: value });
    }
  };


  const handleSystemConfigChange = (field: string, value: any) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      systemConfig: { ...localSettings.systemConfig, [field]: value }
    });
  };

  // Save handlers
  const handleCompanyInfoSubmit = async () => {
    if (!localSettings) return;
    try {
      // Only send company info fields, not systemConfig
      const companyInfo = {
        name: localSettings.name,
        address: localSettings.address,
      };
      await updateSettings(companyInfo);
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

  // Manual upload handler
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

  // Cancel handlers
  const handleCancel = () => {
    setLocalSettings(settings);
  };

  return (
    <div>
      <h2>Settings</h2>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      {uploadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {uploadError}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Tabs value={tab} onChange={(_event, newValue) => setTab(newValue)} aria-label="Settings Tabs" className="settings-tabs">
        <Tab label="Company Info" />
        <Tab label="System Config" />
        <Tab label="Notifications" />
        <Tab label="Sync" />
      </Tabs>
      <div className="settings-content">
        {tab === 0 && localSettings && (
          <CompanyInfoForm
            values={localSettings}
            onChange={handleCompanyInfoChange}
            onSubmit={handleCompanyInfoSubmit}
            onCancel={handleCancel}
            loading={loading}
            error={error}
          />
        )}
        {tab === 1 && localSettings && (
          <SystemConfigForm
            values={localSettings.systemConfig}
            onChange={handleSystemConfigChange}
            onSubmit={handleSystemConfigSubmit}
            onCancel={handleCancel}
            loading={loading}
            error={error}
          />
        )}
        {tab === 2 && (
          <NotificationSettingsTab />
        )}
        {tab === 3 && (
          <Box sx={{ p: 3 }}>
            <h3>Meter Reading Upload</h3>
            <p>Manually trigger an upload of collected meter readings to the remote client system.</p>
            <Button
              variant="contained"
              color="primary"
              onClick={handleManualUpload}
              disabled={uploadLoading}
              sx={{ mt: 2 }}
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
        {!settings && loading && <div>Loading...</div>}
        {!settings && error && <div className="settings-form__error">{error}</div>}
      </div>
    </div>
  );
};

export default SettingsPage;
