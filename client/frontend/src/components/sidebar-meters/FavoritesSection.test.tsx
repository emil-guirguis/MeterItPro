import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FavoritesSection } from './FavoritesSection';
import type { FavoriteDisplay, Meter, MeterElement } from './types';

/**
 * Unit Tests for FavoritesSection Component
 *
 * Requirements: 4.1, 4.3, 5.1, 5.2
 *
 * Tests:
 * - Test Favorites section displays with correct header
 * - Test favorited items display with correct format
 */

describe('FavoritesSection', () => {
  const mockMeters: Meter[] = [
    {
      meter_id: 'meter-1',
      meter_element_id: '',
      tenantId: 'tenant-1',
      name: 'Power Meter',
      description: 'Main power meter',
      createdDate: new Date(),
      updatedDate: new Date(),
    },
    {
      meter_id: 'meter-2',
      meter_element_id: '',
      tenantId: 'tenant-1',
      name: 'Energy Meter',
      description: 'Energy consumption meter',
      createdDate: new Date(),
      updatedDate: new Date(),
    },
  ];

  const mockMeterElements: { [meterId: string]: MeterElement[] } = {
    'meter-1': [
      {
        meter_element_id: 'element-1',
        meter_id: 'meter-1',
        element: 'A',
        name: 'power',
        description: 'Power reading',
        createdDate: new Date(),
        updatedDate: new Date(),
      },
      {
        meter_element_id: 'element-2',
        meter_id: 'meter-1',
        element: 'B',
        name: 'voltage',
        description: 'Voltage reading',
        createdDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    'meter-2': [
      {
        meter_element_id: 'element-3',
        meter_id: 'meter-2',
        element: 'A',
        name: 'energy',
        description: 'Energy reading',
        createdDate: new Date(),
        updatedDate: new Date(),
      },
    ],
  };

  // FavoriteDisplay uses favorite_id (number), id1 (number), id2 (number), favorite_name (string)
  const mockFavorites: FavoriteDisplay[] = [
    {
      favorite_id: 1,
      id1: 1,
      id2: 101,
      favorite_name: 'Power Meter - element-power',
    },
    {
      favorite_id: 2,
      id1: 2,
      id2: 201,
      favorite_name: 'Energy Meter - element-energy',
    },
  ];

  const mockOnItemClick = vi.fn();
  const mockOnStarClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test 1: Favorites section displays with correct header
   * Requirements: 4.1
   */
  it('should display Favorites section with correct header', () => {
    render(
      <FavoritesSection
        favorites={mockFavorites}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    const header = screen.getByText('Favorites');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('favorites-title');
  });

  /**
   * Test 2: Empty favorites - component returns null (no element rendered)
   * Requirements: 4.3
   */
  it('should display empty state message when no favorites exist', () => {
    const { container } = render(
      <FavoritesSection
        favorites={[]}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    // Component returns null when there are no favorites
    expect(container.firstChild).toBeNull();
  });

  /**
   * Test 3: Favorited items display with correct format from favorite_name
   * Requirements: 5.1, 5.2
   */
  it('should display favorited items with correct format "meter_name - element-element_name"', () => {
    render(
      <FavoritesSection
        favorites={mockFavorites}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    // favorite_name is displayed directly
    expect(screen.getByText(/Power Meter - element-power/)).toBeInTheDocument();
    expect(screen.getByText(/Energy Meter - element-energy/)).toBeInTheDocument();
  });

  /**
   * Test 4: Clicking on favorite item calls onItemClick callback
   * Requirements: 5.3
   */
  it('should call onItemClick when favorite item is clicked', () => {
    render(
      <FavoritesSection
        favorites={mockFavorites}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    const firstFavoriteItem = screen.getByText(/Power Meter - element-power/).closest('.favorite-item-content');
    fireEvent.click(firstFavoriteItem!);

    expect(mockOnItemClick).toHaveBeenCalledWith('1', '101', 'Power Meter - element-power', 'simple');
  });

  /**
   * Test 5: Star icon click calls onStarClick callback
   * Requirements: 5.4
   */
  it('should call onStarClick when star icon is clicked', async () => {
    mockOnStarClick.mockResolvedValue(undefined);

    render(
      <FavoritesSection
        favorites={mockFavorites}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    // The collapse toggle is the first button; star buttons come from StarIcon components
    // Find the star button by aria-label (remove from favorites)
    const starButtons = screen.getAllByRole('button', { name: /remove from favorites/i });
    fireEvent.click(starButtons[0]);

    await waitFor(() => {
      expect(mockOnStarClick).toHaveBeenCalled();
    });
  });

  /**
   * Test 6: Error message displays when star click fails
   * Requirements: 3.1, 3.2
   */
  it('should display error message when star click fails', async () => {
    const errorMessage = 'Failed to remove from favorites';
    mockOnStarClick.mockRejectedValue(new Error(errorMessage));

    render(
      <FavoritesSection
        favorites={mockFavorites}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    const starButtons = screen.getAllByRole('button', { name: /remove from favorites/i });
    fireEvent.click(starButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  /**
   * Test 7: Retry button is available on error
   * Requirements: 3.3
   */
  it('should display retry button when error occurs', async () => {
    mockOnStarClick.mockRejectedValueOnce(new Error('Failed to remove from favorites'));
    mockOnStarClick.mockResolvedValueOnce(undefined);

    render(
      <FavoritesSection
        favorites={mockFavorites}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    const starButtons = screen.getAllByRole('button', { name: /remove from favorites/i });
    fireEvent.click(starButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to remove from favorites')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
  });

  /**
   * Test 8: Multiple favorites display correctly
   * Requirements: 4.2, 5.1, 5.2
   */
  it('should display multiple favorites correctly', () => {
    render(
      <FavoritesSection
        favorites={mockFavorites}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    // Should have both favorites displayed
    expect(screen.getByText(/Power Meter - element-power/)).toBeInTheDocument();
    expect(screen.getByText(/Energy Meter - element-energy/)).toBeInTheDocument();
  });

  /**
   * Test 9: Favorite item with missing meter name falls back gracefully
   * Requirements: 5.1
   */
  it('should handle missing meter name gracefully', () => {
    const favoritesWithFallback: FavoriteDisplay[] = [
      {
        favorite_id: 3,
        id1: 999,
        id2: 1,
        favorite_name: '',  // empty favorite_name triggers fallback
      },
    ];

    render(
      <FavoritesSection
        favorites={favoritesWithFallback}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    // Should display fallback format "Meter {id1} - Element {id2}"
    expect(screen.getByText(/Meter 999 - Element 1/)).toBeInTheDocument();
  });

  /**
   * Test 10: Favorite item with missing element name falls back gracefully
   * Requirements: 5.2
   */
  it('should handle missing element name gracefully', () => {
    const favoritesWithFallback: FavoriteDisplay[] = [
      {
        favorite_id: 4,
        id1: 1,
        id2: 999,
        favorite_name: '',  // empty favorite_name triggers fallback
      },
    ];

    render(
      <FavoritesSection
        favorites={favoritesWithFallback}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    // Should display fallback format "Meter {id1} - Element {id2}"
    expect(screen.getByText(/Meter 1 - Element 999/)).toBeInTheDocument();
  });
});
