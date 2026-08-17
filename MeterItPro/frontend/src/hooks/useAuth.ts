import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';
import type { AuthContextType, Permission } from '../types/auth';
import { UserRole } from '../types/auth';

/**
 * Custom hook to access authentication context
 * Provides authentication state and methods
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Hook for checking user permissions
 * Returns a function to check if user has specific permission
 */
export const usePermissions = () => {
  const { checkPermission } = useAuth();
  
  return {
    checkPermission,
    hasPermission: checkPermission, // Alias for consistency
  };
};

/**
 * Hook for checking user roles
 * Returns a function to check if user has specific role
 */
export const useRole = () => {
  const { hasRole, user } = useAuth();
  
  return {
    hasRole,
    currentRole: user?.role,
    isAdmin: () => hasRole(UserRole.ADMIN),
    isManager: () => hasRole(UserRole.MANAGER),
    isTechnician: () => hasRole(UserRole.TECHNICIAN),
    isViewer: () => hasRole(UserRole.VIEWER),
  };
};

/**
 * Hook for authentication actions
 * Returns login, logout, and other auth actions
 */
export const useAuthActions = () => {
  const { login, logout, refreshToken } = useAuth();
  
  return {
    login,
    logout,
    refreshToken,
  };
};

/**
 * Hook for authentication state
 * Returns current authentication state without actions
 */
export const useAuthState = () => {
  const { user, isAuthenticated, isLoading, error } = useAuth();
  
  return {
    user,
    isAuthenticated,
    isLoading,
    error,
  };
};

/**
 * Hook that combines permission and role checking
 * Useful for complex authorization logic
 */
export const useAuthorization = () => {
  const { checkPermission, hasRole, user } = useAuth();
  
  const canAccess = (requiredPermissions: Permission[], requiredRoles?: UserRole[]) => {
    if (!user) return false;
    
    // Check permissions
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      checkPermission(permission)
    );
    
    // Check roles if specified
    const hasRequiredRoles = requiredRoles 
      ? requiredRoles.some(role => hasRole(role))
      : true;
    
    return hasRequiredPermissions && hasRequiredRoles;
  };
  
  const canAccessAny = (permissions: Permission[]) => {
    if (!user) return false;
    return permissions.some(permission => checkPermission(permission));
  };
  
  return {
    canAccess,
    canAccessAny,
    checkPermission,
    hasRole,
    user,
  };
};

export default useAuth;