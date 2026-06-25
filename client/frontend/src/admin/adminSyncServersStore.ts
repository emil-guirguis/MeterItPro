import { createEntityStore, createEntityHook, type EntityService } from '../store/slices/createEntitySlice';
import { withTokenRefresh } from '../store/middleware/apiMiddleware';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface AdminSyncServerEntity {
  id: string;
  sync_server_id: number;
  tenant_id: number;
  tenant_name: string;
  name: string;
  tunnel_url: string;
  bootstrap_key: string;
  notes: string;
  provision_status: 'pending' | 'provisioning' | 'active' | 'error';
  provision_error?: string;
  timezone: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

class AdminSyncServerAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers as Record<string, string> || {}),
      },
      ...options,
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
    return data;
  }

  normalize(s: any): AdminSyncServerEntity {
    return { ...s, id: String(s.sync_server_id) };
  }

  async getAll(): Promise<{ items: AdminSyncServerEntity[]; total: number; hasMore: boolean }> {
    const res = await this.request<any>('/admin/sync-servers');
    const items = (res.data?.items ?? []).map((s: any) => this.normalize(s));
    return { items, total: items.length, hasMore: false };
  }

  async getById(id: string): Promise<AdminSyncServerEntity> {
    const { items } = await this.getAll();
    const item = items.find(s => s.id === id);
    if (!item) throw new Error('Sync server not found');
    return item;
  }

  async create(data: { tenant_id: number; name: string; timezone?: string; active?: boolean; notes?: string }): Promise<AdminSyncServerEntity> {
    const res = await this.request<any>('/admin/sync-servers', { method: 'POST', body: JSON.stringify(data) });
    return this.normalize(res.data);
  }

  async update(id: string, data: { name?: string; timezone?: string; active?: boolean; notes?: string }): Promise<AdminSyncServerEntity> {
    const res = await this.request<any>(`/admin/sync-servers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return this.normalize(res.data);
  }

  async delete(id: string): Promise<void> {
    await this.request<any>(`/admin/sync-servers/${id}`, { method: 'DELETE' });
  }

  async provision(id: string): Promise<AdminSyncServerEntity> {
    const res = await this.request<any>(`/admin/sync-servers/${id}/provision`, { method: 'POST' });
    return this.normalize(res.data);
  }

  async checkStatus(id: string): Promise<{ online: boolean; message?: string }> {
    const res = await this.request<any>(`/admin/sync-servers/${id}/check-status`, { method: 'POST' });
    return { online: Boolean(res.online), message: res.message as string | undefined };
  }
}

const api = new AdminSyncServerAPI();

const adminSyncServerService: EntityService<AdminSyncServerEntity> = {
  getAll:  ()           => withTokenRefresh(() => api.getAll()),
  getById: (id)         => withTokenRefresh(() => api.getById(id)),
  create:  (data)       => withTokenRefresh(() => api.create(data as any)),
  update:  (id, data)   => withTokenRefresh(() => api.update(id, data)),
  delete:  (id)         => withTokenRefresh(() => api.delete(id)),
};

export const useAdminSyncServersStore = createEntityStore<AdminSyncServerEntity>(adminSyncServerService, {
  name: 'admin_sync_server',
  cache: { ttl: 2 * 60 * 1000 },
});

export const useAdminSyncServers = createEntityHook(useAdminSyncServersStore);

export function useAdminSyncServersEnhanced() {
  const store = useAdminSyncServers();
  return {
    ...store,
    checkStatus:     (id: string) => withTokenRefresh(() => api.checkStatus(id)),
    provisionServer: async (id: string) => {
      const current = store.items.find(s => s.id === id);
      if (current) store.updateItemInList({ ...current, provision_status: 'provisioning' as const });
      try {
        const updated = await withTokenRefresh(() => api.provision(id));
        store.updateItemInList(updated);
        return updated;
      } catch (err: any) {
        const stale = store.items.find(s => s.id === id);
        if (stale) store.updateItemInList({ ...stale, provision_status: 'error' as const, provision_error: err.message });
        throw err;
      }
    },
  };
}
