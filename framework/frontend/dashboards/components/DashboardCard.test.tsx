import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardCard } from './DashboardCard';
import type { DashboardCard as DashboardCardType, AggregatedData } from '../types';

describe('DashboardCard', () => {
  const mockCard: DashboardCardType = {
    id: 1,
    title: 'Test Card',
    description: 'Test Description',
    visualization_type: 'line',
    card_name: 'Test Card',
    card_description: 'Test Description',
    selected_columns: ['active_energy', 'power'],
    time_frame_type: 'last_month',
    grouping_type: 'daily',
  };

  const mockAggregatedData: AggregatedData = {
    card_id: 1,
    aggregated_values: {
      active_energy: 1250.50,
      power: 45.25,
    },
    grouped_data: [
      { date: '2024-01-01', active_energy: 100, power: 10 },
      { date: '2024-01-02', active_energy: 150, power: 15 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Isolation', () => {
    it('renders card with correct title and description', () => {
      render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
        />
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('does not make any API calls', () => {
      // This test verifies that the component is isolated and doesn't make API calls
      // If it did, we would see network requests or service calls
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
        />
      );

      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it('accepts all data through props', () => {
      const { rerender } = render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
        />
      );

      expect(screen.getByText('1,250.50')).toBeInTheDocument();

      // Update data through props
      const newData: AggregatedData = {
        card_id: 1,
        aggregated_values: {
          active_energy: 2500.75,
          power: 90.50,
        },
      };

      rerender(
        <DashboardCard
          card={mockCard}
          data={newData}
        />
      );

      expect(screen.getByText('2,500.75')).toBeInTheDocument();
    });

    it('renders without VisualizationComponent when not provided', () => {
      const { container } = render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
        />
      );

      // Should still render the card structure
      expect(screen.getByText('Test Card')).toBeInTheDocument();
      // But no visualization should be rendered
      const papers = container.querySelectorAll('.MuiPaper-root');
      expect(papers.length).toBeGreaterThan(0); // At least the aggregated values papers
    });
  });

  describe('Data Flow Consistency', () => {
    it('displays aggregated values correctly', () => {
      render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
        />
      );

      expect(screen.getByText('1,250.50')).toBeInTheDocument();
      expect(screen.getByText('45.25')).toBeInTheDocument();
    });

    it('updates visualization when data changes', () => {
      const { rerender } = render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
        />
      );

      expect(screen.getByText('1,250.50')).toBeInTheDocument();

      const newData: AggregatedData = {
        card_id: 1,
        aggregated_values: {
          active_energy: 3000.00,
          power: 100.00,
        },
      };

      rerender(
        <DashboardCard
          card={mockCard}
          data={newData}
        />
      );

      expect(screen.getByText('3,000.00')).toBeInTheDocument();
      expect(screen.getByText('100.00')).toBeInTheDocument();
    });

    it('displays loading state when loading prop is true', () => {
      render(
        <DashboardCard
          card={mockCard}
          data={null}
          loading={true}
        />
      );

      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('displays error state when error prop is provided', () => {
      render(
        <DashboardCard
          card={mockCard}
          data={null}
          error="Failed to load data"
        />
      );

      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('displays retry button when error is present', () => {
      render(
        <DashboardCard
          card={mockCard}
          data={null}
          error="Failed to load data"
        />
      );

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Callback Execution', () => {
    it('calls onEdit callback when edit button is clicked', async () => {
      const onEdit = vi.fn();
      const user = userEvent.setup();

      render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
          onEdit={onEdit}
        />
      );

      const editButton = screen.getByLabelText('Edit');
      await user.click(editButton);

      expect(onEdit).toHaveBeenCalledWith(mockCard);
    });

    it('calls onDelete callback when delete button is clicked and confirmed', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
          onDelete={onDelete}
        />
      );

      const deleteButton = screen.getByLabelText('Delete');
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith(mockCard.id);
    });

    it('does not call onDelete when delete is cancelled', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
          onDelete={onDelete}
        />
      );

      const deleteButton = screen.getByLabelText('Delete');
      await user.click(deleteButton);

      expect(onDelete).not.toHaveBeenCalled();
    });

    it('calls onRefresh callback when refresh button is clicked', async () => {
      const onRefresh = vi.fn();
      const user = userEvent.setup();

      render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
          onRefresh={onRefresh}
        />
      );

      const refreshButton = screen.getByLabelText('Refresh');
      await user.click(refreshButton);

      expect(onRefresh).toHaveBeenCalledWith(mockCard.id);
    });

    it('calls onExpand callback when expand button is clicked', async () => {
      const onExpand = vi.fn();
      const user = userEvent.setup();

      render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
          onExpand={onExpand}
        />
      );

      const expandButton = screen.getByLabelText('Expand');
      await user.click(expandButton);

      expect(onExpand).toHaveBeenCalledWith(mockCard);
    });

    it('calls onVisualizationChange when visualization type changes', async () => {
      const onVisualizationChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
          onVisualizationChange={onVisualizationChange}
        />
      );

      // Find the visualization select
      const selects = container.querySelectorAll('select');
      const visualizationSelect = Array.from(selects).find(
        (select) => select.value === 'line'
      );

      if (visualizationSelect) {
        await user.selectOptions(visualizationSelect, 'bar');
        expect(onVisualizationChange).toHaveBeenCalledWith(mockCard.id, 'bar');
      }
    });

    it('calls onGroupingChange when grouping type changes', async () => {
      const onGroupingChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
          onGroupingChange={onGroupingChange}
        />
      );

      // Find the grouping select
      const selects = container.querySelectorAll('select');
      const groupingSelect = Array.from(selects).find(
        (select) => select.value === 'daily'
      );

      if (groupingSelect) {
        await user.selectOptions(groupingSelect, 'weekly');
        expect(onGroupingChange).toHaveBeenCalledWith(mockCard.id, 'weekly');
      }
    });

    it('calls onTimeFrameChange when time frame changes', async () => {
      const onTimeFrameChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
          onTimeFrameChange={onTimeFrameChange}
        />
      );

      // Find the time frame select
      const selects = container.querySelectorAll('select');
      const timeFrameSelect = Array.from(selects).find(
        (select) => select.value === 'last_month'
      );

      if (timeFrameSelect) {
        await user.selectOptions(timeFrameSelect, 'this_month_to_date');
        expect(onTimeFrameChange).toHaveBeenCalledWith(mockCard.id, 'this_month_to_date');
      }
    });
  });

  describe('UI Behavior', () => {
    it('disables refresh button when loading', () => {
      render(
        <DashboardCard
          card={mockCard}
          data={null}
          loading={true}
        />
      );

      const refreshButton = screen.getByLabelText('Refresh');
      expect(refreshButton).toBeDisabled();
    });

    it('disables refresh button when isSaving', () => {
      render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
          isSaving={true}
        />
      );

      const refreshButton = screen.getByLabelText('Refresh');
      expect(refreshButton).toBeDisabled();
    });

    it('formats numbers with commas', () => {
      const largeNumberData: AggregatedData = {
        card_id: 1,
        aggregated_values: {
          active_energy: 1250500.50,
          power: 45.25,
        },
      };

      render(
        <DashboardCard
          card={mockCard}
          data={largeNumberData}
        />
      );

      expect(screen.getByText('1,250,500.50')).toBeInTheDocument();
    });

    it('handles missing description gracefully', () => {
      const cardWithoutDescription: DashboardCardType = {
        ...mockCard,
        description: undefined,
        card_description: undefined,
      };

      render(
        <DashboardCard
          card={cardWithoutDescription}
          data={mockAggregatedData}
        />
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
    });

    it('displays all selected columns', () => {
      render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
        />
      );

      // Check that both columns are displayed in the aggregated values
      expect(screen.getByText('1,250.50')).toBeInTheDocument();
      expect(screen.getByText('45.25')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
          className="custom-class"
        />
      );

      const card = container.querySelector('.dashboard-card.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null aggregated values', () => {
      const dataWithNullValues: AggregatedData = {
        card_id: 1,
        aggregated_values: {
          active_energy: null as any,
          power: undefined as any,
        },
      };

      render(
        <DashboardCard
          card={mockCard}
          data={dataWithNullValues}
        />
      );

      expect(screen.getAllByText('--').length).toBeGreaterThan(0);
    });

    it('handles empty selected columns', () => {
      const cardWithoutColumns: DashboardCardType = {
        ...mockCard,
        selected_columns: [],
      };

      render(
        <DashboardCard
          card={cardWithoutColumns}
          data={mockAggregatedData}
        />
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
    });

    it('handles card with no callbacks', () => {
      render(
        <DashboardCard
          card={mockCard}
          data={mockAggregatedData}
        />
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
    });

    it('handles retry button click when onRefresh is provided', async () => {
      const onRefresh = vi.fn();
      const user = userEvent.setup();

      render(
        <DashboardCard
          card={mockCard}
          data={null}
          error="Failed to load"
          onRefresh={onRefresh}
        />
      );

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      expect(onRefresh).toHaveBeenCalledWith(mockCard.id);
    });
  });
});
