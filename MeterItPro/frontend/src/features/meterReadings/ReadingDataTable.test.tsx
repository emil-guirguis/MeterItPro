/**
 * ReadingDataTable Component Tests
 * 
 * Unit tests for the ReadingDataTable component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReadingDataTable } from './ReadingDataTable';
import type { MeterReading, ReadingMetric } from './types';

/**
 * Helper function to create a mock ReadingMetric
 */
const createMockMetric = (overrides?: Partial<ReadingMetric>): ReadingMetric => ({
  overall: 100,
  phase1: 30,
  phase2: 35,
  phase3: 35,
  unit: 'kWh',
  ...overrides,
});

/**
 * Helper function to create a mock MeterReading
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

describe('ReadingDataTable', () => {
  describe('Component Rendering', () => {
    it('should render the component', () => {
      const reading = createMockReading();
      const { container } = render(<ReadingDataTable reading={reading} />);

      expect(container.querySelector('.reading-data-table')).toBeInTheDocument();
    });

    it('should render empty state when no sections', () => {
      const reading = createMockReading({
        sections: {},
      });

      render(<ReadingDataTable reading={reading} />);

      expect(screen.getByText('No reading data available')).toBeInTheDocument();
    });

    it('should have empty state CSS class', () => {
      const reading = createMockReading({
        sections: {},
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      expect(
        container.querySelector('.reading-data-table--empty')
      ).toBeInTheDocument();
    });
  });

  describe('Section Display', () => {
    it('should render a section for each section in reading', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
          },
          'Reactive Power': {
            Voltage: createMockMetric(),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const sections = container.querySelectorAll(
        '.reading-data-table__section'
      );
      expect(sections.length).toBe(2);
    });

    it('should display section titles', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
          },
        },
      });

      render(<ReadingDataTable reading={reading} />);

      expect(screen.getByText('Total Consumption')).toBeInTheDocument();
    });

    it('should render multiple sections with correct titles', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
          },
          'Reactive Power': {
            Voltage: createMockMetric(),
          },
        },
      });

      render(<ReadingDataTable reading={reading} />);

      expect(screen.getByText('Total Consumption')).toBeInTheDocument();
      expect(screen.getByText('Reactive Power')).toBeInTheDocument();
    });
  });

  describe('Table Structure', () => {
    it('should render a table for each section', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
          },
          'Reactive Power': {
            Voltage: createMockMetric(),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const tables = container.querySelectorAll('.reading-data-table__table');
      expect(tables.length).toBe(2);
    });

    it('should render table headers', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const headers = container.querySelectorAll('.reading-data-table__header');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should have correct header columns', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
          },
        },
      });

      render(<ReadingDataTable reading={reading} />);

      expect(screen.getByText('Metric')).toBeInTheDocument();
      expect(screen.getByText('Overall')).toBeInTheDocument();
      expect(screen.getByText('Phase 1')).toBeInTheDocument();
      expect(screen.getByText('Phase 2')).toBeInTheDocument();
      expect(screen.getByText('Phase 3')).toBeInTheDocument();
    });
  });

  describe('Metric Display', () => {
    it('should display metric names', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
            Current: createMockMetric({ unit: 'A' }),
          },
        },
      });

      render(<ReadingDataTable reading={reading} />);

      expect(screen.getByText('Voltage')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('should render a row for each metric', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
            Current: createMockMetric(),
            Power: createMockMetric(),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const rows = container.querySelectorAll('.reading-data-table__row');
      expect(rows.length).toBe(3);
    });
  });

  describe('Numeric Values Display', () => {
    it('should display numeric values', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({
              overall: 230,
              phase1: 230,
              phase2: 230,
              phase3: 230,
            }),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const values = container.querySelectorAll('.reading-data-table__value');
      expect(values.length).toBeGreaterThan(0);
      expect(Array.from(values).some(v => v.textContent === '230')).toBe(true);
    });

    it('should format decimal values correctly', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({
              overall: 230.456,
              phase1: 230.456,
              phase2: 230.456,
              phase3: 230.456,
            }),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      // Should be formatted to 2 decimal places
      const values = container.querySelectorAll('.reading-data-table__value');
      expect(Array.from(values).some(v => v.textContent === '230.46')).toBe(true);
    });

    it('should remove trailing zeros from decimal values', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({
              overall: 230.5,
              phase1: 230.5,
              phase2: 230.5,
              phase3: 230.5,
            }),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const values = container.querySelectorAll('.reading-data-table__value');
      expect(Array.from(values).some(v => v.textContent === '230.5')).toBe(true);
    });

    it('should display different values for each phase', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({
              overall: 100,
              phase1: 30,
              phase2: 35,
              phase3: 35,
            }),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const values = container.querySelectorAll('.reading-data-table__value');
      const valueTexts = Array.from(values).map(v => v.textContent);
      expect(valueTexts).toContain('100');
      expect(valueTexts).toContain('30');
      expect(valueTexts).toContain('35');
    });
  });

  describe('Unit Display', () => {
    it('should display units for each value', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({ unit: 'V' }),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const units = container.querySelectorAll('.reading-data-table__unit');
      // Should have units for: overall, phase1, phase2, phase3, and frequency
      expect(units.length).toBeGreaterThan(0);
    });

    it('should display correct units for different metrics', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({ unit: 'V' }),
            Current: createMockMetric({ unit: 'A' }),
            Power: createMockMetric({ unit: 'kW' }),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      // Check that units are present in the rendered output
      const unitElements = container.querySelectorAll(
        '.reading-data-table__unit'
      );
      expect(unitElements.length).toBeGreaterThan(0);
    });

    it('should display same unit for all phases of a metric', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({
              overall: 230,
              phase1: 230,
              phase2: 230,
              phase3: 230,
              unit: 'V',
            }),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const unitElements = container.querySelectorAll(
        '.reading-data-table__unit'
      );
      // All units for this metric should be 'V'
      unitElements.forEach((unit) => {
        if (unit.textContent && unit.textContent !== 'Hz') {
          expect(unit.textContent).toBe('V');
        }
      });
    });
  });

  describe('Null/Missing Data Handling', () => {
    it('should display placeholder for null overall value', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({
              overall: null,
              phase1: 230,
              phase2: 230,
              phase3: 230,
            }),
          },
        },
      });

      render(<ReadingDataTable reading={reading} />);

      // Should display placeholder (—)
      const cells = screen.getAllByText('—');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should display placeholder for null phase values', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({
              overall: 100,
              phase1: null,
              phase2: null,
              phase3: null,
            }),
          },
        },
      });

      render(<ReadingDataTable reading={reading} />);

      // Should display multiple placeholders
      const cells = screen.getAllByText('—');
      expect(cells.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle all null values in a metric', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({
              overall: null,
              phase1: null,
              phase2: null,
              phase3: null,
            }),
          },
        },
      });

      render(<ReadingDataTable reading={reading} />);

      // Should display placeholders for all values
      const cells = screen.getAllByText('—');
      expect(cells.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle mixed null and non-null values', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({
              overall: 100,
              phase1: 30,
              phase2: null,
              phase3: 35,
            }),
          },
        },
      });

      render(<ReadingDataTable reading={reading} />);

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('35')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('Frequency Display', () => {
    it('should display frequency section', () => {
      const reading = createMockReading({
        frequency: 50,
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      expect(
        container.querySelector('.reading-data-table__frequency')
      ).toBeInTheDocument();
    });

    it('should display frequency label', () => {
      const reading = createMockReading({
        frequency: 50,
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
          },
        },
      });

      render(<ReadingDataTable reading={reading} />);

      expect(screen.getByText('Frequency')).toBeInTheDocument();
    });

    it('should display frequency value', () => {
      const reading = createMockReading({
        frequency: 50,
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
          },
        },
      });

      render(<ReadingDataTable reading={reading} />);

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('should display frequency with Hz unit', () => {
      const reading = createMockReading({
        frequency: 50,
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const frequencySection = container.querySelector(
        '.reading-data-table__frequency'
      );
      expect(frequencySection?.textContent).toContain('Hz');
    });

    it('should display null indicator for null frequency', () => {
      const reading = createMockReading({
        frequency: null as any,
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
          },
        },
      });

      render(<ReadingDataTable reading={reading} />);

      // Should display placeholder for frequency
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should format frequency decimal values', () => {
      const reading = createMockReading({
        frequency: 50.123,
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
          },
        },
      });

      render(<ReadingDataTable reading={reading} />);

      expect(screen.getByText('50.12')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should have correct CSS classes for table structure', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      expect(
        container.querySelector('.reading-data-table')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.reading-data-table__section')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.reading-data-table__table')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.reading-data-table__header')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.reading-data-table__row')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.reading-data-table__cell')
      ).toBeInTheDocument();
    });

    it('should have correct CSS classes for frequency display', () => {
      const reading = createMockReading({
        frequency: 50,
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric(),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      expect(
        container.querySelector('.reading-data-table__frequency')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.reading-data-table__frequency-item')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.reading-data-table__frequency-label')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.reading-data-table__frequency-value')
      ).toBeInTheDocument();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple sections with multiple metrics', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({ unit: 'V' }),
            Current: createMockMetric({ unit: 'A' }),
            Power: createMockMetric({ unit: 'kW' }),
          },
          'Reactive Power': {
            Voltage: createMockMetric({ unit: 'V' }),
            Current: createMockMetric({ unit: 'A' }),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const sections = container.querySelectorAll(
        '.reading-data-table__section'
      );
      expect(sections.length).toBe(2);

      const rows = container.querySelectorAll('.reading-data-table__row');
      expect(rows.length).toBe(5); // 3 metrics in first section + 2 in second
    });

    it('should handle large numeric values', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Energy: createMockMetric({
              overall: 999999.99,
              phase1: 333333.33,
              phase2: 333333.33,
              phase3: 333333.33,
            }),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const values = container.querySelectorAll('.reading-data-table__value');
      const valueTexts = Array.from(values).map(v => v.textContent);
      expect(valueTexts).toContain('999999.99');
      expect(valueTexts).toContain('333333.33');
    });

    it('should handle very small numeric values', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({
              overall: 0.01,
              phase1: 0.01,
              phase2: 0.01,
              phase3: 0.01,
            }),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const values = container.querySelectorAll('.reading-data-table__value');
      const valueTexts = Array.from(values).map(v => v.textContent);
      expect(valueTexts).toContain('0.01');
    });

    it('should handle zero values', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({
              overall: 0,
              phase1: 0,
              phase2: 0,
              phase3: 0,
            }),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const values = container.querySelectorAll('.reading-data-table__value');
      const valueTexts = Array.from(values).map(v => v.textContent);
      expect(valueTexts).toContain('0');
    });

    it('should handle negative values', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Power: createMockMetric({
              overall: -10.5,
              phase1: -3.5,
              phase2: -3.5,
              phase3: -3.5,
            }),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      const values = container.querySelectorAll('.reading-data-table__value');
      const valueTexts = Array.from(values).map(v => v.textContent);
      expect(valueTexts).toContain('-10.5');
      expect(valueTexts).toContain('-3.5');
    });
  });

  describe('Edge Cases', () => {
    it('should handle section with no metrics', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {},
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      // Should still render the section but with no rows
      expect(
        container.querySelector('.reading-data-table__section')
      ).toBeInTheDocument();
      const rows = container.querySelectorAll('.reading-data-table__row');
      expect(rows.length).toBe(0);
    });

    it('should handle metric with empty unit string', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            Voltage: createMockMetric({ unit: '' }),
          },
        },
      });

      const { container } = render(<ReadingDataTable reading={reading} />);

      expect(
        container.querySelector('.reading-data-table__table')
      ).toBeInTheDocument();
    });

    it('should handle very long metric names', () => {
      const longMetricName =
        'Very Long Metric Name That Should Still Display Properly';
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            [longMetricName]: createMockMetric(),
          },
        },
      });

      render(<ReadingDataTable reading={reading} />);

      expect(screen.getByText(longMetricName)).toBeInTheDocument();
    });

    it('should handle special characters in metric names', () => {
      const reading = createMockReading({
        sections: {
          'Total Consumption': {
            'Voltage (L1-L2)': createMockMetric(),
            'Current & Power': createMockMetric(),
          },
        },
      });

      render(<ReadingDataTable reading={reading} />);

      expect(screen.getByText('Voltage (L1-L2)')).toBeInTheDocument();
      expect(screen.getByText('Current & Power')).toBeInTheDocument();
    });
  });
});
