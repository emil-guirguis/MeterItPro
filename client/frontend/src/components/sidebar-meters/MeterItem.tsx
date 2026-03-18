import React from 'react';
import Star from '@mui/icons-material/Star';
import StarOutline from '@mui/icons-material/StarOutline';
import { IconButton } from '@mui/material';
import type { MeterItemProps } from './types';
import './MeterItem.css';

/**
 * MeterItem Component
 * Renders a single meter with expand/collapse and favorite toggle.
 * The star is always visible — clicking it bulk-toggles all elements under this meter.
 */
export const MeterItem: React.FC<MeterItemProps> = ({
  meter,
  isFavorite,
  isExpanded,
  isSelected,
  onExpand,
  onSelect,
  onFavoriteToggle,
}) => {
  return (
    <div className={`meter-item ${isSelected ? 'selected' : ''}`}>
      <div className="meter-item-content" onClick={() => { onExpand(); onSelect(); }}>
        {/* Expand/Collapse Arrow */}
        <button
          className={`expand-button ${isExpanded ? 'expanded' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          aria-label={isExpanded ? 'Collapse meter' : 'Expand meter'}
        >
          ▶
        </button>

        {/* Meter Name */}
        <span className="meter-name">{meter.name}</span>
      </div>

      {/* Star button — always visible, bulk-toggles all elements */}
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle();
        }}
        className={`favorite-button ${isFavorite ? 'favorited' : 'not-favorited'}`}
        aria-label={isFavorite ? 'Remove all elements from favorites' : 'Add all elements to favorites'}
        title={isFavorite ? 'Remove all elements from favorites' : 'Add all elements to favorites'}
        sx={{ padding: '4px' }}
      >
        {isFavorite
          ? <Star sx={{ fontSize: '20px', color: '#ffc107' }} />
          : <StarOutline sx={{ fontSize: '20px', color: '#9e9e9e' }} />
        }
      </IconButton>
    </div>
  );
};
