import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import authService from '../../services/authService';

type TwoFactorMethod = 'totp' | 'email_otp' | 'sms_otp';

interface BackupCode {
  code: string;
}

interface TwoFactorSetupWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const steps = ['Choose Method', 'Setup', 'Verify', 'Backup Codes'];

export const TwoFactorSetupWizard: React.FC<TwoFactorSetupWizardProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod>('totp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showSecret, setShowSecret] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string>('');

  const handleMethodSelect = (method: TwoFactorMethod) => {
    setSelectedMethod(method);
    setError('');
  };

  const handleNext = async () => {
    setError('');

    // Validate SMS phone number before proceeding
    if (activeStep === 1 && selectedMethod === 'sms_otp' && !phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    if (activeStep === 0) {
      // Method selection - just move to next step
      setActiveStep(1);
      await handleSetup();
    } else if (activeStep === 1) {
      // Setup step - move to verification
      setActiveStep(2);
    } else if (activeStep === 2) {
      // Verification step - verify and move to backup codes
      await handleVerify();
    } else if (activeStep === 3) {
      // Backup codes - complete
      handleComplete();
    }
  };

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const response = await authService.setup2FA(selectedMethod, phoneNumber);
      
      if (selectedMethod === 'totp') {
        setQrCode(response.qr_code || '');
        setSecret(response.secret || '');
      }
      // For email_otp and sms_otp, setup is automatic
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
      setActiveStep(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setError('Verification code is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.verify2FASetup(selectedMethod, verificationCode);
      
      if (selectedMethod === 'totp' && response.backup_codes) {
        setBackupCodes(response.backup_codes);
      }
      
      setActiveStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onSuccess?.();
    handleClose();
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedMethod('totp');
    setPhoneNumber('');
    setVerificationCode('');
    setQrCode('');
    setSecret('');
    setBackupCodes([]);
    setError('');
    setShowSecret(false);
    setCopiedCode('');
    onClose();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const renderMethodSelection = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Choose your two-factor authentication method:
      </Typography>
      <RadioGroup
        value={selectedMethod}
        onChange={(e) => handleMethodSelect(e.target.value as TwoFactorMethod)}
      >
        <Paper sx={{ p: 2, mb: 2 }}>
          <FormControlLabel
            value="totp"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="subtitle2">Authenticator App (TOTP)</Typography>
                <Typography variant="caption" color="textSecondary">
                  Use Google Authenticator, Microsoft Authenticator, or similar apps
                </Typography>
              </Box>
            }
          />
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }}>
          <FormControlLabel
            value="email_otp"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="subtitle2">Email OTP</Typography>
                <Typography variant="caption" color="textSecondary">
                  Receive a code via email during login
                </Typography>
              </Box>
            }
          />
        </Paper>

        <Paper sx={{ p: 2 }}>
          <FormControlLabel
            value="sms_otp"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="subtitle2">SMS OTP</Typography>
                <Typography variant="caption" color="textSecondary">
                  Receive a code via SMS during login
                </Typography>
              </Box>
            }
          />
        </Paper>
      </RadioGroup>
    </Box>
  );

  const renderSetup = () => (
    <Box sx={{ py: 2 }}>
      {selectedMethod === 'totp' && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Scan this QR code with your authenticator app:
          </Typography>
          {qrCode && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                component="img"
                src={qrCode}
                alt="QR Code"
                sx={{ maxWidth: '200px' }}
              />
            </Box>
          )}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Or enter this secret manually:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              value={secret}
              type={showSecret ? 'text' : 'password'}
              variant="outlined"
              size="small"
              InputProps={{
                readOnly: true,
              }}
            />
            <Tooltip title={showSecret ? 'Hide' : 'Show'}>
              <IconButton
                size="small"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy">
              <IconButton
                size="small"
                onClick={() => handleCopyCode(secret)}
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Alert severity="info">
            Save this secret in a safe place. You'll need it if you lose access to your authenticator app.
          </Alert>
        </Box>
      )}

      {selectedMethod === 'sms_otp' && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Enter your phone number to receive SMS codes:
          </Typography>
          <TextField
            fullWidth
            label="Phone Number"
            placeholder="+1 (555) 123-4567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Alert severity="info">
            We'll send a verification code to this number.
          </Alert>
        </Box>
      )}

      {selectedMethod === 'email_otp' && (
        <Box>
          <Alert severity="info">
            We'll send verification codes to your registered email address during login.
          </Alert>
        </Box>
      )}
    </Box>
  );

  const renderVerification = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {selectedMethod === 'totp'
          ? 'Enter the 6-digit code from your authenticator app:'
          : selectedMethod === 'sms_otp'
          ? 'Enter the code sent to your phone:'
          : 'Enter the code sent to your email:'}
      </Typography>
      <TextField
        fullWidth
        label="Verification Code"
        placeholder="000000"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        variant="outlined"
        inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
        sx={{ mb: 2 }}
      />
      <Alert severity="info">
        This code is valid for 5 minutes.
      </Alert>
    </Box>
  );

  const renderBackupCodes = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Save your backup codes in a safe place:
      </Typography>
      <Alert severity="warning" sx={{ mb: 2 }}>
        Each code can only be used once. Keep them safe in case you lose access to your authenticator app.
      </Alert>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <List dense>
            {backupCodes.map((item, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <Tooltip title={copiedCode === item.code ? 'Copied!' : 'Copy'}>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleCopyCode(item.code)}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemIcon>
                  <CheckCircleIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={item.code}
                  primaryTypographyProps={{ 
                    sx: { fontFamily: 'monospace' }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
      <Typography variant="body2" color="textSecondary">
        Two-factor authentication is now enabled on your account.
      </Typography>
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderMethodSelection();
      case 1:
        return renderSetup();
      case 2:
        return renderVerification();
      case 3:
        return renderBackupCodes();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderStepContent()
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          {activeStep === 3 ? 'Close' : 'Cancel'}
        </Button>
        {activeStep < 3 && (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={
              isLoading ||
              (activeStep === 0 && !selectedMethod) ||
              (activeStep === 1 && selectedMethod === 'sms_otp' && !phoneNumber) ||
              (activeStep === 2 && !verificationCode)
            }
          >
            {activeStep === 2 ? 'Verify' : 'Next'}
          </Button>
        )}
        {activeStep === 3 && (
          <Button onClick={handleComplete} variant="contained">
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TwoFactorSetupWizard;
