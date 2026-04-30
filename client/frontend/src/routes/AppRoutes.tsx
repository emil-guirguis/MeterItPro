import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { ProtectedRoute, AuthGuard } from '../components/auth';
import { Permission } from '../types/auth';

// Public pages — lazy so authenticated users don't pay their parse cost
const LoginPage = lazy(() => import('../pages/LoginPage'));
const LandingPage = lazy(() => import('../pages/LandingPage'));
const SignupPage = lazy(() => import('../pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth').then(m => ({ default: m.ForgotPasswordPage })));
const PasswordResetPage = lazy(() => import('../pages/auth').then(m => ({ default: m.PasswordResetPage })));
const TwoFactorManagementPage = lazy(() => import('../pages/auth').then(m => ({ default: m.TwoFactorManagementPage })));

// Protected pages — lazy
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const MeterReadingsPage = lazy(() => import('../pages/MeterReadingsPage').then(m => ({ default: m.MeterReadingsPage })));
const UserManagementPage = lazy(() => import('../features/users').then(m => ({ default: m.UserManagementPage })));
const LocationManagementPage = lazy(() => import('../features/locations').then(m => ({ default: m.LocationManagementPage })));
const ContactManagementPage = lazy(() => import('../features/contacts').then(m => ({ default: m.ContactManagementPage })));
const DeviceManagementPage = lazy(() => import('../features/devices').then(m => ({ default: m.DeviceManagementPage })));
const SettingsPage = lazy(() => import('../pages').then(m => ({ default: m.SettingsPage })));
const MetersPage = lazy(() => import('../pages').then(m => ({ default: m.MetersPage })));
const ReportsPage = lazy(() => import('../pages').then(m => ({ default: m.ReportsPage })));
const NotificationRulesPage = lazy(() => import('../features/notifications').then(m => ({ default: m.NotificationRulesPage })));
const AiChatPage = lazy(() => import('../features/ai/AiChatPage').then(m => ({ default: m.AiChatPage })));
const ManagementForm = lazy(() => import('../components/management/ManagementForm'));

// Unauthorized page
const UnauthorizedPage = () => (
  <div className="unauthorized-page">
    <h2>Access Denied</h2>
    <p>You don't have permission to access this page.</p>
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    }>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/:plan" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Routes - Require Authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* 2FA Management Route */}
        <Route
          path="/security/2fa"
          element={
            <ProtectedRoute>
              <TwoFactorManagementPage />
            </ProtectedRoute>
          }
        />

        {/* User Management Routes */}
        <Route
          path="/users"
          element={
            <AuthGuard requiredPermissions={[Permission.USER_READ]}>
              <UserManagementPage />
            </AuthGuard>
          }
        />

        {/* Location Management Routes */}
        <Route
          path="/location"
          element={
            <AuthGuard requiredPermissions={[Permission.LOCATION_READ]}>
              <LocationManagementPage />
            </AuthGuard>
          }
        />

        {/* Device Management Routes */}
        <Route
          path="/devices"
          element={
            <ProtectedRoute>
              <DeviceManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Permission-based Routes */}

        {/* Meter Readings Route */}
        <Route
          path="/meter-readings"
          element={
            <ProtectedRoute>
              <MeterReadingsPage />
            </ProtectedRoute>
          }
        />

        {/* Settings - Multiple Permission Requirements */}
        <Route
          path="/settings"
          element={
            <AuthGuard
              requiredPermissions={[Permission.SETTINGS_READ, Permission.SETTINGS_UPDATE]}
              requireAll={false}
            >
              <SettingsPage />
            </AuthGuard>
          }
        />

        {/* Contact Management Route */}
        <Route
          path="/contacts"
          element={
            <AuthGuard requiredPermissions={[Permission.CONTACT_READ]}>
              <ContactManagementPage />
            </AuthGuard>
          }
        />

       {/* Meters Module Placeholder */}
        <Route
          path="/meters"
          element={
            <AuthGuard requiredPermissions={[Permission.METER_READ]}>
              <MetersPage />
            </AuthGuard>
          }
        />

        {/* Reports Module */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Notification Rules Route */}
        <Route
          path="/notification-rules"
          element={
            <AuthGuard requiredPermissions={[Permission.NOTIFICATION_RULE_READ]}>
              <NotificationRulesPage />
            </AuthGuard>
          }
        />

        {/* AI Chat Route */}
        <Route
          path="/ai-chat"
          element={
            <ProtectedRoute>
              <AiChatPage />
            </ProtectedRoute>
          }
        />

        {/* Management Route */}
        <Route
          path="/management"
          element={
            <AuthGuard requiredPermissions={[Permission.DEVICE_READ]}>
              <ManagementForm />
            </AuthGuard>
          }
        />

        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
