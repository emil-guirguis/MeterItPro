// Users Entity Store

import type { User } from '../../types/auth';
import { createEntityStore, createEntityHook } from '../../store/slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../../store/middleware/apiMiddleware';
import { tokenStorage } from '../../utils/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Real API service
const usersService = {
  async getAll(params?: any) {
    return withTokenRefresh(async () => {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      // Flatten filters into query parameters
      if (params?.filters) {
        Object.entries(params.filters).forEach(([key, value]: [string, any]) => {
          // Skip empty, null, or undefined values
          if (value !== '' && value !== null && value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }
      
      // Add search parameter if provided
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/users?${queryString}` : '/users';
      
      const token = tokenStorage.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        items: data.data?.items || [],
        total: data.data?.total || 0,
        hasMore: false,
      };
    });
  },

  async getById(id: string) {
    return withTokenRefresh(async () => {
      const token = tokenStorage.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    });
  },

  async create(data: Partial<User>) {
    return withTokenRefresh(async () => {
      const token = tokenStorage.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data;
    });
  },

  async update(id: string, data: Partial<User>) {
    return withTokenRefresh(async () => {
      const token = tokenStorage.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data;
    });
  },

  async delete(id: string) {
    return withTokenRefresh(async () => {
      const token = tokenStorage.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    });
  },
};

// Create users store
export const useUsersStore = createEntityStore(usersService, {
  name: 'user',
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxAge: 30 * 60 * 1000, // 30 minutes
  },
});

// Create users hook
export const useUsers = createEntityHook(useUsersStore);

// Enhanced users hook with additional functionality
export const useUsersEnhanced = () => {
  const users = useUsers();
  
  return {
    ...users,
    
    // Additional computed values
    // activeUsers: users.items.filter(user => user.active),
    // inactiveUsers: users.items.filter(user => user.active ),
    // adminUsers: users.items.filter(user => user.role === 'admin'),
    
    // Enhanced actions with notifications
    createUser: async (data: Partial<User>) => {
      return withApiCall(
        () => users.createItem(data),
        {
          loadingKey: 'createUser',
          showSuccessNotification: true,
          successMessage: 'User created successfully',
        }
      );
    },
    
    updateUser: async (id: string, data: Partial<User>) => {
      return withApiCall(
        () => users.updateItem(id, data),
        {
          loadingKey: 'updateUser',
          showSuccessNotification: true,
          successMessage: 'User updated successfully',
        }
      );
    },
    
    deleteUser: async (id: string) => {
      return withApiCall(
        () => users.deleteItem(id),
        {
          loadingKey: 'deleteUser',
          showSuccessNotification: true,
          successMessage: 'User deleted successfully',
        }
      );
    },
    
    // Bulk operations
    bulkUpdateStatus: async (userIds: string[], status: 'active' | 'inactive') => {
      return withApiCall(
        async () => {
          const promises = userIds.map(id => users.updateItem(id, { status }));
          await Promise.all(promises);
        },
        {
          loadingKey: 'bulkUpdateUsers',
          showSuccessNotification: true,
          successMessage: `${userIds.length} users updated successfully`,
        }
      );
    },
    
    // Search and filter helpers
    searchUsers: (query: string) => {
      users.setSearch(query);
      users.fetchItems();
    },
    
    filterByRole: (role: string) => {
      users.setFilters({ ...users.list.filters, role });
      users.fetchItems();
    },
    
    filterByStatus: (status: string) => {
      users.setFilters({ ...users.list.filters, status });
      users.fetchItems();
    },
  };
};