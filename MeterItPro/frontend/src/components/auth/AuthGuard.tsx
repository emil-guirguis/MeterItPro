import React from 'react';
import type { ReactNode } from 'react';
import type { Permission, UserRole } from '../../types/auth';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';

interface AuthGuardProps {
  children: ReactNode;
  // Route protection props
  requireAuth?: boolean;
  loginRedirect?: string;
  authFallback?: ReactNode;
  // Role protection props
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  requireAll?: boolean;
  roleFallback?: ReactNode;
  showRoleFallback?: boolean;
}

/**
 * AuthGuard component that combines authentication and authorization checks
 * First checks if user is authenticated, then checks permissions/roles
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  loginRedirect = '/login',
  authFallback,
  requiredPermissions = [],
  requiredRoles = [],
  requireAll = true,
  roleFallback,
  showRoleFallback = true,
}) => {
  // If authentication is not required, only check roles
  if (!requireAuth) {
    return (
      <RoleGuard
        requiredPermissions={requiredPermissions}
        requiredRoles={requiredRoles}
        requireAll={requireAll}
        fallback={roleFallback}
        showFallback={showRoleFallback}
      >
        {children}
      </RoleGuard>
    );
  }

  // If no role requirements, only check authentication
  if (requiredPermissions.length === 0 && requiredRoles.length === 0) {
    return (
      <ProtectedRoute redirectTo={loginRedirect} fallback={authFallback}>
        {children}
      </ProtectedRoute>
    );
  }

  // Check both authentication and authorization
  return (
    <ProtectedRoute redirectTo={loginRedirect} fallback={authFallback}>
      <RoleGuard
        requiredPermissions={requiredPermissions}
        requiredRoles={requiredRoles}
        requireAll={requireAll}
        fallback={roleFallback}
        showFallback={showRoleFallback}
      >
        {children}
      </RoleGuard>
    </ProtectedRoute>
  );
};

export default AuthGuard;