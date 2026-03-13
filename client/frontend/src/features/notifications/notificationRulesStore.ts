import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { notificationRuleService, type NotificationRule } from '../../services/notificationRuleService';
import type { EnhancedStore } from '@framework/components/list/types/list';

interface NotificationRulesState {
  items: NotificationRule[];
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

interface NotificationRulesActions {
  fetchItems: () => Promise<void>;
  setSearch: (query: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  createItem: (data: any) => Promise<void>;
  updateItem: (id: string, data: any) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleActive: (id: string, active: boolean) => Promise<void>;
}

type NotificationRulesStore = NotificationRulesState & NotificationRulesActions;

const initialState: NotificationRulesState = {
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

export const useNotificationRulesStore = create<NotificationRulesStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchItems: async () => {
        const { page, pageSize } = get().list;
        const offset = (page - 1) * pageSize;
        set(s => ({ list: { ...s.list, loading: true, error: null } }));
        try {
          const response = await notificationRuleService.listRules(pageSize, offset);
          set(s => ({
            items: response.rules,
            list: { ...s.list, loading: false, total: response.total },
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch notification rules';
          set(s => ({ list: { ...s.list, loading: false, error: message } }));
          console.error('[notificationRulesStore] Error fetching rules:', error);
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
          const newRule = await notificationRuleService.createRule(data);
          const state = get();
          set({
            items: [newRule, ...state.items],
            list: { ...state.list, loading: false, total: state.list.total + 1 },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create rule';
          set(s => ({ list: { ...s.list, loading: false, error: message } }));
          console.error('[notificationRulesStore] Error creating rule:', error);
          throw error;
        }
      },

      updateItem: async (id: string, data: any) => {
        set(s => ({ list: { ...s.list, loading: true, error: null } }));
        try {
          await notificationRuleService.updateRule(id, data);
          const state = get();
          set({
            items: state.items.map(r => (r.notification_rule_id === id ? { ...r, ...data } : r)),
            list: { ...state.list, loading: false },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update rule';
          set(s => ({ list: { ...s.list, loading: false, error: message } }));
          console.error('[notificationRulesStore] Error updating rule:', error);
          throw error;
        }
      },

      deleteItem: async (id: string) => {
        set(s => ({ list: { ...s.list, loading: true, error: null } }));
        try {
          await notificationRuleService.deleteRule(id);
          const state = get();
          set({
            items: state.items.filter(r => r.notification_rule_id !== id),
            list: { ...state.list, loading: false, total: Math.max(0, state.list.total - 1) },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete rule';
          set(s => ({ list: { ...s.list, loading: false, error: message } }));
          console.error('[notificationRulesStore] Error deleting rule:', error);
          throw error;
        }
      },

      toggleActive: async (id: string, active: boolean) => {
        try {
          await notificationRuleService.toggleRuleStatus(id, active);
          const state = get();
          set({
            items: state.items.map(r => (r.notification_rule_id === id ? { ...r, active } : r)),
          });
        } catch (error) {
          console.error('[notificationRulesStore] Error toggling rule status:', error);
          throw error;
        }
      },
    }),
    { name: 'NotificationRulesStore' }
  )
);

export type NotificationRulesEnhanced = EnhancedStore<NotificationRule> & {
  toggleActive: (id: string, active: boolean) => Promise<void>;
};

export const useNotificationRulesEnhanced = (): NotificationRulesEnhanced => {
  const store = useNotificationRulesStore();
  return {
    items: store.items,
    list: store.list,
    fetchItems: store.fetchItems,
    setSearch: store.setSearch,
    setFilters: store.setFilters,
    setPage: store.setPage,
    setPageSize: store.setPageSize,
    createItem: store.createItem,
    updateItem: store.updateItem,
    deleteItem: store.deleteItem,
    toggleActive: store.toggleActive,
  };
};
