import React from 'react';
import { AppLayout } from '@meterit/framework-frontend/layout';
import type { LayoutProps, MenuItem, AppLayoutConfig } from '@meterit/framework-frontend/layout';
import { registerIconMappings } from '@meterit/framework-frontend/utils/iconHelper';
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '@meterit/framework-frontend/hooks/useResponsive';
import { useUI } from '../store/slices/uiSlice';

const supportIconMappings = {
  support_tickets: 'confirmation_number',
  support_devices: 'devices',
};

let iconsRegistered = false;
if (!iconsRegistered) {
  registerIconMappings(supportIconMappings);
  iconsRegistered = true;
}

const adminMenuItems: MenuItem[] = [
  { id: 'support-tickets', label: 'Tickets',  icon: 'support_tickets', path: '/support/tickets' },
  { id: 'support-devices', label: 'Devices',  icon: 'support_devices', path: '/support/devices' },
];

const viewerMenuItems: MenuItem[] = [
  { id: 'support-tickets', label: 'Tickets', icon: 'support_tickets', path: '/support/tickets' },
];

const SupportLayoutWrapper: React.FC<LayoutProps> = (props) => {
  const { user, logout: authLogout } = useAuth();
  const responsive = useResponsive();
  const uiState = useUI();
  const isAdminSupport = user?.is_support_admin === true;

  const logout = () => {
    authLogout();
    window.location.href = '/support/login';
  };

  const config: AppLayoutConfig = {
    menuItems: isAdminSupport ? adminMenuItems : viewerMenuItems,
    sidebarBrand: { icon: '🎫', text: 'MeterIt Support' },
    user: user ? { name: user.name, email: user.email } : undefined,
    onLogout: logout,
    checkPermission: () => true,
    responsive,
    uiState,
    sidebarDefaultExpanded: [],
  };

  return <AppLayout {...props} config={config} />;
};

export default SupportLayoutWrapper;
