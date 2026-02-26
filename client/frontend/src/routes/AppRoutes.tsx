import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AuthGuard } from '../components/auth';
import LoginPage from '../pages/LoginPage';
import LandingPage from '../pages/LandingPage';
import SignupPage from '../pages/SignupPage';
import { ForgotPasswordPage, PasswordResetPage, TwoFactorManagementPage } from '../pages/auth';
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const MeterReadingsPage = lazy(() => import('../pages/MeterReadingsPage').then(m => ({ default: m.MeterReadingsPage })));
const UserManagementPage = lazy(() => import('../features/users').then(m => ({ default: m.UserManagementPage })));
const LocationManagementPage = lazy(() => import('../features/locations').then(m => ({ default: m.LocationManagementPage })));
const ContactManagementPage = lazy(() => import('../features/contacts').then(m => ({ default: m.ContactManagementPage })));
const ContactManagementPage2 = lazy(() => import('../features/contacts2').then(m => ({ default: m.ContactManagementPage })));
const DeviceManagementPage = lazy(() => import('../features/devices').then(m => ({ default: m.DeviceManagementPage })));
const NotificationManagementPage = lazy(() => import('../features/notifications').then(m => ({ default: m.NotificationManagementPage })));
import { Permission } from '../types/auth';
const SettingsPage = lazy(() => import('../pages').then(m => ({ default: m.SettingsPage })));
const MetersPage = lazy(() => import('../pages').then(m => ({ default: m.MetersPage })));
const ReportsPage = lazy(() => import('../pages').then(m => ({ default: m.ReportsPage })));
import ManagementForm from '../components/management/ManagementForm';

// Unauthorized page
const UnauthorizedPage = () => (
  <div className="unauthorized-page">
    <h2>Access Denied</h2>
    <p>You don't have permission to access this page.</p>
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
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

        {/* Contact Management Route - Redesigned */}
        <Route
          path="/contacts2"
          element={
            <AuthGuard requiredPermissions={[Permission.CONTACT_READ]}>
              <ContactManagementPage2 />
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

        {/* Notifications Route */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Management Route */}
        <Route
          path="/management"
          element={
            <AuthGuard requiredPermissions={[Permission.TEMPLATE_READ]}>
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
