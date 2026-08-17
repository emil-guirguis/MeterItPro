/**
 * Client Layout Components
 * 
 * Re-exports framework layout components and client-specific wrappers.
 */

// Export framework layout components
export { 
  AppLayout, 
  Header, 
  Sidebar, 
  MobileNav, 
  Breadcrumb,
  HamburgerIcon 
} from '@meterit/framework-frontend/layout';

// Export types
export type { 
  AppLayoutConfig, 
  AppLayoutProps,
  LayoutProps,
  MenuItem,
  BreadcrumbItem,
  HeaderProps,
  SidebarProps
} from '@meterit/framework-frontend/layout';

// Export client-specific wrapper
export { AppLayoutWrapper } from './AppLayoutWrapper';
export { default } from './AppLayoutWrapper';