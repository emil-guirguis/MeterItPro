/**
 * MeterInfoPanel Component Tests
 * 
 * Unit tests for the MeterInfoPanel component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MeterInfoPanel } from './MeterInfoPanel';
import type { Meter, MeterReading } from './types';

/**
 * Helper function to create a mock Meter object
 */
const createMockMeter = (overrides?: Partial<Meter>): Meter => ({
  id: 'meter-1',
  driver: 'John Doe',
  description: 'Main Building Meter',
  serialNumber: 'SN-12345-67890',
  elements: [],
  ...overrides,
});

/**
 * Helper function to create a mock MeterReading object
 */
const createMockReading = (
  overrides?: Partial<MeterReading>
): MeterReading => ({
  id: 'reading-1',
  meterElementId: 'element-1',
  timestamp: new Date('2024-01-15T10:30:00Z'),
  frequency: 50,
  sections: {},
  ...overrides,
});

describe('MeterInfoPanel', () => {
  describe('Component Rendering', () => {
    it('should render the component', () => {
      const meter = createMockMeter();
      const reading = createMockReading();

      const { container } = render(
        <MeterInfoPanel meter={meter} reading={reading} />
      );

      expect(container.querySelector('.meter-info-panel')).toBeInTheDocument();
    });

    it('should render the grid container', () => {
      const meter = createMockMeter();
      const reading = createMockReading();

      const { container } = render(
        <MeterInfoPanel meter={meter} reading={reading} />
      );

      expect(
        container.querySelector('.meter-info-panel__grid')
      ).toBeInTheDocument();
    });

    it('should render four information items', () => {
      const meter = createMockMeter();
      const reading = createMockReading();

      const { container } = render(
        <MeterInfoPanel meter={meter} reading={reading} />
      );

      const items = container.querySelectorAll('.meter-info-panel__item');
      expect(items.length).toBe(4);
    });
  });

  describe('Driver Name Display', () => {
    it('should display the driver name', () => {
      const meter = createMockMeter({ driver: 'John Doe' });
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display placeholder text when driver is empty string', () => {
      const meter = createMockMeter({ driver: '' });
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should display placeholder text when driver is null', () => {
      const meter = createMockMeter({ driver: null as any });
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should display placeholder text when driver is undefined', () => {
      const meter = createMockMeter({ driver: undefined as any });
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should have Driver label', () => {
      const meter = createMockMeter();
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('Driver')).toBeInTheDocument();
    });
  });

  describe('Description Display', () => {
    it('should display the meter description', () => {
      const meter = createMockMeter({ description: 'Main Building Meter' });
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('Main Building Meter')).toBeInTheDocument();
    });

    it('should display placeholder text when description is empty string', () => {
      const meter = createMockMeter({ description: '' });
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      // Should have at least one N/A for missing description
      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThan(0);
    });

    it('should display placeholder text when description is null', () => {
      const meter = createMockMeter({ description: null as any });
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should have Description label', () => {
      const meter = createMockMeter();
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  describe('Serial Number Display', () => {
    it('should display the serial number', () => {
      const meter = createMockMeter({ serialNumber: 'SN-12345-67890' });
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('SN-12345-67890')).toBeInTheDocument();
    });

    it('should display placeholder text when serial number is empty string', () => {
      const meter = createMockMeter({ serialNumber: '' });
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should display placeholder text when serial number is null', () => {
      const meter = createMockMeter({ serialNumber: null as any });
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should have Serial Number label', () => {
      const meter = createMockMeter();
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('Serial Number')).toBeInTheDocument();
    });
  });

  describe('Reading Timestamp Display', () => {
    it('should display the reading timestamp', () => {
      const meter = createMockMeter();
      const reading = createMockReading({
        timestamp: new Date('2024-01-15T10:30:00Z'),
      });

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      // The exact format depends on locale, but should contain date/time info
      const timestampText = screen.getByText(/2024|January|Jan/);
      expect(timestampText).toBeInTheDocument();
    });

    it('should display placeholder text when timestamp is invalid', () => {
      const meter = createMockMeter();
      const reading = createMockReading({
        timestamp: 'invalid-date' as any,
      });

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      // Invalid date should show N/A
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should handle string timestamp format', () => {
      const meter = createMockMeter();
      const reading = createMockReading({
        timestamp: '2024-01-15T10:30:00Z' as any,
      });

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      // Should successfully parse and display the date
      const timestampText = screen.queryByText('N/A');
      // If timestamp is valid, it should not show N/A for timestamp
      // (though other fields might show N/A)
      expect(timestampText).not.toBeInTheDocument();
    });

    it('should have Reading Timestamp label', () => {
      const meter = createMockMeter();
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('Reading Timestamp')).toBeInTheDocument();
    });
  });

  describe('All Fields Present', () => {
    it('should display all four information fields', () => {
      const meter = createMockMeter({
        driver: 'John Doe',
        description: 'Main Building Meter',
        serialNumber: 'SN-12345-67890',
      });
      const reading = createMockReading({
        timestamp: new Date('2024-01-15T10:30:00Z'),
      });

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('Driver')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Serial Number')).toBeInTheDocument();
      expect(screen.getByText('Reading Timestamp')).toBeInTheDocument();

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Main Building Meter')).toBeInTheDocument();
      expect(screen.getByText('SN-12345-67890')).toBeInTheDocument();
    });
  });

  describe('Missing Data Handling', () => {
    it('should handle all fields missing', () => {
      const meter = createMockMeter({
        driver: '',
        description: '',
        serialNumber: '',
      });
      const reading = createMockReading({
        timestamp: 'invalid' as any,
      });

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      // Should display N/A for all missing fields
      const naElements = screen.getAllByText('N/A');
      // We expect at least 4 N/A values (one for each field)
      expect(naElements.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle partial missing data', () => {
      const meter = createMockMeter({
        driver: 'John Doe',
        description: '',
        serialNumber: 'SN-12345-67890',
      });
      const reading = createMockReading({
        timestamp: new Date('2024-01-15T10:30:00Z'),
      });

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('SN-12345-67890')).toBeInTheDocument();
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Special Characters and Long Text', () => {
    it('should handle special characters in driver name', () => {
      const meter = createMockMeter({ driver: "O'Brien & Associates" });
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText("O'Brien & Associates")).toBeInTheDocument();
    });

    it('should handle long text in description', () => {
      const longDescription =
        'This is a very long description that contains multiple words and should be displayed properly without breaking the layout';
      const meter = createMockMeter({ description: longDescription });
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle special characters in serial number', () => {
      const meter = createMockMeter({ serialNumber: 'SN-12345-67890-ABC' });
      const reading = createMockReading();

      render(<MeterInfoPanel meter={meter} reading={reading} />);

      expect(screen.getByText('SN-12345-67890-ABC')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should have correct CSS classes for structure', () => {
      const meter = createMockMeter();
      const reading = createMockReading();

      const { container } = render(
        <MeterInfoPanel meter={meter} reading={reading} />
      );

      expect(
        container.querySelector('.meter-info-panel')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.meter-info-panel__grid')
      ).toBeInTheDocument();
      expect(
        container.querySelectorAll('.meter-info-panel__item').length
      ).toBe(4);
      expect(
        container.querySelectorAll('.meter-info-panel__label').length
      ).toBe(4);
      expect(
        container.querySelectorAll('.meter-info-panel__value').length
      ).toBe(4);
    });
  });
});
