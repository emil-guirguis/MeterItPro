import React from 'react';
import { AppLayout } from '@framework/layout';
import type { LayoutProps, MenuItem, AppLayoutConfig } from '@framework/layout';
import { registerIconMappings } from '@framework/utils/iconHelper';
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '@framework/hooks/useResponsive';
import { useUI } from '../store/slices/uiSlice';

const adminIconMappings = {
  admin_dashboard: 'dashboard',
  clients: 'business',
  financials: 'account_balance',
  admin_reports: 'assessment',
  admin_users: 'people',
  admin_costs: 'payments',
  admin_devices: 'devices',
};

let iconsRegistered = false;
if (!iconsRegistered) {
  registerIconMappings(adminIconMappings);
  iconsRegistered = true;
}

const adminMenuItems: MenuItem[] = [
  {
    id: 'admin-dashboard',
    label: 'Dashboard',
    icon: 'admin_dashboard',
    path: '/admin/dashboard',
  },
  {
    id: 'admin-clients',
    label: 'Clients',
    icon: 'clients',
    path: '/admin/clients',
  },
  {
    id: 'admin-financials',
    label: 'Financials',
    icon: 'financials',
    path: '/admin/financials',
  },
  {
    id: 'admin-reports',
    label: 'Reports',
    icon: 'admin_reports',
    path: '/admin/reports',
  },
  {
    id: 'admin-devices',
    label: 'Devices',
    icon: 'admin_devices',
    path: '/admin/devices',
  },
    {
    id: 'admin-costs',
    label: 'Costs',
    icon: 'admin_costs',
    path: '/admin/costs',
  },
    {
    id: 'admin-users',
    label: 'Users',
    icon: 'admin_users',
    path: '/admin/users',
  },
];

const AdminLayoutWrapper: React.FC<LayoutProps> = (props) => {
  const { user, logout: authLogout } = useAuth();
  const responsive = useResponsive();
  const uiState = useUI();

  const logout = () => {
    authLogout();
    window.location.href = '/admin/login';
  };

  const config: AppLayoutConfig = {
    menuItems: adminMenuItems,
    sidebarBrand: {
      icon: '🛡️',
      text: 'MeterIt Admin',
    },
    user: user ? { name: user.name, email: user.email } : undefined,
    onLogout: logout,
    checkPermission: () => true,
    responsive,
    uiState,
    sidebarDefaultExpanded: [],
  };

  return <AppLayout {...props} config={config} />;
};

export default AdminLayoutWrapper;
