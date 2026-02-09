import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute, AuthGuard } from '../components/auth';
import AppLayoutWrapper from '../components/layout/AppLayoutWrapper';
import LoginPage from '../pages/LoginPage';
import LandingPage from '../pages/LandingPage';
import SignupPage from '../pages/SignupPage';
import { ForgotPasswordPage, PasswordResetPage, TwoFactorManagementPage } from '../pages/auth';
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const MeterReadingsPage = lazy(() => import('../pages/MeterReadingsPage').then(m => ({ default: m.MeterReadingsPage })));
const UserManagementPage = lazy(() => import('../features/users').then(m => ({ default: m.UserManagementPage })));
const LocationManagementPage = lazy(() => import('../features/locations').then(m => ({ default: m.LocationManagementPage })));
const ContactManagementPage = lazy(() => import('../features/contacts').then(m => ({ default: m.ContactManagementPage })));
const DeviceManagementPage = lazy(() => import('../features/devices').then(m => ({ default: m.DeviceManagementPage })));
import { Permission } from '../types/auth';
const SettingsPage = lazy(() => import('../pages').then(m => ({ default: m.SettingsPage })));
const MetersPage = lazy(() => import('../pages').then(m => ({ default: m.MetersPage })));
const ReportsPage = lazy(() => import('../pages').then(m => ({ default: m.ReportsPage })));
import ManagementForm from '../components/management/ManagementForm';

// Dashboard Page with Layout
const DashboardPageWrapper = () => (
  <AppLayoutWrapper title="Dashboard">
    <DashboardPage />
  </AppLayoutWrapper>
);


const UnauthorizedPage = () => (
  <AppLayoutWrapper title="Unauthorized">
    <div className="unauthorized-page">
      <h2>Access Denied</h2>
      <p>You don't have permission to access this page.</p>
    </div>
  </AppLayoutWrapper>
);

const AppRoutes: React.FC = () => {
  return (
    <AuthProvider>
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
              <DashboardPageWrapper />
            </ProtectedRoute>
          }
        />

        {/* 2FA Management Route */}
        <Route
          path="/security/2fa"
          element={
            <ProtectedRoute>
              <AppLayoutWrapper title="Two-Factor Authentication">
                <TwoFactorManagementPage />
              </AppLayoutWrapper>
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
              <AppLayoutWrapper title="Meter Readings">
                <MeterReadingsPage />
              </AppLayoutWrapper>
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
              <AppLayoutWrapper title="Settings">
                <SettingsPage />
              </AppLayoutWrapper>
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
              <AppLayoutWrapper title="Meters">
                <MetersPage />
              </AppLayoutWrapper>
            </AuthGuard>
          }
        />

        {/* Reports Module */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppLayoutWrapper title="Reports">
                <ReportsPage />
              </AppLayoutWrapper>
            </ProtectedRoute>
          }
        />

        {/* Email Templates Module Placeholder
        <Route
          path="/templates"
          element={
            <AuthGuard requiredPermissions={[Permission.TEMPLATE_READ]}>
              <TemplatesPage />
            </AuthGuard>
          }
        /> */}

        {/* Management Route */}
        <Route
          path="/management"
          element={
            <AuthGuard requiredPermissions={[Permission.TEMPLATE_READ]}>
              <AppLayoutWrapper title="Management">
                <ManagementForm />
              </AppLayoutWrapper>
            </AuthGuard>
          }
        />

        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </AuthProvider>
  );
};

export default AppRoutes;