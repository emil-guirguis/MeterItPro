import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const FinancialsPage = lazy(() => import('./pages/FinancialsPage'));
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const CostsPage = lazy(() => import('./pages/CostsPage'));
const DevicesPage = lazy(() => import('./pages/DevicesPage'));

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <CircularProgress />
    </Box>
  );
  if (!isAuthenticated || user?.role !== 'superadmin') {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

const AdminRoutes: React.FC = () => {
  return (
    <Suspense fallback={
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    }>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboardPage /></AdminGuard>} />
        <Route path="/admin/clients" element={<AdminGuard><ClientsPage /></AdminGuard>} />
        <Route path="/admin/financials" element={<AdminGuard><FinancialsPage /></AdminGuard>} />
        <Route path="/admin/reports" element={<AdminGuard><AdminReportsPage /></AdminGuard>} />
        <Route path="/admin/users" element={<AdminGuard><AdminUsersPage /></AdminGuard>} />
        <Route path="/admin/costs" element={<AdminGuard><CostsPage /></AdminGuard>} />
        <Route path="/admin/devices" element={<AdminGuard><DevicesPage /></AdminGuard>} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;
