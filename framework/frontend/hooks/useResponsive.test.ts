import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsive } from './useResponsive';

const setWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
};

describe('useResponsive — breakpoint classification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('classifies < 768 as mobile', () => {
    setWindowWidth(767);
    const { result } = renderHook(() => useResponsive());
    act(() => { vi.runAllTimers(); });
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isLarge).toBe(false);
    expect(result.current.breakpoint).toBe('mobile');
  });

  it('classifies 768 as tablet (lower boundary)', () => {
    setWindowWidth(768);
    const { result } = renderHook(() => useResponsive());
    act(() => { vi.runAllTimers(); });
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.breakpoint).toBe('tablet');
  });

  it('classifies 1023 as tablet (upper boundary)', () => {
    setWindowWidth(1023);
    const { result } = renderHook(() => useResponsive());
    act(() => { vi.runAllTimers(); });
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('classifies 1024 as desktop (lower boundary)', () => {
    setWindowWidth(1024);
    const { result } = renderHook(() => useResponsive());
    act(() => { vi.runAllTimers(); });
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.breakpoint).toBe('desktop');
  });

  it('classifies 1439 as desktop (upper boundary)', () => {
    setWindowWidth(1439);
    const { result } = renderHook(() => useResponsive());
    act(() => { vi.runAllTimers(); });
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isLarge).toBe(false);
  });

  it('classifies 1440 as large (lower boundary)', () => {
    setWindowWidth(1440);
    const { result } = renderHook(() => useResponsive());
    act(() => { vi.runAllTimers(); });
    expect(result.current.isLarge).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.breakpoint).toBe('large');
  });
});

describe('useResponsive — showSidebarInHeader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is true below 1024', () => {
    setWindowWidth(1023);
    const { result } = renderHook(() => useResponsive());
    act(() => { vi.runAllTimers(); });
    expect(result.current.showSidebarInHeader).toBe(true);
  });

  it('is false at 1024', () => {
    setWindowWidth(1024);
    const { result } = renderHook(() => useResponsive());
    act(() => { vi.runAllTimers(); });
    expect(result.current.showSidebarInHeader).toBe(false);
  });

  it('exposes sidebarBreakpoint as 1024', () => {
    setWindowWidth(1200);
    const { result } = renderHook(() => useResponsive());
    expect(result.current.sidebarBreakpoint).toBe(1024);
  });
});

describe('useResponsive — currentWidth', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reflects window.innerWidth', () => {
    setWindowWidth(1280);
    const { result } = renderHook(() => useResponsive());
    act(() => { vi.runAllTimers(); });
    expect(result.current.currentWidth).toBe(1280);
  });

  it('updates on resize', () => {
    setWindowWidth(800);
    const { result } = renderHook(() => useResponsive());
    act(() => { vi.runAllTimers(); });
    expect(result.current.isTablet).toBe(true);

    act(() => {
      setWindowWidth(400);
      vi.runAllTimers();
    });
    expect(result.current.isMobile).toBe(true);
    expect(result.current.currentWidth).toBe(400);
  });
});
