import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTheme, useMediaQuery } from '@mui/material';
import authService from '../../services/authService';

interface TwoFactorMethod {
  type: string;
  method_type: string;
  is_enabled: boolean;
  created_at: string;
}

const TwoFactorManagementPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [methods, setMethods] = useState<TwoFactorMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog state
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch 2FA methods on mount
  useEffect(() => {
    fetchMethods();
  }, []);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchMethods = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedMethods = await authService.get2FAMethods();
      setMethods(fetchedMethods);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch 2FA methods';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableClick = (method: string) => {
    setSelectedMethod(method);
    setPassword('');
    setDisableDialogOpen(true);
  };

  const handleDisableConfirm = async () => {
    if (!selectedMethod || !password) {
      setError('Password is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await authService.disable2FA(selectedMethod, password);
      setSuccessMessage(`${getMethodLabel(selectedMethod)} has been disabled`);
      setDisableDialogOpen(false);
      setPassword('');
      setSelectedMethod(null);
      await fetchMethods();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable 2FA method';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateClick = () => {
    setPassword('');
    setRegenerateDialogOpen(true);
  };

  const handleRegenerateConfirm = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authService.regenerateBackupCodes(password);
      
      // Show backup codes in a dialog
      const backupCodesText = response.backup_codes
        .map((code: any) => code.code || code)
        .join('\n');
      
      alert(`New backup codes generated:\n\n${backupCodesText}\n\nSave these codes in a safe place.`);
      
      setSuccessMessage('Backup codes have been regenerated');
      setRegenerateDialogOpen(false);
      setPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to regenerate backup codes';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodIcon = (methodType: string) => {
    switch (methodType) {
      case 'totp':
        return <SecurityIcon color="primary" />;
      case 'email_otp':
        return <EmailIcon color="primary" />;
      case 'sms_otp':
        return <PhoneIcon color="primary" />;
      default:
        return <CheckCircleIcon color="primary" />;
    }
  };

  const getMethodLabel = (methodType: string) => {
    switch (methodType) {
      case 'totp':
        return 'Authenticator App (TOTP)';
      case 'email_otp':
        return 'Email OTP';
      case 'sms_otp':
        return 'SMS OTP';
      default:
        return methodType;
    }
  };

  const getMethodDescription = (methodType: string) => {
    switch (methodType) {
      case 'totp':
        return 'Use an authenticator app like Google Authenticator or Microsoft Authenticator';
      case 'email_otp':
        return 'Receive a code via email during login';
      case 'sms_otp':
        return 'Receive a code via SMS during login';
      default:
        return '';
    }
  };

  const hasTOTP = methods.some((m) => m.method_type === 'totp' && m.is_enabled);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isMobile
          ? theme.palette.background.default
          : `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`,
        py: 4,
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Two-Factor Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your security settings and authentication methods
          </Typography>
        </Box>

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Enabled Methods Card */}
            <Card sx={{ mb: 3, boxShadow: 2 }}>
              <CardHeader
                title="Enabled Authentication Methods"
                titleTypographyProps={{ variant: 'h6' }}
                sx={{ pb: 2 }}
              />
              <Divider />
              <CardContent>
                {methods.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No 2FA methods enabled. Add one to secure your account.
                  </Typography>
                ) : (
                  <List sx={{ width: '100%' }}>
                    {methods.map((method, index) => (
                      <React.Fragment key={method.method_type}>
                        <ListItem
                          sx={{
                            py: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              {getMethodIcon(method.method_type)}
                            </ListItemIcon>
                            <ListItemText
                              primary={getMethodLabel(method.method_type)}
                              secondary={getMethodDescription(method.method_type)}
                              primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 500 }}
                              secondaryTypographyProps={{ variant: 'body2' }}
                            />
                          </Box>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDisableClick(method.method_type)}
                            sx={{ ml: 2 }}
                          >
                            Disable
                          </Button>
                        </ListItem>
                        {index < methods.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>

            {/* Backup Codes Card */}
            {hasTOTP && (
              <Card sx={{ boxShadow: 2 }}>
                <CardHeader
                  title="Backup Codes"
                  titleTypographyProps={{ variant: 'h6' }}
                  sx={{ pb: 2 }}
                />
                <Divider />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Backup codes can be used to access your account if you lose access to your authenticator app. Each code can only be used once.
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Keep these codes in a safe place. You can regenerate them at any time.
                    </Typography>
                  </Paper>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={handleRegenerateClick}
                  >
                    Regenerate Backup Codes
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Container>

      {/* Disable 2FA Dialog */}
      <Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Disable {selectedMethod ? getMethodLabel(selectedMethod) : '2FA'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              To disable this authentication method, please enter your password:
            </Typography>
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              variant="outlined"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableDialogOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleDisableConfirm}
            variant="contained"
            color="error"
            disabled={isSubmitting || !password}
          >
            {isSubmitting ? 'Disabling...' : 'Disable'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog open={regenerateDialogOpen} onClose={() => setRegenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Regenerate Backup Codes</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              To regenerate your backup codes, please enter your password:
            </Typography>
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              variant="outlined"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegenerateDialogOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleRegenerateConfirm}
            variant="contained"
            disabled={isSubmitting || !password}
          >
            {isSubmitting ? 'Regenerating...' : 'Regenerate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TwoFactorManagementPage;
