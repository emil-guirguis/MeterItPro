import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { notificationService } from '../../services/notificationService';
import type { Notification } from '../../types/notifications';
import type { EnhancedStore } from '@framework/components/list/types/list';

interface NotificationsState {
  items: Notification[];
  list: {
    loading: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    total: number;
  };
  filters: Record<string, any>;
  searchQuery: string;
}

interface NotificationsActions {
  fetchItems: () => Promise<void>;
  setSearch: (query: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  createItem: (data: any) => Promise<void>;
  deleteItem: (id: string | number) => Promise<void>;
  clearAll: () => Promise<void>;
}

type NotificationsStore = NotificationsState & NotificationsActions;

const initialState: NotificationsState = {
  items: [],
  list: {
    loading: false,
    error: null,
    page: 1,
    pageSize: 20,
    total: 0,
  },
  filters: {},
  searchQuery: '',
};

export const useNotificationsStore = create<NotificationsStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchItems: async () => {
        const { page, pageSize } = get().list;
        const offset = (page - 1) * pageSize;
        set(s => ({ list: { ...s.list, loading: true, error: null } }));
        try {
          const response = await notificationService.listNotifications(pageSize, offset);
          set(s => ({
            items: response.notifications,
            list: { ...s.list, loading: false, total: response.total },
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
          set(s => ({ list: { ...s.list, loading: false, error: message } }));
          console.error('[notificationsStore] Error fetching notifications:', error);
        }
      },

      setSearch: (query: string) => {
        set({ searchQuery: query });
      },

      setFilters: (filters: Record<string, any>) => {
        set({ filters });
        set(s => ({ list: { ...s.list, page: 1 } }));
      },

      setPage: (page: number) => {
        set(s => ({ list: { ...s.list, page } }));
        get().fetchItems();
      },

      setPageSize: (size: number) => {
        set(s => ({ list: { ...s.list, pageSize: size, page: 1 } }));
        get().fetchItems();
      },

      createItem: async (data: any) => {
        set(s => ({ list: { ...s.list, loading: true, error: null } }));
        try {
          const newNotification = await notificationService.createNotification(data);
          const state = get();
          set({
            items: [newNotification, ...state.items],
            list: { ...state.list, loading: false, total: state.list.total + 1 },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create notification';
          set(s => ({ list: { ...s.list, loading: false, error: message } }));
          console.error('[notificationsStore] Error creating notification:', error);
          throw error;
        }
      },

      deleteItem: async (id: string | number) => {
        set(s => ({ list: { ...s.list, loading: true, error: null } }));
        try {
          await notificationService.clearNotification(String(id));
          const state = get();
          set({
            items: state.items.filter(n => n.id !== String(id)),
            list: { ...state.list, loading: false, total: Math.max(0, state.list.total - 1) },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to clear notification';
          set(s => ({ list: { ...s.list, loading: false, error: message } }));
          console.error('[notificationsStore] Error deleting notification:', error);
          throw error;
        }
      },

      clearAll: async () => {
        set(s => ({ list: { ...s.list, loading: true, error: null } }));
        try {
          await notificationService.clearAllNotifications();
          set(s => ({ items: [], list: { ...s.list, loading: false, total: 0 } }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to clear all notifications';
          set(s => ({ list: { ...s.list, loading: false, error: message } }));
          console.error('[notificationsStore] Error clearing all notifications:', error);
          throw error;
        }
      },

    }),
    { name: 'NotificationsStore' }
  )
);

export type NotificationsEnhanced = EnhancedStore<Notification> & {
  clearAll: () => Promise<void>;
};

export const useNotificationsEnhanced = (): NotificationsEnhanced => {
  const store = useNotificationsStore();
  return {
    items: store.items,
    list: store.list,
    fetchItems: store.fetchItems,
    setSearch: store.setSearch,
    setFilters: store.setFilters,
    setPage: store.setPage,
    setPageSize: store.setPageSize,
    createItem: store.createItem,
    deleteItem: store.deleteItem,
    clearAll: store.clearAll,
  };
};
