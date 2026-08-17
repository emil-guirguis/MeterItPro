import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Typography,
  Link,
  Divider,
} from '@mui/material';
import authService from '../../services/authService';

interface TwoFactorVerificationModalProps {
  open: boolean;
  sessionToken: string;
  method: 'totp' | 'email_otp' | 'sms_otp';
  onSuccess: (authResponse: any) => void;
  onClose: () => void;
}

export const TwoFactorVerificationModal: React.FC<TwoFactorVerificationModalProps> = ({
  open,
  sessionToken,
  method,
  onSuccess,
  onClose,
}) => {
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);

  // Timer for lockout countdown
  useEffect(() => {
    if (!isLocked || lockTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockTimeRemaining]);

  const getMethodLabel = (): string => {
    switch (method) {
      case 'totp':
        return 'Authenticator App';
      case 'email_otp':
        return 'Email';
      case 'sms_otp':
        return 'SMS';
      default:
        return 'Two-Factor Authentication';
    }
  };

  const getMethodDescription = (): string => {
    switch (method) {
      case 'totp':
        return 'Enter the 6-digit code from your authenticator app';
      case 'email_otp':
        return 'Enter the 6-digit code sent to your email';
      case 'sms_otp':
        return 'Enter the 6-digit code sent to your phone';
      default:
        return 'Enter your verification code';
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  const handleBackupCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupCode(e.target.value.trim());
  };

  const handleVerify = async () => {
    const verificationCode = useBackupCode ? backupCode : code;

    if (!verificationCode.trim()) {
      setError('Verification code is required');
      return;
    }

    if (!useBackupCode && verificationCode.length !== 6) {
      setError('Code must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const authResponse = await authService.verify2FA(sessionToken, verificationCode);
      
      // Reset state on success
      setCode('');
      setBackupCode('');
      setUseBackupCode(false);
      setAttemptCount(0);
      setError('');

      // Call success callback
      onSuccess(authResponse);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);

      // Track failed attempts
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);

      // Lock after 3 failed attempts
      if (newAttemptCount >= 3) {
        setIsLocked(true);
        setLockTimeRemaining(900); // 15 minutes in seconds
        setError('Too many failed attempts. Please try again in 15 minutes.');
      }

      // Clear input
      if (useBackupCode) {
        setBackupCode('');
      } else {
        setCode('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (method === 'totp') {
      setError('Cannot resend authenticator app codes. Check your app for the current code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // In a real implementation, you would call an API endpoint to resend the code
      // For now, we'll just show a message
      setError('');
      // TODO: Implement resend code API call
      // await authService.resend2FACode(sessionToken, method);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setBackupCode('');
    setUseBackupCode(false);
    setError('');
    setAttemptCount(0);
    setIsLocked(false);
    setLockTimeRemaining(0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableEscapeKeyDown={isLoading}>
      <DialogTitle>Two-Factor Authentication</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* Method Display */}
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Verification Method
            </Typography>
            <Typography variant="h6">{getMethodLabel()}</Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity={isLocked ? 'warning' : 'error'} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Locked State */}
          {isLocked && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: '#fff3cd', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Account locked for {Math.floor(lockTimeRemaining / 60)}m {lockTimeRemaining % 60}s
              </Typography>
            </Box>
          )}

          {/* Main Code Input */}
          {!useBackupCode ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {getMethodDescription()}
              </Typography>
              <TextField
                fullWidth
                label="Verification Code"
                placeholder="000000"
                value={code}
                onChange={handleCodeChange}
                disabled={isLoading || isLocked}
                inputProps={{
                  maxLength: 6,
                  pattern: '[0-9]*',
                  inputMode: 'numeric',
                }}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Typography variant="caption" color="textSecondary">
                Code expires in 5 minutes
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Enter one of your backup codes
              </Typography>
              <TextField
                fullWidth
                label="Backup Code"
                placeholder="XXXX-XXXX-XXXX"
                value={backupCode}
                onChange={handleBackupCodeChange}
                disabled={isLoading || isLocked}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Typography variant="caption" color="textSecondary">
                Each backup code can only be used once
              </Typography>
            </Box>
          )}

          {/* Divider */}
          <Divider sx={{ my: 2 }} />

          {/* Additional Options */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Backup Code Toggle */}
            <Link
              component="button"
              variant="body2"
              onClick={(e) => {
                e.preventDefault();
                setUseBackupCode(!useBackupCode);
                setCode('');
                setBackupCode('');
                setError('');
              }}
              disabled={isLoading || isLocked}
              sx={{
                cursor: isLoading || isLocked ? 'not-allowed' : 'pointer',
                opacity: isLoading || isLocked ? 0.5 : 1,
              }}
            >
              {useBackupCode ? 'Use verification code instead' : 'Use backup code'}
            </Link>

            {/* Resend Code Button (for Email/SMS) */}
            {(method === 'email_otp' || method === 'sms_otp') && !useBackupCode && (
              <Button
                size="small"
                onClick={handleResendCode}
                disabled={isLoading || isLocked}
              >
                Resend Code
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleVerify}
          variant="contained"
          disabled={
            isLoading ||
            isLocked ||
            (useBackupCode ? !backupCode.trim() : code.length !== 6)
          }
        >
          {isLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          {isLoading ? 'Verifying...' : 'Verify'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TwoFactorVerificationModal;
