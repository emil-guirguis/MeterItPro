import type { SyncServer } from '../../types/entities';
import { createEntityStore, createEntityHook, type EntityService } from '../../store/slices/createEntitySlice';
import { withTokenRefresh } from '../../store/middleware/apiMiddleware';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface SyncServerEntity extends SyncServer {
  id: string;
}

class SyncServerAPI {
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/sync-servers${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers as Record<string, string> || {}),
      },
    });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}: ${response.statusText}`);
    return data;
  }

  async getAll(): Promise<{ items: SyncServerEntity[]; total: number; hasMore: boolean }> {
    const result = await this.request<any>('');
    const items = (result.data || []).map((s: SyncServer) => ({ ...s, id: String(s.sync_server_id) }));
    return { items, total: items.length, hasMore: false };
  }

  async getById(id: string): Promise<SyncServerEntity> {
    const { items } = await this.getAll();
    const item = items.find((s) => String(s.sync_server_id) === id);
    if (!item) throw new Error('Sync server not found');
    return item;
  }

  async create(data: Partial<SyncServerEntity>): Promise<SyncServerEntity> {
    const { id: _id, ...payload } = data;
    const result = await this.request<any>('', { method: 'POST', body: JSON.stringify(payload) });
    return { ...result.data, id: String(result.data.sync_server_id) };
  }

  async update(id: string, data: Partial<SyncServerEntity>): Promise<SyncServerEntity> {
    const { id: _id, ...payload } = data;
    const result = await this.request<any>(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    return { ...result.data, id: String(result.data.sync_server_id) };
  }

  async delete(id: string): Promise<void> {
    await this.request<any>(`/${id}`, { method: 'DELETE' });
  }

  async provision(id: string): Promise<SyncServerEntity> {
    const result = await this.request<any>(`/${id}/provision`, { method: 'POST' });
    return { ...result.data, id: String(result.data.sync_server_id) };
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.request<any>(`/${id}/test-connection`, { method: 'POST' });
    return { success: result.success as boolean, message: result.message as string };
  }
}

const api = new SyncServerAPI();

const syncServerService: EntityService<SyncServerEntity> = {
  getAll: () => withTokenRefresh(() => api.getAll()),
  getById: (id) => withTokenRefresh(() => api.getById(id)),
  create: (data) => withTokenRefresh(() => api.create(data)),
  update: (id, data) => withTokenRefresh(() => api.update(id, data)),
  delete: (id) => withTokenRefresh(() => api.delete(id)),
};

export const useSyncServersStore = createEntityStore<SyncServerEntity>(syncServerService, {
  name: 'sync_server',
  cache: { ttl: 2 * 60 * 1000 },
});

export const useSyncServers = createEntityHook(useSyncServersStore);

export function useSyncServersEnhanced() {
  const store = useSyncServersStore();

  return {
    ...store,
    items: store.items,

    provisionServer: async (id: string) => {
      const current = store.items.find((s) => s.id === id);
      if (current) {
        store.updateItemInList({ ...current, provision_status: 'provisioning' as const });
      }
      try {
        const updated = await withTokenRefresh(() => api.provision(id));
        store.updateItemInList(updated);
        return updated;
      } catch (err: any) {
        const stale = store.items.find((s) => s.id === id);
        if (stale) {
          store.updateItemInList({ ...stale, provision_status: 'error' as const, provision_error: err.message });
        }
        throw err;
      }
    },

    testConnection: (id: string) => withTokenRefresh(() => api.testConnection(id)),
  };
}
