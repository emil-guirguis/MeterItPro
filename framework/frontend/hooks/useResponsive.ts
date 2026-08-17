import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Responsive Hook Result
 */
export interface UseResponsiveResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'large';
  showSidebarInHeader: boolean;
  sidebarBreakpoint: number;
  currentWidth: number;
}

// Breakpoint values (in pixels)
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440
} as const;

// Sidebar-specific breakpoint for when to show sidebar elements in header
const SIDEBAR_BREAKPOINT = 1024;

// Optimized debounce utility with immediate execution option
const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    // If enough time has passed, execute immediately for better responsiveness
    if (timeSinceLastCall >= wait) {
      lastCallTime = now;
      func(...args);
    } else {
      timeout = setTimeout(() => {
        lastCallTime = Date.now();
        timeout = null;
        func(...args);
      }, wait - timeSinceLastCall);
    }
    
    if (callNow) {
      lastCallTime = now;
      func(...args);
    }
  };
};

// Memoized state comparison function for better performance
const isStateEqual = (
  prevState: UseResponsiveResult,
  newState: UseResponsiveResult
): boolean => {
  return (
    prevState.isMobile === newState.isMobile &&
    prevState.isTablet === newState.isTablet &&
    prevState.isDesktop === newState.isDesktop &&
    prevState.isLarge === newState.isLarge &&
    prevState.showSidebarInHeader === newState.showSidebarInHeader &&
    prevState.currentWidth === newState.currentWidth
  );
};

/**
 * Hook for responsive design that tracks window size and provides breakpoint information
 */
export const useResponsive = (): UseResponsiveResult => {
  const [state, setState] = useState(() => {
    const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const initialHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
    
    return {
      width: initialWidth,
      height: initialHeight,
      isMobile: initialWidth < BREAKPOINTS.mobile,
      isTablet: initialWidth >= BREAKPOINTS.mobile && initialWidth < BREAKPOINTS.tablet,
      isDesktop: initialWidth >= BREAKPOINTS.tablet && initialWidth < BREAKPOINTS.desktop,
      isLarge: initialWidth >= BREAKPOINTS.desktop,
      showSidebarInHeader: initialWidth < SIDEBAR_BREAKPOINT,
      sidebarBreakpoint: SIDEBAR_BREAKPOINT,
      currentWidth: initialWidth
    };
  });

  const rafRef = useRef<number | undefined>(undefined);

  const calculateResponsiveState = useCallback((width: number, height: number) => {
    const isMobile = width < BREAKPOINTS.mobile;
    const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
    const isDesktop = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
    const isLarge = width >= BREAKPOINTS.desktop;
    const showSidebarInHeader = width < SIDEBAR_BREAKPOINT;

    return {
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      isLarge,
      showSidebarInHeader,
      sidebarBreakpoint: SIDEBAR_BREAKPOINT,
      currentWidth: width
    };
  }, []);

  const handleResize = useCallback(() => {
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use requestAnimationFrame for smooth updates with high priority
    rafRef.current = requestAnimationFrame(() => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      setState(prevState => {
        const newState = calculateResponsiveState(newWidth, newHeight);
        
        // Use optimized state comparison to prevent unnecessary re-renders
        const currentResult: UseResponsiveResult = {
          isMobile: prevState.isMobile,
          isTablet: prevState.isTablet,
          isDesktop: prevState.isDesktop,
          isLarge: prevState.isLarge,
          breakpoint: prevState.isMobile ? 'mobile' : prevState.isTablet ? 'tablet' : prevState.isDesktop ? 'desktop' : 'large',
          showSidebarInHeader: prevState.showSidebarInHeader,
          sidebarBreakpoint: prevState.sidebarBreakpoint,
          currentWidth: prevState.currentWidth
        };
        
        const newResult: UseResponsiveResult = {
          isMobile: newState.isMobile,
          isTablet: newState.isTablet,
          isDesktop: newState.isDesktop,
          isLarge: newState.isLarge,
          breakpoint: newState.isMobile ? 'mobile' : newState.isTablet ? 'tablet' : newState.isDesktop ? 'desktop' : 'large',
          showSidebarInHeader: newState.showSidebarInHeader,
          sidebarBreakpoint: newState.sidebarBreakpoint,
          currentWidth: newState.currentWidth
        };
        
        if (isStateEqual(currentResult, newResult)) {
          return prevState;
        }
        
        return newState;
      });
    });
  }, [calculateResponsiveState]);

  // Create optimized debounced resize handler with immediate execution for first call
  const debouncedHandleResize = useMemo(
    () => debounce(handleResize, 100, true),
    [handleResize]
  );

  useEffect(() => {
    // Set initial state
    handleResize();

    // Add event listener with passive option and capture for better performance
    const options = { passive: true, capture: false };
    window.addEventListener('resize', debouncedHandleResize, options as any);

    // Also listen for orientation changes on mobile devices
    const handleOrientationChange = () => {
      // Small delay to ensure viewport has updated
      setTimeout(handleResize, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange, options as any);

    const handleFullscreenChange = () => {
      setTimeout(handleResize, 100);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [debouncedHandleResize, handleResize]);

  // Memoize breakpoint calculation for better performance
  const breakpoint = useMemo((): 'mobile' | 'tablet' | 'desktop' | 'large' => {
    if (state.isMobile) return 'mobile';
    if (state.isTablet) return 'tablet';
    if (state.isDesktop) return 'desktop';
    return 'large';
  }, [state.isMobile, state.isTablet, state.isDesktop]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    isMobile: state.isMobile,
    isTablet: state.isTablet,
    isDesktop: state.isDesktop,
    isLarge: state.isLarge,
    breakpoint,
    showSidebarInHeader: state.showSidebarInHeader,
    sidebarBreakpoint: state.sidebarBreakpoint,
    currentWidth: state.currentWidth
  }), [
    state.isMobile,
    state.isTablet,
    state.isDesktop,
    state.isLarge,
    breakpoint,
    state.showSidebarInHeader,
    state.sidebarBreakpoint,
    state.currentWidth
  ]);
};

/**
 * Optimized hook for specific media queries with memoization
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    
    // Set initial value if it changed
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Create optimized listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Use modern addEventListener (supported in all modern browsers)
    media.addEventListener('change', listener);

    // Cleanup
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};

/**
 * Predefined breakpoint hooks
 */
export const useIsMobile = (): boolean => {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
};

export const useIsTablet = (): boolean => {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`);
};

export const useIsDesktop = (): boolean => {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.tablet}px)`);
};

export const useIsLarge = (): boolean => {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);
};

/**
 * Hook for touch device detection
 */
export const useIsTouchDevice = (): boolean => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - for older browsers
        navigator.msMaxTouchPoints > 0
      );
    };

    setIsTouchDevice(checkTouchDevice());
  }, []);

  return isTouchDevice;
};
