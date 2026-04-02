import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsive } from '../../../hooks/useResponsive';

// Mock window dimensions
const mockWindowDimensions = (width: number, height: number = 768) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
};

describe('Simple Responsive Tests', () => {
  beforeEach(() => {
    // Reset to desktop size
    mockWindowDimensions(1200);
  });

  it('should detect desktop breakpoint correctly', () => {
    mockWindowDimensions(1200);
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.breakpoint).toBe('desktop');
  });

  it('should detect tablet breakpoint correctly', () => {
    mockWindowDimensions(800);
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.breakpoint).toBe('tablet');
  });

  it('should detect mobile breakpoint correctly', () => {
    mockWindowDimensions(400);
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.breakpoint).toBe('mobile');
  });

  it('should show sidebar in header on tablet and mobile', () => {
    // Test tablet
    mockWindowDimensions(800);
    const { result: tabletResult } = renderHook(() => useResponsive());
    expect(tabletResult.current.showSidebarInHeader).toBe(true);
    
    // Test mobile
    mockWindowDimensions(400);
    const { result: mobileResult } = renderHook(() => useResponsive());
    expect(mobileResult.current.showSidebarInHeader).toBe(true);
  });

  it('should not show sidebar in header on desktop', () => {
    mockWindowDimensions(1200);
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.showSidebarInHeader).toBe(false);
  });

  it('should update current width correctly', () => {
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.currentWidth).toBe(1200);
  });
});

describe('Responsive Behavior Validation', () => {
  it('should pass all breakpoint tests', () => {
    const testCases = [
      { width: 1200, expected: { isDesktop: true, showSidebarInHeader: false, breakpoint: 'desktop' } },
      { width: 800, expected: { isTablet: true, showSidebarInHeader: true, breakpoint: 'tablet' } },
      { width: 400, expected: { isMobile: true, showSidebarInHeader: true, breakpoint: 'mobile' } },
    ];

    testCases.forEach(({ width, expected }) => {
      mockWindowDimensions(width);
      const { result } = renderHook(() => useResponsive());
      
      if (expected.isDesktop) {
        expect(result.current.isDesktop).toBe(true);
      }
      if (expected.isTablet) {
        expect(result.current.isTablet).toBe(true);
      }
      if (expected.isMobile) {
        expect(result.current.isMobile).toBe(true);
      }
      
      expect(result.current.showSidebarInHeader).toBe(expected.showSidebarInHeader);
      expect(result.current.breakpoint).toBe(expected.breakpoint);
    });
  });
});