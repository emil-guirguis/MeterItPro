import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import { LoadingSpinner, Toast } from '@meterit/framework-frontend/components/common';

interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  enableNotifications: boolean;
  notificationFrequency: 'immediate' | 'hourly' | 'daily';
  maxRetries: number;
  retryDelay: number;
}

interface EmailConfigFormProps {
  onSave?: (config: EmailConfig) => void;
  loading?: boolean;
}

export const EmailConfigForm: React.FC<EmailConfigFormProps> = ({
  onSave,
  loading = false
}) => {
  const [config, setConfig] = useState<EmailConfig>({
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: true,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
    enableNotifications: true,
    notificationFrequency: 'immediate',
    maxRetries: 3,
    retryDelay: 5000
  });

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleInputChange = (field: keyof EmailConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      if (onSave) {
        await onSave(config);
        setToast({ message: 'Email configuration saved successfully', type: 'success' });
      }
    } catch (error) {
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to save configuration', 
        type: 'error' 
      });
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // TODO: Integrate with backend endpoint to test email configuration
      setTestResult({ success: false, message: 'Email test not implemented yet' });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test email configuration'
      });
    } finally {
      setTesting(false);
    }
  };

  const isFormValid = () => {
    return config.smtpHost && 
           config.smtpUser && 
           config.fromEmail && 
           config.fromName;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Email Configuration
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          SMTP Server Settings
        </Typography>
        
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <TextField
            fullWidth
            label="SMTP Host"
            value={config.smtpHost}
            onChange={(e) => handleInputChange('smtpHost', e.target.value)}
            placeholder="smtp.gmail.com"
            required
          />
          
          <TextField
            fullWidth
            label="SMTP Port"
            type="number"
            value={config.smtpPort}
            onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value) || 587)}
            required
          />
          
          <TextField
            fullWidth
            label="Username"
            value={config.smtpUser}
            onChange={(e) => handleInputChange('smtpUser', e.target.value)}
            placeholder="your-email@example.com"
            required
          />
          
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={config.smtpPassword}
            onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
            placeholder="Your SMTP password"
            required
          />
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.smtpSecure}
                onChange={(e) => handleInputChange('smtpSecure', e.target.checked)}
              />
            }
            label="Use SSL/TLS encryption"
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Email Settings
        </Typography>
        
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <TextField
            fullWidth
            label="From Email"
            type="email"
            value={config.fromEmail}
            onChange={(e) => handleInputChange('fromEmail', e.target.value)}
            placeholder="noreply@yourcompany.com"
            required
          />
          
          <TextField
            fullWidth
            label="From Name"
            value={config.fromName}
            onChange={(e) => handleInputChange('fromName', e.target.value)}
            placeholder="Your Company Name"
            required
          />
          
          <TextField
            fullWidth
            label="Reply-To Email"
            type="email"
            value={config.replyToEmail}
            onChange={(e) => handleInputChange('replyToEmail', e.target.value)}
            placeholder="support@yourcompany.com"
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Notification Settings
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.enableNotifications}
                onChange={(e) => handleInputChange('enableNotifications', e.target.checked)}
              />
            }
            label="Enable email notifications"
          />
          
          <FormControl fullWidth>
            <InputLabel>Notification Frequency</InputLabel>
            <Select
              value={config.notificationFrequency}
              onChange={(e) => handleInputChange('notificationFrequency', e.target.value)}
              label="Notification Frequency"
              disabled={!config.enableNotifications}
            >
              <MenuItem value="immediate">Immediate</MenuItem>
              <MenuItem value="hourly">Hourly</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <TextField
              fullWidth
              label="Max Retries"
              type="number"
              value={config.maxRetries}
              onChange={(e) => handleInputChange('maxRetries', parseInt(e.target.value) || 3)}
              inputProps={{ min: 1, max: 10 }}
            />
            
            <TextField
              fullWidth
              label="Retry Delay (ms)"
              type="number"
              value={config.retryDelay}
              onChange={(e) => handleInputChange('retryDelay', parseInt(e.target.value) || 5000)}
              inputProps={{ min: 1000, max: 60000 }}
            />
          </Box>
        </Box>
      </Paper>

      {testResult && (
        <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
          {testResult.message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={handleTestConnection}
          disabled={testing || !isFormValid()}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
        
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || !isFormValid()}
        >
          Save Configuration
        </Button>
      </Box>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Box>
  );
};