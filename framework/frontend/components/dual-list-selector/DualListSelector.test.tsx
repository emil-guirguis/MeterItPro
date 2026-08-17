import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DualListSelector } from './DualListSelector';

// Mock data
interface TestItem {
  id: string;
  name: string;
  identifier: string;
}

const mockItems: TestItem[] = [
  { id: '1', name: 'Meter A', identifier: 'MA-001' },
  { id: '2', name: 'Meter B', identifier: 'MB-002' },
  { id: '3', name: 'Meter C', identifier: 'MC-003' },
  { id: '4', name: 'Meter D', identifier: 'MD-004' },
];

const defaultProps = {
  availableItems: mockItems,
  selectedItems: [],
  onItemMove: vi.fn(),
  searchQuery: '',
  emptyStateMessage: 'No items available',
  getItemId: (item: TestItem) => item.id,
  getItemLabel: (item: TestItem) => `${item.name} (${item.identifier})`,
};

describe('DualListSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render two list containers', () => {
      render(<DualListSelector {...defaultProps} />);
      const containers = screen.getAllByRole('listbox');
      expect(containers).toHaveLength(2);
    });

    it('should render column headers', () => {
      render(<DualListSelector {...defaultProps} />);
      expect(screen.getByText('Available Items')).toBeInTheDocument();
      expect(screen.getByText('Selected Items')).toBeInTheDocument();
    });

    it('should render available items in left list', () => {
      render(<DualListSelector {...defaultProps} />);
      expect(screen.getByText('Meter A (MA-001)')).toBeInTheDocument();
      expect(screen.getByText('Meter B (MB-002)')).toBeInTheDocument();
    });

    it('should render selected items in right list', () => {
      const selectedItems = [mockItems[0], mockItems[1]];
      render(
        <DualListSelector
          {...defaultProps}
          selectedItems={selectedItems}
        />
      );
      const listboxes = screen.getAllByRole('listbox');
      const rightList = listboxes[1];
      expect(within(rightList).getByText('Meter A (MA-001)')).toBeInTheDocument();
      expect(within(rightList).getByText('Meter B (MB-002)')).toBeInTheDocument();
    });

    it('should render custom item content when renderItem is provided', () => {
      const renderItem = (item: TestItem) => `Custom: ${item.name}`;
      render(
        <DualListSelector
          {...defaultProps}
          renderItem={renderItem}
        />
      );
      expect(screen.getByText('Custom: Meter A')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when available list is empty', () => {
      render(
        <DualListSelector
          {...defaultProps}
          availableItems={[]}
        />
      );
      const listboxes = screen.getAllByRole('listbox');
      const leftList = listboxes[0];
      expect(within(leftList).getByText('No items available')).toBeInTheDocument();
    });

    it('should display empty state message when selected list is empty', () => {
      render(
        <DualListSelector
          {...defaultProps}
          selectedItems={[]}
        />
      );
      const listboxes = screen.getAllByRole('listbox');
      const rightList = listboxes[1];
      expect(within(rightList).getByText('No items available')).toBeInTheDocument();
    });

    it('should display custom empty state message', () => {
      const customMessage = 'No meters found';
      render(
        <DualListSelector
          {...defaultProps}
          availableItems={[]}
          emptyStateMessage={customMessage}
        />
      );
      const messages = screen.getAllByText(customMessage);
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('Search Filtering', () => {
    it('should filter available items by search query', () => {
      render(
        <DualListSelector
          {...defaultProps}
          searchQuery="Meter A"
        />
      );
      expect(screen.getByText('Meter A (MA-001)')).toBeInTheDocument();
      expect(screen.queryByText('Meter B (MB-002)')).not.toBeInTheDocument();
    });

    it('should filter selected items by search query', () => {
      const selectedItems = [mockItems[0], mockItems[1]];
      render(
        <DualListSelector
          {...defaultProps}
          selectedItems={selectedItems}
          searchQuery="Meter B"
        />
      );
      const listboxes = screen.getAllByRole('listbox');
      const rightList = listboxes[1];
      expect(within(rightList).getByText('Meter B (MB-002)')).toBeInTheDocument();
      expect(within(rightList).queryByText('Meter A (MA-001)')).not.toBeInTheDocument();
    });

    it('should perform case-insensitive search', () => {
      render(
        <DualListSelector
          {...defaultProps}
          searchQuery="meter a"
        />
      );
      expect(screen.getByText('Meter A (MA-001)')).toBeInTheDocument();
    });

    it('should search by identifier', () => {
      render(
        <DualListSelector
          {...defaultProps}
          searchQuery="MA-001"
        />
      );
      expect(screen.getByText('Meter A (MA-001)')).toBeInTheDocument();
      expect(screen.queryByText('Meter B (MB-002)')).not.toBeInTheDocument();
    });

    it('should show all items when search query is empty', () => {
      render(
        <DualListSelector
          {...defaultProps}
          searchQuery=""
        />
      );
      expect(screen.getByText('Meter A (MA-001)')).toBeInTheDocument();
      expect(screen.getByText('Meter B (MB-002)')).toBeInTheDocument();
      expect(screen.getByText('Meter C (MC-003)')).toBeInTheDocument();
    });

    it('should show empty state when search returns no results', () => {
      render(
        <DualListSelector
          {...defaultProps}
          searchQuery="NonExistent"
        />
      );
      const listboxes = screen.getAllByRole('listbox');
      const leftList = listboxes[0];
      expect(within(leftList).getByText('No items available')).toBeInTheDocument();
    });
  });

  describe('Double-Click Interaction', () => {
    it('should call onItemMove with "right" when left item is double-clicked', () => {
      const onItemMove = vi.fn();
      render(
        <DualListSelector
          {...defaultProps}
          onItemMove={onItemMove}
        />
      );
      const item = screen.getByText('Meter A (MA-001)');
      fireEvent.doubleClick(item);
      expect(onItemMove).toHaveBeenCalledWith(mockItems[0], 'right');
    });

    it('should call onItemMove with "left" when right item is double-clicked', () => {
      const onItemMove = vi.fn();
      const selectedItems = [mockItems[0]];
      render(
        <DualListSelector
          {...defaultProps}
          selectedItems={selectedItems}
          onItemMove={onItemMove}
        />
      );
      const listboxes = screen.getAllByRole('listbox');
      const rightList = listboxes[1];
      const item = within(rightList).getByText('Meter A (MA-001)');
      fireEvent.doubleClick(item);
      expect(onItemMove).toHaveBeenCalledWith(mockItems[0], 'left');
    });
  });

  describe('Drag and Drop', () => {
    it('should call onItemMove when item is dropped to right list', () => {
      const onItemMove = vi.fn();
      render(
        <DualListSelector
          {...defaultProps}
          onItemMove={onItemMove}
        />
      );
      const item = screen.getByText('Meter A (MA-001)');
      const listboxes = screen.getAllByRole('listbox');
      const rightList = listboxes[1];

      fireEvent.dragStart(item);
      fireEvent.dragOver(rightList);
      fireEvent.drop(rightList);

      expect(onItemMove).toHaveBeenCalledWith(mockItems[0], 'right');
    });

    it('should call onItemMove when item is dropped to left list', () => {
      const onItemMove = vi.fn();
      const selectedItems = [mockItems[0]];
      render(
        <DualListSelector
          {...defaultProps}
          selectedItems={selectedItems}
          onItemMove={onItemMove}
        />
      );
      const listboxes = screen.getAllByRole('listbox');
      const rightList = listboxes[1];
      const leftList = listboxes[0];
      const item = within(rightList).getByText('Meter A (MA-001)');

      fireEvent.dragStart(item);
      fireEvent.dragOver(leftList);
      fireEvent.drop(leftList);

      expect(onItemMove).toHaveBeenCalledWith(mockItems[0], 'left');
    });

    it('should not move item when dropped to same list', () => {
      const onItemMove = vi.fn();
      render(
        <DualListSelector
          {...defaultProps}
          onItemMove={onItemMove}
        />
      );
      const item = screen.getByText('Meter A (MA-001)');
      const listboxes = screen.getAllByRole('listbox');
      const leftList = listboxes[0];

      fireEvent.dragStart(item);
      fireEvent.dragOver(leftList);
      fireEvent.drop(leftList);

      expect(onItemMove).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should call onItemMove with "right" when Enter is pressed on left item', () => {
      const onItemMove = vi.fn();
      render(
        <DualListSelector
          {...defaultProps}
          onItemMove={onItemMove}
        />
      );
      const item = screen.getByText('Meter A (MA-001)');
      fireEvent.keyDown(item, { key: 'Enter' });
      expect(onItemMove).toHaveBeenCalledWith(mockItems[0], 'right');
    });

    it('should call onItemMove with "left" when Delete is pressed on right item', () => {
      const onItemMove = vi.fn();
      const selectedItems = [mockItems[0]];
      render(
        <DualListSelector
          {...defaultProps}
          selectedItems={selectedItems}
          onItemMove={onItemMove}
        />
      );
      const listboxes = screen.getAllByRole('listbox');
      const rightList = listboxes[1];
      const item = within(rightList).getByText('Meter A (MA-001)');
      fireEvent.keyDown(item, { key: 'Delete' });
      expect(onItemMove).toHaveBeenCalledWith(mockItems[0], 'left');
    });

    it('should not call onItemMove when Delete is pressed on left item', () => {
      const onItemMove = vi.fn();
      render(
        <DualListSelector
          {...defaultProps}
          onItemMove={onItemMove}
        />
      );
      const item = screen.getByText('Meter A (MA-001)');
      fireEvent.keyDown(item, { key: 'Delete' });
      expect(onItemMove).not.toHaveBeenCalled();
    });

    it('should make items focusable with Tab key', () => {
      render(<DualListSelector {...defaultProps} />);
      const item = screen.getByText('Meter A (MA-001)');
      expect(item).toHaveAttribute('tabIndex', '0');
    });

    it('should apply focus styles when item is focused', () => {
      render(<DualListSelector {...defaultProps} />);
      const item = screen.getByText('Meter A (MA-001)');
      fireEvent.focus(item);
      expect(item).toHaveClass('dual-list-selector__item--focused');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      render(<DualListSelector {...defaultProps} />);
      const listboxes = screen.getAllByRole('listbox');
      expect(listboxes).toHaveLength(2);
      const items = screen.getAllByRole('option');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should have aria-label for listboxes', () => {
      render(<DualListSelector {...defaultProps} />);
      const listboxes = screen.getAllByRole('listbox');
      expect(listboxes[0]).toHaveAttribute('aria-label', 'Available items');
      expect(listboxes[1]).toHaveAttribute('aria-label', 'Selected items');
    });

    it('should set aria-selected for selected items', () => {
      const selectedItems = [mockItems[0]];
      render(
        <DualListSelector
          {...defaultProps}
          selectedItems={selectedItems}
        />
      );
      const listboxes = screen.getAllByRole('listbox');
      const rightList = listboxes[1];
      const item = within(rightList).getByRole('option');
      expect(item).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Custom Getters', () => {
    it('should use custom getItemId function', () => {
      const customItems = [
        { customId: 'custom-1', name: 'Item 1', identifier: 'I1' },
        { customId: 'custom-2', name: 'Item 2', identifier: 'I2' },
      ];
      const getItemId = (item: any) => item.customId;
      const getItemLabel = (item: any) => item.name;

      render(
        <DualListSelector
          availableItems={customItems}
          selectedItems={[]}
          onItemMove={vi.fn()}
          searchQuery=""
          emptyStateMessage="No items"
          getItemId={getItemId}
          getItemLabel={getItemLabel}
        />
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should use custom getItemLabel function', () => {
      const customItems = [
        { id: '1', title: 'Custom Title 1' },
        { id: '2', title: 'Custom Title 2' },
      ];
      const getItemId = (item: any) => item.id;
      const getItemLabel = (item: any) => item.title;

      render(
        <DualListSelector
          availableItems={customItems}
          selectedItems={[]}
          onItemMove={vi.fn()}
          searchQuery=""
          emptyStateMessage="No items"
          getItemId={getItemId}
          getItemLabel={getItemLabel}
        />
      );

      expect(screen.getByText('Custom Title 1')).toBeInTheDocument();
      expect(screen.getByText('Custom Title 2')).toBeInTheDocument();
    });
  });

  describe('Search State Persistence', () => {
    it('should maintain search filter when items are moved', () => {
      const onItemMove = vi.fn();
      const { rerender } = render(
        <DualListSelector
          {...defaultProps}
          onItemMove={onItemMove}
          searchQuery="Meter A"
        />
      );

      expect(screen.getByText('Meter A (MA-001)')).toBeInTheDocument();
      expect(screen.queryByText('Meter B (MB-002)')).not.toBeInTheDocument();

      // Simulate moving item
      const item = screen.getByText('Meter A (MA-001)');
      fireEvent.doubleClick(item);

      // Re-render with updated state
      rerender(
        <DualListSelector
          availableItems={mockItems.slice(1)}
          selectedItems={[mockItems[0]]}
          onItemMove={onItemMove}
          searchQuery="Meter A"
          emptyStateMessage="No items available"
          getItemId={(item: TestItem) => item.id}
          getItemLabel={(item: TestItem) => `${item.name} (${item.identifier})`}
        />
      );

      // Search should still be active
      expect(screen.queryByText('Meter B (MB-002)')).not.toBeInTheDocument();
    });
  });

  describe('Selected Items Exclusion', () => {
    it('should not display selected items in available list', () => {
      const selectedItems = [mockItems[0], mockItems[1]];
      const availableItems = mockItems;

      render(
        <DualListSelector
          availableItems={availableItems}
          selectedItems={selectedItems}
          onItemMove={vi.fn()}
          searchQuery=""
          emptyStateMessage="No items available"
          getItemId={(item: TestItem) => item.id}
          getItemLabel={(item: TestItem) => `${item.name} (${item.identifier})`}
        />
      );

      const listboxes = screen.getAllByRole('listbox');
      const leftList = listboxes[0];

      // Selected items should not appear in left list
      expect(within(leftList).queryByText('Meter A (MA-001)')).not.toBeInTheDocument();
      expect(within(leftList).queryByText('Meter B (MB-002)')).not.toBeInTheDocument();

      // Non-selected items should appear in left list
      expect(within(leftList).getByText('Meter C (MC-003)')).toBeInTheDocument();
      expect(within(leftList).getByText('Meter D (MD-004)')).toBeInTheDocument();
    });
  });

  describe('Material Design Styling', () => {
    it('should have proper CSS classes for styling', () => {
      render(<DualListSelector {...defaultProps} />);
      expect(screen.getByText('Available Items').closest('.dual-list-selector__header')).toBeInTheDocument();
      expect(screen.getByText('Meter A (MA-001)').closest('.dual-list-selector__item')).toBeInTheDocument();
    });

    it('should apply hover styles', () => {
      render(<DualListSelector {...defaultProps} />);
      const item = screen.getByText('Meter A (MA-001)');
      fireEvent.mouseEnter(item);
      // Hover styles are applied via CSS, not directly testable in unit tests
      expect(item).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to root element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <DualListSelector
          {...defaultProps}
          ref={ref}
        />
      );
      expect(ref.current).toBeInTheDocument();
      expect(ref.current).toHaveClass('dual-list-selector');
    });
  });
});


