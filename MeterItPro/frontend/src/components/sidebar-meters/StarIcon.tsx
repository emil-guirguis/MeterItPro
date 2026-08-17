import React from 'react';
import Star from '@mui/icons-material/Star';
import StarOutline from '@mui/icons-material/StarOutline';
import { CircularProgress, IconButton } from '@mui/material';
import './StarIcon.css';

/**
 * StarIcon Component
 * Renders a star icon that can be filled or outlined, with loading state support.
 * Used to toggle favorite status for meter elements.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

export interface StarIconProps {
  id1: string;  // meter_id
  id2: string;  // meter_element_id
  is_favorited: boolean;
  is_loading: boolean;
  on_click: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
}

export const StarIcon: React.FC<StarIconProps> = ({
  id1,
  id2,
  is_favorited,
  is_loading,
  on_click,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Stop event propagation to prevent element click
    e.stopPropagation();
    on_click(e);
  };

  return (
    <div className="star-icon-container">
      <IconButton
        size="small"
        onClick={handleClick}
        disabled={is_loading}
        className={`star-icon-button ${is_favorited ? 'favorited' : 'not-favorited'}`}
        aria-label={is_favorited ? 'Remove from favorites' : 'Add to favorites'}
        title={is_favorited ? 'Remove from favorites' : 'Add to favorites'}
        data-testid={`star-icon-${id1}-${id2}`}
      >
        {is_loading ? (
          <CircularProgress
            size={24}
            className="star-icon-loading"
            data-testid={`star-icon-loading-${id1}-${id2}`}
          />
        ) : is_favorited ? (
          <Star
            className="star-icon-filled"
            data-testid={`star-icon-filled-${id1}-${id2}`}
            sx={{ fontSize: '20px' }}
          />
        ) : (
          <StarOutline
            className="star-icon-outlined"
            data-testid={`star-icon-outlined-${id1}-${id2}`}
            sx={{ fontSize: '20px' }}
          />
        )}
      </IconButton>
    </div>
  );
};

export default StarIcon;
