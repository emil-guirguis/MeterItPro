import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MeterElementItem } from './MeterElementItem';
import type { MeterElement } from './types';

describe('MeterElementItem Component', () => {
  const mockElement: MeterElement = {
    meter_element_id: '1',
    meter_id: 'meter-1',
    element: 'A',
    name: 'power',
    favorite_name: 'element-power',
    description: 'A test element',
    createdDate: new Date(),
    updatedDate: new Date(),
  };

  it('renders element name formatted as "element-element_name"', () => {
    const mockCallbacks = {
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
    };

    render(
      <MeterElementItem
        element={mockElement}
        meterId="meter-1"
        isFavorite={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('element-power')).toBeInTheDocument();
  });

  it('renders StarIcon component when on_star_click is provided', () => {
    const mockCallbacks = {
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
      on_star_click: vi.fn(),
    };

    const { container } = render(
      <MeterElementItem
        element={mockElement}
        meterId="meter-1"
        id1="meter-1"
        id2="element-1"
        isFavorite={false}
        is_favorited={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    const starIconContainer = container.querySelector('.star-icon-container');
    expect(starIconContainer).toBeInTheDocument();
  });

  it('displays filled star icon when is_favorited is true', () => {
    const mockCallbacks = {
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
      on_star_click: vi.fn(),
    };

    const { container } = render(
      <MeterElementItem
        element={mockElement}
        meterId="meter-1"
        id1="meter-1"
        id2="element-1"
        isFavorite={false}
        is_favorited={true}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    const filledStar = container.querySelector('[data-testid="star-icon-filled-meter-1-element-1"]');
    expect(filledStar).toBeInTheDocument();
  });

  it('displays outlined star icon when is_favorited is false', () => {
    const mockCallbacks = {
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
      on_star_click: vi.fn(),
    };

    const { container } = render(
      <MeterElementItem
        element={mockElement}
        meterId="meter-1"
        id1="meter-1"
        id2="element-1"
        isFavorite={false}
        is_favorited={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    const outlinedStar = container.querySelector('[data-testid="star-icon-outlined-meter-1-element-1"]');
    expect(outlinedStar).toBeInTheDocument();
  });

  it('calls on_star_click when star icon is clicked', async () => {
    const on_star_click = vi.fn().mockResolvedValue(undefined);
    const mockCallbacks = {
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
      on_star_click,
    };

    const { container } = render(
      <MeterElementItem
        element={mockElement}
        meterId="meter-1"
        id1="meter-1"
        id2="element-1"
        isFavorite={false}
        is_favorited={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    const starButton = container.querySelector('[data-testid="star-icon-meter-1-element-1"]');
    if (!starButton) throw new Error('Star button not found');

    fireEvent.click(starButton);

    await waitFor(() => {
      expect(on_star_click).toHaveBeenCalled();
    });
  });

  it('calls onSelect when element content is clicked', () => {
    const onSelect = vi.fn();
    const mockCallbacks = {
      onSelect,
      onFavoriteToggle: vi.fn(),
    };

    render(
      <MeterElementItem
        element={mockElement}
        meterId="meter-1"
        isFavorite={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    const elementName = screen.getByText('element-power');
    fireEvent.click(elementName);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('applies selected class when isSelected is true', () => {
    const mockCallbacks = {
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
    };

    const { container } = render(
      <MeterElementItem
        element={mockElement}
        meterId="meter-1"
        isFavorite={false}
        isSelected={true}
        {...mockCallbacks}
      />
    );

    const elementItem = container.querySelector('.meter-element-item');
    expect(elementItem).toHaveClass('selected');
  });

  it('shows favorite button on hover when on_star_click is not provided (backward compatibility)', () => {
    const mockCallbacks = {
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
    };

    const { container } = render(
      <MeterElementItem
        element={mockElement}
        meterId="meter-1"
        isFavorite={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    const elementItem = container.querySelector('.meter-element-item');
    if (!elementItem) throw new Error('Element item not found');

    fireEvent.mouseEnter(elementItem);

    const favoriteButton = screen.getByRole('button', { name: /add to favorites/i });
    expect(favoriteButton).toBeInTheDocument();
  });

  it('calls onFavoriteToggle when favorite button is clicked (backward compatibility)', () => {
    const onFavoriteToggle = vi.fn();
    const mockCallbacks = {
      onSelect: vi.fn(),
      onFavoriteToggle,
    };

    const { container } = render(
      <MeterElementItem
        element={mockElement}
        meterId="meter-1"
        isFavorite={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    const elementItem = container.querySelector('.meter-element-item');
    if (!elementItem) throw new Error('Element item not found');

    fireEvent.mouseEnter(elementItem);

    const favoriteButton = screen.getByRole('button', { name: /add to favorites/i });
    fireEvent.click(favoriteButton);

    expect(onFavoriteToggle).toHaveBeenCalledTimes(1);
  });

  it('does not display star icon when on_star_click is not provided', () => {
    const mockCallbacks = {
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
    };

    const { container } = render(
      <MeterElementItem
        element={mockElement}
        meterId="meter-1"
        isFavorite={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    const starIconContainer = container.querySelector('.star-icon-container');
    expect(starIconContainer).not.toBeInTheDocument();
  });

  it('stops event propagation when star icon is clicked', async () => {
    const on_star_click = vi.fn().mockResolvedValue(undefined);
    const onSelect = vi.fn();
    const mockCallbacks = {
      onSelect,
      onFavoriteToggle: vi.fn(),
      on_star_click,
    };

    const { container } = render(
      <MeterElementItem
        element={mockElement}
        meterId="meter-1"
        id1="meter-1"
        id2="element-1"
        isFavorite={false}
        is_favorited={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    const starButton = container.querySelector('[data-testid="star-icon-meter-1-element-1"]');
    if (!starButton) throw new Error('Star button not found');

    fireEvent.click(starButton);

    await waitFor(() => {
      expect(on_star_click).toHaveBeenCalled();
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when add favorite fails', async () => {
      const on_star_click = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockCallbacks = {
        onSelect: vi.fn(),
        onFavoriteToggle: vi.fn(),
        on_star_click,
      };

      const { container } = render(
        <MeterElementItem
          element={mockElement}
          meterId="meter-1"
          id1="meter-1"
          id2="element-1"
          isFavorite={false}
          is_favorited={false}
          isSelected={false}
          {...mockCallbacks}
        />
      );

      const starButton = container.querySelector('[data-testid="star-icon-meter-1-element-1"]');
      if (!starButton) throw new Error('Star button not found');

      fireEvent.click(starButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to add to favorites. Please try again.')).toBeInTheDocument();
      });
    });

    it('displays error message when remove favorite fails', async () => {
      const on_star_click = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockCallbacks = {
        onSelect: vi.fn(),
        onFavoriteToggle: vi.fn(),
        on_star_click,
      };

      const { container } = render(
        <MeterElementItem
          element={mockElement}
          meterId="meter-1"
          id1="meter-1"
          id2="element-1"
          isFavorite={true}
          is_favorited={true}
          isSelected={false}
          {...mockCallbacks}
        />
      );

      const starButton = container.querySelector('[data-testid="star-icon-meter-1-element-1"]');
      if (!starButton) throw new Error('Star button not found');

      fireEvent.click(starButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to remove from favorites. Please try again.')).toBeInTheDocument();
      });
    });

    it('keeps star icon in previous state when operation fails', async () => {
      const on_star_click = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockCallbacks = {
        onSelect: vi.fn(),
        onFavoriteToggle: vi.fn(),
        on_star_click,
      };

      const { container, rerender } = render(
        <MeterElementItem
          element={mockElement}
          meterId="meter-1"
          id1="meter-1"
          id2="element-1"
          isFavorite={false}
          is_favorited={false}
          isSelected={false}
          {...mockCallbacks}
        />
      );

      // Verify initial state is outlined
      let outlinedStar = container.querySelector('[data-testid="star-icon-outlined-meter-1-element-1"]');
      expect(outlinedStar).toBeInTheDocument();

      const starButton = container.querySelector('[data-testid="star-icon-meter-1-element-1"]');
      if (!starButton) throw new Error('Star button not found');

      fireEvent.click(starButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to add to favorites. Please try again.')).toBeInTheDocument();
      });

      // Verify star icon is still outlined (state preserved)
      outlinedStar = container.querySelector('[data-testid="star-icon-outlined-meter-1-element-1"]');
      expect(outlinedStar).toBeInTheDocument();
    });

    it('provides retry option in error message', async () => {
      const on_star_click = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockCallbacks = {
        onSelect: vi.fn(),
        onFavoriteToggle: vi.fn(),
        on_star_click,
      };

      const { container } = render(
        <MeterElementItem
          element={mockElement}
          meterId="meter-1"
          id1="meter-1"
          id2="element-1"
          isFavorite={false}
          is_favorited={false}
          isSelected={false}
          {...mockCallbacks}
        />
      );

      const starButton = container.querySelector('[data-testid="star-icon-meter-1-element-1"]');
      if (!starButton) throw new Error('Star button not found');

      fireEvent.click(starButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to add to favorites. Please try again.')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('retries operation when retry button is clicked', async () => {
      const on_star_click = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
      const mockCallbacks = {
        onSelect: vi.fn(),
        onFavoriteToggle: vi.fn(),
        on_star_click,
      };

      const { container } = render(
        <MeterElementItem
          element={mockElement}
          meterId="meter-1"
          id1="meter-1"
          id2="element-1"
          isFavorite={false}
          is_favorited={false}
          isSelected={false}
          {...mockCallbacks}
        />
      );

      const starButton = container.querySelector('[data-testid="star-icon-meter-1-element-1"]');
      if (!starButton) throw new Error('Star button not found');

      // First click fails
      fireEvent.click(starButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to add to favorites. Please try again.')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Verify retry was called
      await waitFor(() => {
        expect(on_star_click).toHaveBeenCalledTimes(2);
      });
    });

    it('clears error message when retry is successful', async () => {
      const on_star_click = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
      const mockCallbacks = {
        onSelect: vi.fn(),
        onFavoriteToggle: vi.fn(),
        on_star_click,
      };

      const { container } = render(
        <MeterElementItem
          element={mockElement}
          meterId="meter-1"
          id1="meter-1"
          id2="element-1"
          isFavorite={false}
          is_favorited={false}
          isSelected={false}
          {...mockCallbacks}
        />
      );

      const starButton = container.querySelector('[data-testid="star-icon-meter-1-element-1"]');
      if (!starButton) throw new Error('Star button not found');

      // First click fails
      fireEvent.click(starButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to add to favorites. Please try again.')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Verify error message is cleared after successful retry
      await waitFor(() => {
        expect(screen.queryByText('Failed to add to favorites. Please try again.')).not.toBeInTheDocument();
      });
    });

    it('logs error details for debugging', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const on_star_click = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockCallbacks = {
        onSelect: vi.fn(),
        onFavoriteToggle: vi.fn(),
        on_star_click,
      };

      const { container } = render(
        <MeterElementItem
          element={mockElement}
          meterId="meter-1"
          id1="meter-1"
          id2="element-1"
          isFavorite={false}
          is_favorited={false}
          isSelected={false}
          {...mockCallbacks}
        />
      );

      const starButton = container.querySelector('[data-testid="star-icon-meter-1-element-1"]');
      if (!starButton) throw new Error('Star button not found');

      fireEvent.click(starButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[MeterElementItem] Error toggling favorite'),
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
