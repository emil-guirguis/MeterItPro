import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SidebarMetersSection } from './SidebarMetersSection';
import { favoritesService } from '../../services/favoritesService';
import type { Favorite } from './types';
import { SidebarDataProvider, clearSidebarDataCache } from '../../contexts/SidebarDataContext';
import { MeterSelectionProvider, useMeterSelection } from '../../contexts/MeterSelectionContext';

function renderWithProviders(ui: React.ReactElement, tenantId = '1', userId = '100') {
  return render(
    <MeterSelectionProvider>
      <SidebarDataProvider tenantId={tenantId} userId={userId}>
        {ui}
      </SidebarDataProvider>
    </MeterSelectionProvider>
  );
}

/** Wrapper that pipes onMeterElementSelect into MeterSelectionContext so selected state reflects in the UI */
function SidebarWithSelection({ onMeterElementSelect: spy, tenantId, userId, ...rest }: any) {
  const { setSelectedMeter, setSelectedElement } = useMeterSelection();
  const handleSelect = (meterId: string, elementId: string, name?: string, num?: number) => {
    setSelectedMeter(meterId);
    setSelectedElement(elementId);
    spy?.(meterId, elementId, name, num);
  };
  return (
    <SidebarMetersSection
      tenantId={tenantId}
      userId={userId}
      onMeterElementSelect={handleSelect}
      {...rest}
    />
  );
}

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
    favorite_name: 'Water Meter - element-Flow Rate',
    order_by: 1,
    ...overrides,
  };
}

describe('SidebarMetersSection Integration Tests', () => {
  const mockTenantId = '1';
  const mockUserId = '100';

  // getMetersWithElements returns meters with embedded elements
  const mockMetersWithElements = [
    {
      id: '1',
      name: 'Water Meter',
      elements: [
        {
          meter_element_id: '101',
          name: 'Flow Rate',
          favorite_name: 'element-Flow Rate',
          is_favorited: false,
        },
        {
          meter_element_id: '102',
          name: 'Pressure',
          favorite_name: 'element-Pressure',
          is_favorited: false,
        },
      ],
    },
    {
      id: '2',
      name: 'Electric Meter',
      elements: [
        {
          meter_element_id: '201',
          name: 'Voltage',
          favorite_name: 'element-Voltage',
          is_favorited: false,
        },
      ],
    },
  ];

  const mockFavorites: Favorite[] = [
    makeFavorite({
      favorite_id: 1,
      id1: 1,
      id2: 101,
      favorite_name: 'Water Meter - element-Flow Rate',
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    clearSidebarDataCache();

    vi.mocked(favoritesService.getMetersWithElements).mockResolvedValue(mockMetersWithElements);
    vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);
    vi.mocked(favoritesService.addFavorite).mockResolvedValue(
      makeFavorite({ favorite_id: 2, id1: 2, id2: 0, favorite_name: 'Electric Meter' })
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should load meters and favorites on mount', async () => {
      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading meters...')).not.toBeInTheDocument();
      });

      expect(favoritesService.getMetersWithElements).toHaveBeenCalledWith(
        parseInt(mockTenantId),
        parseInt(mockUserId)
      );
      expect(favoritesService.getFavorites).toHaveBeenCalledWith(
        parseInt(mockTenantId),
        parseInt(mockUserId)
      );
    });

    it('should display all meters after loading', async () => {
      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
        expect(screen.getByText('Electric Meter')).toBeInTheDocument();
      });
    });

    it('should display loading indicator while fetching data', () => {
      vi.mocked(favoritesService.getMetersWithElements).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      expect(screen.getByText('Loading meters...')).toBeInTheDocument();
    });

    it('should handle loading errors gracefully', async () => {
      const errorMessage = 'Failed to fetch meters';
      vi.mocked(favoritesService.getMetersWithElements).mockRejectedValue(new Error(errorMessage));

      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should provide retry button on error', async () => {
      vi.mocked(favoritesService.getMetersWithElements).mockRejectedValueOnce(
        new Error('Network error')
      );

      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });

      // Reset mock to succeed on retry
      vi.mocked(favoritesService.getMetersWithElements).mockResolvedValue(mockMetersWithElements);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
      });
    });
  });

  describe('Meter Expansion and Element Display', () => {
    it('should expand meter and display elements when expand button is clicked', async () => {
      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
      });

      // Click expand button for Water Meter
      const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
      fireEvent.click(expandButtons[0]);

      // Wait for elements to display using favorite_name field
      await waitFor(() => {
        expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
        expect(screen.getByText('element-Pressure')).toBeInTheDocument();
      });
    });

    it('should collapse meter and hide elements when expanded meter is clicked again', async () => {
      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
      });

      // Expand meter
      const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
      });

      // Collapse meter
      const collapseButton = screen.getByRole('button', { name: /collapse meter/i });
      fireEvent.click(collapseButton);

      // Elements should be hidden
      await waitFor(() => {
        expect(screen.queryByText('element-Flow Rate')).not.toBeInTheDocument();
      });
    });

    it('should persist expanded state to session storage', async () => {
      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
      });

      // Expand meter
      const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
      });

      // Check session storage
      const savedExpanded = sessionStorage.getItem(`expanded-meters-${mockTenantId}`);
      expect(savedExpanded).toBeTruthy();
      const expandedArray = JSON.parse(savedExpanded!);
      expect(expandedArray).toContain('1');
    });
  });

  describe('Element Selection', () => {
    it('should call onMeterElementSelect when element is clicked', async () => {
      const onMeterElementSelect = vi.fn();

      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={onMeterElementSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
      });

      // Expand meter
      const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
      });

      // Click element content
      const flowRateElement = screen.getByText('element-Flow Rate');
      fireEvent.click(flowRateElement);

      expect(onMeterElementSelect).toHaveBeenCalledWith('1', '101', expect.anything(), expect.anything());
    });

    it('should highlight selected element', async () => {
      renderWithProviders(
        <SidebarWithSelection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
      });

      // Expand meter
      const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
      });

      // Click element
      const flowRateElement = screen.getByText('element-Flow Rate').closest('.meter-element-content');
      fireEvent.click(flowRateElement!);

      // Check if selected class is applied
      const elementItem = screen.getByText('element-Flow Rate').closest('.meter-element-item');
      await waitFor(() => {
        expect(elementItem).toHaveClass('selected');
      });
    });
  });

  describe('Favorites Display', () => {
    it('should display favorites section when favorites exist', async () => {
      vi.mocked(favoritesService.getFavorites).mockResolvedValue(mockFavorites);

      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
      });

      // FavoritesSection should appear with the favorite_name
      await waitFor(() => {
        expect(screen.getByText('Water Meter - element-Flow Rate')).toBeInTheDocument();
      });
    });

    it('should not display favorites section when no favorites exist', async () => {
      vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
      });

      // FavoritesSection is not rendered when empty
      expect(screen.queryByText('Favorites')).not.toBeInTheDocument();
    });

    it('should toggle favorite when element star button is clicked', async () => {
      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
      });

      // Expand meter to show elements
      const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
      });

      // Click element star (Add to favorites)
      const addStarButtons = screen.getAllByRole('button', { name: /add to favorites/i });
      const elementStar = addStarButtons.find(
        (btn) => btn.closest('.meter-element-item') !== null
      );
      fireEvent.click(elementStar!);

      await waitFor(() => {
        expect(favoritesService.addFavorite).toHaveBeenCalled();
      });
    });

    it('should handle favorite toggle errors gracefully', async () => {
      // Set up elements with is_favorited=true so toggling will try to remove
      const metersWithFavoritedElements = [
        {
          id: '1',
          name: 'Water Meter',
          elements: [
            {
              meter_element_id: '101',
              name: 'Flow Rate',
              favorite_name: 'element-Flow Rate',
              is_favorited: true,
            },
          ],
        },
      ];
      vi.mocked(favoritesService.getMetersWithElements).mockResolvedValue(metersWithFavoritedElements);
      vi.mocked(favoritesService.getFavorites).mockResolvedValue([
        makeFavorite({ favorite_id: 1, id1: 1, id2: 101 }),
      ]);
      vi.mocked(favoritesService.removeFavoriteById).mockRejectedValue(
        new Error('Failed to remove favorite')
      );

      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
      });

      // Expand meter
      const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
      });

      // Click remove star
      const removeStarButtons = screen.getAllByRole('button', { name: /remove from favorites/i });
      const elementStar = removeStarButtons.find(
        (btn) => btn.closest('.meter-element-item') !== null
      );
      fireEvent.click(elementStar!);

      await waitFor(() => {
        expect(screen.getByText(/Failed to remove favorite/)).toBeInTheDocument();
      });
    });
  });

  describe('Complete User Workflows', () => {
    it('should complete full workflow: expand meter -> click element -> callback fires', async () => {
      const onMeterElementSelect = vi.fn();

      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={onMeterElementSelect}
        />
      );

      // Wait for meters to load
      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
      });

      // Step 1: Expand meter
      const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
      fireEvent.click(expandButtons[0]);

      // Step 2: Wait for elements to appear
      await waitFor(() => {
        expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
      });

      // Step 3: Click element
      const flowRateElement = screen.getByText('element-Flow Rate');
      fireEvent.click(flowRateElement);

      // Step 4: Verify callback was called
      expect(onMeterElementSelect).toHaveBeenCalledWith('1', '101', expect.anything(), expect.anything());
    });

    it('should maintain state across multiple meter expansions', async () => {
      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
        expect(screen.getByText('Electric Meter')).toBeInTheDocument();
      });

      // Expand first meter
      const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
      });

      // Expand second meter
      fireEvent.click(expandButtons[1]);

      await waitFor(() => {
        expect(screen.getByText('element-Voltage')).toBeInTheDocument();
      });

      // Both should remain expanded
      expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
      expect(screen.getByText('element-Voltage')).toBeInTheDocument();

      // Verify session storage has both
      const savedExpanded = sessionStorage.getItem(`expanded-meters-${mockTenantId}`);
      const expandedArray = JSON.parse(savedExpanded!);
      expect(expandedArray).toContain('1');
      expect(expandedArray).toContain('2');
    });
  });

  describe('Data Flow Verification', () => {
    it('should pass correct data to child components', async () => {
      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
      });

      // Verify meter data is displayed
      expect(screen.getByText('Water Meter')).toBeInTheDocument();
      expect(screen.getByText('Electric Meter')).toBeInTheDocument();

      // Expand and verify element data
      const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
        expect(screen.getByText('element-Pressure')).toBeInTheDocument();
      });
    });

    it('should show filled star for favorited elements', async () => {
      // Return meter with is_favorited=true on element 101
      const metersWithFavorited = [
        {
          id: '1',
          name: 'Water Meter',
          elements: [
            {
              meter_element_id: '101',
              name: 'Flow Rate',
              favorite_name: 'element-Flow Rate',
              is_favorited: true,
            },
            {
              meter_element_id: '102',
              name: 'Pressure',
              favorite_name: 'element-Pressure',
              is_favorited: false,
            },
          ],
        },
      ];
      vi.mocked(favoritesService.getMetersWithElements).mockResolvedValue(metersWithFavorited);
      vi.mocked(favoritesService.getFavorites).mockResolvedValue([
        makeFavorite({ id1: 1, id2: 101, favorite_name: 'Water Meter - element-Flow Rate' }),
      ]);

      renderWithProviders(
        <SidebarMetersSection
          tenantId={mockTenantId}
          userId={mockUserId}
          onMeterSelect={vi.fn()}
          onMeterElementSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Water Meter')).toBeInTheDocument();
      });

      // Expand meter
      const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        // Favorited element shows "Remove from favorites" star
        const removeStarButtons = screen.getAllByRole('button', { name: /remove from favorites/i });
        const elementStar = removeStarButtons.find(
          (btn) => btn.closest('.meter-element-item') !== null
        );
        expect(elementStar).toBeInTheDocument();
      });
    });
  });
});
