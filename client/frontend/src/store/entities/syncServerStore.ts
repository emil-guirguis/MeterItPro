import { create } from 'zustand';
import { authService } from '../../services/authService';
import { withTokenRefresh } from '../middleware/apiMiddleware';
import type { SyncServer, SyncServerFormData } from '../../types/entities';

interface SyncServerStoreState {
  servers: SyncServer[];
  loading: boolean;
  error: string | null;
}

interface SyncServerStoreActions {
  fetchServers: () => Promise<void>;
  createServer: (data: SyncServerFormData) => Promise<void>;
  updateServer: (id: number, data: Partial<SyncServerFormData>) => Promise<void>;
  deleteServer: (id: number) => Promise<void>;
  provisionServer: (id: number) => Promise<void>;
  testConnection: (id: number) => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
}

type SyncServerStore = SyncServerStoreState & SyncServerStoreActions;

function authFetch(url: string, options: RequestInit = {}) {
  return withTokenRefresh(async () => {
    const token = authService.getStoredToken();
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    let result: any;
    try {
      result = await response.json();
    } catch {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }
    if (!response.ok) throw new Error(result?.message || `Request failed: ${response.status}`);
    return result;
  });
}

export const useSyncServerStore = create<SyncServerStore>((set) => ({
  servers: [],
  loading: false,
  error: null,

  fetchServers: async () => {
    set({ loading: true, error: null });
    try {
      const result = await authFetch('/api/sync-servers');
      set({ servers: result.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message });
    }
  },

  createServer: async (data) => {
    set({ loading: true, error: null });
    try {
      const result = await authFetch('/api/sync-servers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      set((s) => ({ servers: [result.data, ...s.servers], loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  updateServer: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const result = await authFetch(`/api/sync-servers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      set((s) => ({
        servers: s.servers.map((srv) => (srv.sync_server_id === id ? result.data : srv)),
        loading: false,
      }));
    } catch (err: any) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  deleteServer: async (id) => {
    set({ loading: true, error: null });
    try {
      await authFetch(`/api/sync-servers/${id}`, { method: 'DELETE' });
      set((s) => ({ servers: s.servers.filter((srv) => srv.sync_server_id !== id), loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  provisionServer: async (id) => {
    set((s) => ({
      servers: s.servers.map((srv) =>
        srv.sync_server_id === id ? { ...srv, provision_status: 'provisioning' as const } : srv
      ),
    }));
    try {
      const result = await authFetch(`/api/sync-servers/${id}/provision`, { method: 'POST' });
      set((s) => ({
        servers: s.servers.map((srv) => (srv.sync_server_id === id ? result.data : srv)),
      }));
    } catch (err: any) {
      set((s) => ({
        servers: s.servers.map((srv) =>
          srv.sync_server_id === id
            ? { ...srv, provision_status: 'error' as const, provision_error: err.message }
            : srv
        ),
        error: err.message,
      }));
      throw err;
    }
  },

  testConnection: async (id) => {
    try {
      const result = await authFetch(`/api/sync-servers/${id}/test-connection`, { method: 'POST' });
      return { success: result.success, message: result.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  clearError: () => set({ error: null }),
}));
