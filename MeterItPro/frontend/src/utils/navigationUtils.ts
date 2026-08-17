// Navigation Utilities

import type { BreadcrumbItem } from '../types/ui';

// Route to title mapping
const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/users': 'Users',
  '/users/new': 'New User',
  '/users/edit': 'Edit User',
  '/location': 'Location',
  '/location/new': 'New Location',
  '/location/edit': 'Edit Location',
  '/contacts': 'Contacts',
  '/contacts/new': 'New Contact',
  '/contacts/edit': 'Edit Contact',
  '/meters': 'Meters',
  '/meters/new': 'New Meter',
  '/meters/edit': 'Edit Meter',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/help': 'Help',
};

// Route to breadcrumb mapping
const routeBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/': [
    { label: 'Dashboard', path: '/dashboard' }
  ],
  '/dashboard': [
    { label: 'Dashboard', path: '/dashboard' }
  ],
  '/users': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Users', path: '/users' }
  ],
  '/users/new': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Users', path: '/users' },
    { label: 'New User' }
  ],
  '/users/edit': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Users', path: '/users' },
    { label: 'Edit User' }
  ],
  '/location': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Location', path: '/location' }
  ],
  '/location/new': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Location', path: '/location' },
    { label: 'New Location' }
  ],
  '/location/edit': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Locations', path: '/location' },
    { label: 'Edit Location' }
  ],
  '/contacts': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Contacts', path: '/contacts' }
  ],
  '/contacts/new': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Contacts', path: '/contacts' },
    { label: 'New Contact' }
  ],
  '/contacts/edit': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Contacts', path: '/contacts' },
    { label: 'Edit Contact' }
  ],
  '/meters': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Meters', path: '/meters' }
  ],
  '/meters/new': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Meters', path: '/meters' },
    { label: 'New Meter' }
  ],
  '/meters/edit': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Meters', path: '/meters' },
    { label: 'Edit Meter' }
  ],
  '/settings': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Settings', path: '/settings' }
  ],
  '/profile': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Profile', path: '/profile' }
  ],
  '/help': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Help', path: '/help' }
  ],
};

/**
 * Get page title from route path
 */
export const getPageTitle = (pathname: string): string => {
  // Try exact match first
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }
  
  // Try to match dynamic routes
  if (pathname.includes('/edit/')) {
    const basePath = pathname.split('/edit/')[0];
    const baseTitle = routeTitles[basePath];
    if (baseTitle) {
      return `Edit ${baseTitle.slice(0, -1)}`; // Remove 's' from plural
    }
  }
  
  if (pathname.includes('/view/')) {
    const basePath = pathname.split('/view/')[0];
    const baseTitle = routeTitles[basePath];
    if (baseTitle) {
      return `View ${baseTitle.slice(0, -1)}`; // Remove 's' from plural
    }
  }
  
  // Fallback to path-based title
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return 'Dashboard';
  }
  
  const lastSegment = segments[segments.length - 1];
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
};

/**
 * Generate breadcrumbs from route path
 */
export const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  // Try exact match first
  if (routeBreadcrumbs[pathname]) {
    return routeBreadcrumbs[pathname];
  }
  
  // Try to match dynamic routes
  if (pathname.includes('/edit/')) {
    const basePath = pathname.split('/edit/')[0];
    const baseBreadcrumbs = routeBreadcrumbs[basePath];
    if (baseBreadcrumbs) {
      return [
        ...baseBreadcrumbs,
        { label: `Edit ${baseBreadcrumbs[baseBreadcrumbs.length - 1].label.slice(0, -1)}` }
      ];
    }
  }
  
  if (pathname.includes('/view/')) {
    const basePath = pathname.split('/view/')[0];
    const baseBreadcrumbs = routeBreadcrumbs[basePath];
    if (baseBreadcrumbs) {
      return [
        ...baseBreadcrumbs,
        { label: `View ${baseBreadcrumbs[baseBreadcrumbs.length - 1].label.slice(0, -1)}` }
      ];
    }
  }
  
  // Generate breadcrumbs from path segments
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', path: '/dashboard' }
  ];
  
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const title = segment.charAt(0).toUpperCase() + segment.slice(1);
    
    if (index === segments.length - 1) {
      // Last segment - no link
      breadcrumbs.push({ label: title });
    } else {
      // Intermediate segments - with link
      breadcrumbs.push({ label: title, path: currentPath });
    }
  });
  
  return breadcrumbs;
};

/**
 * Check if a route is active
 */
export const isRouteActive = (currentPath: string, routePath: string): boolean => {
  if (routePath === currentPath) {
    return true;
  }
  
  // Check for parent route match
  if (currentPath.startsWith(routePath) && routePath !== '/') {
    return true;
  }
  
  return false;
};

/**
 * Get parent route from current path
 */
export const getParentRoute = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length <= 1) {
    return '/dashboard';
  }
  
  // Remove last segment
  segments.pop();
  return '/' + segments.join('/');
};

/**
 * Format route path for display
 */
export const formatRoutePath = (path: string): string => {
  return path
    .split('/')
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' > ');
};

/**
 * Check if route requires authentication
 */
export const isProtectedRoute = (pathname: string): boolean => {
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  return !publicRoutes.includes(pathname);
};

/**
 * Get default route for user role
 */
export const getDefaultRoute = (userRole?: string): string => {
  switch (userRole) {
    case 'admin':
      return '/dashboard';
    case 'manager':
      return '/dashboard';
    case 'technician':
      return '/meters';
    case 'viewer':
      return '/dashboard';
    default:
      return '/dashboard';
  }
};

/**
 * Validate route access for user
 */
export const canAccessRoute = (pathname: string, userRole?: string, userPermissions?: string[]): boolean => {
  // Public routes are always accessible
  if (!isProtectedRoute(pathname)) {
    return true;
  }
  
  // Must be authenticated for protected routes
  if (!userRole) {
    return false;
  }
  
  // Admin can access everything
  if (userRole === 'admin') {
    return true;
  }
  
  // Route-specific access control
  const routePermissions: Record<string, string[]> = {
    '/users': ['user:read'],
    '/users/new': ['user:create'],
    '/users/edit': ['user:update'],
    '/location': ['location:read'],
    '/location/new': ['location:create'],
    '/location/edit': ['location:update'],
    '/contacts': ['contact:read'],
    '/contacts/new': ['contact:create'],
    '/contacts/edit': ['contact:update'],
    '/meters': ['meter:read'],
    '/meters/new': ['meter:create'],
    '/meters/edit': ['meter:update'],
    '/settings': ['settings:read'],
  };
  
  const requiredPermissions = routePermissions[pathname];
  if (!requiredPermissions || !userPermissions) {
    return true; // No specific permissions required
  }
  
  // Check if user has any of the required permissions
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};