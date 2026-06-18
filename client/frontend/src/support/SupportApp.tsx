import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import SupportLayoutWrapper from './SupportLayoutWrapper';
import SupportRoutes from './SupportRoutes';
import { useLocation } from 'react-router-dom';

const SupportApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const isPublicPage = location.pathname === '/support' || location.pathname === '/support/login';

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated && !isPublicPage) {
    return (
      <div className="support-app">
        <SupportLayoutWrapper>
          <SupportRoutes />
        </SupportLayoutWrapper>
      </div>
    );
  }

  return <SupportRoutes />;
};

export default SupportApp;
