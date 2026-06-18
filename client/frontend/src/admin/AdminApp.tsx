import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import AdminLayoutWrapper from './AdminLayoutWrapper';
import AdminRoutes from './AdminRoutes';
import './AdminApp.css';

const AdminApp: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const isAdminUser = user?.is_super_admin || user?.is_support_admin;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated && isAdminUser) {
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
