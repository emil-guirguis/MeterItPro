import { useEffect, useCallback, useRef } from 'react';
import { useResponsive } from '@framework/hooks/useResponsive';
import { useUI } from '../store/slices/uiSlice';

/**
 * Hook for synchronizing responsive state between useResponsive and UI store
 * Handles state transitions during screen size changes and prevents layout jumps
 */
export const useResponsiveSync = () => {
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    showSidebarInHeader,
    breakpoint 
  } = useResponsive();
  
  const { 
    showSidebarInHeader: storeShowSidebarInHeader,
    lastBreakpoint,
    isTransitioning,
    setShowSidebarInHeader,
    setTransitioning,
    updateBreakpoint,
    setScreenSize
  } = useUI();

  // Track previous values to detect changes
  const prevBreakpointRef = useRef(breakpoint);
  const prevShowSidebarInHeaderRef = useRef(showSidebarInHeader);
  const transitionTimeoutRef = useRef<number | null>(null);

  // Sync screen size with UI store
  useEffect(() => {
    setScreenSize(isMobile, isTablet, isDesktop);
  }, [isMobile, isTablet, isDesktop, setScreenSize]);

  // Handle breakpoint changes with transition management
  const handleBreakpointChange = useCallback(() => {
    const prevBreakpoint = prevBreakpointRef.current;
    const currentBreakpoint = breakpoint;
    
    // Only proceed if breakpoint actually changed
    if (prevBreakpoint === currentBreakpoint) {
      return;
    }

    // Clear any existing transition timeout
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }

    // Start transition
    setTransitioning(true);
    
    // Update breakpoint in store (map 'large' to 'desktop' for store compatibility)
    const storeBreakpoint = currentBreakpoint === 'large' ? 'desktop' : currentBreakpoint;
    updateBreakpoint(storeBreakpoint);
    
    // Update refs
    prevBreakpointRef.current = currentBreakpoint;
    
    // End transition after animation duration
    transitionTimeoutRef.current = window.setTimeout(() => {
      setTransitioning(false);
      transitionTimeoutRef.current = null;
    }, 300); // Match animation duration from design
    
  }, [breakpoint, setTransitioning, updateBreakpoint]);

  // Handle sidebar header visibility changes
  const handleSidebarHeaderVisibilityChange = useCallback(() => {
    const prevShowSidebarInHeader = prevShowSidebarInHeaderRef.current;
    const currentShowSidebarInHeader = showSidebarInHeader;
    
    // Only proceed if visibility actually changed
    if (prevShowSidebarInHeader === currentShowSidebarInHeader) {
      return;
    }

    // Update store state if it's different
    if (storeShowSidebarInHeader !== currentShowSidebarInHeader) {
      setShowSidebarInHeader(currentShowSidebarInHeader);
    }
    
    // Update ref
    prevShowSidebarInHeaderRef.current = currentShowSidebarInHeader;
    
  }, [showSidebarInHeader, storeShowSidebarInHeader, setShowSidebarInHeader]);

  // Effect for breakpoint changes
  useEffect(() => {
    handleBreakpointChange();
  }, [handleBreakpointChange]);

  // Effect for sidebar header visibility changes
  useEffect(() => {
    handleSidebarHeaderVisibilityChange();
  }, [handleSidebarHeaderVisibilityChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // Return current state for components that need it
  return {
    // Current responsive state
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
    showSidebarInHeader,
    
    // Transition state
    isTransitioning,
    lastBreakpoint,
    
    // Computed state
    isBreakpointChanging: prevBreakpointRef.current !== breakpoint,
    isSidebarHeaderVisibilityChanging: prevShowSidebarInHeaderRef.current !== showSidebarInHeader,
  };
};

/**
 * Hook for components that need to react to responsive state changes
 * with transition awareness
 */
export const useResponsiveTransition = () => {
  const { 
    isTransitioning,
    lastBreakpoint,
    showSidebarInHeader,
    headerLayout 
  } = useUI();
  
  const { breakpoint } = useResponsive();

  return {
    isTransitioning,
    fromBreakpoint: lastBreakpoint,
    toBreakpoint: breakpoint,
    showSidebarInHeader,
    headerLayout,
    
    // Helper functions
    isTransitioningTo: (targetBreakpoint: 'mobile' | 'tablet' | 'desktop') => 
      isTransitioning && breakpoint === targetBreakpoint,
    
    isTransitioningFrom: (sourceBreakpoint: 'mobile' | 'tablet' | 'desktop') => 
      isTransitioning && lastBreakpoint === sourceBreakpoint,
    
    isTransitioningBetween: (
      from: 'mobile' | 'tablet' | 'desktop', 
      to: 'mobile' | 'tablet' | 'desktop'
    ) => isTransitioning && lastBreakpoint === from && breakpoint === to,
  };
};

/**
 * Hook for preventing layout jumps during responsive transitions
 * Returns CSS classes and styles for smooth transitions
 */
export const useResponsiveLayoutStability = () => {
  const { isTransitioning, showSidebarInHeader } = useUI();
  const { breakpoint } = useResponsive();

  // Generate CSS classes for transition states
  const getTransitionClasses = useCallback(() => {
    const classes: string[] = [];
    
    if (isTransitioning) {
      classes.push('responsive-transitioning');
    }
    
    if (showSidebarInHeader) {
      classes.push('sidebar-in-header');
    }
    
    classes.push(`breakpoint-${breakpoint}`);
    
    return classes.join(' ');
  }, [isTransitioning, showSidebarInHeader, breakpoint]);

  // Generate inline styles for layout stability
  const getStabilityStyles = useCallback(() => {
    const styles: React.CSSProperties = {};
    
    if (isTransitioning) {
      // Prevent layout shifts during transitions
      styles.willChange = 'transform, opacity';
      styles.transition = 'all 0.3s ease-in-out';
    }
    
    return styles;
  }, [isTransitioning]);

  return {
    transitionClasses: getTransitionClasses(),
    stabilityStyles: getStabilityStyles(),
    isTransitioning,
    showSidebarInHeader,
    breakpoint,
  };
};

export default useResponsiveSync;