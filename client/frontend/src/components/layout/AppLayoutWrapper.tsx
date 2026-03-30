/**
 * AppLayoutWrapper
 * 
 * Client-specific wrapper around the framework AppLayout component.
 * This demonstrates how to configure and use the framework layout
 * with client-specific hooks, state, and configuration.
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@framework/layout';
import type { LayoutProps, MenuItem, AppLayoutConfig } from '@framework/layout';
import { registerIconMappings } from '@framework/utils/iconHelper';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { useUI } from '../../store/slices/uiSlice';
import { Permission } from '../../types/auth';
import { SidebarMetersSection } from '../sidebar-meters';
import { useMeterSelection } from '../../contexts/MeterSelectionContext';
import { NotificationBell } from '../notifications';
// Application-specific icon mappings
const appIconMappings = {
  'contacts': 'contacts',
  'meter': 'electric_bolt',
  'meters': 'electric_bolt',
  'reports': 'assessment',
  'management': 'folder_managed',
  'template': 'mail',
  'templates': 'mail',
  'building': 'business',
  'users': 'people',
  'devices': 'devices',
  'location': 'location_on',
  'locations': 'location_on',
  'notifications': 'notifications',
};

// Register icon mappings once
let iconsRegistered = false;
if (!iconsRegistered) {
  registerIconMappings(appIconMappings);
  iconsRegistered = true;
}

/**
 * Memoized version of SidebarMetersSection to prevent remounting when parent route changes
 * Only re-renders when its own props change
 */
const MemoizedSidebarMetersSection = React.memo(SidebarMetersSection, (prevProps, nextProps) => {
  // Return true if props are equal (no re-render needed)
  // Return false if props changed (re-render needed)
  return (
    prevProps.tenantId === nextProps.tenantId &&
    prevProps.userId === nextProps.userId &&
    prevProps.onMeterSelect === nextProps.onMeterSelect &&
    prevProps.onMeterElementSelect === nextProps.onMeterElementSelect
  );
});

// Client-specific menu configuration
const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard'
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: 'contacts',
    path: '/contacts',
    requiredPermission: Permission.CONTACT_READ
  },
  {
    id: 'meters',
    label: 'Meters',
    icon: 'meter',
    path: '/meters',
    requiredPermission: Permission.METER_READ
  },

  {
    id: 'management',
    label: 'Management',
    icon: 'management',
    path: '/management',
    requiredPermission: Permission.TEMPLATE_READ,
    children: [
      {
        id: 'devices',
        label: 'Devices',
        icon: 'meter',
        path: '/devices',
        requiredPermission: Permission.DEVICE_READ
      },

      {
        id: 'templates',
        label: 'Email Templates',
        icon: 'template',
        path: '/templates',
        requiredPermission: Permission.TEMPLATE_READ
      },
      {
        id: 'locations',
        label: 'Locations',
        icon: 'building',
        path: '/location',
        requiredPermission: Permission.LOCATION_READ
      },
      {
        id: 'notification-rules',
        label: 'Notifications',
        icon: 'notifications',
        path: '/notification-rules',
        requiredPermission: Permission.NOTIFICATION_RULE_READ
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: 'assessment',
        path: '/reports'
      },
      {
        id: 'users',
        label: 'Users',
        icon: 'users',
        path: '/users',
        requiredPermission: Permission.USER_READ
      },

    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    path: '/settings',
    requiredPermission: Permission.SETTINGS_READ
  }
];

/**
 * AppLayoutWrapper Component
 * 
 * Wraps the framework AppLayout with client-specific configuration.
 * Use this component instead of importing AppLayout directly.
 */
export const AppLayoutWrapper: React.FC<LayoutProps> = (props) => {
  // Use real authentication data
  const { user, logout: authLogout, checkPermission } = useAuth();

  // Use meter selection context
  const { setSelectedMeter, setSelectedElement } = useMeterSelection();

  // Use React Router navigation
  const navigate = useNavigate();

  const logout = () => {
    console.log('🚪 Logout button clicked');

    // Call logout which clears tokens and sets logout flag
    authLogout();

    // Redirect to login page
    console.log('🔄 Redirecting to login page');
    window.location.href = '/login';
  };

  // Get responsive state
  const responsive = useResponsive();

  // Get UI state
  const uiState = useUI();

  // Memoize meter selection callback to prevent sidebar remount on route change
  const handleMeterSelect = useCallback(
    (meterId: string, meterName?: string) => {
      console.log('[AppLayoutWrapper] Meter selected:', meterId, 'name:', meterName);
      console.log('[AppLayoutWrapper] Setting selectedMeter in context with name:', meterName);
      setSelectedMeter(String(meterId), meterName);
      setSelectedElement(null);
      console.log('[AppLayoutWrapper] Context updated');
      console.log('[AppLayoutWrapper] Navigating to /meter-readings');
      navigate('/meter-readings');
      // Close mobile nav on mobile/tablet after selection
      if (responsive.isMobile || responsive.isTablet) {
        uiState.setMobileNavOpen(false);
      }
    },
    [setSelectedMeter, setSelectedElement, navigate, responsive, uiState]
  );

  // Memoize meter element selection callback to prevent sidebar remount on route change
  const handleMeterElementSelect = useCallback(
    (meterId: string, elementId: string, elementName?: string, elementNumber?: number, gridType?: 'simple' | 'baselist') => {
      console.log('[AppLayoutWrapper] ===== METER ELEMENT SELECT =====');
      console.log('[AppLayoutWrapper] Meter element selected:', meterId, elementId, 'name:', elementName, 'number:', elementNumber);
      console.log('[AppLayoutWrapper] gridType:', gridType);
      console.log('[AppLayoutWrapper] meterId type:', typeof meterId, 'elementId type:', typeof elementId);
      console.log('[AppLayoutWrapper] Setting selectedMeter and selectedElement in context');
      setSelectedMeter(String(meterId));
      setSelectedElement(String(elementId), elementName, elementNumber ? Number(elementNumber) : undefined);
      console.log('[AppLayoutWrapper] Context updated');
      const params = new URLSearchParams();
      params.set('meterId', String(meterId));
      params.set('elementId', String(elementId));
      if (elementName) params.set('elementName', elementName);
      if (elementNumber) params.set('elementNumber', String(elementNumber));
      if (gridType) params.set('gridType', gridType);
      const url = `/meter-readings?${params.toString()}`;
      console.log('[AppLayoutWrapper] Navigating to:', url);
      navigate(url);
      // Close mobile nav on mobile/tablet after selection
      if (responsive.isMobile || responsive.isTablet) {
        uiState.setMobileNavOpen(false);
      }
      console.log('[AppLayoutWrapper] ===== METER ELEMENT SELECT COMPLETE =====');
    },
    [setSelectedMeter, setSelectedElement, navigate, responsive, uiState]
  );

  // Build configuration
  const config: AppLayoutConfig = {
    menuItems,
    sidebarBrand: {
      icon: '🏢',
      text: 'MeterIt Pro'
    },
    user: user ? {
      name: user.name,
      email: user.email
    } : undefined,

    notificationComponent: <NotificationBell />,
    onLogout: logout,
    checkPermission: (permission?: string) => permission ? checkPermission(permission) : true,
    responsive,
    uiState,
    sidebarContent: user ? (
      <MemoizedSidebarMetersSection
        tenantId={user.client || '1'}
        userId={user.users_id || '1'}
        onMeterSelect={handleMeterSelect}
        onMeterElementSelect={handleMeterElementSelect}
      />
    ) : undefined,
  };

  return <AppLayout {...props} config={config} />;
};

// Export as default for backward compatibility
export default AppLayoutWrapper;
