import React, { useEffect, useState, useCallback } from 'react';

/** Measure pixel width of a text string using canvas (no DOM side effects) */
function measureTextWidth(text: string, font: string): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  ctx.font = font;
  return ctx.measureText(text).width;
}

import type { SidebarMetersProps, SelectedItem } from './types';
import { MetersList } from './MetersList';
import { FavoritesSection } from './FavoritesSection';
import { useMeterSelection } from '../../contexts/MeterSelectionContext';
import { useSidebarData } from '../../contexts/SidebarDataContext';
import './SidebarMetersSection.css';

export const SidebarMetersSection: React.FC<SidebarMetersProps> = ({
  tenantId,
  onMeterSelect,
  onMeterElementSelect,
  mode = 'all',
}) => {
  const {
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
  } = useSidebarData();

  const [expandedMeters, setExpandedMeters] = useState<Set<string>>(new Set());

  // Derive selectedItem from shared context so both sidebar instances stay in sync
  const { selectedMeter, selectedElement } = useMeterSelection();
  const selectedItem: SelectedItem | null = selectedMeter
    ? { type: selectedElement ? 'element' : 'meter', meterId: selectedMeter, elementId: selectedElement ?? undefined }
    : null;

  /**
   * Dynamically resize the sidebar to fit the widest favorite name, max 350px.
   */
  useEffect(() => {
    if (mode !== 'favorites' && mode !== 'all') return;
    const font = '13px system-ui, -apple-system, sans-serif';
    const overhead = 110;
    const minWidth = 200;
    const maxWidth = 350;

    const maxTextWidth = favoriteDisplays.reduce((max, fav) => {
      const w = measureTextWidth(fav.favorite_name || '', font);
      return w > max ? w : max;
    }, 0);

    const desired = favoriteDisplays.length > 0
      ? Math.min(maxWidth, Math.max(minWidth, Math.ceil(maxTextWidth + overhead)))
      : 300;

    const appLayout = document.querySelector('.app-layout') as HTMLElement | null;
    if (appLayout) {
      appLayout.style.setProperty('--sidebar-width', `${desired}px`);
    }
  }, [favoriteDisplays, mode]);

  /** Restore expanded meters from session storage on mount */
  useEffect(() => {
    const savedExpanded = sessionStorage.getItem(`expanded-meters-${tenantId}`);
    if (savedExpanded) {
      try {
        setExpandedMeters(new Set(JSON.parse(savedExpanded)));
      } catch {
        // ignore parse errors
      }
    }
  }, [tenantId]);

  const handleMeterExpand = useCallback((meterId: string) => {
    setExpandedMeters((prev) => {
      const next = new Set(prev);
      if (next.has(meterId)) {
        next.delete(meterId);
      } else {
        next.add(meterId);
      }
      sessionStorage.setItem(`expanded-meters-${tenantId}`, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [tenantId]);

  const handleMeterSelect = useCallback(
    (meterId: string, meterName?: string) => onMeterSelect(meterId, meterName),
    [onMeterSelect]
  );

  const handleMeterElementSelect = useCallback(
    (meterId: string, elementId: string, elementName?: string, elementNumber?: number) =>
      onMeterElementSelect(meterId, elementId, elementName, elementNumber),
    [onMeterElementSelect]
  );

  const handleFavoritesItemClick = useCallback(
    (meterId: string, elementId: string, favoriteName?: string, gridType?: 'simple' | 'baselist') =>
      onMeterElementSelect(meterId, elementId, favoriteName, undefined, gridType),
    [onMeterElementSelect]
  );

  const handleFavoritesStarClick = useCallback(
    async (favoriteId: number, meterId: string, elementId: string) => {
      await removeFavorite(favoriteId, meterId, elementId);
    },
    [removeFavorite]
  );

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
          {(mode === 'all' || mode === 'favorites') && favoriteDisplays.length > 0 && (
            <FavoritesSection
              favorites={favoriteDisplays}
              meters={meters}
              meterElements={meterElements}
              selectedItem={selectedItem}
              onItemClick={handleFavoritesItemClick}
              onStarClick={handleFavoritesStarClick}
              onReorder={reorderFavorites}
            />
          )}

          {(mode === 'all' || mode === 'meters') && (
            <MetersList
              meters={meters}
              favorites={favorites}
              meterElements={meterElements}
              expandedMeters={expandedMeters}
              selectedItem={selectedItem}
              onMeterExpand={handleMeterExpand}
              onMeterSelect={handleMeterSelect}
              onMeterElementSelect={handleMeterElementSelect}
              onFavoriteToggle={toggleFavorite}
            />
          )}
        </>
      )}
    </div>
  );
};
