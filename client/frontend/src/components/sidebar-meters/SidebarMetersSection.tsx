import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { SidebarMetersProps, Meter, Favorite, SelectedItem, FavoriteDisplay, MeterElement } from './types';
import { MetersList } from './MetersList';
import { FavoritesSection } from './FavoritesSection';
import { favoritesService } from '../../services/favoritesService';
import { validateTenantId, validateUserId, handleApiError } from './errorHandling';
import './SidebarMetersSection.css';

/**
 * SidebarMetersSection Component
 * Main container component that manages the sidebar section
 * Handles data loading, state management, and user interactions
 */
/**
 * Cache to persist sidebar data across component remounts
 * This prevents unnecessary API calls when navigating between routes
 */
const sidebarDataCache = new Map<string, {
  meters: Meter[];
  favorites: Favorite[];
  meterElements: { [meterId: string]: MeterElement[] };
}>();

export const SidebarMetersSection: React.FC<SidebarMetersProps> = ({
  tenantId,
  userId,
  onMeterSelect,
  onMeterElementSelect,
}) => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [meterElements, setMeterElements] = useState<{ [meterId: string]: MeterElement[] }>({});
  const [expandedMeters, setExpandedMeters] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache key for this tenant/user combination
  const cacheKey = `${tenantId}:${userId}`;


  /**
   * Load meters and favorites from API
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      validateTenantId(tenantId);
      validateUserId(userId);

      // Load meters with elements and favorite status in one call
      const metersData = await favoritesService.getMetersWithElements(parseInt(tenantId), parseInt(userId));

      // Extract meters and elements from the response
      const meters = metersData.map(m => ({
        id: m.id,
        name: m.name,
        tenantId,
        createdDate: new Date(),
        updatedDate: new Date()
      }));

      // Flatten elements for easier access
      const allElements: { [meterId: string]: any[] } = {};

      metersData.forEach((meter: any) => {
        allElements[meter.id] = meter.elements || [];
      });

      // Load favorites separately to get order_by field
      const allFavorites = await favoritesService.getFavorites(parseInt(tenantId), parseInt(userId));

      setMeters(meters);
      setFavorites(allFavorites);
      setMeterElements(allElements);

      // Cache the data
      sidebarDataCache.set(cacheKey, {
        meters,
        favorites: allFavorites,
        meterElements: allElements
      });
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      console.error('Error loading meters:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, userId, cacheKey]);

  /**
   * Load meters and favorites on component mount
   * First try to restore from cache to avoid flickering
   */
  useEffect(() => {
    // Try to restore from cache first
    const cachedData = sidebarDataCache.get(cacheKey);
    if (cachedData) {
      setMeters(cachedData.meters);
      setFavorites(cachedData.favorites);
      setMeterElements(cachedData.meterElements);
      setLoading(false);
      // Still refresh in the background to get latest data
      loadData();
    } else {
      // No cache, load from API
      loadData();
    }
  }, [cacheKey, loadData]);

  /**
   * Handle meter expansion/collapse
   */
  const handleMeterExpand = useCallback((meterId: string) => {
    setExpandedMeters((prev) => {
      const next = new Set(prev);
      if (next.has(meterId)) {
        next.delete(meterId);
      } else {
        next.add(meterId);
      }
      // Save to session storage
      sessionStorage.setItem(`expanded-meters-${tenantId}`, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [tenantId]);

  /**
   * Handle meter selection
   */
  const handleMeterSelect = useCallback(
    (meterId: string, meterName?: string) => {
      setSelectedItem({ type: 'meter', meterId });
      onMeterSelect(meterId, meterName);
    },
    [onMeterSelect]
  );

  /**
   * Handle meter element selection
   */
  const handleMeterElementSelect = useCallback(
    (meterId: string, elementId: string, elementName?: string, elementNumber?: number) => {
      setSelectedItem({ type: 'element', meterId, elementId });
      onMeterElementSelect(meterId, elementId, elementName, elementNumber);
    },
    [onMeterElementSelect]
  );

  /**
   * Handle favorite toggle - toggles favorite status for a meter element
   * Requirements: 2.1, 2.3, 2.5
   * 
   * If element is not favorited: call add_favorite() and update state to filled
   * If element is favorited: call remove_favorite() and update state to outlined
   * Set is_loading to true during operation (handled by caller)
   * Set is_loading to false after operation completes (handled by caller)
   */
  const handleFavoriteToggle = useCallback(
    async (meterId: string, elementId?: string) => {
      try {
        const meterIdNum = parseInt(meterId);
        const elementIdNum = elementId ? parseInt(elementId) : undefined;

        // Determine favorite state from meterElements (source of truth for the star UI)
        const elements = meterElements[meterIdNum] || meterElements[meterId] || [];
        const element = elementIdNum !== undefined
          ? elements.find((el: any) => Number(el.meter_element_id) === elementIdNum)
          : null;
        const isFavorited = element ? !!element.is_favorited : false;

        if (isFavorited) {
          // Find the favorite record to get its ID, using Number() to avoid type mismatches
          const favorite = favorites.find(
            (fav) => Number(fav.id1) === meterIdNum && Number(fav.id2) === (elementIdNum ?? 0)
          );
          if (favorite) {
            await favoritesService.removeFavoriteById(favorite.favorite_id, parseInt(tenantId));
          }

          // Remove from favorites state
          setFavorites((prev) =>
            prev.filter((fav) => !(Number(fav.id1) === meterIdNum && Number(fav.id2) === (elementIdNum ?? 0)))
          );

          // Update meterElements to reflect unfavorited status
          setMeterElements((prev) => {
            const updated = { ...prev };
            const key = updated[meterIdNum] ? meterIdNum : meterId;
            if (updated[key]) {
              updated[key] = updated[key].map((el: any) =>
                Number(el.meter_element_id) === (elementIdNum ?? 0)
                  ? { ...el, is_favorited: false }
                  : el
              );
            }
            return updated;
          });
        } else {
          // Add favorite
          await favoritesService.addFavorite(
            parseInt(tenantId),
            parseInt(userId),
            'meter',
            meterIdNum,
            elementIdNum
          );

          // Reload favorites to get the new record with favorite_id and favorite_name
          const updatedFavorites = await favoritesService.getFavorites(
            parseInt(tenantId),
            parseInt(userId)
          );
          setFavorites(updatedFavorites);

          // Update meterElements to reflect favorited status
          setMeterElements((prev) => {
            const updated = { ...prev };
            const key = updated[meterIdNum] ? meterIdNum : meterId;
            if (updated[key]) {
              updated[key] = updated[key].map((el: any) =>
                Number(el.meter_element_id) === (elementIdNum ?? 0)
                  ? { ...el, is_favorited: true }
                  : el
              );
            }
            return updated;
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update favorite';
        setError(message);
        console.error('Error updating favorite:', err);
      }
    },
    [tenantId, userId, favorites, meterElements]
  );

  /**
   * Create FavoriteDisplay objects from favorites
   * Requirements: 4.2, 5.1, 5.2
   */
  const favoriteDisplays = useMemo<FavoriteDisplay[]>(() => {
    return favorites.map((fav) => {
      return {
        favorite_id: fav.favorite_id,
        id1: fav.id1,
        id2: fav.id2,
        favorite_name: fav.favorite_name || '',
        order_by: fav.order_by,
      };
    });
  }, [favorites]);

  /**
   * Handle reorder of favorites from drag-and-drop
   */
  const handleFavoritesReorder = useCallback(
    async (reorderedFavorites: FavoriteDisplay[]) => {
      // Build the order update payload
      const orderedIds = reorderedFavorites.map((fav, index) => ({
        favorite_id: fav.favorite_id,
        order_by: index + 1,
      }));

      console.log('[SidebarMetersSection] Reorder called, orderedIds:', orderedIds);

      // Optimistically update the favorites state to match the new order
      setFavorites((prev) => {
        const reordered = reorderedFavorites.map((display, index) => {
          const original = prev.find((f) => Number(f.favorite_id) === Number(display.favorite_id));
          return original ? { ...original, order_by: index + 1 } : null;
        }).filter(Boolean) as typeof prev;
        return reordered.length > 0 ? reordered : prev;
      });

      // Persist to backend
      try {
        await favoritesService.updateFavoriteOrder(parseInt(tenantId), parseInt(userId), orderedIds);
        console.log('[SidebarMetersSection] Order saved successfully');
      } catch (err) {
        console.error('[SidebarMetersSection] Error saving favorite order:', err);
        setError('Failed to save favorite order');
      }
    },
    [tenantId, userId]
  );

  /**
   * Handle favorite item click from FavoritesSection
   * Requirements: 5.3
   */
  const handleFavoritesItemClick = useCallback(
    (meterId: string, elementId: string, favoriteName?: string, gridType?: 'simple' | 'baselist') => {
      console.log('[SidebarMetersSection] ===== FAVORITE ITEM CLICK HANDLER =====');
      console.log('[SidebarMetersSection] meterId:', meterId, 'type:', typeof meterId);
      console.log('[SidebarMetersSection] elementId:', elementId, 'type:', typeof elementId);
      console.log('[SidebarMetersSection] favoriteName:', favoriteName);
      console.log('[SidebarMetersSection] gridType:', gridType);
      console.log('[SidebarMetersSection] Setting selected item and calling onMeterElementSelect');
      
      setSelectedItem({ type: 'element', meterId, elementId });
      onMeterElementSelect(meterId, elementId, favoriteName, undefined, gridType);
      console.log('[SidebarMetersSection] ===== FAVORITE ITEM CLICK COMPLETE =====');
    },
    [onMeterElementSelect]
  );

  /**
   * Handle star click from FavoritesSection
   * Requirements: 5.4, 6.2
   * 
   * When clicking a star in the FavoritesSection, it's always a removal
   * since only favorited items are shown there
   */
  const handleFavoritesStarClick = useCallback(
    async (favoriteId: number, meterId: string, elementId: string) => {
      const meterIdNum = parseInt(meterId);
      const elementIdNum = parseInt(elementId);

      try {
        // Remove favorite from database using favorite_id
        await favoritesService.removeFavoriteById(
          favoriteId,
          parseInt(tenantId)
        );
      } catch (err) {
        console.error('Error removing favorite:', err);
        // Re-throw so FavoritesSection can handle the error
        throw err;
      }

      // Update favorites list by removing the item
      setFavorites((prev) =>
        prev.filter(
          (fav) => !(Number(fav.id1) === meterIdNum && Number(fav.id2) === elementIdNum)
        )
      );

      // Update meterElements to reflect unfavorited status
      setMeterElements((prev) => {
        const updated = { ...prev };
        const key = updated[meterIdNum] ? meterIdNum : meterId;
        if (updated[key]) {
          updated[key] = updated[key].map((el: any) =>
            Number(el.meter_element_id) === elementIdNum
              ? { ...el, is_favorited: false }
              : el
          );
        }
        return updated;
      });
    },
    [tenantId]
  );

  /**
   * Restore expanded meters from session storage on mount
   */
  useEffect(() => {
    const savedExpanded = sessionStorage.getItem(`expanded-meters-${tenantId}`);
    if (savedExpanded) {
      try {
        const expandedArray = JSON.parse(savedExpanded);
        setExpandedMeters(new Set(expandedArray));
      } catch (err) {
        console.error('Error restoring expanded meters:', err);
      }
    }
  }, [tenantId]);

  if (loading) {
    return (
      <div className="sidebar-meters-section">
        <div className="loading-state">Loading meters...</div>
      </div>
    );
  }

  return (
    <div className="sidebar-meters-section">
      {error && (
        <div className="error-state">
          <div className="error-message">{error}</div>
          <button className="retry-button" onClick={loadData} type="button">
            Retry
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* FavoritesSection - only display if there are favorites */}
          {favoriteDisplays.length > 0 && (
            <FavoritesSection
              favorites={favoriteDisplays}
              meters={meters}
              meterElements={meterElements}
              onItemClick={handleFavoritesItemClick}
              onStarClick={handleFavoritesStarClick}
              onReorder={handleFavoritesReorder}
            />
          )}

          {/* MetersList - displays all meters and their elements */}
          <MetersList
            meters={meters}
            favorites={favorites}
            meterElements={meterElements}
            expandedMeters={expandedMeters}
            selectedItem={selectedItem}
            onMeterExpand={handleMeterExpand}
            onMeterSelect={handleMeterSelect}
            onMeterElementSelect={handleMeterElementSelect}
            onFavoriteToggle={handleFavoriteToggle}
          />
        </>
      )}
    </div>
  );
};
