import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute, AuthGuard } from '../components/auth';
import AppLayoutWrapper from '../components/layout/AppLayoutWrapper';
import LoginPage from '../pages/LoginPage';
import LandingPage from '../pages/LandingPage';
import { ForgotPasswordPage, PasswordResetPage, TwoFactorManagementPage } from '../pages/auth';
import { DashboardPage } from '../pages/DashboardPage';
import { MeterReadingsPage } from '../pages/MeterReadingsPage';
import { UserManagementPage } from '../features/users';
import { LocationManagementPage } from '../features/locations';
import { ContactManagementPage } from '../features/contacts';
import { DeviceManagementPage } from '../features/devices';
import { Permission } from '../types/auth';
import { SettingsPage, MetersPage, ReportsPage } from '../pages';
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
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
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
    </AuthProvider>
  );
};

export default AppRoutes;