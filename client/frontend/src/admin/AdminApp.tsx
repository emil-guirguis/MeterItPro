import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import AdminLayoutWrapper from './AdminLayoutWrapper';
import AdminRoutes from './AdminRoutes';
import './AdminApp.css';

const AdminApp: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated && isSuperAdmin) {
    return (
      <div className="admin-app">
        <AdminLayoutWrapper>
          <AdminRoutes />
        </AdminLayoutWrapper>
      </div>
    );
  }

  return <AdminRoutes />;
};

export default AdminApp;
