import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SidebarMetersSection } from './SidebarMetersSection';
import { favoritesService } from '../../services/favoritesService';
import type { Favorite } from './types';

// Mock the services
vi.mock('../../services/favoritesService');

// Helper to build a Favorite matching the current type shape
function makeFavorite(overrides: Partial<Favorite> = {}): Favorite {
  return {
    favorite_id: 1,
    tenant_id: 1,
    users_id: 100,
    table_name: 'meter',
    id1: 1,
    id2: 101,
    created_at: '2024-01-01T00:00:00Z',
    favorite_name: 'Power Meter - element-power',
    order_by: 1,
    ...overrides,
  };
}

/**
 * Real-Time Synchronization Tests for Task 9.1
 *
 * Validates that the Favorites section updates immediately when:
 * 1. A favorite is added from meter elements
 * 2. A favorite is removed from meter elements
 * 3. A favorite is added from Favorites section
 * 4. A favorite is removed from Favorites section
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
describe('Task 9.1: Real-Time Favorites Section Updates', () => {
  const mockTenantId = '1';
  const mockUserId = '100';

  // getMetersWithElements response structure
  const mockMetersWithElements = [
    {
      id: '1',
      name: 'Power Meter',
      elements: [
        {
          meter_element_id: '101',
          name: 'power',
          favorite_name: 'element-power',
          is_favorited: false,
        },
        {
          meter_element_id: '102',
          name: 'voltage',
          favorite_name: 'element-voltage',
          is_favorited: false,
        },
      ],
    },
    {
      id: '2',
      name: 'Energy Meter',
      elements: [
        {
          meter_element_id: '201',
          name: 'energy',
          favorite_name: 'element-energy',
          is_favorited: false,
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(favoritesService.getMetersWithElements).mockResolvedValue(mockMetersWithElements);
    vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);
    vi.mocked(favoritesService.addFavorite).mockResolvedValue(
      makeFavorite({ favorite_id: 1, id1: 1, id2: 101 })
    );
    vi.mocked(favoritesService.removeFavoriteById).mockResolvedValue(undefined);
    vi.mocked(favoritesService.isFavorite).mockImplementation(
      (favorites, meterId, meterElementId) =>
        favorites.some(
          (fav) =>
            fav.id1 === Number(meterId) &&
            (meterElementId === undefined ? fav.id2 === 0 : fav.id2 === Number(meterElementId))
        )
    );

    sessionStorage.clear();
  });

  /**
   * Requirement 6.1: When a favorite is added from meter elements,
   * the Favorites section SHALL update immediately without requiring a page refresh
   */
  it('should update Favorites section immediately when favorite is added from meter elements', async () => {
    // Start with no favorites - FavoritesSection won't render
    vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

    render(
      <SidebarMetersSection
        tenantId={mockTenantId}
        userId={mockUserId}
        onMeterSelect={vi.fn()}
        onMeterElementSelect={vi.fn()}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Power Meter')).toBeInTheDocument();
    });

    // FavoritesSection is hidden when no favorites
    expect(screen.queryByText('Favorites')).not.toBeInTheDocument();

    // Expand meter to show elements
    const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('element-power')).toBeInTheDocument();
    });

    // Mock getFavorites to return the new favorite after add
    const newFavorite = makeFavorite({
      favorite_id: 1,
      id1: 1,
      id2: 101,
      favorite_name: 'Power Meter - element-power',
    });
    vi.mocked(favoritesService.getFavorites).mockResolvedValue([newFavorite]);

    // Click star icon to add favorite (on a meter element)
    const starButtons = screen.getAllByRole('button', { name: /add to favorites/i });
    const powerStarButton = starButtons.find((btn) => {
      return btn.closest('.meter-element-item') !== null;
    });
    fireEvent.click(powerStarButton!);

    // Verify addFavorite was called
    await waitFor(() => {
      expect(favoritesService.addFavorite).toHaveBeenCalled();
    });

    // Verify Favorites section updates immediately with the new favorite
    await waitFor(() => {
      expect(screen.getByText(/Power Meter - element-power/)).toBeInTheDocument();
    });

    // Verify favorites section header appeared
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  /**
   * Requirement 6.2: When a favorite is removed from meter elements,
   * the Favorites section SHALL update immediately without requiring a page refresh
   */
  it('should update Favorites section immediately when favorite is removed from meter elements', async () => {
    // Start with one favorite and is_favorited=true on element
    const initialFavorite = makeFavorite({
      favorite_id: 1,
      id1: 1,
      id2: 101,
      favorite_name: 'Power Meter - element-power',
    });
    vi.mocked(favoritesService.getFavorites).mockResolvedValue([initialFavorite]);

    const metersWithFavoritedElement = [
      {
        id: '1',
        name: 'Power Meter',
        elements: [
          {
            meter_element_id: '101',
            name: 'power',
            favorite_name: 'element-power',
            is_favorited: true,
          },
          {
            meter_element_id: '102',
            name: 'voltage',
            favorite_name: 'element-voltage',
            is_favorited: false,
          },
        ],
      },
    ];
    vi.mocked(favoritesService.getMetersWithElements).mockResolvedValue(metersWithFavoritedElement);

    render(
      <SidebarMetersSection
        tenantId={mockTenantId}
        userId={mockUserId}
        onMeterSelect={vi.fn()}
        onMeterElementSelect={vi.fn()}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Power Meter')).toBeInTheDocument();
    });

    // Verify Favorites section shows the favorite
    await waitFor(() => {
      expect(screen.getByText(/Power Meter - element-power/)).toBeInTheDocument();
    });

    // Expand meter to show elements
    const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('element-power')).toBeInTheDocument();
    });

    // Mock getFavorites to return empty list after removal
    vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

    // Click element star to remove favorite
    const removeStarButtons = screen.getAllByRole('button', { name: /remove from favorites/i });
    const elementStar = removeStarButtons.find(
      (btn) => btn.closest('.meter-element-item') !== null
    );
    fireEvent.click(elementStar!);

    // Verify removeFavoriteById was called
    await waitFor(() => {
      expect(favoritesService.removeFavoriteById).toHaveBeenCalled();
    });

    // Verify Favorites section updates immediately - favorite is removed
    await waitFor(() => {
      expect(screen.queryByText(/Power Meter - element-power/)).not.toBeInTheDocument();
    });

    // FavoritesSection should be gone since no favorites remain
    expect(screen.queryByText('Favorites')).not.toBeInTheDocument();
  });

  /**
   * Requirement 6.3: When a favorite is added from Favorites section,
   * the corresponding star icon in the meter elements section SHALL update immediately
   */
  it('should update star icon in meter elements when favorite is added from Favorites section', async () => {
    // Start with no favorites
    vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

    render(
      <SidebarMetersSection
        tenantId={mockTenantId}
        userId={mockUserId}
        onMeterSelect={vi.fn()}
        onMeterElementSelect={vi.fn()}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Power Meter')).toBeInTheDocument();
    });

    // Expand meter to show elements
    const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('element-power')).toBeInTheDocument();
    });

    // Verify star icon is outlined (not favorited) - star-icon-outlined-{id1}-{id2}
    const outlinedStars = screen.getAllByTestId(/star-icon-outlined/);
    expect(outlinedStars.length).toBeGreaterThan(0);

    // Mock getFavorites to return the new favorite
    const newFavorite = makeFavorite({
      favorite_id: 1,
      id1: 1,
      id2: 101,
      favorite_name: 'Power Meter - element-power',
    });
    vi.mocked(favoritesService.getFavorites).mockResolvedValue([newFavorite]);

    // Click star icon to add favorite
    const starButtons = screen.getAllByRole('button', { name: /add to favorites/i });
    const powerStarButton = starButtons.find((btn) => {
      return btn.closest('.meter-element-item') !== null;
    });
    fireEvent.click(powerStarButton!);

    // Verify addFavorite was called
    await waitFor(() => {
      expect(favoritesService.addFavorite).toHaveBeenCalled();
    });

    // Verify star icon updates to filled immediately
    await waitFor(() => {
      const filledStars = screen.getAllByTestId('star-icon-filled-1-101');
      expect(filledStars.length).toBeGreaterThan(0);
    });
  });

  /**
   * Requirement 6.4: When a favorite is removed from Favorites section,
   * the corresponding star icon in the meter elements section SHALL update immediately
   */
  it('should update star icon in meter elements when favorite is removed from Favorites section', async () => {
    // Start with one favorite and is_favorited=true
    const initialFavorite = makeFavorite({
      favorite_id: 1,
      id1: 1,
      id2: 101,
      favorite_name: 'Power Meter - element-power',
    });
    vi.mocked(favoritesService.getFavorites).mockResolvedValue([initialFavorite]);

    const metersWithFavoritedElement = [
      {
        id: '1',
        name: 'Power Meter',
        elements: [
          {
            meter_element_id: '101',
            name: 'power',
            favorite_name: 'element-power',
            is_favorited: true,
          },
          {
            meter_element_id: '102',
            name: 'voltage',
            favorite_name: 'element-voltage',
            is_favorited: false,
          },
        ],
      },
    ];
    vi.mocked(favoritesService.getMetersWithElements).mockResolvedValue(metersWithFavoritedElement);

    render(
      <SidebarMetersSection
        tenantId={mockTenantId}
        userId={mockUserId}
        onMeterSelect={vi.fn()}
        onMeterElementSelect={vi.fn()}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Power Meter')).toBeInTheDocument();
    });

    // Verify Favorites section shows the favorite
    await waitFor(() => {
      expect(screen.getByText(/Power Meter - element-power/)).toBeInTheDocument();
    });

    // Expand meter to show elements
    const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('element-power')).toBeInTheDocument();
    });

    // Verify star icon is filled (favorited) in meter elements
    const filledStars = screen.getAllByTestId('star-icon-filled-1-101');
    expect(filledStars.length).toBeGreaterThan(0);

    // Mock getFavorites to return empty list after removal
    vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

    // Click star icon in Favorites section to remove favorite
    const favoriteStarButtons = screen.getAllByRole('button', { name: /remove from favorites/i });
    const favoriteSectionStarButton = favoriteStarButtons.find((btn) => {
      return btn.closest('.favorite-item') !== null;
    });
    fireEvent.click(favoriteSectionStarButton!);

    // Verify removeFavoriteById was called
    await waitFor(() => {
      expect(favoritesService.removeFavoriteById).toHaveBeenCalled();
    });

    // Verify star icon in meter elements updates to outlined immediately
    await waitFor(() => {
      const outlinedStars = screen.getAllByTestId('star-icon-outlined-1-101');
      expect(outlinedStars.length).toBeGreaterThan(0);
    });
  });

  /**
   * Integration test: Complete round-trip synchronization
   * Add favorite from meter -> verify in Favorites section
   * Remove favorite from Favorites section -> verify in meter
   */
  it('should maintain real-time sync through complete add/remove cycle', async () => {
    // Start with no favorites
    vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

    render(
      <SidebarMetersSection
        tenantId={mockTenantId}
        userId={mockUserId}
        onMeterSelect={vi.fn()}
        onMeterElementSelect={vi.fn()}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Power Meter')).toBeInTheDocument();
    });

    // Step 1: Expand meter
    const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('element-power')).toBeInTheDocument();
    });

    // Step 2: Add favorite from meter element
    const newFavorite = makeFavorite({
      favorite_id: 1,
      id1: 1,
      id2: 101,
      favorite_name: 'Power Meter - element-power',
    });
    vi.mocked(favoritesService.getFavorites).mockResolvedValue([newFavorite]);

    const starButtons = screen.getAllByRole('button', { name: /add to favorites/i });
    const powerStarButton = starButtons.find((btn) => {
      return btn.closest('.meter-element-item') !== null;
    });
    fireEvent.click(powerStarButton!);

    // Step 3: Verify favorite appears in Favorites section
    await waitFor(() => {
      expect(screen.getByText(/Power Meter - element-power/)).toBeInTheDocument();
    });

    // Step 4: Remove favorite from Favorites section
    vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

    const favoriteStarButtons = screen.getAllByRole('button', { name: /remove from favorites/i });
    const favoriteSectionStarButton = favoriteStarButtons.find((btn) => {
      return btn.closest('.favorite-item') !== null;
    });
    fireEvent.click(favoriteSectionStarButton!);

    // Step 5: Verify favorite is removed
    await waitFor(() => {
      expect(screen.queryByText(/Power Meter - element-power/)).not.toBeInTheDocument();
    });

    // Verify star icon is outlined again in meter elements
    const outlinedStars = screen.getAllByTestId('star-icon-outlined-1-101');
    expect(outlinedStars.length).toBeGreaterThan(0);
  });

  /**
   * Test multiple favorites sync simultaneously
   */
  it('should sync multiple favorites simultaneously', async () => {
    // Start with no favorites
    vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

    render(
      <SidebarMetersSection
        tenantId={mockTenantId}
        userId={mockUserId}
        onMeterSelect={vi.fn()}
        onMeterElementSelect={vi.fn()}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Power Meter')).toBeInTheDocument();
    });

    // Expand both meters
    const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
    fireEvent.click(expandButtons[0]);
    fireEvent.click(expandButtons[1]);

    await waitFor(() => {
      expect(screen.getByText('element-power')).toBeInTheDocument();
      expect(screen.getByText('element-energy')).toBeInTheDocument();
    });

    // Set up two favorites to appear after adding
    const multipleFavorites: Favorite[] = [
      makeFavorite({
        favorite_id: 1,
        id1: 1,
        id2: 101,
        favorite_name: 'Power Meter - element-power',
        order_by: 1,
      }),
      makeFavorite({
        favorite_id: 2,
        id1: 2,
        id2: 201,
        favorite_name: 'Energy Meter - element-energy',
        order_by: 2,
      }),
    ];
    vi.mocked(favoritesService.getFavorites).mockResolvedValue(multipleFavorites);

    // Click first element star to add favorite
    const starButtons = screen.getAllByRole('button', { name: /add to favorites/i });
    fireEvent.click(starButtons[0]);

    await waitFor(() => {
      expect(favoritesService.addFavorite).toHaveBeenCalled();
    });

    // Reset and add second favorite
    vi.mocked(favoritesService.addFavorite).mockClear();
    fireEvent.click(starButtons[1]);

    await waitFor(() => {
      expect(favoritesService.addFavorite).toHaveBeenCalled();
    });

    // Verify both favorites appear in Favorites section
    await waitFor(() => {
      expect(screen.getByText(/Power Meter - element-power/)).toBeInTheDocument();
      expect(screen.getByText(/Energy Meter - element-energy/)).toBeInTheDocument();
    });
  });
});
