import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, isLoading } = useAuth();

  // Get location state for pre-filled credentials and messages
  const locationState = location.state as any;
  const from = locationState?.from?.pathname || '/dashboard';
  const prefilledEmail = locationState?.email || '';
  const prefilledPassword = locationState?.password || '';
  const successMessage = locationState?.message || '';

  // Redirect if already authenticated (but NOT if user explicitly logged out)
  useEffect(() => {
    // Don't redirect if user explicitly logged out
    if (authService.hasLogoutFlag()) {
      console.log('🚫 Logout flag detected, staying on login page');
      return;
    }
    
    if (isAuthenticated && !isLoading) {
      console.log('✅ Already authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  // Handle successful login
  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };

  // Don't render login form if already authenticated (unless user explicitly logged out)
  if (isAuthenticated && !authService.hasLogoutFlag()) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isMobile
          ? theme.palette.background.default
          : `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LoginForm 
        onSuccess={handleLoginSuccess} 
        redirectTo={from}
        prefilledEmail={prefilledEmail}
        prefilledPassword={prefilledPassword}
        successMessage={successMessage}
      />
    </Box>
  );
};

export default LoginPage;