import React, { useState } from 'react';
import { IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { MetersListProps } from './types';
import { MeterItem } from './MeterItem';
import { MeterElementItem } from './MeterElementItem';
import { favoritesService } from '../../services/favoritesService';
import './MetersList.css';

/**
 * MetersList Component
 * Renders a list of meters with their elements in a tree structure
 * Handles expand/collapse, selection, and favorite toggling
 */
export const MetersList: React.FC<MetersListProps> = ({
  meters,
  favorites,
  meterElements,
  expandedMeters,
  selectedItem,
  onMeterExpand,
  onMeterSelect,
  onMeterElementSelect,
  onFavoriteToggle,
}) => {
  const [isMetersCollapsed, setIsMetersCollapsed] = useState(true);



  /**
   * Create a click handler for star icon that toggles favorite status
   * Requirements: 2.1, 2.3, 2.5
   * 
   * If element is not favorited: call add_favorite() and update state to filled
   * If element is favorited: call remove_favorite() and update state to outlined
   * Set is_loading to true during operation (handled by caller)
   * Set is_loading to false after operation completes (handled by caller)
   */
  const createStarClickHandler = (meterId: string, elementId: string) => {
    return async () => {
      console.log('[MetersList.createStarClickHandler] Calling onFavoriteToggle with meterId:', meterId, 'elementId:', elementId);
      await onFavoriteToggle(meterId, elementId);
    };
  };

  /**
   * Handle meter expand/collapse
   */
  const handleMeterExpand = (meterId: string) => {
    onMeterExpand(meterId);
  };

  // Use meters as-is without sorting by favorites
  const sortedMeters = meters;

  return (
    <div className="meters-list">
      {/* Meters Header with Collapse Icon */}
      {sortedMeters.length > 0 && (
        <div className="meters-header" onClick={() => setIsMetersCollapsed(!isMetersCollapsed)} style={{ cursor: 'pointer' }}>
          <h3 className="meters-title">Meter Readings</h3>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setIsMetersCollapsed(!isMetersCollapsed); }}
            sx={{ ml: 'auto' }}
          >
            {isMetersCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </div>
      )}

      {/* Meters Content */}
      {!isMetersCollapsed && (
        <>
          {sortedMeters.length === 0 ? (
            <div className="empty-state">No meters available</div>
          ) : (
            sortedMeters.map((meter) => {
              const isExpanded = expandedMeters.has(meter.id);
              const isMeterSelected = selectedItem?.type === 'meter' && selectedItem?.meterId === meter.id;
              const elements = meterElements[meter.id] || [];

              // Meter star is filled only when ALL elements are favorited
              const isMeterFavorite = elements.length > 0 && elements.every((el: any) => el.is_favorited);

              // Bulk-toggle: if all favorited → remove all; otherwise → add all that aren't yet favorited
              const handleMeterStarClick = () => {
                if (isMeterFavorite) {
                  elements.forEach((el: any) => {
                    onFavoriteToggle(meter.id, String(el.meter_element_id));
                  });
                } else {
                  elements.forEach((el: any) => {
                    if (!el.is_favorited) {
                      onFavoriteToggle(meter.id, String(el.meter_element_id));
                    }
                  });
                }
              };

              return (
                <div key={meter.id} className="meter-group">
                  <MeterItem
                    meter={meter}
                    isFavorite={isMeterFavorite}
                    isExpanded={isExpanded}
                    isSelected={isMeterSelected}
                    onExpand={() => handleMeterExpand(meter.id)}
                    onSelect={() => onMeterSelect(meter.id, meter.name)}
                    onFavoriteToggle={handleMeterStarClick}
                  />

                  {/* Meter Elements (shown when expanded) */}
                  {isExpanded && (
                    <div className="meter-elements">
                      {elements.length === 0 ? (
                        <div className="no-elements">No elements</div>
                      ) : (
                        elements.map((element) => {
                          console.log('[MetersList] Element object:', element);
                          
                          const elementId = String(element.meter_element_id);
                          
                          // Use is_favorited from element data if available, otherwise fall back to favorites check
                          const isElementFavorite = element.is_favorited !== undefined 
                            ? element.is_favorited
                            : favoritesService.isFavorite(
                                favorites,
                                parseInt(meter.id),
                                parseInt(elementId)
                              );
                          const isElementSelected =
                            selectedItem?.type === 'element' &&
                            selectedItem?.meterId === meter.id &&
                            selectedItem?.elementId === elementId;

                          return (
                            <MeterElementItem
                              key={elementId}
                              element={element}
                              meterId={meter.id}
                              isFavorite={isElementFavorite}
                              isSelected={isElementSelected}
                              onSelect={() => onMeterElementSelect(meter.id, elementId, element.name, parseInt(element.meter_element_id))}
                              onFavoriteToggle={() => onFavoriteToggle(meter.id, elementId)}
                              id1={meter.id}
                              id2={elementId}
                              is_favorited={isElementFavorite}
                              on_star_click={createStarClickHandler(meter.id, elementId)}
                            />
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
};
