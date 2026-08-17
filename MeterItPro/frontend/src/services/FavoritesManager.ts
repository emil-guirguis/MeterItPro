import axios from 'axios';
import type { AxiosResponse, AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Favorite record from the API
 */
export interface FavoriteRecord {
  favorite_id: number;
  tenant_id: string;
  user_id: string;
  meter_id: string;
  meter_element_id: string;
  table_name: string;
  created_at?: string;
}

/**
 * FavoritesManager - Service for managing user favorites
 * Handles loading, adding, and removing favorites with internal caching
 */
export class FavoritesManager {
  private apiClient: AxiosInstance;

  // Internal map of favorites keyed by "id1:id2" (meter_id:meter_element_id)
  private favorites: Map<string, FavoriteRecord> = new Map();

  constructor(apiClient?: AxiosInstance) {
    // Use provided apiClient or create a new one
    if (apiClient) {
      this.apiClient = apiClient;
    } else {
      this.apiClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Add request interceptor to include auth token
      this.apiClient.interceptors.request.use(
        (config) => {
          const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * Load all favorites for a specific user and tenant from the API
   * @param users_id - The user ID
   * @returns Promise<FavoriteRecord[]> - Array of favorite records
   */
  async load_favorites(users_id: string): Promise<FavoriteRecord[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: FavoriteRecord[] }> = await this.apiClient.get(
        '/favorites',
        { params: { user_id: users_id } }
      );

      const favorites = response.data.data || [];

      // Clear and rebuild internal map
      this.favorites.clear();
      for (const favorite of favorites) {
        const key = `${favorite.meter_id}:${favorite.meter_element_id}`;
        this.favorites.set(key, favorite);
      }

      return favorites;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch favorites';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Add a favorite via API
   * @param id1 - The meter ID
   * @param id2 - The meter element ID
   * @param users_id - The user ID
   * @returns Promise<FavoriteRecord> - The created favorite record
   */
  async add_favorite(
    id1: string,
    id2: string,
    users_id: string
  ): Promise<FavoriteRecord> {
    try {
      const payload = {
        user_id: users_id,
        meter_id: id1,
        meter_element_id: id2,
        table_name: 'meter',
      };

      const response: AxiosResponse<{ success: boolean; data: FavoriteRecord }> = await this.apiClient.post(
        '/favorites',
        payload
      );

      const favorite = response.data.data;

      // Update internal map
      const key = `${id1}:${id2}`;
      this.favorites.set(key, favorite);

      return favorite;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to add favorite';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Remove a favorite via API
   * @param id1 - The meter ID
   * @param id2 - The meter element ID
   * @param users_id - The user ID
   * @returns Promise<void>
   */
  async remove_favorite(
    id1: string,
    id2: string,
    users_id: string
  ): Promise<void> {
    try {
      await this.apiClient.delete('/favorites', {
        params: {
          user_id: users_id,
          meter_id: id1,
          meter_element_id: id2,
        },
      });

      // Update internal map
      const key = `${id1}:${id2}`;
      this.favorites.delete(key);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to remove favorite';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Check if an element is favorited
   * @param id1 - The meter ID
   * @param id2 - The meter element ID
   * @returns boolean - True if the element is favorited
   */
  is_favorited(id1: string, id2: string): boolean {
    const key = `${id1}:${id2}`;
    return this.favorites.has(key);
  }

  /**
   * Get all favorites from internal cache
   * @returns FavoriteRecord[] - Array of all cached favorites
   */
  get_all_favorites(): FavoriteRecord[] {
    return Array.from(this.favorites.values());
  }

  /**
   * Clear the internal favorites cache
   */
  clear_cache(): void {
    this.favorites.clear();
  }
}

// Export singleton instance
export const favoritesManager = new FavoritesManager();
export default favoritesManager;
