// Generic CRUD Operations Pattern

import { withApiCall } from '../middleware/apiMiddleware';
import type { EntityStoreSlice } from '../types';

// Generic CRUD operations interface
export interface CrudOperations<T> {
  // Read operations
  fetchAll: (params?: any) => Promise<void>;
  fetchById: (id: string) => Promise<T>;
  refresh: () => Promise<void>;
  
  // Create operations
  create: (data: Partial<T>) => Promise<T>;
  createMultiple: (items: Partial<T>[]) => Promise<T[]>;
  
  // Update operations
  update: (id: string, data: Partial<T>) => Promise<T>;
  updateMultiple: (updates: Array<{ id: string; data: Partial<T> }>) => Promise<T[]>;
  
  // Delete operations
  delete: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<void>;
  
  // Bulk operations
  bulkUpdate: (ids: string[], data: Partial<T>) => Promise<T[]>;
  bulkDelete: (ids: string[]) => Promise<void>;
  
  // State management
  setSelected: (item: T | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Create CRUD operations for an entity store
export const createCrudOperations = <T extends { id: string }>(
  store: EntityStoreSlice<T>,
  entityName: string
): CrudOperations<T> => {
  
  return {
    // Read operations
    fetchAll: async (params?: any) => {
      return withApiCall(
        () => store.fetchItems(params),
        {
          loadingKey: `fetch${entityName}`,
          showErrorNotification: true,
        }
      );
    },

    fetchById: async (id: string) => {
      return withApiCall(
        () => store.fetchItem(id),
        {
          loadingKey: `fetch${entityName}Item`,
          showErrorNotification: true,
        }
      );
    },

    refresh: async () => {
      // Force refresh by clearing cache
      store.setLastFetch(0);
      return store.fetchItems();
    },

    // Create operations
    create: async (data: Partial<T>) => {
      return withApiCall(
        () => store.createItem(data),
        {
          loadingKey: `create${entityName}`,
          showSuccessNotification: true,
          successMessage: `${entityName} created successfully`,
        }
      );
    },

    createMultiple: async (items: Partial<T>[]) => {
      return withApiCall(
        async () => {
          const promises = items.map(item => store.createItem(item));
          return Promise.all(promises);
        },
        {
          loadingKey: `createMultiple${entityName}`,
          showSuccessNotification: true,
          successMessage: `${items.length} ${entityName.toLowerCase()}s created successfully`,
        }
      );
    },

    // Update operations
    update: async (id: string, data: Partial<T>) => {
      return withApiCall(
        () => store.updateItemById(id, data),
        {
          loadingKey: `update${entityName}`,
          showSuccessNotification: true,
          successMessage: `${entityName} updated successfully`,
        }
      );
    },

    updateMultiple: async (updates: Array<{ id: string; data: Partial<T> }>) => {
      return withApiCall(
        async () => {
          const promises = updates.map(({ id, data }) => store.updateItemById(id, data));
          return Promise.all(promises);
        },
        {
          loadingKey: `updateMultiple${entityName}`,
          showSuccessNotification: true,
          successMessage: `${updates.length} ${entityName.toLowerCase()}s updated successfully`,
        }
      );
    },

    // Delete operations
    delete: async (id: string) => {
      return withApiCall(
        () => store.deleteItem(id),
        {
          loadingKey: `delete${entityName}`,
          showSuccessNotification: true,
          successMessage: `${entityName} deleted successfully`,
        }
      );
    },

    deleteMultiple: async (ids: string[]) => {
      return withApiCall(
        async () => {
          const promises = ids.map(id => store.deleteItem(id));
          await Promise.all(promises);
        },
        {
          loadingKey: `deleteMultiple${entityName}`,
          showSuccessNotification: true,
          successMessage: `${ids.length} ${entityName.toLowerCase()}s deleted successfully`,
        }
      );
    },

    // Bulk operations
    bulkUpdate: async (ids: string[], data: Partial<T>) => {
      return withApiCall(
        async () => {
          const promises = ids.map(id => store.updateItemById(id, data));
          return Promise.all(promises);
        },
        {
          loadingKey: `bulkUpdate${entityName}`,
          showSuccessNotification: true,
          successMessage: `${ids.length} ${entityName.toLowerCase()}s updated successfully`,
        }
      );
    },

    bulkDelete: async (ids: string[]) => {
      return withApiCall(
        async () => {
          const promises = ids.map(id => store.deleteItem(id));
          await Promise.all(promises);
        },
        {
          loadingKey: `bulkDelete${entityName}`,
          showSuccessNotification: true,
          successMessage: `${ids.length} ${entityName.toLowerCase()}s deleted successfully`,
        }
      );
    },

    // State management
    setSelected: (item: T | null) => {
      store.setSelectedItem(item);
    },

    clearError: () => {
      store.setError(null);
    },

    reset: () => {
      store.reset();
    },
  };
};

// Optimistic update patterns
export const createOptimisticOperations = <T extends { id: string }>(
  store: EntityStoreSlice<T>
) => {
  return {
    // Optimistic create
    optimisticCreate: async (tempItem: T, apiCall: () => Promise<T>) => {
      // Add temporary item with loading state
      const tempId = `temp_${Date.now()}`;
      const tempItemWithId = { ...tempItem, id: tempId };
      
      store.addItem(tempItemWithId);
      
      try {
        const realItem = await apiCall();
        
        // Replace temp item with real item
        store.removeItem(tempId);
        store.addItem(realItem);
        
        return realItem;
      } catch (error) {
        // Remove temp item on error
        store.removeItem(tempId);
        throw error;
      }
    },

    // Optimistic update
    optimisticUpdate: async (id: string, updates: Partial<T>, apiCall: () => Promise<T>) => {
      const originalItem = store.items.find(item => item.id === id);
      
      if (!originalItem) {
        throw new Error('Item not found for optimistic update');
      }

      // Apply optimistic update
      store.updateItem(id, updates);
      
      try {
        const updatedItem = await apiCall();
        
        // Update with real data
        store.updateItem(id, updatedItem);
        
        return updatedItem;
      } catch (error) {
        // Rollback to original state
        store.updateItem(id, originalItem);
        throw error;
      }
    },

    // Optimistic delete
    optimisticDelete: async (id: string, apiCall: () => Promise<void>) => {
      const originalItem = store.items.find(item => item.id === id);
      const originalIndex = store.items.findIndex(item => item.id === id);
      
      if (!originalItem) {
        throw new Error('Item not found for optimistic delete');
      }

      // Remove item optimistically
      store.removeItem(id);
      
      try {
        await apiCall();
        // Delete successful, no need to do anything
      } catch (error) {
        // Rollback: re-add item at original position
        const newItems = [...store.items];
        newItems.splice(originalIndex, 0, originalItem);
        store.setItems(newItems);
        throw error;
      }
    },
  };
};

// Normalized state operations
export const createNormalizedOperations = <T extends { id: string }>() => {
  return {
    // Normalize array to object
    normalize: (items: T[]): Record<string, T> => {
      return items.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as Record<string, T>);
    },

    // Denormalize object to array
    denormalize: (normalized: Record<string, T>): T[] => {
      return Object.values(normalized);
    },

    // Merge normalized states
    mergeNormalized: (
      existing: Record<string, T>,
      incoming: Record<string, T>
    ): Record<string, T> => {
      return { ...existing, ...incoming };
    },

    // Update normalized item
    updateNormalized: (
      normalized: Record<string, T>,
      id: string,
      updates: Partial<T>
    ): Record<string, T> => {
      if (!normalized[id]) return normalized;
      
      return {
        ...normalized,
        [id]: { ...normalized[id], ...updates },
      };
    },

    // Remove from normalized
    removeNormalized: (
      normalized: Record<string, T>,
      id: string
    ): Record<string, T> => {
      const { [id]: removed, ...rest } = normalized;
      return rest;
    },
  };
};

// Pagination operations
export const createPaginationOperations = (store: any) => {
  return {
    // Go to next page
    nextPage: () => {
      if (store.list.hasMore) {
        store.list.setPage(store.list.page + 1);
        store.fetchItems();
      }
    },

    // Go to previous page
    prevPage: () => {
      if (store.list.page > 1) {
        store.list.setPage(store.list.page - 1);
        store.fetchItems();
      }
    },

    // Go to specific page
    goToPage: (page: number) => {
      if (page >= 1) {
        store.list.setPage(page);
        store.fetchItems();
      }
    },

    // Change page size
    changePageSize: (pageSize: number) => {
      store.list.setPageSize(pageSize);
      store.fetchItems();
    },

    // Load more (for infinite scroll)
    loadMore: async () => {
      if (store.list.hasMore && !store.list.loading) {
        const nextPage = store.list.page + 1;
        const params = {
          ...store.list,
          page: nextPage,
        };
        
        // Fetch next page and append to existing items
        const response = await store.fetchItems(params);
        store.list.setPage(nextPage);
        
        return response;
      }
    },
  };
};

// Search and filter operations
export const createSearchFilterOperations = (store: any) => {
  return {
    // Debounced search
    debouncedSearch: (() => {
      let timeoutId: any;
      
      return (query: string, delay = 300) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          store.list.setSearch(query);
          store.fetchItems();
        }, delay);
      };
    })(),

    // Apply multiple filters
    applyFilters: (filters: Record<string, any>) => {
      store.list.setFilters(filters);
      store.fetchItems();
    },

    // Add single filter
    addFilter: (key: string, value: any) => {
      const newFilters = { ...store.list.filters, [key]: value };
      store.list.setFilters(newFilters);
      store.fetchItems();
    },

    // Remove filter
    removeFilter: (key: string) => {
      const { [key]: removed, ...newFilters } = store.list.filters;
      store.list.setFilters(newFilters);
      store.fetchItems();
    },

    // Clear all filters
    clearAllFilters: () => {
      store.list.resetFilters();
      store.fetchItems();
    },

    // Sort by field
    sortBy: (field: string, order: 'asc' | 'desc' = 'asc') => {
      store.list.setSorting(field, order);
      store.fetchItems();
    },

    // Toggle sort order
    toggleSort: (field: string) => {
      const currentOrder = store.list.sortBy === field && store.list.sortOrder === 'asc' ? 'desc' : 'asc';
      store.list.setSorting(field, currentOrder);
      store.fetchItems();
    },
  };
};