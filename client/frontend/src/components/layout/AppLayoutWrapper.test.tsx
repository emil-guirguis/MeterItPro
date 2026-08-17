/**
 * Unit Tests for AppLayoutWrapper
 * 
 * Feature: meter-readings-grid-loading
 * Task 3.1: Verify that context updates are synchronous and available immediately after navigation
 * 
 * Validates: Requirements 1.2, 1.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useEffect, useState } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayoutWrapper } from './AppLayoutWrapper';
import { MeterSelectionProvider, useMeterSelection } from '../../contexts/MeterSelectionContext';
import { useAuth } from '../../hooks/useAuth';

// Mock the hooks
vi.mock('../../hooks/useAuth');
vi.mock('../../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));
vi.mock('../../store/slices/uiSlice', () => ({
  useUI: () => ({
    sidebarOpen: true,
  }),
}));
vi.mock('../../hooks/usePageTitle', () => ({
  usePageTitle: () => 'Test Page',
}));
vi.mock('../../utils/navigationUtils', () => ({
  generateBreadcrumbs: () => [],
  getPageTitle: () => 'Test Page',
}));

// Mock the framework AppLayout component
vi.mock('@meterit/framework-frontend/layout', () => ({
  AppLayout: ({ config, children }: any) => {
    const meterReadingsItem = config.menuItems?.find((item: any) => item.id === 'meter-readings');
    return (
      <div data-testid="app-layout">
        <div data-testid="sidebar-content">
          {meterReadingsItem?.content}
        </div>
        <div data-testid="main-content">{children}</div>
      </div>
    );
  },
}));

// Mock the SidebarMetersSection component
vi.mock('../sidebar-meters', () => ({
  SidebarMetersSection: ({ onMeterElementSelect }: any) => (
    <div data-testid="sidebar-meters">
      <button
        data-testid="meter-element-button"
        onClick={() => onMeterElementSelect('meter-123', 'element-456')}
      >
        Select Meter Element
      </button>
    </div>
  ),
}));

// Test component that captures context values at navigation time
const MeterReadingsTestPage: React.FC = () => {
  const { selectedMeter, selectedElement } = useMeterSelection();
  const [capturedValues, setCapturedValues] = useState<{
    meter: string | null;
    element: string | null;
  } | null>(null);

  useEffect(() => {
    // Capture context values when component mounts
    setCapturedValues({
      meter: selectedMeter,
      element: selectedElement,
    });
  }, [selectedMeter, selectedElement]);

  return (
    <div data-testid="meter-readings-page">
      <div data-testid="selected-meter">{capturedValues?.meter || 'none'}</div>
      <div data-testid="selected-element">{capturedValues?.element || 'none'}</div>
    </div>
  );
};

describe('AppLayoutWrapper - Context Synchronization', () => {
  beforeEach(() => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: {
        users_id: '1',
        name: 'Test User',
        email: 'test@example.com',
        client: '1',
      },
      logout: vi.fn(),
      checkPermission: vi.fn(() => true),
      isAuthenticated: true,
      isLoading: false,
      error: null,
    } as any);
  });

  it('should update context synchronously before navigation', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <MeterSelectionProvider>
          <Routes>
            <Route path="/" element={<AppLayoutWrapper><div /></AppLayoutWrapper>} />
            <Route path="/meter-readings" element={<MeterReadingsTestPage />} />
          </Routes>
        </MeterSelectionProvider>
      </MemoryRouter>
    );

    // Find and click the meter element button
    const button = screen.getByTestId('meter-element-button');
    await user.click(button);

    // Wait for navigation and verify context values are set
    const selectedMeterElement = await screen.findByTestId('selected-meter');
    const selectedElementElement = await screen.findByTestId('selected-element');

    expect(selectedMeterElement).toHaveTextContent('meter-123');
    expect(selectedElementElement).toHaveTextContent('element-456');
  });

  it('should set selectedMeter before navigation occurs', async () => {
    const user = userEvent.setup();
    let navigationOccurred = false;
    let contextValueAtNavigation: { meter: string | null; element: string | null } = {
      meter: null,
      element: null,
    };

    render(
      <MemoryRouter initialEntries={['/']}>
        <MeterSelectionProvider>
          <Routes>
            <Route path="/" element={<AppLayoutWrapper><div /></AppLayoutWrapper>} />
            <Route
              path="/meter-readings"
              element={
                <div>
                  <ContextCapture
                    onCapture={(values) => {
                      navigationOccurred = true;
                      contextValueAtNavigation = values;
                    }}
                  />
                </div>
              }
            />
          </Routes>
        </MeterSelectionProvider>
      </MemoryRouter>
    );

    const button = screen.getByTestId('meter-element-button');
    await user.click(button);

    // Verify navigation occurred and context was set
    await screen.findByTestId('context-capture');
    expect(navigationOccurred).toBe(true);
    expect(contextValueAtNavigation.meter).toBe('meter-123');
    expect(contextValueAtNavigation.element).toBe('element-456');
  });
});

// Helper component to capture context values
const ContextCapture: React.FC<{
  onCapture: (values: { meter: string | null; element: string | null }) => void;
}> = ({ onCapture }) => {
  const { selectedMeter, selectedElement } = useMeterSelection();

  useEffect(() => {
    onCapture({
      meter: selectedMeter,
      element: selectedElement,
    });
  }, [selectedMeter, selectedElement, onCapture]);

  return <div data-testid="context-capture" />;
};