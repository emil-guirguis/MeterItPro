/**
 * AppLayoutWrapper
 * 
 * Client-specific wrapper around the framework AppLayout component.
 * This demonstrates how to configure and use the framework layout
 * with client-specific hooks, state, and configuration.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@framework/layout';
import type { LayoutProps, MenuItem, AppLayoutConfig } from '@framework/layout';
import { registerIconMappings } from '@framework/utils/iconHelper';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { useUI } from '../../store/slices/uiSlice';
import { Permission } from '../../types/auth';
import { SidebarMetersSection } from '../sidebar-meters';
import { useMeterSelection } from '../../contexts/MeterSelectionContext';
import { SidebarDataProvider } from '../../contexts/SidebarDataContext';
import { NotificationBell } from '../notifications';
// Application-specific icon mappings
const appIconMappings = {
  'contacts': 'contacts',
  'meter': 'electric_bolt',
  'meters': 'electric_bolt',
  'reports': 'assessment',
  'management': 'folder_managed',
  'building': 'business',
  'users': 'people',
  'devices': 'devices',
  'location': 'location_on',
  'locations': 'location_on',
  'notifications': 'notifications',
  'favorites': 'star',
  'meter-readings': 'electric_bolt',
  'ai-chat': 'smart_toy',
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
    prevProps.mode === nextProps.mode &&
    prevProps.onMeterSelect === nextProps.onMeterSelect &&
    prevProps.onMeterElementSelect === nextProps.onMeterElementSelect
  );
});

// Static menu items (items without dynamic content)
const staticMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard'
  },
    {
    id: 'favorites',
    label: 'Favorites',
    icon: 'favorites',
    path: '/favorites'
  },
    {
    id: 'meter-readings',
    label: 'Meter Readings',
    icon: 'data_table',
    path: '/meter-readings',
    requiredPermission: Permission.METER_READ
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
    requiredPermission: Permission.DEVICE_READ,
    children: [
      {
        id: 'devices',
        label: 'Devices',
        icon: 'meter',
        path: '/devices',
        requiredPermission: Permission.DEVICE_READ
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
    id: 'ai-chat',
    label: 'AI Assistant',
    icon: 'smart_toy',
    path: '/ai-chat',
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
  const location = useLocation();

  // Track which sidebar section last triggered navigation, to control active highlight
  const [activeSection, setActiveSection] = useState<'favorites' | 'meters' | null>(null);

  // Reset active section when navigating away from meter-readings
  useEffect(() => {
    if (location.pathname !== '/meter-readings') {
      setActiveSection(null);
    }
  }, [location.pathname]);

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

  // Shared navigation helpers
  const navigateToMeterReadings = useCallback(
    (params?: URLSearchParams) => {
      const url = params ? `/meter-readings?${params.toString()}` : '/meter-readings';
      navigate(url);
      if (responsive.isMobile || responsive.isTablet) {
        uiState.setMobileNavOpen(false);
      }
    },
    [navigate, responsive, uiState]
  );

  // Callback for the Meters section — highlights "Meter Readings" menu item
  const handleMeterSelect = useCallback(
    (meterId: string, meterName?: string) => {
      setActiveSection('meters');
      setSelectedMeter(String(meterId), meterName);
      setSelectedElement(null);
      navigateToMeterReadings();
    },
    [setSelectedMeter, setSelectedElement, navigateToMeterReadings]
  );

  const handleMeterElementSelect = useCallback(
    (meterId: string, elementId: string, elementName?: string, elementNumber?: number, gridType?: 'simple' | 'baselist') => {
      setActiveSection('meters');
      setSelectedMeter(String(meterId));
      setSelectedElement(String(elementId), elementName, elementNumber ? Number(elementNumber) : undefined);
      const params = new URLSearchParams();
      params.set('meterId', String(meterId));
      params.set('elementId', String(elementId));
      if (elementName) params.set('elementName', elementName);
      if (elementNumber) params.set('elementNumber', String(elementNumber));
      if (gridType) params.set('gridType', gridType);
      navigateToMeterReadings(params);
    },
    [setSelectedMeter, setSelectedElement, navigateToMeterReadings]
  );

  // Callback for the Favorites section — highlights "Favorites" menu item
  const handleFavoritesMeterElementSelect = useCallback(
    (meterId: string, elementId: string, elementName?: string, elementNumber?: number, gridType?: 'simple' | 'baselist') => {
      setActiveSection('favorites');
      setSelectedMeter(String(meterId));
      setSelectedElement(String(elementId), elementName, elementNumber ? Number(elementNumber) : undefined);
      const params = new URLSearchParams();
      params.set('meterId', String(meterId));
      params.set('elementId', String(elementId));
      if (elementName) params.set('elementName', elementName);
      if (elementNumber) params.set('elementNumber', String(elementNumber));
      if (gridType) params.set('gridType', gridType);
      navigateToMeterReadings(params);
    },
    [setSelectedMeter, setSelectedElement, navigateToMeterReadings]
  );

  const menuItems: MenuItem[] = staticMenuItems.map(item => {
    if (item.id === 'favorites') {
      return {
        ...item,
        isActive: activeSection === 'favorites',
        content: user ? (
          <MemoizedSidebarMetersSection
            tenantId={user.client || '1'}
            userId={user.users_id || '1'}
            mode='favorites'
            onMeterSelect={handleMeterSelect}
            onMeterElementSelect={handleFavoritesMeterElementSelect}
          />
        ) : undefined,
      };
    }
    if (item.id === 'meter-readings') {
      return {
        ...item,
        isActive: activeSection === 'meters' || (activeSection === null && location.pathname === '/meter-readings'),
        content: user ? (
          <MemoizedSidebarMetersSection
            tenantId={user.client || '1'}
            userId={user.users_id || '1'}
            mode='meters'
            onMeterSelect={handleMeterSelect}
            onMeterElementSelect={handleMeterElementSelect}
          />
        ) : undefined,
      };
    }
    return item;
  });

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
    sidebarDefaultExpanded: [],
  };

  if (!user) return <AppLayout {...props} config={config} />;

  return (
    <SidebarDataProvider tenantId={user.client || '1'} userId={user.users_id || '1'}>
      <AppLayout {...props} config={config} />
    </SidebarDataProvider>
  );
};

// Export as default for backward compatibility
export default AppLayoutWrapper;
