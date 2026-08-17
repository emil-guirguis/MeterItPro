import React, { useState, useMemo } from 'react';
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
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import authService from '../../services/authService';
import { PasswordValidator } from '../../utils/passwordValidator';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Validate password and get requirements status
  const passwordValidation = useMemo(() => {
    if (!newPassword) {
      return {
        isValid: false,
        score: 0,
        requirements: {
          minLength: false,
          hasUppercase: false,
          hasLowercase: false,
          hasNumber: false,
          hasSpecialChar: false,
        },
      };
    }

    const validation = PasswordValidator.validate(newPassword);
    const score = PasswordValidator.getStrengthScore(newPassword);
    return {
      isValid: validation.isValid,
      score,
      requirements: {
        minLength: newPassword.length >= 12,
        hasUppercase: /[A-Z]/.test(newPassword),
        hasLowercase: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSpecialChar: /[!@#$%^&*]/.test(newPassword),
      },
    };
  }, [newPassword]);

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordsMismatch = newPassword && confirmPassword && newPassword !== confirmPassword;

  const getStrengthLabel = (): string => {
    if (!newPassword) return '';
    if (passwordValidation.score < 30) return 'Weak';
    if (passwordValidation.score < 60) return 'Fair';
    if (passwordValidation.score < 80) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = (): 'error' | 'warning' | 'info' | 'success' => {
    if (!newPassword) return 'info';
    if (passwordValidation.score < 30) return 'error';
    if (passwordValidation.score < 60) return 'warning';
    if (passwordValidation.score < 80) return 'info';
    return 'success';
  };

  const handleTogglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!currentPassword.trim()) {
      setError('Current password is required');
      return;
    }

    if (!newPassword.trim()) {
      setError('New password is required');
      return;
    }

    if (!confirmPassword.trim()) {
      setError('Confirm password is required');
      return;
    }

    if (passwordsMismatch) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordValidation.isValid) {
      setError('Password does not meet all security requirements');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await authService.changePassword(currentPassword, newPassword, confirmPassword);
      setSuccessMessage('Password Changed Successfully');
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Call success callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      } else {
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password change failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setSuccessMessage('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && passwordValidation.isValid && passwordsMatch) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableEscapeKeyDown={isLoading}>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* Success Message */}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Current Password */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isLoading}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => handleTogglePasswordVisibility('current')}
                    edge="end"
                    disabled={isLoading}
                    size="small"
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
              onKeyDown={handleKeyDown}
            />
          </Box>

          {/* New Password */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => handleTogglePasswordVisibility('new')}
                    edge="end"
                    disabled={isLoading}
                    size="small"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
              onKeyDown={handleKeyDown}
            />

            {/* Password Strength Indicator */}
            {newPassword && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Password Strength
                  </Typography>
                  <Typography variant="caption" color={getStrengthColor()}>
                    {getStrengthLabel()}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={passwordValidation.score}
                  color={getStrengthColor()}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
            )}

            {/* Password Requirements */}
            {newPassword && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Password Requirements
                </Typography>
                <List dense sx={{ p: 0 }}>
                  <ListItem sx={{ py: 0.5, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {passwordValidation.requirements.minLength ? (
                        <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} data-testid="CheckCircleIcon" />
                      ) : (
                        <Cancel sx={{ color: 'error.main', fontSize: 20 }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="At least 12 characters"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.5, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {passwordValidation.requirements.hasUppercase ? (
                        <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} data-testid="CheckCircleIcon" />
                      ) : (
                        <Cancel sx={{ color: 'error.main', fontSize: 20 }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="At least one uppercase letter (A-Z)"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.5, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {passwordValidation.requirements.hasLowercase ? (
                        <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} data-testid="CheckCircleIcon" />
                      ) : (
                        <Cancel sx={{ color: 'error.main', fontSize: 20 }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="At least one lowercase letter (a-z)"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.5, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {passwordValidation.requirements.hasNumber ? (
                        <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} data-testid="CheckCircleIcon" />
                      ) : (
                        <Cancel sx={{ color: 'error.main', fontSize: 20 }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="At least one number (0-9)"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.5, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {passwordValidation.requirements.hasSpecialChar ? (
                        <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} data-testid="CheckCircleIcon" />
                      ) : (
                        <Cancel sx={{ color: 'error.main', fontSize: 20 }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="At least one special character (!@#$%^&*)"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>
              </Box>
            )}
          </Box>

          {/* Confirm Password */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => handleTogglePasswordVisibility('confirm')}
                    edge="end"
                    disabled={isLoading}
                    size="small"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
              onKeyDown={handleKeyDown}
            />

            {/* Password Match Indicator */}
            {confirmPassword && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                {passwordsMatch ? (
                  <>
                    <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />
                    <Typography variant="caption" color="success.main">
                      Passwords match
                    </Typography>
                  </>
                ) : (
                  <>
                    <Cancel sx={{ color: 'error.main', fontSize: 18 }} />
                    <Typography variant="caption" color="error.main">
                      Passwords do not match
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            isLoading ||
            !currentPassword.trim() ||
            !newPassword.trim() ||
            !confirmPassword.trim() ||
            !passwordValidation.isValid ||
            !passwordsMatch
          }
        >
          {isLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          {isLoading ? 'Changing Password...' : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordModal;
