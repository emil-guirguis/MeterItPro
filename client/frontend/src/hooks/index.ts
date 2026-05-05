// Export all custom hooks from this file
export { useAuth } from './useAuth';
export {
  useResponsive,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsLarge,
  useIsTouchDevice
} from '@framework/hooks/useResponsive';
export { 
  useResponsiveSync,
  useResponsiveTransition,
  useResponsiveLayoutStability
} from './useResponsiveSync';
export { 
  usePageTitle, 
  useDynamicPageTitle 
} from './usePageTitle';
