import type { ComponentType } from 'react';
import type { Permission, UserRole } from '../types/auth';

export interface RouteConfig {
  path: string;
  component: ComponentType<any>;
  exact?: boolean;
  // Authentication requirements
  requireAuth?: boolean;
  loginRedirect?: string;
  // Authorization requirements
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  requireAll?: boolean;
  // Route metadata
  title?: string;
  description?: string;
  breadcrumb?: string;
  // Navigation
  showInNav?: boolean;
  navLabel?: string;
  navIcon?: string;
  navOrder?: number;
}

/**
 * Predefined route configurations for common access patterns
 */
export const RouteAccessPatterns = {
  // Public routes (no authentication required)
  PUBLIC: {
    requireAuth: false,
  },

  // Authenticated routes (any authenticated user)
  AUTHENTICATED: {
    requireAuth: true,
  },

  // Admin only routes
  ADMIN_ONLY: {
    requireAuth: true,
    requiredRoles: ['admin' as UserRole],
  },

  // Manager and above routes
  MANAGER_AND_ABOVE: {
    requireAuth: true,
    requiredRoles: ['admin' as UserRole, 'manager' as UserRole],
    requireAll: false, // User needs ANY of these roles
  },

  // Technician and above routes
  TECHNICIAN_AND_ABOVE: {
    requireAuth: true,
    requiredRoles: ['admin' as UserRole, 'manager' as UserRole, 'technician' as UserRole],
    requireAll: false,
  },

  // User management routes
  USER_MANAGEMENT: {
    requireAuth: true,
    requiredPermissions: ['user:read' as Permission],
  },

  // Location management routes
  LOCATION_MANAGEMENT: {
    requireAuth: true,
    requiredPermissions: ['location:read' as Permission],
  },

  // Contact management routes
  CONTACT_MANAGEMENT: {
    requireAuth: true,
    requiredPermissions: ['contact:read' as Permission],
  },

  // Meter management routes
  METER_MANAGEMENT: {
    requireAuth: true,
    requiredPermissions: ['meter:read' as Permission],
  },

  // Settings routes
  SETTINGS: {
    requireAuth: true,
    requiredPermissions: ['settings:read' as Permission],
  },

  // Email template routes
  EMAIL_TEMPLATES: {
    requireAuth: true,
    requiredPermissions: ['template:read' as Permission],
  },
} as const;

/**
 * Helper function to create route config with access pattern
 */
export const createRouteConfig = (
  path: string,
  component: ComponentType<any>,
  accessPattern: Partial<RouteConfig> = RouteAccessPatterns.AUTHENTICATED,
  additionalConfig: Partial<RouteConfig> = {}
): RouteConfig => {
  return {
    path,
    component,
    ...accessPattern,
    ...additionalConfig,
  };
};

/**
 * Helper function to check if a route should be shown in navigation
 */
export const shouldShowInNav = (route: RouteConfig, userPermissions: Permission[], userRole: UserRole): boolean => {
  if (!route.showInNav) return false;

  // Check authentication requirement
  if (route.requireAuth && !userPermissions.length) return false;

  // Check role requirements
  if (route.requiredRoles && route.requiredRoles.length > 0) {
    const hasRequiredRole = route.requireAll
      ? route.requiredRoles.every(role => role === userRole)
      : route.requiredRoles.some(role => role === userRole);
    
    if (!hasRequiredRole) return false;
  }

  // Check permission requirements
  if (route.requiredPermissions && route.requiredPermissions.length > 0) {
    const hasRequiredPermissions = route.requireAll
      ? route.requiredPermissions.every(permission => userPermissions.includes(permission))
      : route.requiredPermissions.some(permission => userPermissions.includes(permission));
    
    if (!hasRequiredPermissions) return false;
  }

  return true;
};

/**
 * Helper function to filter routes based on user access
 */
export const filterAccessibleRoutes = (
  routes: RouteConfig[],
  userPermissions: Permission[],
  userRole: UserRole
): RouteConfig[] => {
  return routes.filter(route => {
    // Always allow public routes
    if (!route.requireAuth) return true;

    // Check role requirements
    if (route.requiredRoles && route.requiredRoles.length > 0) {
      const hasRequiredRole = route.requireAll
        ? route.requiredRoles.every(role => role === userRole)
        : route.requiredRoles.some(role => role === userRole);
      
      if (!hasRequiredRole) return false;
    }

    // Check permission requirements
    if (route.requiredPermissions && route.requiredPermissions.length > 0) {
      const hasRequiredPermissions = route.requireAll
        ? route.requiredPermissions.every(permission => userPermissions.includes(permission))
        : route.requiredPermissions.some(permission => userPermissions.includes(permission));
      
      if (!hasRequiredPermissions) return false;
    }

    return true;
  });
};