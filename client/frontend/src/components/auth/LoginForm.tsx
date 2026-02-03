import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Container,
  Link,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { LoginCredentials, ValidationError } from '../../types/auth';
import { validateLoginCredentials } from '../../types/auth';
import { useAuth } from '../../hooks/useAuth';
import { TwoFactorVerificationModal } from './TwoFactorVerificationModal';
import authService from '../../services/authService';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  prefilledEmail?: string;
  prefilledPassword?: string;
  successMessage?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  redirectTo = '/dashboard',
  prefilledEmail = '',
  prefilledPassword = '',
  successMessage = ''
}) => {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: prefilledEmail,
    password: prefilledPassword,
    rememberMe: false,
  });
  
  // Success message from signup
  const [signupSuccess, setSignupSuccess] = useState(successMessage);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [twoFAMethod, setTwoFAMethod] = useState<'totp' | 'email_otp' | 'sms_otp'>('totp');
  const [show2FAModal, setShow2FAModal] = useState(false);

  // Clear validation errors when user starts typing
  useEffect(() => {
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [credentials.email, credentials.password]);

  // Handle input changes
  const handleInputChange = (field: keyof LoginCredentials) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'rememberMe' ? event.target.checked : event.target.value;
    setCredentials(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate form
    const validation = validateLoginCredentials(credentials);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      // Attempt login with credentials
      const response = await authService.login(credentials);

      // Check if 2FA is required
      if (response.requires_2fa && response.session_token) {
        // 2FA is required, show modal
        setSessionToken(response.session_token);
        setTwoFAMethod(response.twofa_method || 'totp');
        setRequires2FA(true);
        setShow2FAModal(true);
        setIsSubmitting(false);
        return;
      }

      // No 2FA required, proceed with normal login
      await login(credentials);

      // Add a small delay to allow console logs to be visible
      console.log('✅ Login successful, redirecting in 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default redirect behavior
        window.location.href = redirectTo;
      }
    } catch (error) {
      // Error is handled by the auth context
      console.error('Login failed:', error);
      setIsSubmitting(false);
    }
  };

  // Handle 2FA verification success
  const handle2FASuccess = async (authResponse: any) => {
    try {
      // Store tokens from 2FA verification response
      authService.storeTokens(
        authResponse.token,
        authResponse.refreshToken,
        authResponse.expiresIn,
        credentials.rememberMe
      );

      // Store tenant ID
      const tenantId = authResponse.user.client;
      localStorage.setItem('tenantId', tenantId);

      // Update auth context
      await login(credentials);

      // Close modal
      setShow2FAModal(false);
      setRequires2FA(false);
      setSessionToken('');

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default redirect behavior
        window.location.href = redirectTo;
      }
    } catch (error) {
      console.error('2FA success handler error:', error);
    }
  };

  // Handle 2FA modal close
  const handle2FAClose = () => {
    setShow2FAModal(false);
    setRequires2FA(false);
    setSessionToken('');
    setIsSubmitting(false);
  };

  // Get field error message
  const getFieldError = (field: string): string | undefined => {
    const fieldError = validationErrors.find(error => error.field === field);
    return fieldError?.message;
  };

  // Check if field has error
  const hasFieldError = (field: string): boolean => {
    return validationErrors.some(error => error.field === field);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 3,
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 400,
            boxShadow: 3,
            backgroundColor: '#ffffff',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ color: '#666' }}>
                Enter your credentials to access your account
              </Typography>
            </Box>

            {/* Success Alert */}
            {signupSuccess && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSignupSuccess('')}>
                {signupSuccess}
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Email Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                type="email"
                value={credentials.email}
                onChange={handleInputChange('email')}
                error={hasFieldError('email')}
                helperText={getFieldError('email')}
                disabled={isSubmitting || isLoading || requires2FA}
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#ffffff !important',
                    '& fieldset': {
                      borderColor: '#cccccc',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#000000 !important',
                    fontSize: '16px',
                    backgroundColor: '#ffffff !important',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#999999',
                    opacity: 1,
                  },
                  '& .MuiInputLabel-root': {
                    color: '#666666',
                    fontSize: '14px',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1976d2',
                  },
                }}
              />

              {/* Password Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                id="password"
                autoComplete="current-password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={handleInputChange('password')}
                error={hasFieldError('password')}
                helperText={getFieldError('password')}
                disabled={isSubmitting || isLoading || requires2FA}
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        disabled={isSubmitting || isLoading || requires2FA}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#ffffff !important',
                    '& fieldset': {
                      borderColor: '#cccccc',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#000000 !important',
                    fontSize: '16px',
                    backgroundColor: '#ffffff !important',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#999999',
                    opacity: 1,
                  },
                  '& .MuiInputLabel-root': {
                    color: '#666666',
                    fontSize: '14px',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1976d2',
                  },
                }}
              />

              {/* Remember Me Checkbox */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={credentials.rememberMe}
                    onChange={handleInputChange('rememberMe')}
                    name="rememberMe"
                    color="primary"
                    disabled={isSubmitting || isLoading || requires2FA}
                  />
                }
                label="Remember me"
              />

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting || isLoading || requires2FA}
                sx={{
                  mt: 2,
                  mb: 2,
                  height: 48,
                  position: 'relative',
                }}
              >
                {(isSubmitting || isLoading) && (
                  <CircularProgress
                    size={20}
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      marginLeft: '-10px',
                      marginTop: '-10px',
                    }}
                  />
                )}
                {(isSubmitting || isLoading) ? 'Signing In...' : 'Sign In'}
              </Button>

              {/* Additional Links */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Forgot your password?{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/forgot-password');
                    }}
                    sx={{ cursor: 'pointer', textDecoration: 'none', color: '#1976d2' }}
                  >
                    Reset Password
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © 2025 MeterIt Pro. All rights reserved.
          </Typography>
        </Box>
      </Box>

      {/* 2FA Verification Modal */}
      {show2FAModal && (
        <TwoFactorVerificationModal
          open={show2FAModal}
          sessionToken={sessionToken}
          method={twoFAMethod}
          onSuccess={handle2FASuccess}
          onClose={handle2FAClose}
        />
      )}
    </Container>
  );
};

export default LoginForm;