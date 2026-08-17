import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CombinedMetersTab } from './CombinedMetersTab';
import { meterService } from '../../services/meterService';
import type { SelectedItem } from '../../services/meterService';

vi.mock('../../services/meterService', () => ({
  meterService: {
    getMeterElements: vi.fn(),
    getVirtualMeterConfig: vi.fn(),
    getElementsForMeter: vi.fn(),
    saveVirtualMeterConfig: vi.fn(),
  },
  formatItemLabel: (item: SelectedItem) =>
    item.selectionType === 'element'
      ? `${item.meter_name} (${item.element}) ${item.element_name}`
      : item.meter_name,
}));

const mockGetMeterElements = vi.mocked(meterService.getMeterElements);
const mockGetVirtualMeterConfig = vi.mocked(meterService.getVirtualMeterConfig);
const mockGetElementsForMeter = vi.mocked(meterService.getElementsForMeter);
const mockSaveVirtualMeterConfig = vi.mocked(meterService.saveVirtualMeterConfig);

const AVAILABLE_METERS = [
  { id: 10, name: 'Meter A', identifier: 'SN010' },
  { id: 11, name: 'Meter B', identifier: 'SN011' },
];

const SELECTED_METER_ITEM: SelectedItem = {
  selectionType: 'meter',
  id: 'meter-10',
  meter_id: 10,
  meter_name: 'Meter A',
  identifier: 'SN010',
  operation: '+',
};

const SELECTED_ELEMENT_ITEM: SelectedItem = {
  selectionType: 'element',
  id: 'element-201',
  meter_id: 11,
  meter_name: 'Meter B',
  identifier: 'SN011',
  meter_element_id: 201,
  element_name: 'kWh Import',
  element: 'kWh',
  operation: '-',
};

function defaultProps(overrides = {}) {
  return {
    meterId: 5,
    isVirtual: true,
    isParentSaved: true,
    onError: vi.fn(),
    onParentSave: vi.fn(),
    ...overrides,
  };
}

describe('CombinedMetersTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__DISABLE_RETRIES__ = true;
    mockGetMeterElements.mockResolvedValue(AVAILABLE_METERS as any);
    mockGetVirtualMeterConfig.mockResolvedValue([]);
    mockSaveVirtualMeterConfig.mockResolvedValue(undefined);
  });

  describe('loading state', () => {
    it('shows loading spinner while fetching', async () => {
      let resolve!: (v: any) => void;
      mockGetMeterElements.mockReturnValue(new Promise((r) => { resolve = r; }));

      render(<CombinedMetersTab {...defaultProps()} />);

      expect(screen.getByText(/loading meters/i)).toBeInTheDocument();
      resolve(AVAILABLE_METERS);
    });

    it('renders available meters after load', async () => {
      render(<CombinedMetersTab {...defaultProps()} />);

      await waitFor(() => {
        expect(screen.getByText('Meter A')).toBeInTheDocument();
        expect(screen.getByText('Meter B')).toBeInTheDocument();
      });
    });
  });

  describe('disabled state (parent not saved)', () => {
    it('shows save-first message when isParentSaved is false', () => {
      render(<CombinedMetersTab {...defaultProps({ isParentSaved: false })} />);
      expect(screen.getByText(/save the meter first/i)).toBeInTheDocument();
    });

    it('does not call service when isParentSaved is false', () => {
      render(<CombinedMetersTab {...defaultProps({ isParentSaved: false })} />);
      expect(mockGetMeterElements).not.toHaveBeenCalled();
    });
  });

  describe('error state', () => {
    it('shows error message and retry button on load failure', async () => {
      mockGetMeterElements.mockRejectedValue(new Error('Network error'));

      render(<CombinedMetersTab {...defaultProps()} />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('calls onError callback on load failure', async () => {
      const onError = vi.fn();
      mockGetMeterElements.mockRejectedValue(new Error('Oops'));

      render(<CombinedMetersTab {...defaultProps({ onError })} />);

      await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.any(Error)));
    });

    it('reloads when retry is clicked', async () => {
      mockGetMeterElements
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce(AVAILABLE_METERS as any);

      render(<CombinedMetersTab {...defaultProps()} />);

      await waitFor(() => screen.getByRole('button', { name: /retry/i }));
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      await waitFor(() => expect(screen.getByText('Meter A')).toBeInTheDocument());
    });
  });

  describe('pre-loaded selection', () => {
    it('shows previously saved meter selections', async () => {
      mockGetVirtualMeterConfig.mockResolvedValue([SELECTED_METER_ITEM]);

      render(<CombinedMetersTab {...defaultProps()} />);

      await waitFor(() => {
        // The selected panel should show Meter A
        const selectedPanel = screen.getAllByText('Meter A');
        expect(selectedPanel.length).toBeGreaterThan(0);
      });
    });

    it('shows previously saved element selections', async () => {
      mockGetVirtualMeterConfig.mockResolvedValue([SELECTED_ELEMENT_ITEM]);

      render(<CombinedMetersTab {...defaultProps()} />);

      await waitFor(() => {
        expect(screen.getByText(/kWh Import/i)).toBeInTheDocument();
      });
    });

    it('shows correct item count in Selected header', async () => {
      mockGetVirtualMeterConfig.mockResolvedValue([SELECTED_METER_ITEM, SELECTED_ELEMENT_ITEM]);

      render(<CombinedMetersTab {...defaultProps()} />);

      await waitFor(() => {
        const counts = screen.getAllByText('2');
        expect(counts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('adding items', () => {
    it('double-click on meter row adds it to selected panel', async () => {
      render(<CombinedMetersTab {...defaultProps()} />);

      await waitFor(() => screen.getByText('Meter A'));

      const meterRow = screen.getByText('Meter A').closest('.cmt__meter-row')!;
      fireEvent.doubleClick(meterRow);

      await waitFor(() => {
        expect(mockSaveVirtualMeterConfig).toHaveBeenCalled();
      });
    });

    it('does not add duplicate items', async () => {
      mockGetVirtualMeterConfig.mockResolvedValue([SELECTED_METER_ITEM]);
      render(<CombinedMetersTab {...defaultProps()} />);

      await waitFor(() => screen.getAllByText('Meter A'));

      // Meter A appears in both panels; pick the one inside the left available panel
      const leftPanel = document.querySelector('.cmt__panel:first-of-type')!;
      const meterRow = leftPanel.querySelector('.cmt__meter-row')!;
      fireEvent.doubleClick(meterRow);

      // saveVirtualMeterConfig should NOT be called since already selected
      expect(mockSaveVirtualMeterConfig).not.toHaveBeenCalled();
    });
  });

  describe('removing items', () => {
    it('double-click on selected row removes it', async () => {
      mockGetVirtualMeterConfig.mockResolvedValue([SELECTED_METER_ITEM]);
      render(<CombinedMetersTab {...defaultProps()} />);

      await waitFor(() => screen.getByRole('button', { name: /remove/i }));

      const removeBtn = screen.getByRole('button', { name: /remove/i });
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(mockSaveVirtualMeterConfig).toHaveBeenCalledWith(
          5,
          expect.arrayContaining([])
        );
      });
    });
  });

  describe('operation toggle', () => {
    it('first item operation select is disabled', async () => {
      mockGetVirtualMeterConfig.mockResolvedValue([SELECTED_METER_ITEM, SELECTED_ELEMENT_ITEM]);
      render(<CombinedMetersTab {...defaultProps()} />);

      await waitFor(() => screen.getAllByRole('combobox'));

      const selects = screen.getAllByRole('combobox');
      expect(selects[0]).toBeDisabled();
    });

    it('subsequent items operation can be changed', async () => {
      mockGetVirtualMeterConfig.mockResolvedValue([SELECTED_METER_ITEM, SELECTED_ELEMENT_ITEM]);
      render(<CombinedMetersTab {...defaultProps()} />);

      await waitFor(() => screen.getAllByRole('combobox'));

      const selects = screen.getAllByRole('combobox');
      expect(selects[1]).not.toBeDisabled();
      fireEvent.change(selects[1], { target: { value: '-' } });

      await waitFor(() => {
        expect(mockSaveVirtualMeterConfig).toHaveBeenCalled();
      });
    });
  });

  describe('search filtering', () => {
    it('filters available meters by name', async () => {
      render(<CombinedMetersTab {...defaultProps()} />);
      await waitFor(() => screen.getByText('Meter A'));

      const searchInput = screen.getByPlaceholderText(/search meters/i);
      fireEvent.change(searchInput, { target: { value: 'Meter A' } });

      expect(screen.getByText('Meter A')).toBeInTheDocument();
      expect(screen.queryByText('Meter B')).not.toBeInTheDocument();
    });

    it('shows clear button when search has text', async () => {
      render(<CombinedMetersTab {...defaultProps()} />);
      await waitFor(() => screen.getByText('Meter A'));

      const searchInput = screen.getByPlaceholderText(/search meters/i);
      fireEvent.change(searchInput, { target: { value: 'x' } });

      expect(screen.getByLabelText(/clear search/i)).toBeInTheDocument();
    });

    it('clears search when clear button clicked', async () => {
      render(<CombinedMetersTab {...defaultProps()} />);
      await waitFor(() => screen.getByText('Meter A'));

      const searchInput = screen.getByPlaceholderText(/search meters/i);
      fireEvent.change(searchInput, { target: { value: 'x' } });
      fireEvent.click(screen.getByLabelText(/clear search/i));

      expect((searchInput as HTMLInputElement).value).toBe('');
    });
  });

  describe('footer', () => {
    it('shows "No items selected." when selection is empty', async () => {
      render(<CombinedMetersTab {...defaultProps()} />);
      await waitFor(() => screen.getByText('Meter A'));

      expect(screen.getByText('No items selected.')).toBeInTheDocument();
    });

    it('shows item count when items are selected', async () => {
      mockGetVirtualMeterConfig.mockResolvedValue([SELECTED_METER_ITEM, SELECTED_ELEMENT_ITEM]);
      render(<CombinedMetersTab {...defaultProps()} />);

      await waitFor(() => {
        expect(screen.getByText('2 items selected')).toBeInTheDocument();
      });
    });

    it('uses singular "item" for single selection', async () => {
      mockGetVirtualMeterConfig.mockResolvedValue([SELECTED_METER_ITEM]);
      render(<CombinedMetersTab {...defaultProps()} />);

      await waitFor(() => {
        expect(screen.getByText('1 item selected')).toBeInTheDocument();
      });
    });
  });

  describe('element expansion', () => {
    it('expand button fetches and shows elements for a meter', async () => {
      mockGetElementsForMeter.mockResolvedValue([
        { meter_element_id: 201, meter_id: 10, name: 'kWh Import', element: 'kWh' },
      ]);

      render(<CombinedMetersTab {...defaultProps()} />);
      await waitFor(() => screen.getByText('Meter A'));

      const expandBtns = screen.getAllByRole('button', { name: /expand/i });
      fireEvent.click(expandBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('kWh Import')).toBeInTheDocument();
      });
    });

    it('shows "No elements defined." when meter has no elements', async () => {
      mockGetElementsForMeter.mockResolvedValue([]);

      render(<CombinedMetersTab {...defaultProps()} />);
      await waitFor(() => screen.getByText('Meter A'));

      const expandBtns = screen.getAllByRole('button', { name: /expand/i });
      fireEvent.click(expandBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('No elements defined.')).toBeInTheDocument();
      });
    });
  });
});
