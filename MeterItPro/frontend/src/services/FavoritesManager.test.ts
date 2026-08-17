import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FavoritesManager, type FavoriteRecord } from './FavoritesManager';

describe('FavoritesManager', () => {
  let manager: FavoritesManager;
  let mockApiClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock API client
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
      },
    };
    
    manager = new FavoritesManager(mockApiClient);
  });

  describe('load_favorites', () => {
    it('should load favorites from API and populate internal map', async () => {
      const mockFavorites: FavoriteRecord[] = [
        {
          favorite_id: 1,
          tenant_id: 'tenant1',
          user_id: 'user1',
          meter_id: 'meter1',
          meter_element_id: 'element1',
          table_name: 'meter',
        },
        {
          favorite_id: 2,
          tenant_id: 'tenant1',
          user_id: 'user1',
          meter_id: 'meter2',
          meter_element_id: 'element2',
          table_name: 'meter',
        },
      ];

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockFavorites },
      });

      const result = await manager.load_favorites('user1');

      expect(result).toEqual(mockFavorites);
      expect(mockApiClient.get).toHaveBeenCalledWith('/favorites', {
        params: { user_id: 'user1' },
      });
      expect(manager.is_favorited('meter1', 'element1')).toBe(true);
      expect(manager.is_favorited('meter2', 'element2')).toBe(true);
    });

    it('should handle empty favorites list', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: [] },
      });

      const result = await manager.load_favorites('user1');

      expect(result).toEqual([]);
      expect(manager.get_all_favorites()).toEqual([]);
    });

    it('should throw error on API failure', async () => {
      mockApiClient.get.mockRejectedValue(
        new Error('Network error')
      );

      await expect(manager.load_favorites('user1')).rejects.toThrow(
        'Network error occurred'
      );
    });
  });;;

  describe('add_favorite', () => {
    it('should add favorite and update internal map', async () => {
      const mockFavorite: FavoriteRecord = {
        favorite_id: 1,
        tenant_id: 'tenant1',
        user_id: 'user1',
        meter_id: 'meter1',
        meter_element_id: 'element1',
        table_name: 'meter',
      };

      mockApiClient.post.mockResolvedValue({
        data: { success: true, data: mockFavorite },
      });

      const result = await manager.add_favorite('meter1', 'element1', 'user1');

      expect(result).toEqual(mockFavorite);
      expect(mockApiClient.post).toHaveBeenCalledWith('/favorites', {
        user_id: 'user1',
        meter_id: 'meter1',
        meter_element_id: 'element1',
        table_name: 'meter',
      });
      expect(manager.is_favorited('meter1', 'element1')).toBe(true);
    });

    it('should throw error on API failure', async () => {
      mockApiClient.post.mockRejectedValue(
        new Error('Failed to add favorite')
      );

      await expect(
        manager.add_favorite('meter1', 'element1', 'user1')
      ).rejects.toThrow('Network error occurred');
    });
  });

  describe('remove_favorite', () => {
    it('should remove favorite and update internal map', async () => {
      const mockFavorite: FavoriteRecord = {
        favorite_id: 1,
        tenant_id: 'tenant1',
        user_id: 'user1',
        meter_id: 'meter1',
        meter_element_id: 'element1',
        table_name: 'meter',
      };

      mockApiClient.delete.mockResolvedValue({
        data: { success: true, data: mockFavorite },
      });

      // First add a favorite
      manager['favorites'].set('meter1:element1', mockFavorite);
      expect(manager.is_favorited('meter1', 'element1')).toBe(true);

      // Then remove it
      await manager.remove_favorite('meter1', 'element1', 'user1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/favorites', {
        params: {
          user_id: 'user1',
          meter_id: 'meter1',
          meter_element_id: 'element1',
        },
      });
      expect(manager.is_favorited('meter1', 'element1')).toBe(false);
    });

    it('should throw error on API failure', async () => {
      mockApiClient.delete.mockRejectedValue(
        new Error('Failed to remove favorite')
      );

      await expect(
        manager.remove_favorite('meter1', 'element1', 'user1')
      ).rejects.toThrow('Network error occurred');
    });
  });

  describe('is_favorited', () => {
    it('should return true for favorited element', () => {
      const mockFavorite: FavoriteRecord = {
        favorite_id: 1,
        tenant_id: 'tenant1',
        user_id: 'user1',
        meter_id: 'meter1',
        meter_element_id: 'element1',
        table_name: 'meter',
      };

      manager['favorites'].set('meter1:element1', mockFavorite);

      expect(manager.is_favorited('meter1', 'element1')).toBe(true);
    });

    it('should return false for non-favorited element', () => {
      expect(manager.is_favorited('meter1', 'element1')).toBe(false);
    });

    it('should distinguish between different elements', () => {
      const mockFavorite: FavoriteRecord = {
        favorite_id: 1,
        tenant_id: 'tenant1',
        user_id: 'user1',
        meter_id: 'meter1',
        meter_element_id: 'element1',
        table_name: 'meter',
      };

      manager['favorites'].set('meter1:element1', mockFavorite);

      expect(manager.is_favorited('meter1', 'element1')).toBe(true);
      expect(manager.is_favorited('meter1', 'element2')).toBe(false);
      expect(manager.is_favorited('meter2', 'element1')).toBe(false);
    });
  });

  describe('get_all_favorites', () => {
    it('should return all cached favorites', () => {
      const mockFavorites: FavoriteRecord[] = [
        {
          favorite_id: 1,
          tenant_id: 'tenant1',
          user_id: 'user1',
          meter_id: 'meter1',
          meter_element_id: 'element1',
          table_name: 'meter',
        },
        {
          favorite_id: 2,
          tenant_id: 'tenant1',
          user_id: 'user1',
          meter_id: 'meter2',
          meter_element_id: 'element2',
          table_name: 'meter',
        },
      ];

      manager['favorites'].set('meter1:element1', mockFavorites[0]);
      manager['favorites'].set('meter2:element2', mockFavorites[1]);

      const result = manager.get_all_favorites();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockFavorites[0]);
      expect(result).toContainEqual(mockFavorites[1]);
    });

    it('should return empty array when no favorites cached', () => {
      const result = manager.get_all_favorites();

      expect(result).toEqual([]);
    });
  });

  describe('clear_cache', () => {
    it('should clear all cached favorites', () => {
      const mockFavorite: FavoriteRecord = {
        favorite_id: 1,
        tenant_id: 'tenant1',
        user_id: 'user1',
        meter_id: 'meter1',
        meter_element_id: 'element1',
        table_name: 'meter',
      };

      manager['favorites'].set('meter1:element1', mockFavorite);
      expect(manager.is_favorited('meter1', 'element1')).toBe(true);

      manager.clear_cache();

      expect(manager.is_favorited('meter1', 'element1')).toBe(false);
      expect(manager.get_all_favorites()).toEqual([]);
    });
  });

  describe('internal map key format', () => {
    it('should use "id1:id2" format for map keys', () => {
      const mockFavorite: FavoriteRecord = {
        favorite_id: 1,
        tenant_id: 'tenant1',
        user_id: 'user1',
        meter_id: 'meter123',
        meter_element_id: 'element456',
        table_name: 'meter',
      };

      manager['favorites'].set('meter123:element456', mockFavorite);

      expect(manager.is_favorited('meter123', 'element456')).toBe(true);
      expect(manager.get_all_favorites()).toHaveLength(1);
    });
  });
});
