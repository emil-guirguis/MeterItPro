import { useCallback, type ReactNode } from 'react';
import { AppLayout } from '@meterit/framework-frontend/layout';
import type { MenuItem, AppLayoutConfig } from '@meterit/framework-frontend/layout';
import { useResponsive } from '@meterit/framework-frontend/hooks/useResponsive';
import { registerIconMappings } from '@meterit/framework-frontend/utils/iconHelper';
import { useUI } from '../../store/slices/uiSlice';
import { useAuth } from '../../hooks/useAuth';

registerIconMappings({
  dashboard: 'dashboard',
  users: 'people',
  orders: 'table_chart',
  quotes: 'request_quote',
  inventory: 'inventory_2',
  customers: 'contacts',
});

const NAV: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
  { id: 'quotes', label: 'Quotes', icon: 'quotes', path: '/quotes' },
  { id: 'orders', label: 'Orders', icon: 'orders', path: '/orders' },
  { id: 'inventory', label: 'Inventory', icon: 'inventory', path: '/inventory', requiredPermission: 'admin' },
  { id: 'customers', label: 'Customers', icon: 'customers', path: '/customers', requiredPermission: 'admin' },
  { id: 'users', label: 'Users', icon: 'users', path: '/users', requiredPermission: 'admin' },
];

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/quotes')) return 'Quotes';
  if (pathname.startsWith('/orders')) return 'Orders';
  if (pathname.startsWith('/inventory')) return 'Inventory';
  if (pathname.startsWith('/customers')) return 'Customers';
  if (pathname.startsWith('/users')) return 'Users';
  return 'Dashboard';
}

export default function AppLayoutWrapper({ children }: { children: ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const responsive = useResponsive();
  const ui = useUI();

  const checkPermission = useCallback(
    (permission?: string) => (permission === 'admin' ? isAdmin : true),
    [isAdmin]
  );

  const config: AppLayoutConfig = {
    menuItems: NAV,
    sidebarBrand: { icon: 'dashboard', text: 'TBWC' },
    user: { name: user?.name || user?.email || 'User', email: user?.email ?? '' },
    onLogout: logout,
    checkPermission,
    responsive: {
      isMobile: responsive.isMobile,
      isTablet: responsive.isTablet,
      isDesktop: responsive.isDesktop,
      showSidebarInHeader: responsive.showSidebarInHeader,
    },
    uiState: {
      sidebarCollapsed: ui.sidebarCollapsed,
      setSidebarCollapsed: ui.setSidebarCollapsed,
      mobileNavOpen: ui.mobileNavOpen,
      setMobileNavOpen: ui.setMobileNavOpen,
    },
    getPageTitle,
  };

  return <AppLayout config={config}>{children}</AppLayout>;
}
