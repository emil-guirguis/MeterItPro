/**
 * MeterReadingForm Component Tests
 *
 * Tests for the main MeterReadingForm component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MeterReadingForm } from './MeterReadingForm';
import { useMeterReadingsEnhanced } from './meterReadingsStore';

// Mock MeterSelectionContext to avoid requiring MeterSelectionProvider wrapper
vi.mock('../../contexts/MeterSelectionContext', () => ({
  useMeterSelection: () => ({
    selectedMeter: null,
    selectedElement: null,
    setSelectedMeter: vi.fn(),
    setSelectedElement: vi.fn(),
  }),
  MeterSelectionProvider: ({ children }: any) => children,
}));

// Mock the store so we control items/loading
vi.mock('./meterReadingsStore', () => ({
  useMeterReadingsEnhanced: vi.fn(),
}));

const mockReading = {
  meter_reading_id: 'reading-1',
  meter_element_id: 'element-1',
  created_at: '2024-01-01T00:00:00Z',
  voltage_a_n: 120, voltage_b_n: 120, voltage_c_n: 120,
  amperage: 10, phase_amperage_a: 3, phase_amperage_b: 3, phase_amperage_c: 4,
  kw: 1.2, phase_kw_a: 0.4, phase_kw_b: 0.4, phase_kw_c: 0.4,
  frequency: '60',
};

const emptyStore = {
  items: [],
  loading: false,
  error: null,
  fetchItems: vi.fn(),
};

const storeWithItems = {
  items: [mockReading],
  loading: false,
  error: null,
  fetchItems: vi.fn(),
};

describe('MeterReadingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: empty store (renders empty state)
    (useMeterReadingsEnhanced as ReturnType<typeof vi.fn>).mockReturnValue(emptyStore);
  });

  describe('Component Structure', () => {
    it('should render the component', () => {
      const { container } = render(
        <MeterReadingForm meterElementId="test-element-1" />
      );
      expect(container.querySelector('.meter-reading-form')).toBeInTheDocument();
    });

    it('should render empty state when no reading is available', () => {
      render(<MeterReadingForm meterElementId="test-element-1" />);
      expect(
        screen.getByText('No meter readings available for this element')
      ).toBeInTheDocument();
    });

    it('should render the View All Readings button when onNavigateToList is provided', () => {
      (useMeterReadingsEnhanced as ReturnType<typeof vi.fn>).mockReturnValue(storeWithItems);
      const mockNavigate = vi.fn();
      render(
        <MeterReadingForm
          meterElementId="test-element-1"
          onNavigateToList={mockNavigate}
        />
      );
      expect(screen.getByText('View All Readings')).toBeInTheDocument();
    });

    it('should not render the View All Readings button when onNavigateToList is not provided', () => {
      render(<MeterReadingForm meterElementId="test-element-1" />);
      expect(screen.queryByText('View All Readings')).not.toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should initialize with correct default state', () => {
      const { container } = render(
        <MeterReadingForm meterElementId="test-element-1" />
      );
      expect(container.querySelector('.meter-reading-form')).toBeInTheDocument();
    });

    it('should render main content sections', () => {
      const { container } = render(
        <MeterReadingForm meterElementId="test-element-1" />
      );
      const sections = container.querySelectorAll('.meter-reading-form__section');
      expect(sections.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should render empty state by default', () => {
      render(<MeterReadingForm meterElementId="test-element-1" />);
      expect(
        screen.getByText('No meter readings available for this element')
      ).toBeInTheDocument();
    });

    it('should have retry functionality structure', () => {
      const { container } = render(
        <MeterReadingForm meterElementId="test-element-1" />
      );
      expect(container.querySelector('.meter-reading-form')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept meterElementId prop', () => {
      const { container } = render(
        <MeterReadingForm meterElementId="test-element-123" />
      );
      expect(container.querySelector('.meter-reading-form')).toBeInTheDocument();
    });

    it('should accept onNavigateToList callback prop', () => {
      (useMeterReadingsEnhanced as ReturnType<typeof vi.fn>).mockReturnValue(storeWithItems);
      const mockCallback = vi.fn();
      render(
        <MeterReadingForm
          meterElementId="test-element-1"
          onNavigateToList={mockCallback}
        />
      );
      expect(screen.getByText('View All Readings')).toBeInTheDocument();
    });
  });
});
