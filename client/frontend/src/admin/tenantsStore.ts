import { createEntityStore, createEntityHook, type EntityService } from '../store/slices/createEntitySlice';
import { withTokenRefresh } from '../store/middleware/apiMiddleware';
import type { ListParams } from '../types/entities';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface TenantEntity {
  id: string;
  tenant_id: number;
  name: string;
  url: string | null;
  contact_email: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  timezone: string | null;
  currency: string | null;
  language: string | null;
  date_format: string | null;
  time_format: string | null;
  default_page_size: number | null;
  street: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  meter_reading_batch_count: number;
}

class AdminTenantAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as any;
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  private normalize(t: any): TenantEntity {
    return { ...t, id: String(t.tenant_id) };
  }

  async getAll(_params?: ListParams): Promise<{ items: TenantEntity[]; total: number; hasMore: boolean }> {
    const res = await this.request<any>('/admin/clients');
    const items = (res.data?.items ?? []).map((t: any) => this.normalize(t));
    return { items, total: items.length, hasMore: false };
  }

  async getById(id: string): Promise<TenantEntity> {
    const res = await this.request<any>(`/admin/clients/${id}`);
    return this.normalize(res.data);
  }

  async create(data: Partial<TenantEntity>): Promise<TenantEntity> {
    const res = await this.request<any>('/admin/clients', { method: 'POST', body: JSON.stringify(data) });
    return this.normalize(res.data);
  }

  async update(id: string, data: Partial<TenantEntity>): Promise<TenantEntity> {
    const res = await this.request<any>(`/admin/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return this.normalize(res.data);
  }
}

const api = new AdminTenantAPI();

const tenantsService: EntityService<TenantEntity> = {
  async getAll(params?: any) {
    return withTokenRefresh(() => api.getAll(params));
  },
  async getById(id: string) {
    return withTokenRefresh(() => api.getById(id));
  },
  async create(data: Partial<TenantEntity>) {
    return withTokenRefresh(() => api.create(data));
  },
  async update(id: string, data: Partial<TenantEntity>) {
    return withTokenRefresh(() => api.update(id, data));
  },
  async delete(_id: string): Promise<void> {
    throw new Error('Tenant deletion is not permitted');
  },
};

export const useTenantsStore = createEntityStore(tenantsService, {
  name: 'admin_tenant',
  cache: { ttl: 5 * 60 * 1000, maxAge: 30 * 60 * 1000 },
});

export const useTenants = createEntityHook(useTenantsStore);

export const useTenantsEnhanced = () => {
  return useTenants();
};
