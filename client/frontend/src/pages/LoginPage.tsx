import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

function portalRedirect(user: any, fallback: string): string {
  if (user?.is_super_admin) return '/admin/dashboard';
  if (user?.is_support_admin) return '/support/tickets';
  return fallback;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, isLoading, user } = useAuth();

  const locationState = location.state as any;
  const from = locationState?.from?.pathname || '/dashboard';
  const prefilledEmail = locationState?.email || '';
  const prefilledPassword = locationState?.password || '';
  const successMessage = locationState?.message || '';

  useEffect(() => {
    if (authService.hasLogoutFlag()) return;
    if (isAuthenticated && !isLoading) {
      navigate(portalRedirect(user, from), { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate, from]);

  const handleLoginSuccess = (response?: any) => {
    navigate(portalRedirect(response?.user, from), { replace: true });
  };

  if (isAuthenticated && !authService.hasLogoutFlag()) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
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
