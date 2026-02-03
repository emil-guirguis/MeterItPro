// Generic Entity Store Creator

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { EntityStoreSlice, CacheConfig } from '../types';
import { 
  createEntityState, 
  createListState, 
  isCacheFresh,
  createCacheConfig,
} from '../utils';
import { loadSchema } from '@framework/components/form/utils/schemaLoader';

// Generic service interface
export interface EntityService<T> {
  getAll: (params?: any) => Promise<{ items: T[]; total: number; hasMore: boolean }>;
  getById: (id: string) => Promise<T>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

// Create entity store
export const createEntityStore = <T extends { id: string }>(
  service: EntityService<T>,
  options: {
    name: string;
    cache?: Partial<CacheConfig>;
  }
) => {
  const cacheConfig = createCacheConfig(options.cache);

  return create<EntityStoreSlice<T>>()(
    immer((set, get) => ({
      // Initial state
      ...createEntityState<T>(),
      list: createListState(),

      // Entity actions
      setItems: (items) => {
        set((state) => {
          state.items = items as any;
        });
      },

      addItem: (item) => {
        set((state) => {
          state.items.unshift(item as any);
          state.total += 1;
        });
      },

      updateItem: (id, updates) => {
        set((state) => {
          const index = state.items.findIndex(item => item.id === id);
          if (index !== -1) {
            state.items[index] = { ...state.items[index], ...updates } as any;
          }
          if (state.selectedItem?.id === id) {
            state.selectedItem = { ...state.selectedItem, ...updates } as any;
          }
        });
      },

      removeItem: (id) => {
        set((state) => {
          state.items = state.items.filter(item => item.id !== id) as any;
          state.total = Math.max(0, state.total - 1);
          if (state.selectedItem?.id === id) {
            state.selectedItem = null;
          }
        });
      },

      // Optimistic update methods for form integration
      addItemToList: (item) => {
        set((state) => {
          state.items.unshift(item as any);
          state.total += 1;
        });
      },

      updateItemInList: (item) => {
        set((state) => {
          // Convert both IDs to strings for comparison to handle type mismatches
          const index = state.items.findIndex(i => String(i.id) === String(item.id));
          if (index !== -1) {
            // Replace the entire item to ensure all fields are updated
            state.items[index] = item as any;
          } else {
            // Fallback: add item if not found (edge case)
            console.warn('[updateItemInList] Item not found in list, adding as new item');
            state.items.unshift(item as any);
            state.total += 1;
          }
          
          // Update selected item if it matches
          if (state.selectedItem && String(state.selectedItem.id) === String(item.id)) {
            state.selectedItem = item as any;
          }
        });
      },

      setSelectedItem: (item) => {
        set((state) => {
          state.selectedItem = item as any;
        });
      },

      setLoading: (loading) => {
        set((state) => {
          state.loading = loading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      setTotal: (total) => {
        set((state) => {
          state.total = total;
        });
      },

      setHasMore: (hasMore) => {
        set((state) => {
          state.hasMore = hasMore;
        });
      },

      setLastFetch: (timestamp) => {
        set((state) => {
          state.lastFetch = timestamp;
        });
      },

      reset: () => {
        set((state) => {
          const initialState = createEntityState<T>();
          state.items = initialState.items as any;
          state.selectedItem = initialState.selectedItem as any;
          state.loading = initialState.loading;
          state.error = initialState.error;
          state.lastFetch = initialState.lastFetch;
          state.hasMore = initialState.hasMore;
          state.total = initialState.total;
          
          const initialListState = createListState();
          state.list.page = initialListState.page;
          state.list.pageSize = initialListState.pageSize;
          state.list.total = initialListState.total;
          state.list.search = initialListState.search;
          state.list.filters = initialListState.filters;
          state.list.sortBy = initialListState.sortBy;
          state.list.sortOrder = initialListState.sortOrder;
          state.list.loading = initialListState.loading;
          state.list.error = initialListState.error;
        });
      },

      // List actions - these are added as methods to the store
      setPage: (page) => {
        set((state) => {
          state.list.page = page;
        });
      },

      setPageSize: (pageSize) => {
        set((state) => {
          state.list.pageSize = pageSize;
          state.list.page = 1; // Reset to first page
        });
      },

      setSearch: (search) => {
        set((state) => {
          state.list.search = search;
          state.list.page = 1; // Reset to first page
        });
      },

      setFilters: (filters) => {
        set((state) => {
          state.list.filters = filters;
          state.list.page = 1; // Reset to first page
        });
      },

      setSorting: (sortBy, sortOrder) => {
        set((state) => {
          state.list.sortBy = sortBy;
          state.list.sortOrder = sortOrder;
        });
      },

      resetFilters: () => {
        set((state) => {
          state.list.search = '';
          state.list.filters = {};
          state.list.page = 1;
        });
      },

      setListLoading: (loading) => {
        set((state) => {
          state.list.loading = loading;
        });
      },

      setListError: (error) => {
        set((state) => {
          state.list.error = error;
        });
      },

      resetList: () => {
        set((state) => {
          const initialListState = createListState();
          state.list.page = initialListState.page;
          state.list.pageSize = initialListState.pageSize;
          state.list.total = initialListState.total;
          state.list.search = initialListState.search;
          state.list.filters = initialListState.filters;
          state.list.sortBy = initialListState.sortBy;
          state.list.sortOrder = initialListState.sortOrder;
          state.list.loading = initialListState.loading;
          state.list.error = initialListState.error;
        });
      },

      // API actions
      fetchItems: async (params) => {
        const state = get();
        
        console.log('[fetchItems] Called with params:', params);
        console.log('[fetchItems] Current state.list:', state.list);
        
        // Check if we should bypass cache (if params has any real properties besides _bypassCache)
        const hasRealParams = params && Object.keys(params).some(key => key !== '_bypassCache');
        const shouldBypassCache = params && (hasRealParams || params._bypassCache);
        
        if (state.lastFetch && isCacheFresh(state.lastFetch, cacheConfig.ttl) && !shouldBypassCache) {
          console.log('[fetchItems] Using cached data - cache is fresh');
          return; // Use cached data
        }

        set((state) => {
          state.list.loading = true;
          state.list.error = null;
        });

        try {
          // If params provided with real properties (not just _bypassCache), use them; otherwise use store state
          const queryParams = hasRealParams ? params : {
            page: state.list.page,
            pageSize: state.list.pageSize,
            search: state.list.search,
            filters: state.list.filters,
            sortBy: state.list.sortBy,
            sortOrder: state.list.sortOrder,
          };

          console.log('[fetchItems] Calling service.getAll with queryParams:', queryParams);
          const response = await service.getAll(queryParams);
          console.log('[fetchItems] Got response:', response);

          // Normalize ID fields based on schema idFieldName if present
          try {
            const schema = await loadSchema(options.name);
            const idField = schema?.idFieldName;
            if (idField && Array.isArray(response.items)) {
              response.items = response.items.map((it: any) => {
                if ((it.id === undefined || it.id === null) && it[idField] !== undefined) {
                  return { ...it, id: it[idField] };
                }
                return it;
              });
            }
          } catch (e) {
            // ignore schema load errors - proceed with original items
            console.warn('[fetchItems] Could not load schema for id normalization:', e);
          }

          set((state) => {
            state.items = response.items as any;
            state.total = response.total;
            state.hasMore = response.hasMore;
            state.lastFetch = Date.now();
            state.list.loading = false;
            state.list.error = null;
            state.list.total = response.total;
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch items';
          const errorDetail = (error as any)?.detail || (error as any)?.data?.detail || '';
          const errorCode = (error as any)?.code || (error as any)?.data?.code || '';
          const fullMessage = errorDetail ? `${errorMessage}: ${errorDetail}` : errorMessage;
          
          console.error('[fetchItems] Error:', {
            message: errorMessage,
            detail: errorDetail,
            code: errorCode,
            fullError: error
          });
          
          set((state) => {
            state.list.loading = false;
            state.list.error = fullMessage;
            state.error = fullMessage;
          });

          throw error;
        }
      },

      fetchItem: async (id) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const item = await service.getById(id);

          set((state) => {
            state.selectedItem = item as any;
            state.loading = false;
            state.error = null;
            
            // Update item in list if it exists
            const existingIndex = state.items.findIndex(i => i.id === id);
            if (existingIndex !== -1) {
              state.items[existingIndex] = item as any;
            }
          });

          // Normalize ID based on schema if necessary
          try {
            const schema = await loadSchema(options.name);
            const idField = schema?.idFieldName;
            if (idField && item && (item.id === undefined || item.id === null) && item[idField] !== undefined) {
              (item as any).id = item[idField];
            }
          } catch (e) {
            console.warn('[fetchItem] Could not normalize id:', e);
          }

          return item;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch item';
          const errorDetail = (error as any)?.detail || (error as any)?.data?.detail || '';
          const errorCode = (error as any)?.code || (error as any)?.data?.code || '';
          const fullMessage = errorDetail ? `${errorMessage}: ${errorDetail}` : errorMessage;
          
          console.error('[fetchItemById] Error:', {
            message: errorMessage,
            detail: errorDetail,
            code: errorCode,
            fullError: error
          });
          
          set((state) => {
            state.loading = false;
            state.error = fullMessage;
          });

          throw error;
        }
      },

      createItem: async (data) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const newItem = await service.create(data);

          set((state) => {
            state.items.unshift(newItem as any);
            state.total += 1;
            state.selectedItem = newItem as any;
            state.loading = false;
            state.error = null;
          });

          // Normalize ID based on schema if necessary
          try {
            const schema = await loadSchema(options.name);
            const idField = schema?.idFieldName;
            if (idField && newItem && (newItem.id === undefined || newItem.id === null) && newItem[idField] !== undefined) {
              (newItem as any).id = newItem[idField];
            }
          } catch (e) {
            console.warn('[createItem] Could not normalize id:', e);
          }

          return newItem;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create item';
          const errorDetail = (error as any)?.detail || (error as any)?.data?.detail || '';
          const errorCode = (error as any)?.code || (error as any)?.data?.code || '';
          const fullMessage = errorDetail ? `${errorMessage}: ${errorDetail}` : errorMessage;
          
          console.error('[createItem] Error:', {
            message: errorMessage,
            detail: errorDetail,
            code: errorCode,
            fullError: error
          });
          
          set((state) => {
            state.loading = false;
            state.error = fullMessage;
          });

          throw error;
        }
      },

      updateItemById: async (id, data) => {
        // Optimistic update
        const state = get();
        const originalItem = state.items.find(item => item.id === id);
        
        if (originalItem) {
          set((state) => {
            const index = state.items.findIndex(item => item.id === id);
            if (index !== -1) {
              state.items[index] = { ...originalItem, ...data } as any;
            }
            if (state.selectedItem?.id === id) {
              state.selectedItem = { ...state.selectedItem, ...data } as any;
            }
          });
        }

        try {
          const updatedItem = await service.update(id, data);

          set((state) => {
            const index = state.items.findIndex(item => item.id === id);
            if (index !== -1) {
              state.items[index] = updatedItem as any;
            }
            if (state.selectedItem?.id === id) {
              state.selectedItem = updatedItem as any;
            }
            state.error = null;
          });

          // Normalize ID based on schema if necessary
          try {
            const schema = await loadSchema(options.name);
            const idField = schema?.idFieldName;
            if (idField && updatedItem && (updatedItem.id === undefined || updatedItem.id === null) && updatedItem[idField] !== undefined) {
              (updatedItem as any).id = updatedItem[idField];
            }
          } catch (e) {
            console.warn('[updateItemById] Could not normalize id:', e);
          }

          return updatedItem;
        } catch (error) {
          // Rollback optimistic update
          if (originalItem) {
            set((state) => {
              const index = state.items.findIndex(item => item.id === id);
              if (index !== -1) {
                state.items[index] = originalItem as any;
              }
              if (state.selectedItem?.id === id) {
                state.selectedItem = originalItem as any;
              }
            });
          }

          const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
          const errorDetail = (error as any)?.detail || (error as any)?.data?.detail || '';
          const errorCode = (error as any)?.code || (error as any)?.data?.code || '';
          const fullMessage = errorDetail ? `${errorMessage}: ${errorDetail}` : errorMessage;
          
          console.error('[updateItemById] Error:', {
            message: errorMessage,
            detail: errorDetail,
            code: errorCode,
            fullError: error
          });
          
          set((state) => {
            state.error = fullMessage;
          });

          throw error;
        }
      },

      deleteItem: async (id) => {
        // Optimistic update
        const state = get();
        const originalItems = [...state.items];
        const originalTotal = state.total;
        const originalSelected = state.selectedItem;

        set((state) => {
          state.items = state.items.filter(item => item.id !== id) as any;
          state.total = Math.max(0, state.total - 1);
          if (state.selectedItem?.id === id) {
            state.selectedItem = null;
          }
        });

        try {
          await service.delete(id);
          
          set((state) => {
            state.error = null;
          });
        } catch (error) {
          // Rollback optimistic update
          set((state) => {
            state.items = originalItems as any;
            state.total = originalTotal;
            state.selectedItem = originalSelected as any;
          });

          const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
          
          set((state) => {
            state.error = errorMessage;
          });

          throw error;
        }
      },
    }))
  );
};

// Helper to create entity hook
export const createEntityHook = <T extends { id: string }>(
  store: ReturnType<typeof createEntityStore<T>>
) => {
  return () => {
    const storeState = store();
    
    return {
      // State
      items: storeState.items,
      selectedItem: storeState.selectedItem,
      loading: storeState.loading,
      error: storeState.error,
      total: storeState.total,
      hasMore: storeState.hasMore,
      list: storeState.list,
      
      // Actions
      fetchItems: storeState.fetchItems,
      fetchItem: storeState.fetchItem,
      createItem: storeState.createItem,
      updateItem: storeState.updateItemById,
      deleteItem: storeState.deleteItem,
      setSelectedItem: storeState.setSelectedItem,
      reset: storeState.reset,
      
      // Optimistic update methods
      addItemToList: storeState.addItemToList,
      updateItemInList: storeState.updateItemInList,
      
      // List actions
      setPage: storeState.setPage,
      setPageSize: storeState.setPageSize,
      setSearch: storeState.setSearch,
      setFilters: storeState.setFilters,
      setSorting: storeState.setSorting,
      resetFilters: storeState.resetFilters,
    };
  };
};