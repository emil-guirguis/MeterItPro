import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import type { ReactNode } from 'react';
import type { Permission, UserRole } from '../../types/auth';
import { useAuthorization } from '../../hooks/useAuth';

interface RoleGuardProps {
  children: ReactNode;
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  requireAll?: boolean; // If true, user must have ALL permissions/roles. If false, user needs ANY
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * RoleGuard component that checks user permissions and roles
 * Shows fallback content or hides content if user lacks required access
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAll = true,
  fallback,
  showFallback = true,
}) => {
  const { canAccess, canAccessAny, hasRole, user } = useAuthorization();

  // If no requirements specified, allow access
  if (requiredPermissions.length === 0 && requiredRoles.length === 0) {
    return <>{children}</>;
  }

  // Check access based on requireAll flag
  const hasAccess = requireAll
    ? canAccess(requiredPermissions, requiredRoles.length > 0 ? requiredRoles : undefined)
    : canAccessAny(requiredPermissions) || requiredRoles.some(role => hasRole(role));

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // If showFallback is false, render nothing
  if (!showFallback) {
    return null;
  }

  // Default fallback UI
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        textAlign: 'center',
        minHeight: 200,
      }}
    >
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Access Denied
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        You don't have permission to access this content.
        {user && (
          <>
            <br />
            Current role: <strong>{user.role}</strong>
          </>
        )}
      </Typography>
      <Button
        variant="outlined"
        onClick={() => window.history.back()}
        size="small"
      >
        Go Back
      </Button>
    </Box>
  );
};

/**
 * Hook for conditional rendering based on permissions
 */
export const usePermissionCheck = (
  requiredPermissions: Permission[],
  requiredRoles?: UserRole[],
  requireAll: boolean = true
) => {
  const { canAccess, canAccessAny, hasRole } = useAuthorization();

  if (requiredPermissions.length === 0 && (!requiredRoles || requiredRoles.length === 0)) {
    return true;
  }

  return requireAll
    ? canAccess(requiredPermissions, requiredRoles)
    : canAccessAny(requiredPermissions) || (requiredRoles?.some(role => hasRole(role)) ?? false);
};

/**
 * Higher-order component for role-based access control
 */
export const withRoleGuard = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: Permission[] = [],
  requiredRoles: UserRole[] = [],
  requireAll: boolean = true
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <RoleGuard
      requiredPermissions={requiredPermissions}
      requiredRoles={requiredRoles}
      requireAll={requireAll}
    >
      <Component {...props} />
    </RoleGuard>
  );

  WrappedComponent.displayName = `withRoleGuard(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default RoleGuard;