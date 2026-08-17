import { describe, it, expect } from 'vitest';
import { favoritesService } from './favoritesService';
import type { Favorite } from '../components/sidebar-meters/types';

/**
 * Unit Tests for FavoritesService
 * Tests the favorite checking logic
 */
describe('FavoritesService', () => {
  describe('isFavorite', () => {
    it('should return true for favorited meter', () => {
      const favorites: Favorite[] = [
        {
          favorite_id: 1,
          tenant_id: 1,
          users_id: 1,
          table_name: 'meter',
          id1: 100,
          id2: 0,
          created_at: '',
        },
      ];

      const result = favoritesService.isFavorite(favorites, 100);

      expect(result).toBe(true);
    });

    it('should return false for non-favorited meter', () => {
      const favorites: Favorite[] = [
        {
          favorite_id: 1,
          tenant_id: 1,
          users_id: 1,
          table_name: 'meter',
          id1: 100,
          id2: 0,
          created_at: '',
        },
      ];

      const result = favoritesService.isFavorite(favorites, 200);

      expect(result).toBe(false);
    });

    it('should return true for favorited meter element', () => {
      const favorites: Favorite[] = [
        {
          favorite_id: 1,
          tenant_id: 1,
          users_id: 1,
          table_name: 'meter_element',
          id1: 100,
          id2: 50,
          created_at: '',
        },
      ];

      const result = favoritesService.isFavorite(favorites, 100, 50);

      expect(result).toBe(true);
    });

    it('should return false for non-favorited meter element', () => {
      const favorites: Favorite[] = [
        {
          favorite_id: 1,
          tenant_id: 1,
          users_id: 1,
          table_name: 'meter_element',
          id1: 100,
          id2: 50,
          created_at: '',
        },
      ];

      const result = favoritesService.isFavorite(favorites, 100, 60);

      expect(result).toBe(false);
    });

    it('should distinguish between meter and element favorites', () => {
      const favorites: Favorite[] = [
        {
          favorite_id: 1,
          tenant_id: 1,
          users_id: 1,
          table_name: 'meter',
          id1: 100,
          id2: 0, // Meter favorite
          created_at: '',
        },
        {
          favorite_id: 2,
          tenant_id: 1,
          users_id: 1,
          table_name: 'meter_element',
          id1: 100,
          id2: 50, // Element favorite
          created_at: '',
        },
      ];

      // Meter should be favorited
      expect(favoritesService.isFavorite(favorites, 100)).toBe(true);

      // Element should be favorited
      expect(favoritesService.isFavorite(favorites, 100, 50)).toBe(true);

      // Different element should not be favorited
      expect(favoritesService.isFavorite(favorites, 100, 60)).toBe(false);
    });

    it('should handle empty favorites array', () => {
      const favorites: Favorite[] = [];

      const result = favoritesService.isFavorite(favorites, 100);

      expect(result).toBe(false);
    });

  });
});
