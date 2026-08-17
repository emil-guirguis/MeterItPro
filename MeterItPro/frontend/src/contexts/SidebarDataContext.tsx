import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { Meter, Favorite, MeterElement, FavoriteDisplay } from '../components/sidebar-meters/types';
import { favoritesService } from '../services/favoritesService';
import { validateTenantId, validateUserId, handleApiError } from '../components/sidebar-meters/errorHandling';

/** Cache to persist sidebar data across provider remounts */
const sidebarDataCache = new Map<string, {
  meters: Meter[];
  favorites: Favorite[];
  meterElements: { [meterId: string]: MeterElement[] };
}>();

interface SidebarDataContextType {
  meters: Meter[];
  favorites: Favorite[];
  meterElements: { [meterId: string]: MeterElement[] };
  favoriteDisplays: FavoriteDisplay[];
  loading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
  toggleFavorite: (meterId: string, elementId?: string) => Promise<void>;
  removeFavorite: (favoriteId: number, meterId: string, elementId: string) => Promise<void>;
  reorderFavorites: (reorderedFavorites: FavoriteDisplay[]) => Promise<void>;
}

const SidebarDataContext = createContext<SidebarDataContextType | undefined>(undefined);

export const SidebarDataProvider: React.FC<{
  tenantId: string;
  userId: string;
  children: React.ReactNode;
}> = ({ tenantId, userId, children }) => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [meterElements, setMeterElements] = useState<{ [meterId: string]: MeterElement[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `${tenantId}:${userId}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      validateTenantId(tenantId);
      validateUserId(userId);

      const metersData = await favoritesService.getMetersWithElements(parseInt(tenantId), parseInt(userId));

      const loadedMeters = metersData.map((m: any) => ({
        id: m.id,
        name: m.name,
        is_virtual: m.is_virtual,
        installation_date: m.installation_date,
        is_favorited: m.is_favorited,
        tenantId,
        createdDate: new Date(),
        updatedDate: new Date(),
      }));

      const allElements: { [meterId: string]: any[] } = {};
      metersData.forEach((meter: any) => {
        allElements[meter.id] = meter.elements || [];
      });

      const allFavorites = await favoritesService.getFavorites(parseInt(tenantId), parseInt(userId));

      setMeters(loadedMeters);
      setFavorites(allFavorites);
      setMeterElements(allElements);

      sidebarDataCache.set(cacheKey, {
        meters: loadedMeters,
        favorites: allFavorites,
        meterElements: allElements,
      });
    } catch (err) {
      setError(handleApiError(err));
      console.error('Error loading sidebar meters:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, userId, cacheKey]);

  // Restore from cache immediately on mount (no network hit).
  // Actual data fetching is deferred until SidebarMetersSection mounts
  // (i.e. when the user expands the sidebar section for the first time).
  useEffect(() => {
    const cached = sidebarDataCache.get(cacheKey);
    if (cached) {
      setMeters(cached.meters);
      setFavorites(cached.favorites);
      setMeterElements(cached.meterElements);
    }
  }, [cacheKey]);

  const toggleFavorite = useCallback(
    async (meterId: string, elementId?: string) => {
      if (!elementId) return;

      const meterIdNum = parseInt(meterId);
      const elementIdNum = parseInt(elementId);
      const isVirtualMeter = elementIdNum === 0;

      try {
        let isFavorited: boolean;

        if (isVirtualMeter) {
          const meter = meters.find((m: any) => Number(m.id) === meterIdNum);
          isFavorited = !!(meter as any)?.is_favorited;
        } else {
          const elements = meterElements[meterIdNum] || meterElements[meterId] || [];
          const element = elements.find((el: any) => Number(el.meter_element_id) === elementIdNum);
          isFavorited = element ? !!element.is_favorited : false;
        }

        if (isFavorited) {
          const favorite = favorites.find(
            (fav) => Number(fav.id1) === meterIdNum && Number(fav.id2) === elementIdNum
          );
          if (favorite) {
            await favoritesService.removeFavoriteById(favorite.favorite_id, parseInt(tenantId));
          }

          setFavorites((prev) =>
            prev.filter((fav) => !(Number(fav.id1) === meterIdNum && Number(fav.id2) === elementIdNum))
          );

          if (isVirtualMeter) {
            setMeters((prev) =>
              prev.map((m: any) => Number(m.id) === meterIdNum ? { ...m, is_favorited: false } : m)
            );
          } else {
            setMeterElements((prev) => {
              const updated = { ...prev };
              const key = (updated[meterIdNum] ? meterIdNum : meterId) as any;
              if (updated[key]) {
                updated[key] = updated[key].map((el: any) =>
                  Number(el.meter_element_id) === elementIdNum ? { ...el, is_favorited: false } : el
                );
              }
              return updated;
            });
          }
        } else {
          await favoritesService.addFavorite(
            parseInt(tenantId),
            parseInt(userId),
            'meter',
            meterIdNum,
            isVirtualMeter ? 0 : elementIdNum
          );

          const updatedFavorites = await favoritesService.getFavorites(parseInt(tenantId), parseInt(userId));
          setFavorites(updatedFavorites);

          if (isVirtualMeter) {
            setMeters((prev) =>
              prev.map((m: any) => Number(m.id) === meterIdNum ? { ...m, is_favorited: true } : m)
            );
          } else {
            setMeterElements((prev) => {
              const updated = { ...prev };
              const key = (updated[meterIdNum] ? meterIdNum : meterId) as any;
              if (updated[key]) {
                updated[key] = updated[key].map((el: any) =>
                  Number(el.meter_element_id) === elementIdNum ? { ...el, is_favorited: true } : el
                );
              }
              return updated;
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update favorite');
        console.error('Error toggling favorite:', err);
      }
    },
    [tenantId, userId, favorites, meterElements, meters]
  );

  const removeFavorite = useCallback(
    async (favoriteId: number, meterId: string, elementId: string) => {
      const meterIdNum = parseInt(meterId);
      const elementIdNum = parseInt(elementId);

      await favoritesService.removeFavoriteById(favoriteId, parseInt(tenantId));

      setFavorites((prev) =>
        prev.filter((fav) => !(Number(fav.id1) === meterIdNum && Number(fav.id2) === elementIdNum))
      );
      setMeterElements((prev) => {
        const updated = { ...prev };
        const key = (updated[meterIdNum] ? meterIdNum : meterId) as any;
        if (updated[key]) {
          updated[key] = updated[key].map((el: any) =>
            Number(el.meter_element_id) === elementIdNum ? { ...el, is_favorited: false } : el
          );
        }
        return updated;
      });
    },
    [tenantId]
  );

  const reorderFavorites = useCallback(
    async (reorderedFavorites: FavoriteDisplay[]) => {
      const orderedIds = reorderedFavorites.map((fav, index) => ({
        favorite_id: fav.favorite_id,
        order_by: index + 1,
      }));

      setFavorites((prev) => {
        const reordered = reorderedFavorites.map((display, index) => {
          const original = prev.find((f) => Number(f.favorite_id) === Number(display.favorite_id));
          return original ? { ...original, order_by: index + 1 } : null;
        }).filter(Boolean) as typeof prev;
        return reordered.length > 0 ? reordered : prev;
      });

      try {
        await favoritesService.updateFavoriteOrder(parseInt(tenantId), parseInt(userId), orderedIds);
      } catch (err) {
        console.error('Error saving favorite order:', err);
        setError('Failed to save favorite order');
      }
    },
    [tenantId, userId]
  );

  const favoriteDisplays = useMemo<FavoriteDisplay[]>(() =>
    favorites.map((fav) => ({
      favorite_id: fav.favorite_id,
      id1: fav.id1,
      id2: fav.id2,
      favorite_name: fav.favorite_name || '',
      order_by: fav.order_by,
    })),
    [favorites]
  );

  const value = useMemo(() => ({
    meters,
    favorites,
    meterElements,
    favoriteDisplays,
    loading,
    error,
    loadData,
    toggleFavorite,
    removeFavorite,
    reorderFavorites,
  }), [meters, favorites, meterElements, favoriteDisplays, loading, error, loadData, toggleFavorite, removeFavorite, reorderFavorites]);

  return (
    <SidebarDataContext.Provider value={value}>
      {children}
    </SidebarDataContext.Provider>
  );
};

export const useSidebarData = () => {
  const context = useContext(SidebarDataContext);
  if (!context) throw new Error('useSidebarData must be used within SidebarDataProvider');
  return context;
};

/** Clear the module-level cache — intended for use in tests only */
export const clearSidebarDataCache = () => sidebarDataCache.clear();
